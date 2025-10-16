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
   * Sign message and return JWT token using RSA-PKCS1-v1_5 with SHA-256 (compatible with Spring Boot)
   * @param {string} message - Message to sign
   * @param {string|CryptoKey} privateKeyB64OrKey - Base64 private key or CryptoKey
   * @param {boolean} useCache - Whether to use key caching (ignored if CryptoKey passed)
   * @returns {Promise<{jwtToken: string}>} JWT token
   */
  async sign(message, privateKeyB64OrKey, useCache = true) {
    const key = typeof privateKeyB64OrKey === "string" 
      ? await this.importPrivateKeyForSigning(privateKeyB64OrKey, useCache) 
      : privateKeyB64OrKey;
    
    const subtle = this.getSubtle();
    
    // Create JWT header
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    
    // Create JWT payload - detect if message is JSON or simple string
    let payload = {};
    
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(message);
      if (typeof parsed === 'object' && parsed !== null) {
        // Valid JSON object - use as claims
        payload = { ...parsed };
      } else {
        // JSON primitive - wrap in data claim
        payload.data = message;
      }
    } catch {
      // Not valid JSON - treat as simple string
      payload.data = message;
    }
    
    // Add timestamp claims if not present
    const now = Math.floor(Date.now() / 1000);
    if (!payload.iat) payload.iat = now;
    if (!payload.exp) payload.exp = now + 3600; // 1 hour expiration
    
    // Encode header and payload
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    
    // Create signature using RSASSA-PKCS1-v1_5 (same as Spring Boot's SHA256withRSA)
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signatureInputBytes = this.te.encode(signatureInput);
    
    const signature = await subtle.sign(
      "RSASSA-PKCS1-v1_5", // Use PKCS#1 v1.5 to match Spring Boot
      key, 
      signatureInputBytes
    );
    
    const encodedSignature = this.base64UrlEncode(signature);
    const jwtToken = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
    
    return { jwtToken };
  }

  /**
   * Verify JWT token and return original data (compatible with Spring Boot)
   * @param {string} jwtToken - JWT token to verify
   * @param {string|CryptoKey} publicKeyB64OrKey - Base64 public key or CryptoKey
   * @param {boolean} useCache - Whether to use key caching (ignored if CryptoKey passed)
   * @returns {Promise<{verified: boolean, data: string}>} Verification result
   */
  async verify(jwtToken, publicKeyB64OrKey, useCache = true) {
    const key = typeof publicKeyB64OrKey === "string" 
      ? await this.importPublicKeyForVerifying(publicKeyB64OrKey, useCache) 
      : publicKeyB64OrKey;
    
    const subtle = this.getSubtle();
    
    try {
      // Parse JWT token
      const parts = jwtToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }
      
      const [encodedHeader, encodedPayload, encodedSignature] = parts;
      
      // Verify signature using RSASSA-PKCS1-v1_5
      const signatureInput = `${encodedHeader}.${encodedPayload}`;
      const signatureInputBytes = this.te.encode(signatureInput);
      const signature = this.base64UrlDecode(encodedSignature);
      
      const verified = await subtle.verify(
        "RSASSA-PKCS1-v1_5", // Use PKCS#1 v1.5 to match Spring Boot
        key, 
        signature, 
        signatureInputBytes
      );
      
      if (!verified) {
        throw new Error('JWT signature verification failed');
      }
      
      // Parse payload to extract original data
      const payload = JSON.parse(this.base64UrlDecodeToString(encodedPayload));
      
      // Check expiration if present
      if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        throw new Error('JWT token has expired');
      }
      
      // Return original data (match Spring Boot logic)
      if (payload.data !== undefined) {
        // Was a simple string or JSON primitive
        return { verified: true, data: payload.data };
      } else {
        // Was JSON claims - return as JSON string, removing standard JWT claims
        const claims = { ...payload };
        delete claims.iat;
        delete claims.exp;
        return { verified: true, data: JSON.stringify(claims) };
      }
      
    } catch (error) {
      throw new Error(`JWT verification failed: ${error.message}`);
    }
  }

  /**
   * Base64 URL encode (JWT format)
   * @param {string|ArrayBuffer} input - Input to encode
   * @returns {string} Base64 URL encoded string
   */
  base64UrlEncode(input) {
    let base64;
    if (typeof input === 'string') {
      base64 = btoa(input);
    } else {
      base64 = this.b64.enc(input);
    }
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Base64 URL decode to ArrayBuffer
   * @param {string} input - Base64 URL encoded string
   * @returns {ArrayBuffer} Decoded buffer
   */
  base64UrlDecode(input) {
    // Add padding if needed
    const padded = input + '='.repeat((4 - input.length % 4) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    return this.b64.dec(base64);
  }

  /**
   * Base64 URL decode to string
   * @param {string} input - Base64 URL encoded string
   * @returns {string} Decoded string
   */
  base64UrlDecodeToString(input) {
    // Add padding if needed
    const padded = input + '='.repeat((4 - input.length % 4) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    return atob(base64);
  }

  /**
   * Import RSA private key for signing (RSA-PSS)
   * @param {string} privateKeyB64 - Base64 private key (PKCS#8)
   * @param {boolean} useCache - Whether to use key caching
   * @returns {Promise<CryptoKey>} Imported private key
   */
  async importPrivateKeyForSigning(privateKeyB64, useCache = true) {
    const cacheKey = `sign-priv-${privateKeyB64}`;
    if (useCache && this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }

    const keyData = this.b64.dec(privateKeyB64);
    const key = await this.getSubtle().importKey(
      "pkcs8", 
      keyData, 
      { 
        name: "RSASSA-PKCS1-v1_5", 
        hash: "SHA-256" 
      }, 
      false, 
      ["sign"]
    );
    
    if (useCache) {
      this.keyCache.set(cacheKey, key);
    }
    return key;
  }

  /**
   * Import RSA public key for verification (RSA-PSS)
   * @param {string} publicKeyB64 - Base64 public key (SPKI)
   * @param {boolean} useCache - Whether to use key caching
   * @returns {Promise<CryptoKey>} Imported public key
   */
  async importPublicKeyForVerifying(publicKeyB64, useCache = true) {
    const cacheKey = `verify-pub-${publicKeyB64}`;
    if (useCache && this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }

    const keyData = this.b64.dec(publicKeyB64);
    const key = await this.getSubtle().importKey(
      "spki", 
      keyData, 
      { 
        name: "RSASSA-PKCS1-v1_5", 
        hash: "SHA-256" 
      }, 
      false, 
      ["verify"]
    );
    
    if (useCache) {
      this.keyCache.set(cacheKey, key);
    }
    return key;
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
