/**
 * Client-side asymmetric crypto operations using Web Crypto API
 * RSA-OAEP (SHA-256) with SPKI/PKCS#8 Base64 keys. Interops with Spring AsymmetricCryptoService.
 */
export class AsymmetricCryptoClient {
  constructor() {
    this.name = 'Browser';
    this.icon = '🖥️';
    this.keyCache = new Map(); // Cache imported keys per Base64 string to avoid re-importing
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
   * Generate cache key for imported keys
   * @param {string} keyB64 - Base64 encoded key
   * @param {string} type - Key type ('public' or 'private')
   * @returns {string} Cache key
   */
  cacheKey(keyB64, type) {
    return `${type}:${keyB64.substring(0, 50)}...`;
  }

  /**
   * Generate RSA keypair (2048) + random salt (16B). Exports keys to Base64 (SPKI/PKCS#8).
   * @returns {Promise<{publicKeyB64: string, privateKeyB64: string, saltB64: string}>}
   */
  async generateKeys() {
    const subtle = this.getSubtle();
    const kp = await subtle.generateKey(
      { 
        name: "RSA-OAEP", 
        modulusLength: 2048, 
        publicExponent: new Uint8Array([1, 0, 1]), 
        hash: "SHA-256" 
      },
      true,
      ["encrypt", "decrypt"]
    );

    const spki = await subtle.exportKey("spki", kp.publicKey);
    const pkcs8 = await subtle.exportKey("pkcs8", kp.privateKey);
    const salt = crypto.getRandomValues(new Uint8Array(16));

    return { 
      publicKeyB64: this.b64.enc(spki), 
      privateKeyB64: this.b64.enc(pkcs8), 
      saltB64: this.b64.enc(salt) 
    };
  }

  /**
   * Import RSA public key from SPKI Base64
   * @param {string} spkiB64 - Base64 encoded SPKI public key
   * @param {boolean} useCache - Whether to use key caching
   * @returns {Promise<CryptoKey>} RSA public key
   */
  async importPublicKey(spkiB64, useCache = true) {
    const cacheKey = this.cacheKey(spkiB64, 'public');
    
    if (useCache && this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }

    const subtle = this.getSubtle();
    const key = await subtle.importKey(
      "spki", 
      this.b64.dec(spkiB64), 
      { name: "RSA-OAEP", hash: "SHA-256" }, 
      true, 
      ["encrypt"]
    );

    if (useCache) {
      this.keyCache.set(cacheKey, key);
    }
    
    return key;
  }

  /**
   * Import RSA private key from PKCS#8 Base64
   * @param {string} pkcs8B64 - Base64 encoded PKCS#8 private key
   * @param {boolean} useCache - Whether to use key caching
   * @returns {Promise<CryptoKey>} RSA private key
   */
  async importPrivateKey(pkcs8B64, useCache = true) {
    const cacheKey = this.cacheKey(pkcs8B64, 'private');
    
    if (useCache && this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }

    const subtle = this.getSubtle();
    const key = await subtle.importKey(
      "pkcs8", 
      this.b64.dec(pkcs8B64), 
      { name: "RSA-OAEP", hash: "SHA-256" }, 
      true, 
      ["decrypt"]
    );

    if (useCache) {
      this.keyCache.set(cacheKey, key);
    }
    
    return key;
  }

  /**
   * Encrypt plaintext with RSA-OAEP(SHA-256)
   * @param {string} plaintext - Text to encrypt
   * @param {string|CryptoKey} publicKeyB64OrKey - Base64 public key or CryptoKey
   * @param {boolean} useCache - Whether to use key caching (ignored if CryptoKey passed)
   * @returns {Promise<{dataB64: string}>} Base64 encoded ciphertext
   */
  async encrypt(plaintext, publicKeyB64OrKey, useCache = true) {
    const key = typeof publicKeyB64OrKey === "string" 
      ? await this.importPublicKey(publicKeyB64OrKey, useCache) 
      : publicKeyB64OrKey;
    
    const subtle = this.getSubtle();
    const ciphertext = await subtle.encrypt(
      { name: "RSA-OAEP" }, 
      key, 
      this.te.encode(plaintext)
    );
    
    return { dataB64: this.b64.enc(ciphertext) };
  }

  /**
   * Decrypt base64 ciphertext with RSA-OAEP(SHA-256)
   * @param {string} dataB64 - Base64 encoded ciphertext
   * @param {string|CryptoKey} privateKeyB64OrKey - Base64 private key or CryptoKey
   * @param {boolean} useCache - Whether to use key caching (ignored if CryptoKey passed)
   * @returns {Promise<{text: string}>} Decrypted plaintext
   */
  async decrypt(dataB64, privateKeyB64OrKey, useCache = true) {
    const key = typeof privateKeyB64OrKey === "string" 
      ? await this.importPrivateKey(privateKeyB64OrKey, useCache) 
      : privateKeyB64OrKey;
    
    const subtle = this.getSubtle();
    const plaintext = await subtle.decrypt(
      { name: "RSA-OAEP" }, 
      key, 
      this.b64.dec(dataB64)
    );
    
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
      keys: Array.from(this.keyCache.keys())
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
   * Demo function to test client-side asymmetric crypto
   * @returns {Promise<object>} Demo results
   */
  async demo() {
    const bundle = await this.generateKeys();
    const { dataB64 } = await this.encrypt("hello-rsa", bundle.publicKeyB64);
    const { text } = await this.decrypt(dataB64, bundle.privateKeyB64);
    return { ...bundle, dataB64, plaintext: text };
  }
}
