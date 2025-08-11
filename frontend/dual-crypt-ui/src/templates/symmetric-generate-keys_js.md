## Generate AES-256 Keys - JavaScript

Generate secure random keys for AES-256-GCM encryption using JavaScript Web Crypto API.

### Code

```javascript
/**
 * Generate random secret (32B) + salt (16B), base64-encoded
 * Uses Web Crypto API for cryptographically secure random generation
 */
async function generateKeys() {
  // Generate cryptographically secure random bytes
  const secret = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
  const salt = crypto.getRandomValues(new Uint8Array(16));   // 128-bit salt
  
  // Base64 encode for transport/storage
  const secretB64 = btoa(String.fromCharCode(...secret));
  const saltB64 = btoa(String.fromCharCode(...salt));
  
  return { secretB64, saltB64 };
}

// Usage example
const { secretB64, saltB64 } = await generateKeys();
console.log('Secret:', secretB64);
console.log('Salt:', saltB64);
```

### Browser Crypto Class Implementation

```javascript
export class SymmetricCryptoClient {
  constructor() {
    this.name = 'Browser';
    this.icon = '🖥️';
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
      }
    };
  }

  /**
   * Generate random secret (32B) + salt (16B), base64-encoded
   */
  async generateKeys() {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    return {
      secretB64: this.b64.enc(secret),
      saltB64: this.b64.enc(salt)
    };
  }
}
```

### Key Features

- **Web Crypto API**: Uses browser's native cryptographic functions
- **256-bit Secret Key**: Provides strong encryption strength
- **128-bit Salt**: Ensures unique key derivation for each session
- **Cryptographically Secure**: Uses `crypto.getRandomValues()`
- **Base64 Encoding**: Safe for JSON transport and storage

### Security Notes

- Uses `crypto.getRandomValues()` for cryptographically secure random generation
- Available in all modern browsers (requires HTTPS in production)
- Keys are generated client-side for maximum privacy
- Salt ensures unique derived keys even with same secret
