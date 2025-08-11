import { getSymmetricGenerateUrl, getSymmetricEncryptUrl, getSymmetricDecryptUrl, createHeaders } from '../config/config.js';

/**
 * Server-side symmetric crypto operations using the Spring Boot API
 */
export class SymmetricCryptoServer {
  constructor() {
    this.name = 'Server';
    this.icon = '☁️';
  }

  /**
   * Generate AES-256 key and salt on the server
   * @returns {Promise<{secretB64: string, saltB64: string}>}
   */
  async generateKeys() {
    const response = await fetch(getSymmetricGenerateUrl());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Encrypt plaintext using server-side AES-256-GCM
   * @param {string} plaintext - Text to encrypt
   * @param {string} secretB64 - Base64 encoded secret key
   * @param {string} saltB64 - Base64 encoded salt
   * @returns {Promise<{dataB64: string}>}
   */
  async encrypt(plaintext, secretB64, saltB64) {
    const response = await fetch(getSymmetricEncryptUrl(), {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        plaintext: plaintext,
        secretB64: secretB64,
        saltB64: saltB64
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Decrypt data using server-side AES-256-GCM
   * @param {string} dataB64 - Base64 encoded packed data (IV + ciphertext + tag)
   * @param {string} secretB64 - Base64 encoded secret key
   * @param {string} saltB64 - Base64 encoded salt
   * @returns {Promise<{text: string}>}
   */
  async decrypt(dataB64, secretB64, saltB64) {
    const response = await fetch(getSymmetricDecryptUrl(), {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        dataB64: dataB64,
        secretB64: secretB64,
        saltB64: saltB64
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
      const response = await fetch(getSymmetricGenerateUrl(), { method: 'HEAD' });
      return response.ok;
    } catch (error) {
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
}
