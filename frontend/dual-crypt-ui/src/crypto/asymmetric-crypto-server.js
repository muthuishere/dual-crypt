import { getAsymmetricGenerateUrl, getAsymmetricEncryptUrl, getAsymmetricDecryptUrl, createHeaders } from '../config/config.js';

/**
 * Server-side asymmetric crypto operations using the Spring Boot API
 */
export class AsymmetricCryptoServer {
  constructor() {
    this.name = 'Server';
    this.icon = '☁️';
  }

  /**
   * Generate RSA-2048 key pair and salt on the server
   * @returns {Promise<{publicKeyB64: string, privateKeyB64: string, saltB64: string}>}
   */
  async generateKeys() {
    const response = await fetch(getAsymmetricGenerateUrl());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Encrypt plaintext using server-side RSA-OAEP
   * @param {string} plaintext - Text to encrypt
   * @param {string} publicKeyB64 - Base64 encoded RSA public key (SPKI format)
   * @returns {Promise<{text: string}>}
   */
  async encrypt(plaintext, publicKeyB64) {
    const response = await fetch(getAsymmetricEncryptUrl(), {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        plaintext: plaintext,
        publicKeyB64: publicKeyB64
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Decrypt ciphertext using server-side RSA-OAEP
   * @param {string} cipherB64 - Base64 encoded ciphertext
   * @param {string} privateKeyB64 - Base64 encoded RSA private key (PKCS#8 format)
   * @returns {Promise<{text: string}>}
   */
  async decrypt(cipherB64, privateKeyB64) {
    const response = await fetch(getAsymmetricDecryptUrl(), {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        cipherB64: cipherB64,
        privateKeyB64: privateKeyB64
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Check if server is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const response = await fetch(getAsymmetricGenerateUrl(), { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get performance metrics for the last operation
   * @param {number} startTime - Performance.now() start time
   * @param {number} endTime - Performance.now() end time
   * @param {Response} response - Fetch response object
   * @returns {object} Performance metrics
   */
  getMetrics(startTime, endTime, response) {
    const totalTime = endTime - startTime;
    const serverTime = response?.headers?.get('X-Server-Total-Time-Ms') || null;
    const serializeTime = response?.headers?.get('X-Server-Serialize-Time-Ms') || null;
    
    return {
      totalTime: totalTime.toFixed(2),
      networkTime: serverTime ? (totalTime - parseFloat(serverTime)).toFixed(2) : null,
      serverTime: serverTime,
      serializeTime: serializeTime,
      venue: 'server'
    };
  }

  /**
   * Demo function to test server-side asymmetric crypto
   * @returns {Promise<object>} Demo results
   */
  async demo() {
    const bundle = await this.generateKeys();
    const { text: cipherB64 } = await this.encrypt("hello-rsa", bundle.publicKeyB64);
    const { text: plaintext } = await this.decrypt(cipherB64, bundle.privateKeyB64);
    return { ...bundle, cipherB64, plaintext };
  }
}
