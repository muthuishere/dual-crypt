## RSA-OAEP Encryption - JavaScript

Encrypt messages using RSA-OAEP with SHA-256 in JavaScript.

### Code

```javascript
/**
 * Encrypt plaintext using RSA-OAEP with SHA-256
 */
async function encrypt(plaintext, publicKeyB64) {
  // Import RSA public key from SPKI Base64
  const publicKey = await importPublicKey(publicKeyB64);
  
  // Encrypt using RSA-OAEP
  const subtle = crypto.subtle;
  const ciphertext = await subtle.encrypt(
    { name: "RSA-OAEP" }, 
    publicKey, 
    new TextEncoder().encode(plaintext)
  );
  
  // Return as base64
  return { dataB64: btoa(String.fromCharCode(...new Uint8Array(ciphertext))) };
}

/**
 * Import RSA public key from SPKI Base64
 */
async function importPublicKey(spkiB64) {
  const spkiBytes = atob(spkiB64).split('').map(c => c.charCodeAt(0));
  
  const subtle = crypto.subtle;
  return await subtle.importKey(
    "spki", 
    new Uint8Array(spkiBytes), 
    { name: "RSA-OAEP", hash: "SHA-256" }, 
    true, 
    ["encrypt"]
  );
}
```

### Browser Crypto Class Implementation

```javascript
export class AsymmetricCryptoClient {
  constructor() {
    this.name = 'Browser';
    this.icon = '🖥️';
    this.keyCache = new Map(); // Cache imported keys per Base64 string
    this.te = new TextEncoder();
    this.td = new TextDecoder();
  }

  /**
   * Base64 utilities
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
      }
    };
  }

  /**
   * Generate cache key for imported keys
   */
  cacheKey(keyB64, type) {
    return `${type}:${keyB64.substring(0, 50)}...`;
  }

  /**
   * Import RSA public key from SPKI Base64 with caching
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
   * Encrypt plaintext with RSA-OAEP(SHA-256)
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
   * Get Web Crypto API subtle interface
   */
  getSubtle() {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
      throw new Error("Web Crypto API not available");
    }
    return subtle;
  }
}
```

### Key Features

- **RSA-OAEP**: Optimal Asymmetric Encryption Padding with SHA-256
- **SPKI Import**: Standard public key format for interoperability
- **Key Caching**: Optional caching of imported keys for performance
- **Flexible Input**: Accepts Base64 string or CryptoKey object
- **Base64 Output**: Single base64 string contains encrypted data

### Security Notes

- OAEP padding prevents chosen ciphertext attacks
- SHA-256 hash function provides strong security
- Public key encryption allows secure message sending
- Key caching improves performance but uses more memory
- Each encryption produces different output due to random padding

### Usage Example

```javascript
// Example public key and message
const publicKeyB64 = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...";
const message = "Hello, World!";

// Encrypt the message
const { dataB64 } = await encrypt(message, publicKeyB64);
console.log('Encrypted:', dataB64);
```
