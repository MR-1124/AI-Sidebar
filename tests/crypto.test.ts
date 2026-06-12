// ─────────────────────────────────────────────────────────────
// Unit Tests: Crypto Module
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { encryptApiKey, decryptApiKey } from '../src/background/crypto';

describe('Crypto Module', () => {
  it('should encrypt and decrypt an API key', async () => {
    const originalKey = 'sk-test-1234567890abcdef';
    const encrypted = await encryptApiKey(originalKey);

    expect(encrypted.ciphertext).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.salt).toBeTruthy();

    const decrypted = await decryptApiKey(encrypted);
    expect(decrypted).toBe(originalKey);
  });

  it('should produce different ciphertexts for the same plaintext (random IV/salt)', async () => {
    const key = 'sk-test-same-key';
    const enc1 = await encryptApiKey(key);
    const enc2 = await encryptApiKey(key);

    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.salt).not.toBe(enc2.salt);

    // But both should decrypt to the same value
    expect(await decryptApiKey(enc1)).toBe(key);
    expect(await decryptApiKey(enc2)).toBe(key);
  });

  it('should handle empty strings', async () => {
    const encrypted = await encryptApiKey('');
    const decrypted = await decryptApiKey(encrypted);
    expect(decrypted).toBe('');
  });

  it('should handle long keys', async () => {
    const longKey = 'A'.repeat(1000);
    const encrypted = await encryptApiKey(longKey);
    const decrypted = await decryptApiKey(encrypted);
    expect(decrypted).toBe(longKey);
  });

  it('should handle Unicode characters', async () => {
    const unicodeKey = '🔑 my-key-密码-пароль';
    const encrypted = await encryptApiKey(unicodeKey);
    const decrypted = await decryptApiKey(encrypted);
    expect(decrypted).toBe(unicodeKey);
  });
});
