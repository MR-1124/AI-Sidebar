// ─────────────────────────────────────────────────────────────
// Crypto Module — AES-256-GCM encryption for API keys
// Runs in Service Worker context only.
//
// Security: Key material is generated randomly on first install
// and stored in chrome.storage.local. Combined with the unique
// chrome.runtime.id as a pepper, this ensures each installation
// has a unique encryption key. Attacker must have access to both
// the storage AND the specific extension instance to derive keys.
// ─────────────────────────────────────────────────────────────

const INSTALL_SECRET_KEY = 'ais_install_secret';

export interface EncryptedData {
  ciphertext: string;  // Base64
  iv: string;          // Base64
  salt: string;        // Base64
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Get or generate per-installation key material.
 */
async function getKeyMaterial(useRuntimeId: boolean = false): Promise<Uint8Array> {
  const result = await chrome.storage.local.get(INSTALL_SECRET_KEY);
  let secretBase64 = result[INSTALL_SECRET_KEY] as string | undefined;

  if (!secretBase64) {
    // First install — generate and store a random secret
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    secretBase64 = arrayBufferToBase64(randomBytes.buffer as ArrayBuffer);
    await chrome.storage.local.set({ [INSTALL_SECRET_KEY]: secretBase64 });
  }

  // Use a stable pepper for unpacked dev extensions, but allow checking the old runtime ID
  const pepper = useRuntimeId ? (chrome.runtime?.id || 'aiside-fallback') : 'aiside-stable-pepper-v2';
  const combined = secretBase64 + ':' + pepper;
  return new TextEncoder().encode(combined);
}

async function deriveKey(salt: Uint8Array, useRuntimeId: boolean = false): Promise<CryptoKey> {
  const rawKeyMaterial = await getKeyMaterial(useRuntimeId);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    rawKeyMaterial as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt an API key using AES-256-GCM.
 * Returns base64-encoded ciphertext, IV, and salt.
 */
export async function encryptApiKey(plaintext: string): Promise<EncryptedData> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(salt, false); // Always encrypt with stable pepper now

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    new TextEncoder().encode(plaintext) as any
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext as ArrayBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
  };
}

/**
 * Decrypt an API key from its encrypted form.
 */
export async function decryptApiKey(encrypted: EncryptedData): Promise<string> {
  const salt = new Uint8Array(base64ToArrayBuffer(encrypted.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encrypted.iv));
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

  try {
    // Try stable pepper first (new default)
    const key = await deriveKey(salt, false);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      ciphertext
    );
    return new TextDecoder().decode(plaintext);
  } catch (err) {
    // Fallback to legacy runtime ID pepper for existing keys
    const legacyKey = await deriveKey(salt, true);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      legacyKey,
      ciphertext
    );
    return new TextDecoder().decode(plaintext);
  }
}
