import { Link } from 'react-router';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Steve Jobs Hero Section */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center space-y-8">
          <h1 className="text-7xl font-light text-gray-900 tracking-tight">
            Dual Crypt
          </h1>
          <p className="text-2xl font-light text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Symmetric encryption, asymmetric encryption, and digital signature demos.
          </p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Spring Boot server encryption/signing ↔ React client decryption/verification. Get the code and use it.
          </p>
        </div>
      </div>

      {/* The Magic Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-gray-900 mb-6">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Encrypt on the server, decrypt in the browser. Sign on the server, verify in the browser. Or vice versa. 
              Symmetric encryption, asymmetric encryption, and digital signatures all work cross-platform.
            </p>
          </div>

          {/* Three Pillars of Cryptography */}
          <div className="grid md:grid-cols-3 gap-12 mt-20">
            {/* Symmetric Encryption */}
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-blue-500 rounded-full flex items-center justify-center mb-8">
                <span className="text-4xl text-white">🔐</span>
              </div>
              <h3 className="text-3xl font-light text-gray-900">Symmetric</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                AES-256-GCM encryption. One secret key shared between server and client.
                Fast and efficient for large data.
              </p>
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <div className="text-sm text-gray-500 mb-3">What you get:</div>
                <ul className="text-left space-y-2 text-gray-700">
                  <li>• AES-256-GCM encryption implementation</li>
                  <li>• Spring Boot ↔ React integration</li>
                  <li>• Key generation and secure exchange</li>
                  <li>• Copy-paste ready code templates</li>
                </ul>
              </div>
            </div>

            {/* Asymmetric Encryption */}
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-purple-500 rounded-full flex items-center justify-center mb-8">
                <span className="text-4xl text-white">🔑</span>
              </div>
              <h3 className="text-3xl font-light text-gray-900">Asymmetric</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                RSA-2048 with OAEP padding. Public key encrypts, private key decrypts.
                No shared secrets required.
              </p>
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <div className="text-sm text-gray-500 mb-3">What you get:</div>
                <ul className="text-left space-y-2 text-gray-700">
                  <li>• RSA-2048 key pair generation</li>
                  <li>• Cross-platform Spring Boot ↔ React</li>
                  <li>• Secure key exchange implementation</li>
                  <li>• Ready-to-use code templates</li>
                </ul>
              </div>
            </div>

            {/* Digital Signatures */}
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-emerald-500 rounded-full flex items-center justify-center mb-8">
                <span className="text-4xl text-white">✍️</span>
              </div>
              <h3 className="text-3xl font-light text-gray-900">Sign & Verify</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                RSA-PSS digital signatures with JWT tokens. Sign with private key, verify with public key.
                Ensure data authenticity and integrity.
              </p>
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <div className="text-sm text-gray-500 mb-3">What you get:</div>
                <ul className="text-left space-y-2 text-gray-700">
                  <li>• JWT token signing and verification</li>
                  <li>• RSA-PSS signature implementation</li>
                  <li>• Data authenticity verification</li>
                  <li>• Cross-platform signature validation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Platform Demo Section */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-gray-900 mb-6">
              Frontend ↔ Backend Integration
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Encrypt in Spring Boot, decrypt in React. Sign in Spring Boot, verify in React.
              Or encrypt in React, decrypt in Spring Boot. Sign in React, verify in Spring Boot.
              All directions work with the same algorithms.
            </p>
          </div>

          {/* Demo Flow */}
          <div className="bg-white rounded-3xl shadow-lg p-12 border">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl text-white">☁️</span>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Spring Boot Server</h3>
                <p className="text-gray-600">
                  Generate keys, encrypt data, and sign tokens with Java crypto libraries
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="text-4xl text-gray-300">↔️</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl text-white">🌐</span>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">React Browser</h3>
                <p className="text-gray-600">
                  Decrypt data and verify signatures using native Web Crypto API
                </p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <p className="text-lg text-gray-600 mb-8">
                Compatible encryption and signature implementations. No compatibility issues.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <Link to="/symmetric" className="group">
                  <div className="bg-blue-50 hover:bg-blue-100 p-6 rounded-2xl transition-all border border-blue-200 hover:border-blue-300">
                    <div className="text-3xl mb-3">🔐</div>
                    <h4 className="text-lg font-medium text-blue-900 mb-2">Try Symmetric</h4>
                    <p className="text-blue-700 text-sm">Test AES-256-GCM encryption</p>
                  </div>
                </Link>
                <Link to="/asymmetric" className="group">
                  <div className="bg-purple-50 hover:bg-purple-100 p-6 rounded-2xl transition-all border border-purple-200 hover:border-purple-300">
                    <div className="text-3xl mb-3">🔑</div>
                    <h4 className="text-lg font-medium text-purple-900 mb-2">Try Asymmetric</h4>
                    <p className="text-purple-700 text-sm">Test RSA-2048 encryption</p>
                  </div>
                </Link>
                <Link to="/sign" className="group">
                  <div className="bg-emerald-50 hover:bg-emerald-100 p-6 rounded-2xl transition-all border border-emerald-200 hover:border-emerald-300">
                    <div className="text-3xl mb-3">✍️</div>
                    <h4 className="text-lg font-medium text-emerald-900 mb-2">Try Sign & Verify</h4>
                    <p className="text-emerald-700 text-sm">Test JWT digital signatures</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Templates Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-gray-900 mb-6">
              Get the code
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Each demo generates code templates for both platforms. 
              Copy and use in your projects.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-white font-bold">JS</span>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900">JavaScript Templates</h3>
                  <p className="text-gray-600">Web Crypto API implementation</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Key generation, encryption & signing
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  AES-256-GCM, RSA-OAEP & RSA-PSS implementation
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Browser-ready code
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-white font-bold">☕</span>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900">Spring Boot Templates</h3>
                  <p className="text-gray-600">Java server implementation</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Service layer implementation
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Error handling
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Standard crypto practices
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Key Differentiators */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-gray-900 mb-6">
              Why Dual Crypt
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-4">Standard Algorithms</h3>
              <p className="text-gray-600 leading-relaxed">
                AES-256-GCM and RSA-2048 with OAEP padding. 
                Well-tested encryption standards.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-4">Cross-Platform</h3>
              <p className="text-gray-600 leading-relaxed">
                Compatible implementations between Java and JavaScript. 
                Encrypt on server, decrypt on client, or vice versa.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-4">Copy-Paste Ready</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete code templates with error handling 
                and standard crypto practices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-light text-gray-900 mb-6">
            Try the demo
          </h2>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Choose your cryptographic method and test the integration.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link to="/symmetric" className="group transform hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl text-white text-center shadow-xl">
                <div className="text-4xl mb-3">🔐</div>
                <h3 className="text-xl font-light mb-2">Symmetric</h3>
                <p className="opacity-90 text-sm">Single shared key</p>
                <div className="mt-4 text-xs opacity-75">Test AES-256 →</div>
              </div>
            </Link>
            
            <Link to="/asymmetric" className="group transform hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-3xl text-white text-center shadow-xl">
                <div className="text-4xl mb-3">🔑</div>
                <h3 className="text-xl font-light mb-2">Asymmetric</h3>
                <p className="opacity-90 text-sm">Public/private key pair</p>
                <div className="mt-4 text-xs opacity-75">Test RSA-2048 →</div>
              </div>
            </Link>
            
            <Link to="/sign" className="group transform hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl text-white text-center shadow-xl">
                <div className="text-4xl mb-3">✍️</div>
                <h3 className="text-xl font-light mb-2">Sign & Verify</h3>
                <p className="opacity-90 text-sm">Digital signatures</p>
                <div className="mt-4 text-xs opacity-75">Test JWT signing →</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
