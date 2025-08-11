/**
 * Client-side symmetric crypto operations using Web Crypto API
 * HKDF(SHA-256) + AES-GCM(256). Packed output: dataB64 = base64(IV||CIPHERTEXT||TAG)
 */
export class SymmetricCryptoClient {
  constructor() {
    this.name = 'Browser';
    this.icon = '🖥️';
    this.keyCache = new Map(); // Cache derived keys per (secret,salt) to avoid re-deriving
    this.te = new TextEncoder();
    this.td = new TextDecoder();
  }

  /**
   * Check if Web Crypto API is available
   * @returns {boolean}
   */
  isAvailable() {
    return !!(globalThis.crypto?.subtle);
  }

  /**
   * Get Web Crypto API subtle interface
   * @returns {SubtleCrypto}
   * @throws {Error} If Web Crypto API is not available
   */
  getSubtle() {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
      throw new Error("Web Crypto API not available");
    }
    return subtle;
  }

  /**
   * Base64 encoding utilities
   */
  get b64() {
    return {
      enc: (buf) => {
        const bytes = buf instanceof ArrayBuffer
          ? new Uint8Array(buf)
          : new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        let s = "";
        for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        return btoa(s);
      },
      dec: (str) => {
        const bin = atob(str);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
      },
    };
  }

  /**
   * Generate cache key for derived keys
   * @param {string} secretB64 - Base64 encoded secret
   * @param {string} saltB64 - Base64 encoded salt
   * @returns {string} Cache key
   */
  cacheKey(secretB64, saltB64) {
    return `${secretB64}:${saltB64}`;
  }

  /**
   * Derive AES-GCM key using HKDF-SHA256
   * @param {string} secretB64 - Base64 encoded secret (32 bytes)
   * @param {string} saltB64 - Base64 encoded salt
   * @param {boolean} useCache - Whether to use key caching
   * @returns {Promise<CryptoKey>} AES-GCM key
   */
  async deriveKey(secretB64, saltB64, useCache = true) {
    const cacheKey = this.cacheKey(secretB64, saltB64);
    
    if (useCache && this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }

    const ikm = this.b64.dec(secretB64);
    if (ikm.length !== 32) {
      throw new Error("secret must be 32 bytes");
    }
    const salt = this.b64.dec(saltB64);

    const subtle = this.getSubtle();
    const baseKey = await subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]);
    const aesKey = await subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt, info: new Uint8Array(0) },
      baseKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    if (useCache) {
      this.keyCache.set(cacheKey, aesKey);
    }
    
    return aesKey;
  }

  /**
   * Generate random secret (32B) + salt (16B), base64-encoded
   * @returns {Promise<{secretB64: string, saltB64: string}>}
   */
  async generateKeys() {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    return {
      secretB64: this.b64.enc(secret),
      saltB64: this.b64.enc(salt)
    };
  }

  /**
   * Encrypt plaintext using client-side AES-256-GCM
   * @param {string} plaintext - Text to encrypt
   * @param {string} secretB64 - Base64 encoded secret key
   * @param {string} saltB64 - Base64 encoded salt
   * @param {boolean} useCache - Whether to use key caching
   * @returns {Promise<{dataB64: string}>} Packed encrypted data
   */
  async encrypt(plaintext, secretB64, saltB64, useCache = true) {
    const key = await this.deriveKey(secretB64, saltB64, useCache);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const subtle = this.getSubtle();
    const ciphertext = await subtle.encrypt(
      { name: "AES-GCM", iv }, 
      key, 
      this.te.encode(plaintext)
    );
    
    // Pack IV + ciphertext + tag
    const packed = new Uint8Array(iv.length + ciphertext.byteLength);
    packed.set(iv, 0);
    packed.set(new Uint8Array(ciphertext), iv.length);
    
    return { dataB64: this.b64.enc(packed) };
  }

  /**
   * Decrypt packed data using client-side AES-256-GCM
   * @param {string} dataB64 - Base64 encoded packed data (IV + ciphertext + tag)
   * @param {string} secretB64 - Base64 encoded secret key
   * @param {string} saltB64 - Base64 encoded salt
   * @param {boolean} useCache - Whether to use key caching
   * @returns {Promise<{text: string}>} Decrypted plaintext
   */
  async decrypt(dataB64, secretB64, saltB64, useCache = true) {
    const packed = this.b64.dec(dataB64);
    if (packed.length <= 12) {
      throw new Error("cipher too short");
    }
    
    const iv = packed.slice(0, 12);
    const ciphertext = packed.slice(12);
    const key = await this.deriveKey(secretB64, saltB64, useCache);
    
    const subtle = this.getSubtle();
    const plaintext = await subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    
    return { text: this.td.decode(plaintext) };
  }

  /**
   * Clear the key cache
   */
  clearCache() {
    this.keyCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.keyCache.size,
      keys: Array.from(this.keyCache.keys()).map(k => k.substring(0, 20) + '...')
    };
  }

  /**
   * Get performance metrics for client-side operations
   * @param {number} startTime - Performance.now() start time
   * @param {number} endTime - Performance.now() end time
   * @param {boolean} cacheHit - Whether the operation used cached keys
   * @returns {object} Performance metrics
   */
  getMetrics(startTime, endTime, cacheHit = false) {
    const totalTime = endTime - startTime;
    
    return {
      totalTime: totalTime.toFixed(2),
      cryptoTime: totalTime.toFixed(2),
      cacheHit,
      venue: 'browser'
    };
  }

  /**
   * Demo function to test client-side crypto
   * @returns {Promise<object>} Demo results
   */
  async demo() {
    const bundle = await this.generateKeys();
    const { dataB64 } = await this.encrypt("hello-aes", bundle.secretB64, bundle.saltB64);
    const { text } = await this.decrypt(dataB64, bundle.secretB64, bundle.saltB64);
    return { ...bundle, dataB64, plaintext: text };
  }
}
