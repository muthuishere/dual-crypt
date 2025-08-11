## RSA-OAEP Decryption - JavaScript

Decrypt messages using RSA-OAEP with SHA-256 in JavaScript.

### Code

```javascript
/**
 * Decrypt base64 ciphertext using RSA-OAEP with SHA-256
 */
async function decrypt(dataB64, privateKeyB64) {
  // Import RSA private key from PKCS#8 Base64
  const privateKey = await importPrivateKey(privateKeyB64);
  
  // Decode ciphertext from base64
  const ciphertext = atob(dataB64).split('').map(c => c.charCodeAt(0));
  
  // Decrypt using RSA-OAEP
  const subtle = crypto.subtle;
  const plaintext = await subtle.decrypt(
    { name: "RSA-OAEP" }, 
    privateKey, 
    new Uint8Array(ciphertext)
  );
  
  // Return as string
  return { text: new TextDecoder().decode(plaintext) };
}

/**
 * Import RSA private key from PKCS#8 Base64
 */
async function importPrivateKey(pkcs8B64) {
  const pkcs8Bytes = atob(pkcs8B64).split('').map(c => c.charCodeAt(0));
  
  const subtle = crypto.subtle;
  return await subtle.importKey(
    "pkcs8", 
    new Uint8Array(pkcs8Bytes), 
    { name: "RSA-OAEP", hash: "SHA-256" }, 
    true, 
    ["decrypt"]
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
   * Import RSA private key from PKCS#8 Base64 with caching
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
   * Decrypt base64 ciphertext with RSA-OAEP(SHA-256)
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

### Usage Example

```javascript
// Example encrypted data from encrypt operation
const dataB64 = "CjGAmJLgpPCt73gCEEF0aJK9GRnG2ph8Tv...";
const privateKeyB64 = "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...";

// Decrypt the message
const { text } = await decrypt(dataB64, privateKeyB64);
console.log('Decrypted:', text); // "Hello, World!"
```

### Key Features

- **RSA-OAEP**: Optimal Asymmetric Encryption Padding with SHA-256
- **PKCS#8 Import**: Standard private key format for interoperability
- **Key Caching**: Optional caching of imported keys for performance
- **Flexible Input**: Accepts Base64 string or CryptoKey object
- **Secure Decryption**: Only private key holder can decrypt messages

### Security Notes

- OAEP padding automatically verifies integrity during decryption
- Decryption will fail if data has been tampered with or wrong key used
- Private key must be kept secure and never shared
- Key caching improves performance for multiple operations
- Constant-time operations protect against timing attacks

### Error Handling

Common decryption failures and their causes:

- **OperationError**: Wrong private key or corrupted data
- **InvalidAccessError**: Key doesn't have decrypt usage
- **DataError**: Invalid PKCS#8 key format
- **NotSupportedError**: RSA-OAEP not supported

Always wrap decryption calls in try-catch blocks to handle these errors gracefully.
