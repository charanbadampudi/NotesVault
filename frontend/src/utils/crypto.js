import CryptoJS from 'crypto-js';

/**
 * Derive a 256-bit AES key from the user's master password using PBKDF2.
 * Runs 100,000 iterations — lives in memory only, never stored.
 */
export const deriveKey = (password, saltHex) =>
  CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(saltHex), {
    keySize: 256 / 32,
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256,
  });

/**
 * Encrypt a plaintext string.
 * Returns { ciphertext: string (base64), iv: string (32-char hex) }
 */
export const encryptText = (plaintext, key) => {
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return {
    ciphertext: encrypted.toString(), // base64
    iv: iv.toString(CryptoJS.enc.Hex), // 32 hex chars
  };
};

/**
 * Decrypt a base64 ciphertext string back to plaintext.
 */
export const decryptText = (ciphertext, key, ivHex) => {
  try {
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
};

/** Count words in a string */
export const wordCount = (text) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

/** Format a date nicely */
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** Format a date with time */
export const fmtDateTime = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/**
 * Encrypt a base64 image string with AES-256.
 */
export const encryptImage = (base64String, key) => {
  const { ciphertext, iv } = encryptText(base64String, key);
  return { encryptedData: ciphertext, iv };
};

/**
 * Decrypt an encrypted image back to base64.
 */
export const decryptImage = (encryptedData, key, ivHex) => {
  return decryptText(encryptedData, key, ivHex);
};
