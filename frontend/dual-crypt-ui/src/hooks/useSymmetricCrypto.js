import { useState, useCallback, useEffect } from 'react';
import useLocalStorage from './useLocalStorage.js';
import { SymmetricCryptoClient } from '../crypto/symmetric-crypto-client.js';
import { SymmetricCryptoServer } from '../crypto/symmetric-crypto-server.js';

/**
 * Custom hook for managing symmetric crypto operations with both client and server support
 */
export function useSymmetricCrypto() {
  // Persistent state
  const [secretKey, setSecretKey] = useLocalStorage('dual-crypt-symmetric-key', '');
  const [salt, setSalt] = useLocalStorage('dual-crypt-symmetric-salt', '');
  
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
  const [clientCrypto] = useState(() => new SymmetricCryptoClient());
  const [serverCrypto] = useState(() => new SymmetricCryptoServer());

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

  // Generate keys
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
    log(`${crypto.icon} Generating AES-256 key and salt using ${crypto.name}...`, 'info');
    
    try {
      const startTime = performance.now();
      const result = await crypto.generateKeys();
      const endTime = performance.now();
      
      setSecretKey(result.secretB64);
      setSalt(result.saltB64);
      
      const timing = actualMode === 'browser' 
        ? `${(endTime - startTime).toFixed(2)}ms`
        : `${(endTime - startTime).toFixed(2)}ms total`;
      
      log(`✅ Keys generated successfully in ${timing}`, 'success');
      log(`🔐 Secret key: ${result.secretB64.substring(0, 20)}...`, 'info');
      log(`🧂 Salt: ${result.saltB64.substring(0, 20)}...`, 'info');
      
      return { success: true, mode: actualMode, timing: endTime - startTime };
    } catch (error) {
      const errorMsg = `❌ Failed to generate keys: ${error.message}`;
      log(errorMsg, 'error');
      setError(errorMsg);
      return { success: false, error: error.message };
    }
  }, [generateMode, clientCrypto, serverCrypto, log, setSecretKey, setSalt, getActualMode, getFallbackMode]);

  // Encrypt text
  const encrypt = useCallback(async (plaintext) => {
    if (!secretKey || !salt || !plaintext.trim()) {
      const msg = 'Please generate keys and enter text to encrypt';
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
        ? await crypto.encrypt(plaintext, secretKey, salt, keyCaching)
        : await crypto.encrypt(plaintext, secretKey, salt);
      const endTime = performance.now();
      
      const timing = endTime - startTime;
      const plaintextSize = new TextEncoder().encode(plaintext).length;
      const ciphertextSize = new TextEncoder().encode(result.dataB64).length;
      
      log(`✅ Encryption completed in ${timing.toFixed(2)}ms`, 'success');
      log(`📦 Original: ${plaintextSize} bytes → Encrypted: ${ciphertextSize} bytes (base64)`, 'info');
      log(`🔐 Encrypted data: ${result.dataB64.substring(0, 50)}...`, 'info');
      
      if (actualMode === 'browser' && keyCaching) {
        const cacheStats = clientCrypto.getCacheStats();
        log(`💾 Key cache: ${cacheStats.size} entries`, 'info');
      }
      
      return { 
        success: true, 
        dataB64: result.dataB64, 
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
  }, [encryptMode, secretKey, salt, keyCaching, clientCrypto, serverCrypto, log, getActualMode, getFallbackMode]);

  // Decrypt text
  const decrypt = useCallback(async (dataB64) => {
    if (!secretKey || !salt || !dataB64) {
      const msg = 'Please provide encrypted data and keys';
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
        ? await crypto.decrypt(dataB64, secretKey, salt, keyCaching)
        : await crypto.decrypt(dataB64, secretKey, salt);
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
  }, [decryptMode, secretKey, salt, keyCaching, clientCrypto, serverCrypto, log, getActualMode, getFallbackMode]);

  // Clear functions
  const clearAll = useCallback(() => {
    setSecretKey('');
    setSalt('');
    setError('');
    clientCrypto.clearCache();
    log('🧹 All data cleared and cache emptied', 'info');
  }, [setSecretKey, setSalt, clientCrypto, log]);

  const clearStoredKeys = useCallback(() => {
    setSecretKey('');
    setSalt('');
    clientCrypto.clearCache();
    log('🗑️ Stored keys cleared and cache emptied', 'info');
  }, [setSecretKey, setSalt, clientCrypto, log]);

  return {
    // State
    secretKey,
    salt,
    setSecretKey,
    setSalt,
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

export default useSymmetricCrypto;
