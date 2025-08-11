## AES-256-GCM Decryption - JavaScript

Decrypt messages using AES-256-GCM with HKDF-SHA256 key derivation in JavaScript.

### Code

```javascript
/**
 * Decrypt packed data using AES-256-GCM with HKDF-SHA256 key derivation
 */
async function decrypt(dataB64, secretB64, saltB64) {
  // Decode packed data (IV + ciphertext + tag)
  const packed = atob(dataB64).split('').map(c => c.charCodeAt(0));
  if (packed.length <= 12) {
    throw new Error("cipher too short");
  }
  
  // Extract IV and ciphertext
  const iv = new Uint8Array(packed.slice(0, 12));
  const ciphertext = new Uint8Array(packed.slice(12));
  
  // Derive AES key from secret using HKDF-SHA256
  const key = await deriveKey(secretB64, saltB64);
  
  // Decrypt using AES-GCM
  const subtle = crypto.subtle;
  const plaintext = await subtle.decrypt(
    { name: "AES-GCM", iv }, 
    key, 
    ciphertext
  );
  
  // Return as string
  return { text: new TextDecoder().decode(plaintext) };
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
   * Decrypt packed data using client-side AES-256-GCM
   */
  async decrypt(dataB64, secretB64, saltB64, useCache = true) {
    const packed = this.b64.dec(dataB64);
    if (packed.length <= 12) {
      throw new Error("cipher too short");
    }
    
    const iv = packed.slice(0, 12);
    const ciphertext = packed.slice(12);
    const key = await this.deriveKey(secretB64, saltB64, useCache);
    
    const subtle = crypto.subtle;
    const plaintext = await subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    
    return { text: this.td.decode(plaintext) };
  }
}
```

### Usage Example

```javascript
// Example encrypted data from encrypt operation
const dataB64 = "+Mr7ZDSWMCjGAmJLgpPCt73gCEEF0aJK9GRnG2ph8Tv...";
const secretB64 = "GcHrUKLfctsYthcVPLnr...";
const saltB64 = "1EwAqBTFzVC16RaT0MZt...";

// Decrypt the message
const { text } = await decrypt(dataB64, secretB64, saltB64);
console.log('Decrypted:', text); // "Hello, World!"
```

### Key Features

- **AES-256-GCM**: Authenticated decryption with integrity verification
- **HKDF-SHA256**: Secure key derivation from secret and salt
- **Automatic Unpacking**: Extracts IV, ciphertext, and tag from packed format
- **Key Caching**: Optional caching of derived keys for performance
- **Integrity Verification**: GCM mode automatically verifies authenticity

### Security Notes

- GCM mode automatically verifies message authenticity and integrity
- Decryption will fail if data has been tampered with
- HKDF ensures secure key derivation from secret material
- Key caching improves performance for multiple operations
- Constant-time operations protect against timing attacks
