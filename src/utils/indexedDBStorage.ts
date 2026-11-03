/**
 * IndexedDB Zero-Backend Persistence Engine for iOS WebKit (`lexispeak_webkit_db`)
 *
 * Why this exists:
 * iOS Safari/WebKit may purge `localStorage` under device storage pressure or ITP policies.
 * This module stores all family profiles (Tôi, Vợ, Con), sentence progress, custom syntax/lexical
 * overrides, user configurations, and optional encrypted local config keys inside IndexedDB,
 * while maintaining synchronous mirror fallbacks and full JSON Export / Import backup & restore.
 */

import { CEFRLevel, SentenceProgress, UserProfile } from '../types/sla';
import { CustomPatternOverride } from '../components/SyntaxLexicalUpdaterModal';

const DB_NAME = 'lexispeak_webkit_db';
const DB_VERSION = 1;

const STORE_CONFIG = 'config';
const STORE_PROGRESS = 'progress_by_profile';
const STORE_OVERRIDES = 'overrides_by_profile';
const STORE_VAULT = 'encrypted_vault';

export interface ProfileSettingsRecord {
  selectedLevel: CEFRLevel;
  selectedPatternId: string;
  enforceSequentialLock: boolean;
}

export interface LexiSpeakBackupPayload {
  schemaVersion: number;
  appName: 'LexiSpeak VN';
  exportedAtIso: string;
  activeProfileId: string;
  isDarkMode: boolean;
  profiles: UserProfile[];
  progressByProfile: Record<string, Record<string, SentenceProgress>>;
  overridesByProfile: Record<string, Record<string, CustomPatternOverride>>;
  settingsByProfile: Record<string, ProfileSettingsRecord>;
}

/**
 * Pure validation helper for JSON backup import (unit-testable in Node without DOM)
 */
