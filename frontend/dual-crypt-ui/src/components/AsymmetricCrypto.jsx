import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useAsymmetricCrypto from '../hooks/useAsymmetricCrypto.js';
import CodeViewer from './CodeViewer.jsx';
import { templateService } from '../services/TemplateService.js';

export default function AsymmetricCrypto() {
  const [plaintext, setPlaintext] = useState('Hello, World! This is a test message for RSA encryption.');
  const [ciphertext, setCiphertext] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [metrics, setMetrics] = useState(null);
  
  // Operation status for toast notifications
  const [operationStatus, setOperationStatus] = useState({
    generating: false,
    encrypting: false,
    decrypting: false,
    error: null,
    errorTimeout: null
  });
  
  // Code viewer state
  const [codeViewer, setCodeViewer] = useState({
    visible: false,
    currentContent: '',
    fullContent: '',
    title: 'Code Implementation'
  });
  
  const {
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
    logs,
    serverStatus,
    webCryptoAvailable,
    
    // Actions
    generateKeys,
    encrypt,
    decrypt,
    clearAll,
    clearLogs
  } = useAsymmetricCrypto();

  // Helper function to set error with auto-dismiss
  const setErrorWithTimeout = (errorMessage) => {
    // Clear any existing timeout
    if (operationStatus.errorTimeout) {
      clearTimeout(operationStatus.errorTimeout);
    }
    
    // Set new error and timeout
    const timeoutId = setTimeout(() => {
      setOperationStatus(prev => ({ ...prev, error: null, errorTimeout: null }));
    }, 20000); // 20 seconds
    
    setOperationStatus(prev => ({ ...prev, error: errorMessage, errorTimeout: timeoutId }));
  };

  // Handle key generation
  const handleGenerateKeys = async () => {
    // Clear any previous errors
    setOperationStatus(prev => ({ ...prev, generating: true, error: null }));
    
    try {
      const result = await generateKeys();
      if (result.success) {
        setMetrics(prev => ({
          ...prev,
          generateTime: result.timing,
          generateMode: result.mode
        }));
      } else {
        setErrorWithTimeout(result.error || 'Key generation failed');
      }
    } catch (err) {
      setErrorWithTimeout('Key generation failed: ' + err.message);
    } finally {
      setOperationStatus(prev => ({ ...prev, generating: false }));
    }
  };

  // Handle encryption
  const handleEncrypt = async () => {
    // Clear any previous errors
    setOperationStatus(prev => ({ ...prev, encrypting: true, error: null }));
    
    try {
      const result = await encrypt(plaintext);
      if (result.success) {
        setCiphertext(result.dataB64);
        setMetrics(prev => ({
          ...prev,
          encryptTime: result.timing,
          encryptMode: result.mode,
          plaintextSize: result.metrics.plaintextSize,
          ciphertextSize: result.metrics.ciphertextSize
        }));
      } else {
        setErrorWithTimeout(result.error || 'Encryption failed');
      }
    } catch (err) {
      setErrorWithTimeout('Encryption failed: ' + err.message);
    } finally {
      setOperationStatus(prev => ({ ...prev, encrypting: false }));
    }
  };

  // Handle decryption
  const handleDecrypt = async () => {
    // Clear any previous errors
    setOperationStatus(prev => ({ ...prev, decrypting: true, error: null }));
    
    try {
      const result = await decrypt(ciphertext);
      if (result.success) {
        setDecryptedText(result.text);
        setMetrics(prev => ({
          ...prev,
          decryptTime: result.timing,
          decryptMode: result.mode
        }));
      } else {
        setErrorWithTimeout(result.error || 'Decryption failed');
      }
    } catch (err) {
      setErrorWithTimeout('Decryption failed: ' + err.message);
    } finally {
      setOperationStatus(prev => ({ ...prev, decrypting: false }));
    }
  };

  // Handle clearing all data
  const handleClearAll = () => {
    // Clear any existing error timeout
    if (operationStatus.errorTimeout) {
      clearTimeout(operationStatus.errorTimeout);
    }
    
    // Reset all state
    clearAll();
    setCiphertext('');
    setDecryptedText('');
    setMetrics(null);
    setOperationStatus({
      generating: false,
      encrypting: false,
      decrypting: false,
      error: null,
      errorTimeout: null
    });
  };

    // Show code viewer
  const showCode = async (operation, mode) => {
    try {
      const context = {
        publicKey,
        privateKey,
        plaintext,
        ciphertext,
        decryptedText
      };

       const currentContent = await templateService.getAsymmetricTemplate(operation, mode, context);
      const fullContent = await templateService.getAsymmetricFullExplanation(generateMode, encryptMode, decryptMode, context);
      const title = `${operation.charAt(0).toUpperCase() + operation.slice(1)} Implementation`;


      setCodeViewer({
        visible: true,
        currentContent,
        fullContent,
        title
      });
    } catch (error) {
      console.error('Error generating code content:', error);
      setCodeViewer({
        visible: true,
        currentContent: 'Error generating code content',
        fullContent: '',
        title: 'Error'
      });
    }
  };

  // Close code viewer
  const closeCodeViewer = () => {
    setCodeViewer({
      visible: false,
      currentContent: '',
      fullContent: '',
      title: 'Code Implementation'
    });
  };

  // Chart data preparation
  const chartData = metrics ? [
    { 
      name: 'Generate', 
      time: metrics.generateTime || 0, 
      mode: metrics.generateMode,
      label: `Generate (${metrics.generateMode === 'browser' ? 'JavaScript' : 'Spring Boot'})`
    },
    { 
      name: 'Encrypt', 
      time: metrics.encryptTime || 0, 
      mode: metrics.encryptMode,
      label: `Encrypt (${metrics.encryptMode === 'browser' ? 'JavaScript' : 'Spring Boot'})`
    },
    { 
      name: 'Decrypt', 
      time: metrics.decryptTime || 0, 
      mode: metrics.decryptMode,
      label: `Decrypt (${metrics.decryptMode === 'browser' ? 'JavaScript' : 'Spring Boot'})`
    }
  ].filter(item => item.time > 0) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6">
      {/* Toast Error Notification */}
      {operationStatus.error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-800 font-medium">Operation Failed</p>
              <p className="text-sm text-red-600 break-words">{operationStatus.error}</p>
            </div>
            <button
              onClick={() => setOperationStatus(prev => ({ ...prev, error: null }))}
              className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-light text-gray-900">
          Asymmetric Encryption
        </h1>
        <p className="text-lg text-gray-500">
          RSA-2048 encryption testing
        </p>
      </div>

      {/* Status Indicators */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row  justify-center space-y-4 sm:space-y-0 sm:space-x-8 lg:space-x-12">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${webCryptoAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700 font-medium text-sm sm:text-base">JavaScript Crypto</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              serverStatus === 'available' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-gray-700 font-medium text-sm sm:text-base">Spring Boot API</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${publicKey && privateKey ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-gray-700 font-medium text-sm sm:text-base">Key Pair</span>
          </div>
        </div>
      </div>

      {/* Key Generation */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-light text-gray-900">Generate Key Pair</h2>
          <p className="text-gray-500">Create new RSA-2048 public/private keys</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <select
              value={generateMode}
              onChange={(e) => setGenerateMode(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="browser">JavaScript Crypto</option>
              <option value="server">Spring Boot API</option>
            </select>
            <button
              onClick={handleGenerateKeys}
              disabled={operationStatus.generating}
              className={`w-full sm:w-auto px-8 py-3 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                operationStatus.generating 
                  ? 'bg-blue-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {operationStatus.generating ? 'Generating...' : 'Generate New Key Pair'}
            </button>
            <button
              onClick={() => showCode('generate-keys', generateMode)}
              className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              📖 Show Code
            </button>
          </div>

          {(publicKey || privateKey) && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Public Key (SPKI Base64)</label>
                  <div className="p-3 bg-white border rounded-lg">
                    <code className="text-xs text-gray-600 break-all font-mono">{publicKey}</code>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Private Key (PKCS#8 Base64)</label>
                  <div className="p-3 bg-white border rounded-lg">
                    <code className="text-xs text-gray-600 break-all font-mono">{privateKey}</code>
                  </div>
                </div>
                {salt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salt</label>
                    <div className="p-3 bg-white border rounded-lg">
                      <code className="text-xs text-gray-600 break-all font-mono">{salt}</code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Encryption Interface */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-light text-gray-900">Message Encryption</h2>
            <p className="text-gray-500">Encrypt and decrypt your messages with RSA</p>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Your Message</label>
            <textarea
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="Enter your message here..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-400">
                {new TextEncoder().encode(plaintext).length} bytes
              </p>
              {plaintext.length > 200 && (
                <p className="text-xs text-red-500">
                  ⚠️ Message too long for RSA (max ~200 chars)
                </p>
              )}
            </div>
          </div>

          {/* Encrypt Section */}
          <div className="p-4 sm:p-6 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900">Encrypt Message</h3>
                <p className="text-sm text-purple-700">Secure your message with RSA-2048</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={encryptMode}
                  onChange={(e) => setEncryptMode(e.target.value)}
                  className="px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="browser">JavaScript</option>
                  <option value="server">Spring Boot</option>
                </select>
                <button
                  onClick={handleEncrypt}
                  disabled={!publicKey || !plaintext.trim() || plaintext.length > 200 || operationStatus.encrypting}
                  className={`px-6 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    operationStatus.encrypting 
                      ? 'bg-purple-400 text-white' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {operationStatus.encrypting ? 'Encrypting...' : 'Encrypt'}
                </button>
                <button
                  onClick={() => showCode('encrypt', encryptMode)}
                  className="px-3 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  📖
                </button>
              </div>
            </div>
          </div>

          {/* Encrypted Result */}
          {ciphertext && (
            <div className="p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">Encrypted Data</label>
              <div className="p-4 bg-white border rounded-lg">
                <code className="text-xs text-gray-600 break-all font-mono">{ciphertext}</code>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {new TextEncoder().encode(ciphertext).length} bytes (base64 encoded)
              </p>
            </div>
          )}

          {/* Decrypt Section */}
          <div className="p-4 sm:p-6 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">Decrypt Message</h3>
                <p className="text-sm text-orange-700">Restore your original message</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={decryptMode}
                  onChange={(e) => setDecryptMode(e.target.value)}
                  className="px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="browser">JavaScript</option>
                  <option value="server">Spring Boot</option>
                </select>
                <button
                  onClick={handleDecrypt}
                  disabled={!privateKey || !ciphertext || operationStatus.decrypting}
                  className={`px-6 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    operationStatus.decrypting 
                      ? 'bg-orange-400 text-white' 
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {operationStatus.decrypting ? 'Decrypting...' : 'Decrypt'}
                </button>
                <button
                  onClick={() => showCode('decrypt', decryptMode)}
                  className="px-3 py-2 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                >
                  📖
                </button>
              </div>
            </div>
          </div>

          {/* Decrypted Result */}
          {decryptedText && (
            <div className="p-6 bg-green-50 rounded-xl border border-green-100">
              <label className="block text-sm font-medium text-green-700 mb-3">Decrypted Message</label>
              <div className="p-4 bg-white border border-green-200 rounded-lg">
                <p className="text-gray-800">{decryptedText}</p>
              </div>
              <div className="flex items-center mt-3">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  decryptedText === plaintext ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  decryptedText === plaintext ? 'text-green-700' : 'text-red-700'
                }`}>
                  {decryptedText === plaintext ? 'Message integrity verified' : 'Integrity check failed'}
                </span>
              </div>
            </div>
          )}

          {/* RSA Info Box */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-3">🔐 RSA Key Usage</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p><strong>Public Key:</strong> Used for encryption (safe to share)</p>
                <p><strong>Private Key:</strong> Used for decryption (keep secret)</p>
              </div>
              <div>
                <p><strong>Security:</strong> Only private key can decrypt</p>
                <p><strong>Use Case:</strong> Key exchange, digital signatures</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {metrics && chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl font-light text-gray-900">Performance</h2>
            <p className="text-gray-500">Execution times and metrics</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value.toFixed(2)}ms`,
                      props.payload.mode === 'browser' ? 'JavaScript' : 'Spring Boot'
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="time" 
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Summary</h3>
              {metrics.generateTime && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Key Generation</span>
                  <div className="text-right">
                    <div className="font-mono text-sm">{metrics.generateTime.toFixed(2)}ms</div>
                    <div className="text-xs text-gray-500">
                      {metrics.generateMode === 'browser' ? 'JavaScript' : 'Spring Boot'}
                    </div>
                  </div>
                </div>
              )}
              {metrics.encryptTime && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Encryption</span>
                  <div className="text-right">
                    <div className="font-mono text-sm">{metrics.encryptTime.toFixed(2)}ms</div>
                    <div className="text-xs text-gray-500">
                      {metrics.encryptMode === 'browser' ? 'JavaScript' : 'Spring Boot'}
                    </div>
                  </div>
                </div>
              )}
              {metrics.decryptTime && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Decryption</span>
                  <div className="text-right">
                    <div className="font-mono text-sm">{metrics.decryptTime.toFixed(2)}ms</div>
                    <div className="text-xs text-gray-500">
                      {metrics.decryptMode === 'browser' ? 'JavaScript' : 'Spring Boot'}
                    </div>
                  </div>
                </div>
              )}
              {metrics.plaintextSize && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Input Size</span>
                  <span className="font-mono text-sm">{metrics.plaintextSize} bytes</span>
                </div>
              )}
              {metrics.ciphertextSize && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Output Size</span>
                  <span className="font-mono text-sm">{metrics.ciphertextSize} bytes</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-light text-gray-900">Activity Log</h2>
            <p className="text-gray-500">Real-time operation details</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Clear Log
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 max-h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-400">No activity yet. Start by generating a key pair or encrypting a message.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((logEntry) => (
                <div key={logEntry.id} className="flex flex-col sm:flex-row sm:items-start sm:space-x-4 space-y-1 sm:space-y-0">
                  <span className="text-gray-500 text-xs font-mono whitespace-nowrap sm:mt-0.5">
                    {logEntry.timestamp}
                  </span>
                  <span className={`text-sm font-mono ${
                    logEntry.type === 'error' ? 'text-red-400' :
                    logEntry.type === 'warning' ? 'text-yellow-400' :
                    logEntry.type === 'success' ? 'text-green-400' :
                    'text-gray-300'
                  }`}>
                    {logEntry.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Code Viewer Modal */}
      <CodeViewer
        currentContent={codeViewer.currentContent}
        fullContent={codeViewer.fullContent}
        title={codeViewer.title}
        visible={codeViewer.visible}
        onClose={closeCodeViewer}
      />
    </div>
  );
}
