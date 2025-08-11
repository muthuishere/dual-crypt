import { useState, useCallback, useEffect } from 'react';
import useLocalStorage from './useLocalStorage.js';
import { AsymmetricCryptoClient } from '../crypto/asymmetric-crypto-client.js';
import { AsymmetricCryptoServer } from '../crypto/asymmetric-crypto-server.js';

/**
 * Custom hook for managing asymmetric crypto operations with both client and server support
 */
export function useAsymmetricCrypto() {
  // Persistent state
  const [publicKey, setPublicKey] = useLocalStorage('dual-crypt-asymmetric-public-key', '');
  const [privateKey, setPrivateKey] = useLocalStorage('dual-crypt-asymmetric-private-key', '');
  const [salt, setSalt] = useLocalStorage('dual-crypt-asymmetric-salt', '');
  
  // Session state - direct mode selection for each action
  const [generateMode, setGenerateMode] = useState('browser');
  const [encryptMode, setEncryptMode] = useState('browser');
  const [decryptMode, setDecryptMode] = useState('browser');
  const keyCaching = true; // Always enabled for browser mode
  const [serverStatus, setServerStatus] = useState('unknown');
  const [webCryptoAvailable, setWebCryptoAvailable] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  
  // Crypto instances
  const [clientCrypto] = useState(() => new AsymmetricCryptoClient());
  const [serverCrypto] = useState(() => new AsymmetricCryptoServer());

  // Initialize availability checks
  useEffect(() => {
    setWebCryptoAvailable(clientCrypto.isAvailable());
    
    // Check server availability
    serverCrypto.isAvailable().then(available => {
      setServerStatus(available ? 'available' : 'unavailable');
    }).catch(() => {
      setServerStatus('unavailable');
    });
  }, [clientCrypto, serverCrypto]);

  const log = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp,
      message,
      type
    };
    setLogs(prev => [...prev, logEntry]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    log('Logs cleared', 'info');
  }, [log]);

  // Determine actual execution mode (no global mode anymore)
  const getActualMode = useCallback((actionMode) => {
    return actionMode; // Direct mode selection
  }, []);

  // Auto-fallback logic
  const getFallbackMode = useCallback((preferredMode, action) => {
    if (preferredMode === 'browser' && !webCryptoAvailable) {
      log(`⚠️ Web Crypto API not available, cannot use browser mode for ${action}`, 'error');
      return null; // Will cause operation to fail
    }
    if (preferredMode === 'server' && serverStatus === 'unavailable') {
      log(`⚠️ Server unavailable, cannot use server mode for ${action}`, 'error');
      return null; // Will cause operation to fail
    }
    return preferredMode;
  }, [webCryptoAvailable, serverStatus, log]);

  // Generate key pair
  const generateKeys = useCallback(async () => {
    const preferredMode = getActualMode(generateMode);
    const actualMode = getFallbackMode(preferredMode, 'generate');
    
    if (!actualMode) {
      const errorMsg = `Cannot generate keys: ${preferredMode} mode is not available`;
      setError(errorMsg);
      log(`❌ ${errorMsg}`, 'error');
      return { success: false, error: errorMsg };
    }
    
    const crypto = actualMode === 'browser' ? clientCrypto : serverCrypto;
    
    setError('');
    log(`${crypto.icon} Generating RSA-2048 key pair using ${crypto.name}...`, 'info');
    
    try {
      const startTime = performance.now();
      const result = await crypto.generateKeys();
      const endTime = performance.now();
      
      setPublicKey(result.publicKeyB64);
      setPrivateKey(result.privateKeyB64);
      setSalt(result.saltB64);
      
      const timing = actualMode === 'browser' 
        ? `${(endTime - startTime).toFixed(2)}ms`
        : `${(endTime - startTime).toFixed(2)}ms total`;
      
      log(`✅ Key pair generated successfully in ${timing}`, 'success');
      log(`🔓 Public key: ${result.publicKeyB64.substring(0, 50)}...`, 'info');
      log(`🔒 Private key: ${result.privateKeyB64.substring(0, 50)}...`, 'info');
      log(`🧂 Salt: ${result.saltB64.substring(0, 20)}...`, 'info');
      log('🔐 RSA-2048 with OAEP padding ready for use', 'info');
      
      return { success: true, mode: actualMode, timing: endTime - startTime };
    } catch (error) {
      const errorMsg = `❌ Failed to generate key pair: ${error.message}`;
      log(errorMsg, 'error');
      setError(errorMsg);
      return { success: false, error: error.message };
    }
  }, [generateMode, clientCrypto, serverCrypto, log, setPublicKey, setPrivateKey, setSalt, getActualMode, getFallbackMode]);

  // Encrypt text
  const encrypt = useCallback(async (plaintext) => {
    if (!publicKey || !plaintext.trim()) {
      const msg = 'Please generate keys and enter text to encrypt';
      setError(msg);
      log(`⚠️ ${msg}`, 'error');
      return { success: false, error: msg };
    }

    // Check message length for RSA limitations
    if (plaintext.length > 200) {
      const msg = 'Message too long for RSA encryption (max ~200 characters)';
      setError(msg);
      log(`⚠️ ${msg}`, 'error');
      return { success: false, error: msg };
    }

    const preferredMode = getActualMode(encryptMode);
    const actualMode = getFallbackMode(preferredMode, 'encrypt');
    
    if (!actualMode) {
      const errorMsg = `Cannot encrypt: ${preferredMode} mode is not available`;
      setError(errorMsg);
      log(`❌ ${errorMsg}`, 'error');
      return { success: false, error: errorMsg };
    }
    
    const crypto = actualMode === 'browser' ? clientCrypto : serverCrypto;
    
    setError('');
    log(`${crypto.icon} Encrypting message using ${crypto.name}...`, 'info');
    
    try {
      const startTime = performance.now();
      const result = actualMode === 'browser' 
        ? await crypto.encrypt(plaintext, publicKey, keyCaching)
        : await crypto.encrypt(plaintext, publicKey);
      const endTime = performance.now();
      
      const timing = endTime - startTime;
      const plaintextSize = new TextEncoder().encode(plaintext).length;
      const ciphertextSize = new TextEncoder().encode(result.dataB64 || result.text).length;
      
      log(`✅ Encryption completed in ${timing.toFixed(2)}ms`, 'success');
      log(`📦 Original: ${plaintextSize} bytes → Encrypted: ${ciphertextSize} bytes (base64)`, 'info');
      log(`🔐 Encrypted data: ${(result.dataB64 || result.text).substring(0, 50)}...`, 'info');
      
      if (actualMode === 'browser' && keyCaching) {
        const cacheStats = clientCrypto.getCacheStats();
        log(`💾 Key cache: ${cacheStats.size} entries`, 'info');
      }
      
      return { 
        success: true, 
        dataB64: result.dataB64 || result.text, 
        mode: actualMode, 
        timing,
        metrics: { plaintextSize, ciphertextSize, timing }
      };
    } catch (error) {
      const errorMsg = `❌ Encryption failed: ${error.message}`;
      log(errorMsg, 'error');
      setError(errorMsg);
      return { success: false, error: error.message };
    }
  }, [encryptMode, publicKey, keyCaching, clientCrypto, serverCrypto, log, getActualMode, getFallbackMode]);

  // Decrypt text
  const decrypt = useCallback(async (dataB64) => {
    if (!privateKey || !dataB64) {
      const msg = 'Please provide encrypted data and private key';
      setError(msg);
      log(`⚠️ ${msg}`, 'error');
      return { success: false, error: msg };
    }

    const preferredMode = getActualMode(decryptMode);
    const actualMode = getFallbackMode(preferredMode, 'decrypt');
    
    if (!actualMode) {
      const errorMsg = `Cannot decrypt: ${preferredMode} mode is not available`;
      setError(errorMsg);
      log(`❌ ${errorMsg}`, 'error');
      return { success: false, error: errorMsg };
    }
    
    const crypto = actualMode === 'browser' ? clientCrypto : serverCrypto;
    
    setError('');
    log(`${crypto.icon} Decrypting message using ${crypto.name}...`, 'info');
    
    try {
      const startTime = performance.now();
      const result = actualMode === 'browser'
        ? await crypto.decrypt(dataB64, privateKey, keyCaching)
        : await crypto.decrypt(dataB64, privateKey);
      const endTime = performance.now();
      
      const timing = endTime - startTime;
      
      log(`✅ Decryption completed in ${timing.toFixed(2)}ms`, 'success');
      log(`📝 Decrypted text: "${result.text}"`, 'info');
      
      return { 
        success: true, 
        text: result.text, 
        mode: actualMode, 
        timing 
      };
    } catch (error) {
      const errorMsg = `❌ Decryption failed: ${error.message}`;
      log(errorMsg, 'error');
      setError(errorMsg);
      return { success: false, error: error.message };
    }
  }, [decryptMode, privateKey, keyCaching, clientCrypto, serverCrypto, log, getActualMode, getFallbackMode]);

  // Clear functions
  const clearAll = useCallback(() => {
    setPublicKey('');
    setPrivateKey('');
    setSalt('');
    setError('');
    clientCrypto.clearCache();
    log('🧹 All data cleared and cache emptied', 'info');
  }, [setPublicKey, setPrivateKey, setSalt, clientCrypto, log]);

  const clearStoredKeys = useCallback(() => {
    setPublicKey('');
    setPrivateKey('');
    setSalt('');
    clientCrypto.clearCache();
    log('🗑️ Stored keys cleared and cache emptied', 'info');
  }, [setPublicKey, setPrivateKey, setSalt, clientCrypto, log]);

  return {
    // State
    publicKey,
    privateKey,
    salt,
    generateMode,
    setGenerateMode,
    encryptMode,
    setEncryptMode,
    decryptMode,
    setDecryptMode,
    keyCaching,
    logs,
    error,
    serverStatus,
    webCryptoAvailable,
    
    // Actions
    generateKeys,
    encrypt,
    decrypt,
    clearAll,
    clearStoredKeys,
    clearLogs,
    log,
    
    // Utilities
    getActualMode,
    clientCrypto,
    serverCrypto
  };
}

export default useAsymmetricCrypto;
