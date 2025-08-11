import React from 'react';
import { Outlet, Link, useLocation } from "react-router";

export default function Layout() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/symmetric', label: 'Symmetric Encryption', icon: '🔐' },
    { path: '/asymmetric', label: 'Asymmetric Encryption', icon: '🔑' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 hover:scale-105 transition-transform">
              <span className="text-2xl">🔐</span>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dual-Crypt
              </h1>
            </Link>
            <nav className="flex space-x-4">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1 pb-12">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              🔐 <strong>Dual-Crypt</strong> - A Complete Cryptography & Serialization System
            </p>
            <p className="text-sm text-gray-500">
              Secure encryption playground with AES-256-GCM and RSA-2048 algorithms
            </p>
            <div className="mt-4 flex justify-center space-x-6 text-xs text-gray-400">
              <span>🛡️ Military-grade encryption</span>
              <span>⚡ Real-time performance metrics</span>
              <span>🎯 Interactive testing</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}