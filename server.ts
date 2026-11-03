import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 8434;
const isProd = process.env.NODE_ENV === 'production';


// Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Tightened body parser limit (64kb max to prevent memory amplification DoS)
app.use(express.json({ limit: '64kb' }));

// In-Memory Sliding-Window Rate Limiter (Max 45 requests / 60 seconds per IP)
interface RateLimitRecord {
  timestamps: number[];
}
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 45;
const ipRateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRateLimitMap.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (record.timestamps.length === 0) {
      ipRateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const now = Date.now();
  let record = ipRateLimitMap.get(ip);
  if (!record) {
    record = { timestamps: [] };
    ipRateLimitMap.set(ip, record);
  }

  // Filter timestamps within window
  record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = record.timestamps[0];
    const retryAfterSec = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
    res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    res.setHeader('X-RateLimit-Remaining', '0');
    return res.status(429).json({
      error: 'Quá nhiều yêu cầu đọc âm thanh. Vui lòng thử lại sau giây lát.',
      retryAfterSec,
      fallbackAvailable: true,
    });
  }

  record.timestamps.push(now);
  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
  res.setHeader('X-RateLimit-Remaining', String(MAX_REQUESTS_PER_WINDOW - record.timestamps.length));
  next();
}

// Server-side LRU Audio Cache (Max 120 items) to prevent redundant Gemini quota consumption
interface CachedAudioEntry {
  audioBase64: string;
  mimeType: string;
  voice: string;
  createdAt: number;
}
const SERVER_AUDIO_CACHE = new Map<string, CachedAudioEntry>();
const MAX_SERVER_CACHE_ENTRIES = 120;

function getCachedAudio(key: string): CachedAudioEntry | undefined {
  const entry = SERVER_AUDIO_CACHE.get(key);
  if (entry) {
    // Refresh LRU order: delete & re-insert
    SERVER_AUDIO_CACHE.delete(key);
    SERVER_AUDIO_CACHE.set(key, entry);
  }
  return entry;
}

function setCachedAudio(key: string, entry: CachedAudioEntry): void {
  if (SERVER_AUDIO_CACHE.size >= MAX_SERVER_CACHE_ENTRIES) {
    const oldestKey = SERVER_AUDIO_CACHE.keys().next().value;
    if (oldestKey) SERVER_AUDIO_CACHE.delete(oldestKey);
  }
  SERVER_AUDIO_CACHE.set(key, entry);
}

// Allowed Gemini TTS Prebuilt Voices
const ALLOWED_VOICES = new Set(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr']);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    cachedAudioCount: SERVER_AUDIO_CACHE.size,
    time: new Date().toISOString(),
  });
});

// Gemini TTS Generation Endpoint
app.post('/api/tts/generate', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Vui lòng cung cấp văn bản cần đọc' });
    }

    const cleanText = text.trim();
    if (!cleanText) {
      return res.status(400).json({ error: 'Văn bản không được để trống' });
    }

    if (cleanText.length > 500) {
      return res.status(400).json({ error: 'Độ dài văn bản vượt quá giới hạn cho phép (500 ký tự)' });
    }

    // Whitelist sanitize voice
    const targetVoice = ALLOWED_VOICES.has(voiceName) ? voiceName : 'Kore';

    // Check server cache
    const cacheKey = `${targetVoice}:::${cleanText.toLowerCase()}`;
    const cached = getCachedAudio(cacheKey);
    if (cached) {
      return res.json({
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        voice: cached.voice,
        provider: 'Google Gemini Audio TTS',
        cached: true,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ',
        fallbackAvailable: true,
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Request with 10s timeout guarantee
    const ttsPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText.slice(0, 400),
              speechMetadata: {
                style: 'Clear, natural, friendly American English pronunciation coach with authentic cadence',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: targetVoice },
          },
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Yêu cầu tới Gemini TTS bị quá hạn (10s timeout)')), 10000)
    );

    const response = await Promise.race([ttsPromise, timeoutPromise]);

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(502).json({
        error: 'Mô hình Gemini không trả về dữ liệu âm thanh',
        fallbackAvailable: true,
      });
    }

    const audioEntry: CachedAudioEntry = {
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voice: targetVoice,
      createdAt: Date.now(),
    };

    setCachedAudio(cacheKey, audioEntry);

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voice: targetVoice,
      provider: 'Google Gemini Audio TTS',
      cached: false,
    });
  } catch (error: any) {
    console.error('[LexiSpeak TTS Engine] Error:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'Lỗi khi gọi API Google Gemini Audio TTS',
      fallbackAvailable: true,
    });
  }
});

// Vite middleware in development or static asset serving in production
if (!isProd) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[LexiSpeak Server] Running on http://0.0.0.0:${PORT}`);
});
