## Generate RSA-2048 Keys - JavaScript

Generate secure RSA-2048 keypairs for asymmetric encryption using JavaScript Web Crypto API.

### Code

```javascript
/**
 * Generate RSA keypair (2048) + random salt (16B). Exports keys to Base64 (SPKI/PKCS#8).
 * Uses Web Crypto API for cryptographically secure key generation
 */
async function generateKeys() {
  // Generate RSA-2048 keypair with OAEP padding
  const keyPair = await crypto.subtle.generateKey(
    { 
      name: "RSA-OAEP", 
      modulusLength: 2048, 
      publicExponent: new Uint8Array([1, 0, 1]), 
      hash: "SHA-256" 
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Export keys to standard formats
  const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Base64 encode for transport/storage
  const publicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(spki)));
  const privateKeyB64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
  const saltB64 = btoa(String.fromCharCode(...salt));

  return { publicKeyB64, privateKeyB64, saltB64 };
}

// Usage example
const { publicKeyB64, privateKeyB64, saltB64 } = await generateKeys();
console.log('Public Key:', publicKeyB64);
console.log('Private Key:', privateKeyB64);
console.log('Salt:', saltB64);
```

### Browser Crypto Class Implementation

```javascript
export class AsymmetricCryptoClient {
  constructor() {
    this.name = 'Browser';
    this.icon = '🖥️';
    this.keyCache = new Map(); // Cache imported keys
    this.te = new TextEncoder();
    this.td = new TextDecoder();
  }

  /**
   * Check if Web Crypto API is available
   */
  isAvailable() {
    return !!(globalThis.crypto?.subtle);
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
      }
    };
  }

  /**
   * Generate RSA keypair (2048) + random salt (16B). Exports keys to Base64 (SPKI/PKCS#8).
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

- **RSA-2048**: Strong asymmetric encryption with 2048-bit keys
- **OAEP Padding**: Optimal Asymmetric Encryption Padding with SHA-256
- **SPKI/PKCS#8**: Standard key formats for interoperability
- **Web Crypto API**: Uses browser's native cryptographic functions
- **Base64 Encoding**: Safe for JSON transport and storage

### Security Notes

- Uses `crypto.subtle.generateKey()` for cryptographically secure key generation
- RSA-2048 provides strong security for most applications
- OAEP padding prevents chosen ciphertext attacks
- Keys are generated client-side for maximum privacy
- Available in all modern browsers (requires HTTPS in production)
