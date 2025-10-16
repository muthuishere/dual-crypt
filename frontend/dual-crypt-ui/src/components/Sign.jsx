import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useAsymmetricCrypto from '../hooks/useAsymmetricCrypto';

export default function Sign() {
  const [message, setMessage] = useState('Hello, this is a test message for JWT signing.');
  const [jwtToken, setJwtToken] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // Operation status for toast notifications
  const [operationStatus, setOperationStatus] = useState({
    generating: false,
    signing: false,
    verifying: false,
    error: null,
    errorTimeout: null,
  });

  const {
    // State
    publicKey,
    privateKey,
    salt,
    generateMode,
    setGenerateMode,
    signMode,
    setSignMode,
    verifyMode,
    setVerifyMode,
    logs,
    serverStatus,
    webCryptoAvailable,
    
    // Actions
    generateKeys,
    sign,
    verify,
    clearAll,
    clearLogs,
    
    // Key setters
    setPublicKey,
    setPrivateKey,
    setSalt,
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

  // Handle signing
  const handleSign = async () => {
    setOperationStatus(prev => ({ ...prev, signing: true, error: null }));
    
    try {
      const result = await sign(message);
      if (result.success) {
        setJwtToken(result.jwtToken);
        setMetrics(prev => ({
          ...prev,
          signTime: result.timing,
          signMode: result.mode,
          messageSize: result.metrics?.messageSize,
          jwtTokenSize: result.metrics?.jwtTokenSize
        }));
      } else {
        setErrorWithTimeout(result.error || 'JWT creation failed');
      }
    } catch (err) {
      setErrorWithTimeout('JWT creation failed: ' + err.message);
    } finally {
      setOperationStatus(prev => ({ ...prev, signing: false }));
    }
  };

  // Handle verification
  const handleVerify = async () => {
    setOperationStatus(prev => ({ ...prev, verifying: true, error: null }));
    
    try {
      const result = await verify(jwtToken);
      if (result.success) {
        setVerificationResult(result.verified);
        setMetrics(prev => ({
          ...prev,
          verifyTime: result.timing,
          verifyMode: result.mode
        }));
      } else {
        setVerificationResult(false);
        setErrorWithTimeout(result.error || 'JWT verification failed');
      }
    } catch (err) {
      setVerificationResult(false);
      setErrorWithTimeout('JWT verification failed: ' + err.message);
    } finally {
      setOperationStatus(prev => ({ ...prev, verifying: false }));
    }
  };

  // Handle clearing all data
  const handleClearAll = () => {
    if (operationStatus.errorTimeout) {
      clearTimeout(operationStatus.errorTimeout);
    }
    clearAll();
    setJwtToken('');
    setVerificationResult(null);
    setMetrics(null);
    setOperationStatus({
      generating: false,
      signing: false,
      verifying: false,
      error: null,
      errorTimeout: null,
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
      name: 'Sign', 
      time: metrics.signTime || 0, 
      mode: metrics.signMode,
      label: `Sign (${metrics.signMode === 'browser' ? 'JavaScript' : 'Spring Boot'})`
    },
    { 
      name: 'Verify', 
      time: metrics.verifyTime || 0, 
      mode: metrics.verifyMode,
      label: `Verify (${metrics.verifyMode === 'browser' ? 'JavaScript' : 'Spring Boot'})`
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
          JWT Signatures
        </h1>
        <p className="text-lg text-gray-500">
          RSA-PSS signing and verification
        </p>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 max-w-2xl mx-auto">
          <p className="text-sm text-blue-800">
            ✏️ <strong>All fields are editable!</strong> You can manually enter or modify public keys, private keys, JWT tokens, and messages for testing different scenarios.
          </p>
        </div>
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
          <p className="text-gray-500">Create new RSA-2048 public/private keys for signing</p>
          
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
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Public Key (SPKI Base64)</label>
                <textarea
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="w-full p-3 bg-white border rounded-lg text-xs text-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="Enter or paste your public key here..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can manually enter or edit your public key
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Private Key (PKCS#8 Base64)</label>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="w-full p-3 bg-white border rounded-lg text-xs text-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="Enter or paste your private key here..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can manually enter or edit your private key
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salt (Optional)</label>
                <textarea
                  value={salt || ''}
                  onChange={(e) => setSalt(e.target.value)}
                  className="w-full p-3 bg-white border rounded-lg text-xs text-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="Enter or paste your salt here (optional)..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can manually enter or edit your salt (used in some key generation processes)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Signing Interface */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-light text-gray-900">Message Signing</h2>
            <p className="text-gray-500">Sign and verify your messages with RSA JWT tokens</p>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Your Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="Enter your message here..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-400">
                {new TextEncoder().encode(message).length} bytes
              </p>
            </div>
          </div>

          {/* Sign Section */}
          <div className="p-4 sm:p-6 bg-green-50 rounded-xl border border-green-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Sign Message</h3>
                <p className="text-sm text-green-700">Create JWT token with your private key</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={signMode}
                  onChange={(e) => setSignMode(e.target.value)}
                  className="px-3 py-2 bg-white border border-green-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="browser">JavaScript</option>
                  <option value="server">Spring Boot</option>
                </select>
                <button
                  onClick={handleSign}
                  disabled={!privateKey || !message.trim() || operationStatus.signing}
                  className={`px-6 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    operationStatus.signing 
                      ? 'bg-green-400 text-white' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {operationStatus.signing ? 'Signing...' : 'Sign'}
                </button>
              </div>
            </div>
          </div>

          {/* JWT Token Result/Input */}
          <div className="p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">JWT Token (Signed or Input)</label>
            <textarea
              value={jwtToken}
              onChange={(e) => setJwtToken(e.target.value)}
              className="w-full p-4 bg-white border rounded-lg text-xs text-gray-600 break-all font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="JWT token will appear here after signing, or you can paste any JWT token for verification..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-400">
                {jwtToken ? `${new TextEncoder().encode(jwtToken).length} bytes (JWT format)` : 'No JWT token'}
              </p>
              <p className="text-xs text-blue-600">
                ✏️ Fully editable - modify to test different tokens
              </p>
            </div>
          </div>

          {/* Verify Section */}
          <div className="p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-100">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Verify Signature</h3>
                  <p className="text-sm text-blue-700">Validate signature with public key</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <select
                    value={verifyMode}
                    onChange={(e) => setVerifyMode(e.target.value)}
                    className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="browser">JavaScript</option>
                    <option value="server">Spring Boot</option>
                  </select>
                  <button
                    onClick={handleVerify}
                    disabled={!publicKey || !jwtToken || !message.trim() || operationStatus.verifying}
                    className={`px-6 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      operationStatus.verifying 
                        ? 'bg-blue-400 text-white' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {operationStatus.verifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
              
              {/* JWT Token Reference for Verification */}
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">JWT Token to Verify</label>
                <div className="p-3 bg-white border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 mb-2">
                    Using the JWT token from above ⬆️ (you can edit it directly in the JWT Token section)
                  </p>
                  <div className="p-2 bg-blue-50 rounded border">
                    <code className="text-xs text-blue-600 break-all font-mono">
                      {jwtToken || 'No JWT token available - sign a message first or paste one in the JWT Token section above'}
                    </code>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  💡 To verify a different token, edit the JWT token in the section above
                </p>
              </div>
            </div>
          </div>

          {/* Verification Result */}
          {verificationResult !== null && (
            <div className={`p-6 rounded-xl border ${
              verificationResult ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
            }`}>
              <label className={`block text-sm font-medium mb-3 ${
                verificationResult ? 'text-green-700' : 'text-red-700'
              }`}>Verification Result</label>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  verificationResult ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  verificationResult ? 'text-green-700' : 'text-red-700'
                }`}>
                  {verificationResult ? '✅ Signature is valid and authentic' : '❌ Signature verification failed'}
                </span>
              </div>
            </div>
          )}

          {/* RSA Signing Info Box */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-3">✍️ JWT Token Usage</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p><strong>Private Key:</strong> Used for signing (keep secret)</p>
                <p><strong>Public Key:</strong> Used for verification (safe to share)</p>
              </div>
              <div>
                <p><strong>Security:</strong> Only private key can create signatures</p>
                <p><strong>Use Case:</strong> Authentication, non-repudiation</p>
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
                    fill="#10b981"
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
              {metrics.signTime && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Signing</span>
                  <div className="text-right">
                    <div className="font-mono text-sm">{metrics.signTime.toFixed(2)}ms</div>
                    <div className="text-xs text-gray-500">
                      {metrics.signMode === 'browser' ? 'JavaScript' : 'Spring Boot'}
                    </div>
                  </div>
                </div>
              )}
              {metrics.verifyTime && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Verification</span>
                  <div className="text-right">
                    <div className="font-mono text-sm">{metrics.verifyTime.toFixed(2)}ms</div>
                    <div className="text-xs text-gray-500">
                      {metrics.verifyMode === 'browser' ? 'JavaScript' : 'Spring Boot'}
                    </div>
                  </div>
                </div>
              )}
              {metrics.messageSize && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Message Size</span>
                  <span className="font-mono text-sm">{metrics.messageSize} bytes</span>
                </div>
              )}
              {metrics.jwtTokenSize && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">JWT Token Size</span>
                  <span className="font-mono text-sm">{metrics.jwtTokenSize} bytes</span>
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
            <p className="text-gray-400">No activity yet. Start by generating a key pair or signing a message.</p>
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
    </div>
  );
}