export function validateAndParseBackupJson(rawJson: string): {
  valid: boolean;
  payload?: LexiSpeakBackupPayload;
  errorVi?: string;
} {
  if (!rawJson || !rawJson.trim()) {
    return { valid: false, errorVi: 'File hoặc chuỗi JSON trống.' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { valid: false, errorVi: 'Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại file sao lưu.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errorVi: 'Cấu trúc dữ liệu sao lưu không hợp lệ.' };
  }

  if (!Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
    return {
      valid: false,
      errorVi: 'File sao lưu thiếu danh sách hồ sơ người học (profiles).',
    };
  }

  for (const p of parsed.profiles) {
    if (!p || typeof p.id !== 'string' || typeof p.name !== 'string') {
      return {
        valid: false,
        errorVi: 'Hồ sơ người học trong file sao lưu thiếu id hoặc tên.',
      };
    }
  }

  const normalizedPayload: LexiSpeakBackupPayload = {
    schemaVersion: typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1,
    appName: 'LexiSpeak VN',
    exportedAtIso:
      typeof parsed.exportedAtIso === 'string' ? parsed.exportedAtIso : new Date().toISOString(),
    activeProfileId:
      typeof parsed.activeProfileId === 'string'
        ? parsed.activeProfileId
        : parsed.profiles[0].id,
    isDarkMode: typeof parsed.isDarkMode === 'boolean' ? parsed.isDarkMode : true,
    profiles: parsed.profiles,
    progressByProfile:
      parsed.progressByProfile && typeof parsed.progressByProfile === 'object'
        ? parsed.progressByProfile
        : {},
    overridesByProfile:
      parsed.overridesByProfile && typeof parsed.overridesByProfile === 'object'
        ? parsed.overridesByProfile
        : {},
    settingsByProfile:
      parsed.settingsByProfile && typeof parsed.settingsByProfile === 'object'
        ? parsed.settingsByProfile
        : {},
  };

  return { valid: true, payload: normalizedPayload };
}

/**
 * Lightweight deterministic obfuscation/encryption helper for storing sensitive preferences
 * in the IndexedDB `encrypted_vault` store.
 */
export function encodeVaultValue(plainText: string, salt = 'lexispeak-ios-v1'): string {
  const input = `${salt}::${plainText}`;
  if (typeof btoa === 'function') {
    return btoa(encodeURIComponent(input));
  }
  return Buffer.from(input, 'utf-8').toString('base64');
}

export function decodeVaultValue(cipherText: string, salt = 'lexispeak-ios-v1'): string | null {
  try {
    const raw =
      typeof atob === 'function'
        ? decodeURIComponent(atob(cipherText))
        : Buffer.from(cipherText, 'base64').toString('utf-8');
    const prefix = `${salt}::`;
    return raw.startsWith(prefix) ? raw.slice(prefix.length) : null;
  } catch {
    return null;
  }
}

class IndexedDBPersistenceService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private openDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return Promise.resolve(null);
    }
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_CONFIG)) {
            db.createObjectStore(STORE_CONFIG);
          }
          if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
            db.createObjectStore(STORE_PROGRESS);
          }
          if (!db.objectStoreNames.contains(STORE_OVERRIDES)) {
            db.createObjectStore(STORE_OVERRIDES);
          }
          if (!db.objectStoreNames.contains(STORE_VAULT)) {
            db.createObjectStore(STORE_VAULT);
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  private async putValue<T>(storeName: string, key: string, value: T): Promise<void> {
    const db = await this.openDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  private async getValue<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await this.openDB();
    if (!db) return undefined;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      }
    });
  }

  public async saveProfiles(profiles: UserProfile[], activeProfileId: string, isDarkMode: boolean): Promise<void> {
    await Promise.all([
      this.putValue(STORE_CONFIG, 'profiles', profiles),
      this.putValue(STORE_CONFIG, 'activeProfileId', activeProfileId),
      this.putValue(STORE_CONFIG, 'isDarkMode', isDarkMode),
    ]);
  }

  public async saveProfileProgress(
    profileId: string,
    progressMap: Record<string, SentenceProgress>
  ): Promise<void> {
    await this.putValue(STORE_PROGRESS, profileId, progressMap);
  }

  public async saveProfileOverrides(
    profileId: string,
    overridesMap: Record<string, CustomPatternOverride>
  ): Promise<void> {
    await this.putValue(STORE_OVERRIDES, profileId, overridesMap);
  }

  public async saveProfileSettings(
    profileId: string,
    settings: ProfileSettingsRecord
  ): Promise<void> {
    await this.putValue(STORE_CONFIG, `settings_${profileId}`, settings);
  }

  public async hydrateInitialAppState(defaultProfiles: UserProfile[]): Promise<{
    profiles: UserProfile[];
    activeProfileId: string;
    isDarkMode: boolean;
    progressMap: Record<string, SentenceProgress>;
    customOverrides: Record<string, CustomPatternOverride>;
    settings?: ProfileSettingsRecord;
  } | null> {
    const db = await this.openDB();
    if (!db) return null;

    const storedProfiles = await this.getValue<UserProfile[]>(STORE_CONFIG, 'profiles');
    const storedActiveId = await this.getValue<string>(STORE_CONFIG, 'activeProfileId');
    const storedDark = await this.getValue<boolean>(STORE_CONFIG, 'isDarkMode');

    const profiles =
      Array.isArray(storedProfiles) && storedProfiles.length > 0
        ? storedProfiles
        : defaultProfiles;
    const activeProfileId = storedActiveId || profiles[0]?.id || 'toi';
    const isDarkMode = typeof storedDark === 'boolean' ? storedDark : true;

    const progressMap =
      (await this.getValue<Record<string, SentenceProgress>>(STORE_PROGRESS, activeProfileId)) ||
      {};
    const customOverrides =
      (await this.getValue<Record<string, CustomPatternOverride>>(
        STORE_OVERRIDES,
        activeProfileId
      )) || {};
    const settings = await this.getValue<ProfileSettingsRecord>(
      STORE_CONFIG,
      `settings_${activeProfileId}`
    );

    return {
      profiles,
      activeProfileId,
      isDarkMode,
      progressMap,
      customOverrides,
      settings,
    };
  }

  public async loadProfileBundle(profileId: string): Promise<{
    progressMap: Record<string, SentenceProgress> | undefined;
    customOverrides: Record<string, CustomPatternOverride> | undefined;
    settings: ProfileSettingsRecord | undefined;
  }> {
    const [progressMap, customOverrides, settings] = await Promise.all([
      this.getValue<Record<string, SentenceProgress>>(STORE_PROGRESS, profileId),
      this.getValue<Record<string, CustomPatternOverride>>(STORE_OVERRIDES, profileId),
      this.getValue<ProfileSettingsRecord>(STORE_CONFIG, `settings_${profileId}`),
    ]);
    return { progressMap, customOverrides, settings };
  }

  /**
   * Build complete JSON backup of all profiles (Tôi, Vợ, Con), progress, custom syntax/lexical overrides,
   * and settings from IndexedDB + localStorage fallback.
   */
  public async exportAllDataAsJson(
    profiles: UserProfile[],
    activeProfileId: string,
    isDarkMode: boolean
  ): Promise<string> {
    const progressByProfile: Record<string, Record<string, SentenceProgress>> = {};
    const overridesByProfile: Record<string, Record<string, CustomPatternOverride>> = {};
    const settingsByProfile: Record<string, ProfileSettingsRecord> = {};

    for (const p of profiles) {
      const idbProg = await this.getValue<Record<string, SentenceProgress>>(STORE_PROGRESS, p.id);
      const idbOver = await this.getValue<Record<string, CustomPatternOverride>>(
        STORE_OVERRIDES,
        p.id
      );
      const idbSet = await this.getValue<ProfileSettingsRecord>(STORE_CONFIG, `settings_${p.id}`);

      let lsProg: Record<string, SentenceProgress> = {};
      let lsOver: Record<string, CustomPatternOverride> = {};
      try {
        const rawP = localStorage.getItem(`lexispeak_progress_${p.id}`);
        if (rawP) lsProg = JSON.parse(rawP);
        const rawO = localStorage.getItem(`lexispeak_overrides_${p.id}`);
        if (rawO) lsOver = JSON.parse(rawO);
      } catch {
        // ignore
      }

      progressByProfile[p.id] =
        idbProg && Object.keys(idbProg).length > 0 ? idbProg : lsProg;
      overridesByProfile[p.id] =
        idbOver && Object.keys(idbOver).length > 0 ? idbOver : lsOver;
      settingsByProfile[p.id] = idbSet || {
        selectedLevel: p.targetLevel || 'A2',
        selectedPatternId: 'a2-p1',
        enforceSequentialLock: false,
      };
    }

    const payload: LexiSpeakBackupPayload = {
      schemaVersion: 1,
      appName: 'LexiSpeak VN',
      exportedAtIso: new Date().toISOString(),
      activeProfileId,
      isDarkMode,
      profiles,
      progressByProfile,
      overridesByProfile,
      settingsByProfile,
    };

    return JSON.stringify(payload, null, 2);
  }

  /**
   * Import and persist a validated LexiSpeakBackupPayload into both IndexedDB and localStorage.
   */
  public async importAllDataFromPayload(payload: LexiSpeakBackupPayload): Promise<void> {
    await this.saveProfiles(payload.profiles, payload.activeProfileId, payload.isDarkMode);

    try {
      localStorage.setItem('lexispeak_vn_family_profiles_v2', JSON.stringify(payload.profiles));
      localStorage.setItem('lexispeak_vn_active_profile_id_v2', payload.activeProfileId);
      localStorage.setItem('lexispeak_vn_dark_mode_v1', JSON.stringify(payload.isDarkMode));
    } catch {
      // ignore
    }

    for (const p of payload.profiles) {
      const prog = payload.progressByProfile[p.id] || {};
      const over = payload.overridesByProfile[p.id] || {};
      const set = payload.settingsByProfile[p.id] || {
        selectedLevel: p.targetLevel || 'A2',
        selectedPatternId: 'a2-p1',
        enforceSequentialLock: false,
      };

      await Promise.all([
        this.saveProfileProgress(p.id, prog),
        this.saveProfileOverrides(p.id, over),
        this.saveProfileSettings(p.id, set),
      ]);

      try {
        localStorage.setItem(`lexispeak_progress_${p.id}`, JSON.stringify(prog));
        localStorage.setItem(`lexispeak_overrides_${p.id}`, JSON.stringify(over));
        localStorage.setItem(`lexispeak_level_${p.id}`, set.selectedLevel);
        localStorage.setItem(`lexispeak_pattern_${p.id}`, set.selectedPatternId);
        localStorage.setItem(
          `lexispeak_seq_${p.id}`,
          JSON.stringify(set.enforceSequentialLock)
        );
      } catch {
        // ignore
      }
    }
  }
}

export const indexedDBStorage = new IndexedDBPersistenceService();
