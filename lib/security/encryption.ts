/**
 * Client-Side Encryption Utilities
 * 
 * Provides encryption for sensitive data stored in localStorage.
 * Uses the Web Crypto API for secure encryption/decryption.
 * 
 * Note: Client-side encryption adds a layer of protection but is not
 * a complete security solution. For highly sensitive data, consider
 * server-side storage with proper authentication.
 */

// Encryption configuration
const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

// Storage key for the derived key salt
const SALT_STORAGE_KEY = "william_encryption_salt";

/**
 * Generate a random initialization vector
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Generate or retrieve the encryption salt
 */
function getOrCreateSalt(): Uint8Array {
  if (typeof window === "undefined") {
    return new Uint8Array(SALT_LENGTH);
  }

  const storedSalt = localStorage.getItem(SALT_STORAGE_KEY);
  if (storedSalt) {
    return new Uint8Array(
      storedSalt.split(",").map((n) => parseInt(n, 10))
    );
  }

  const newSalt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  localStorage.setItem(SALT_STORAGE_KEY, newSalt.toString());
  return newSalt;
}

/**
 * Derive an encryption key from a password/identifier
 * In production, this should use a user-specific secret
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const salt = getOrCreateSalt();

  // Import the password as a key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive the actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Get a device-specific identifier for key derivation
 * This is a simple fingerprint - not meant to be highly unique
 */
function getDeviceIdentifier(): string {
  if (typeof window === "undefined") {
    return "server-context";
  }

  // Combine various browser properties for a simple fingerprint
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
    "william-ai-v1", // Application identifier
  ];

  return components.join("|");
}

/**
 * Encrypt data for secure storage
 */
export async function encryptData(data: string): Promise<string> {
  if (typeof window === "undefined" || !crypto.subtle) {
    // Return base64 encoded data if crypto not available
    return btoa(unescape(encodeURIComponent(data)));
  }

  try {
    const key = await deriveKey(getDeviceIdentifier());
    const encoder = new TextEncoder();
    const iv = generateIV();

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
      key,
      encoder.encode(data)
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption failed:", error);
    // Fallback to base64 encoding
    return btoa(unescape(encodeURIComponent(data)));
  }
}

/**
 * Decrypt data from secure storage
 */
export async function decryptData(encryptedData: string): Promise<string> {
  if (typeof window === "undefined" || !crypto.subtle) {
    // Return base64 decoded data if crypto not available
    return decodeURIComponent(escape(atob(encryptedData)));
  }

  try {
    const key = await deriveKey(getDeviceIdentifier());

    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encryptedBuffer = combined.slice(IV_LENGTH);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
      key,
      encryptedBuffer.buffer as ArrayBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    // Try fallback base64 decoding (for legacy data)
    try {
      return decodeURIComponent(escape(atob(encryptedData)));
    } catch {
      return "";
    }
  }
}

/**
 * Wrapper for encrypted localStorage operations
 */
export const secureStorage = {
  /**
   * Store encrypted data
   */
  async setItem(key: string, value: unknown): Promise<void> {
    if (typeof window === "undefined") return;

    const jsonString = JSON.stringify(value);
    const encrypted = await encryptData(jsonString);
    localStorage.setItem(key, encrypted);
  },

  /**
   * Retrieve and decrypt data
   */
  async getItem<T>(key: string): Promise<T | null> {
    if (typeof window === "undefined") return null;

    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = await decryptData(encrypted);
      return JSON.parse(decrypted) as T;
    } catch {
      // If decryption fails, try parsing as plain JSON (legacy data)
      try {
        return JSON.parse(encrypted) as T;
      } catch {
        return null;
      }
    }
  },

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },

  /**
   * Check if an item exists
   */
  hasItem(key: string): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(key) !== null;
  },
};

/**
 * Migrate unencrypted data to encrypted storage
 */
export async function migrateToEncryptedStorage(
  keys: string[]
): Promise<void> {
  if (typeof window === "undefined") return;

  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (!value) continue;

    try {
      // Try to parse as JSON (unencrypted data)
      const parsed = JSON.parse(value);
      
      // Re-save with encryption
      await secureStorage.setItem(key, parsed);
      if (process.env.NODE_ENV === "development") {
        console.log(`Migrated ${key} to encrypted storage`);
      }
    } catch {
      // Already encrypted or invalid, skip
    }
  }
}

/**
 * Clear all encrypted data and encryption keys
 */
export function clearSecureStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SALT_STORAGE_KEY);
}
