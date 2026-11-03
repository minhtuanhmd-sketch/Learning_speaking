import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAndParseBackupJson,
  encodeVaultValue,
  decodeVaultValue,
} from '../indexedDBStorage';

test('validateAndParseBackupJson accepts valid backup JSON and normalizes fields', () => {
  const sampleBackup = JSON.stringify({
    schemaVersion: 1,
    appName: 'LexiSpeak VN',
    activeProfileId: 'vo',
    isDarkMode: true,
    profiles: [
      {
        id: 'toi',
        name: 'Tôi',
        avatar: '👨‍💼',
        roleDescription: 'Người dùng chính',
        targetLevel: 'A2',
        createdAt: 1700000000000,
      },
      {
        id: 'vo',
        name: 'Vợ',
        avatar: '👩‍💼',
        roleDescription: 'Vợ / Bạn đời',
        targetLevel: 'B1',
        createdAt: 1700000000001,
      },
    ],
    progressByProfile: {
      vo: {
        'a2-p1-s1': {
          sentenceId: 'a2-p1-s1',
          clozeCompleted: true,
          clozeAttempts: 1,
          speakingCompleted: true,
          bestSpeakingScore: 94,
        },
      },
    },
  });

  const res = validateAndParseBackupJson(sampleBackup);
  assert.equal(res.valid, true);
  assert.ok(res.payload);
  assert.equal(res.payload.activeProfileId, 'vo');
  assert.equal(res.payload.profiles.length, 2);
  assert.equal(res.payload.progressByProfile.vo['a2-p1-s1'].bestSpeakingScore, 94);
});

test('validateAndParseBackupJson rejects malformed or empty JSON', () => {
  assert.equal(validateAndParseBackupJson('').valid, false);
  assert.equal(validateAndParseBackupJson('{invalid json').valid, false);
  assert.equal(validateAndParseBackupJson(JSON.stringify({ profiles: [] })).valid, false);
});

test('encodeVaultValue and decodeVaultValue round-trip sensitive configuration', () => {
  const secret = 'custom_voice_config_key_12345';
  const encoded = encodeVaultValue(secret);
  assert.notEqual(encoded, secret);
  const decoded = decodeVaultValue(encoded);
  assert.equal(decoded, secret);
});

test('sanitizeFetchDescriptor prevents TypeError when extension defines getter-only fetch and reassigns window.fetch', () => {
  const mockWindow: Record<string, any> = {};
  const nativeFetch = () => 'native-response';
  mockWindow.fetch = nativeFetch;

  const sanitize = (desc: PropertyDescriptor) => {
    if ('get' in desc || 'set' in desc) {
      const origGet = desc.get;
      const origSet = desc.set;
      let localVal: any;
      let hasLocalVal = false;
      return {
        configurable: true,
        enumerable: desc.enumerable !== false,
        get(this: any) {
          if (hasLocalVal) return localVal;
          return origGet ? origGet.call(this) : nativeFetch;
        },
        set(this: any, fn: any) {
          if (typeof fn === 'function') {
            localVal = fn;
            hasLocalVal = true;
          }
          if (origSet) origSet.call(this, fn);
        },
      };
    }
    return {
      configurable: true,
      enumerable: true,
      writable: true,
      value: desc.value ?? nativeFetch,
    };
  };

  // Step 1: Extension script 1 attempts to define getter-only fetch (no setter)
  Object.defineProperty(
    mockWindow,
    'fetch',
    sanitize({
      get() {
        return () => 'getter-only-response';
      },
    })
  );

  assert.equal(mockWindow.fetch(), 'getter-only-response');

  // Step 2: Extension script 2 (e.g. requests.js) assigns mockWindow.fetch = ... in strict mode
  const interceptorFetch = () => 'intercepted-response';
  assert.doesNotThrow(() => {
    mockWindow.fetch = interceptorFetch;
  });
  assert.equal(mockWindow.fetch(), 'intercepted-response');
});

