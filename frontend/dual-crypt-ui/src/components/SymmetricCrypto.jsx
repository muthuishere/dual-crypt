import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useSymmetricCrypto from '../hooks/useSymmetricCrypto.js';
import CodeViewer from './CodeViewer.jsx';
import { templateService } from '../services/TemplateService.js';

export default function SymmetricCrypto() {
  const [plaintext, setPlaintext] = useState('Hello, World! This is a test message for symmetric encryption.');
  const [ciphertext, setCiphertext] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [metrics, setMetrics] = useState(null);
  
  // Code viewer state
  const [codeViewer, setCodeViewer] = useState({
    visible: false,
    currentContent: '',
    fullContent: '',
    title: 'Code Implementation'
  });
  
  const {
    // State
    secretKey,
    salt,
    generateMode,
    setGenerateMode,
    encryptMode,
    setEncryptMode,
    decryptMode,
    setDecryptMode,
    logs,
    error,
    serverStatus,
    webCryptoAvailable,
    
    // Actions
    generateKeys,
    encrypt,
    decrypt,
    clearAll,
    clearLogs
  } = useSymmetricCrypto();

  // Handle key generation
  const handleGenerateKeys = async () => {
    const result = await generateKeys();
    if (result.success) {
      setMetrics(prev => ({
        ...prev,
        generateTime: result.timing,
        generateMode: result.mode
      }));
    }
  };

  // Handle encryption
  const handleEncrypt = async () => {
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
    }
  };

  // Handle decryption
  const handleDecrypt = async () => {
    const result = await decrypt(ciphertext);
    if (result.success) {
      setDecryptedText(result.text);
      setMetrics(prev => ({
        ...prev,
        decryptTime: result.timing,
        decryptMode: result.mode
      }));
    }
  };

  // Handle clearing all data
  const handleClearAll = () => {
    clearAll();
    setCiphertext('');
    setDecryptedText('');
    setMetrics(null);
  };

    // Show code viewer
  const showCode = async (operation, mode) => {
    try {
      const context = {
        secretKey,
        salt,
        plaintext,
        ciphertext,
        decryptedText
      };

      const currentContent = await templateService.getSymmetericTemplate(operation, mode, context);
      const fullContent = await templateService.getSymmetricFullExplanation(generateMode, encryptMode, decryptMode, context);
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-light text-gray-900">
          Symmetric Encryption
        </h1>
        <p className="text-lg text-gray-500">
          AES-256-GCM encryption testing
        </p>
      </div>

      {/* Status Indicators */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-center space-x-12">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${webCryptoAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700 font-medium">JavaScript Crypto</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              serverStatus === 'available' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-gray-700 font-medium">Spring Boot API</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${secretKey ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-gray-700 font-medium">Encryption Keys</span>
          </div>
        </div>
      </div>

      {/* Key Generation */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-light text-gray-900">Generate Keys</h2>
          <p className="text-gray-500">Create new AES-256 encryption keys</p>
          
          <div className="flex items-center justify-center space-x-4">
            <select
              value={generateMode}
              onChange={(e) => setGenerateMode(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="browser">JavaScript Crypto</option>
              <option value="server">Spring Boot API</option>
            </select>
            <button
              onClick={handleGenerateKeys}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Generate New Keys
            </button>
            <button
              onClick={() => showCode('generate-keys', generateMode)}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              📖 Show Code
            </button>
          </div>

          {secretKey && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                  <div className="p-3 bg-white border rounded-lg">
                    <code className="text-xs text-gray-600 break-all font-mono">{secretKey}</code>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salt</label>
                  <div className="p-3 bg-white border rounded-lg">
                    <code className="text-xs text-gray-600 break-all font-mono">{salt}</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Encryption Interface */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-light text-gray-900">Message Encryption</h2>
            <p className="text-gray-500">Encrypt and decrypt your messages</p>
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
            <p className="text-xs text-gray-400 mt-2">
              {new TextEncoder().encode(plaintext).length} bytes
            </p>
          </div>

          {/* Encrypt Section */}
          <div className="flex items-center justify-between p-6 bg-green-50 rounded-xl border border-green-100">
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Encrypt Message</h3>
              <p className="text-sm text-green-700">Secure your message with AES-256-GCM</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={encryptMode}
                onChange={(e) => setEncryptMode(e.target.value)}
                className="px-3 py-2 bg-white border border-green-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="browser">JavaScript</option>
                <option value="server">Spring Boot</option>
              </select>
              <button
                onClick={handleEncrypt}
                disabled={!secretKey || !plaintext.trim()}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Encrypt
              </button>
              <button
                onClick={() => showCode('encrypt', encryptMode)}
                className="px-3 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                📖
              </button>
            </div>
          </div>

          {/* Encrypted Result */}
          {ciphertext && (
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
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
          <div className="flex items-center justify-between p-6 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">Decrypt Message</h3>
              <p className="text-sm text-orange-700">Restore your original message</p>
            </div>
            <div className="flex items-center space-x-4">
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
                disabled={!secretKey || !ciphertext}
                className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decrypt
              </button>
              <button
                onClick={() => showCode('decrypt', decryptMode)}
                className="px-3 py-2 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              >
                📖
              </button>
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
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-700 font-medium">Message integrity verified</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      {metrics && chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-gray-900">Performance</h2>
            <p className="text-gray-500">Execution times and metrics</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
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
                      props.payload.mode === 'browser' ? 'Local' : 'Cloud'
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
                    fill="#3b82f6"
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
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-light text-gray-900">Activity Log</h2>
            <p className="text-gray-500">Real-time operation details</p>
          </div>
          <div className="flex space-x-3">
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-gray-900 rounded-lg p-6 max-h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-400">No activity yet. Start by generating keys or encrypting a message.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((logEntry) => (
                <div key={logEntry.id} className="flex items-start space-x-4">
                  <span className="text-gray-500 text-xs font-mono whitespace-nowrap mt-0.5">
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
