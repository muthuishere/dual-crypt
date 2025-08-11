## AES-256-GCM Encryption - JavaScript

Encrypt messages using AES-256-GCM with HKDF-SHA256 key derivation in JavaScript.

### Code

```javascript
/**
 * Encrypt plaintext using AES-256-GCM with HKDF-SHA256 key derivation
 */
async function encrypt(plaintext, secretB64, saltB64) {
  // Derive AES key from secret using HKDF-SHA256
  const key = await deriveKey(secretB64, saltB64);
  
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt using AES-GCM
  const subtle = crypto.subtle;
  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv }, 
    key, 
    new TextEncoder().encode(plaintext)
  );
  
  // Pack IV + ciphertext + tag into single buffer
  const packed = new Uint8Array(iv.length + ciphertext.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertext), iv.length);
  
  // Return as base64
  return { dataB64: btoa(String.fromCharCode(...packed)) };
}

/**
 * Derive AES-GCM key using HKDF-SHA256
 */
async function deriveKey(secretB64, saltB64) {
  const ikm = atob(secretB64).split('').map(c => c.charCodeAt(0));
  const salt = atob(saltB64).split('').map(c => c.charCodeAt(0));
  
  const subtle = crypto.subtle;
  const baseKey = await subtle.importKey(
    "raw", 
    new Uint8Array(ikm), 
    "HKDF", 
    false, 
    ["deriveKey"]
  );
  
  return await subtle.deriveKey(
    { 
      name: "HKDF", 
      hash: "SHA-256", 
      salt: new Uint8Array(salt), 
      info: new Uint8Array(0) 
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}
```

### Browser Crypto Class Implementation

```javascript
export class SymmetricCryptoClient {
  constructor() {
    this.name = 'Browser';
    this.icon = '🖥️';
    this.keyCache = new Map(); // Cache derived keys
    this.te = new TextEncoder();
    this.td = new TextDecoder();
  }

  /**
   * Base64 utilities
   */
  get b64() {
    return {
      enc: (buf) => {
        const bytes = new Uint8Array(buf);
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
   * Derive AES-GCM key using HKDF-SHA256 with caching
   */
  async deriveKey(secretB64, saltB64, useCache = true) {
    const cacheKey = `${secretB64}:${saltB64}`;
    
    if (useCache && this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }

    const ikm = this.b64.dec(secretB64);
    if (ikm.length !== 32) {
      throw new Error("secret must be 32 bytes");
    }
    const salt = this.b64.dec(saltB64);

    const subtle = crypto.subtle;
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
   * Encrypt plaintext using client-side AES-256-GCM
   */
  async encrypt(plaintext, secretB64, saltB64, useCache = true) {
    const key = await this.deriveKey(secretB64, saltB64, useCache);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const subtle = crypto.subtle;
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
}
```

### Key Features

- **AES-256-GCM**: Authenticated encryption with 256-bit keys
- **HKDF-SHA256**: Secure key derivation from secret and salt
- **96-bit IV**: Random initialization vector for each encryption
- **Key Caching**: Optional caching of derived keys for performance
- **Packed Format**: Single base64 string contains IV + ciphertext + tag

### Security Notes

- Each encryption uses a fresh random IV
- GCM mode provides both confidentiality and authenticity
- HKDF ensures secure key derivation from secret material
- Key caching improves performance but uses more memory
