import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VOICE_OPTIONS,
  getCurrentVoiceOption,
  setVoiceOption,
  getSamanthaOrSiriVoice,
} from '../speechVoiceManager';

test('VOICE_OPTIONS includes Google Gemini Audio TTS and Samantha (Enhanced) / Siri Voice', () => {
  assert.equal(VOICE_OPTIONS.length, 2);

  const geminiOption = VOICE_OPTIONS.find((v) => v.id === 'gemini_audio');
  assert.ok(geminiOption, 'Must include Google Gemini Audio TTS option');
  assert.equal(geminiOption.name, 'Google Gemini Audio TTS');
  assert.equal(geminiOption.isAi, true);

  const samanthaOption = VOICE_OPTIONS.find((v) => v.id === 'samantha_siri');
  assert.ok(samanthaOption, 'Must include Samantha (Enhanced) / Siri Voice option');
  assert.equal(samanthaOption.name, 'Samantha (Enhanced) / Siri Voice');
  assert.equal(samanthaOption.isAi, false);
});

test('setVoiceOption correctly updates current selection and switches between the 2 options', () => {
  setVoiceOption('samantha_siri');
  assert.equal(getCurrentVoiceOption(), 'samantha_siri');

  setVoiceOption('gemini_audio');
  assert.equal(getCurrentVoiceOption(), 'gemini_audio');
});

test('getSamanthaOrSiriVoice gracefully returns null in node test environment without browser speechSynthesis', () => {
  const voice = getSamanthaOrSiriVoice();
  // In node environment without window.speechSynthesis, it returns null without throwing
  assert.equal(voice, null);
});

test('clearAudioCache and stopAllSpeech execute cleanly without crashing in node environment', async () => {
  const { clearAudioCache, stopAllSpeech } = await import('../speechVoiceManager');
  assert.doesNotThrow(() => {
    stopAllSpeech();
    clearAudioCache();
  });
});

