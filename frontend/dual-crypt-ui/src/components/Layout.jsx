
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from "react-router";

export default function Layout() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/symmetric', label: 'Symmetric Encryption', icon: '🔐' },
    { path: '/asymmetric', label: 'Asymmetric Encryption', icon: '🔑' },
    { path: '/sign', label: 'Sign & Verify', icon: '✍️' },
  ];

  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 hover:scale-105 transition-transform">
              <span className="text-2xl">🔐</span>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dual-Crypt
              </h1>
            </Link>
            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-2 lg:space-x-4">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
            </nav>
            {/* Mobile Nav Toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setNavOpen(!navOpen)}
              aria-label="Open navigation menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile Nav Drawer */}
        {navOpen && (
          <nav className="md:hidden bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 py-2 flex flex-col space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-base font-medium flex items-center space-x-2 ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:shadow-md'
                  }`}
                  onClick={() => setNavOpen(false)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full pb-12 px-2 sm:px-4 md:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-gray-200/50 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center md:justify-between space-y-6 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-light text-gray-900 mb-2">
                🔐 Dual-Crypt
              </h3>
              <p className="text-sm text-gray-500 max-w-md mb-3">
                A complete cryptography playground with AES-256-GCM and RSA-2048 algorithms.
              </p>
              <div className="flex items-center justify-center md:justify-start space-x-6 text-xs text-gray-400">
                <span className="flex items-center space-x-1">
                  <span>🛡️</span>
                  <span>Military-grade encryption</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>⚡</span>
                  <span>Real-time metrics</span>
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <a href="https://github.com/muthuishere/dual-crypt" target="_blank" rel="noopener noreferrer" 
                 className="flex items-center space-x-1 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
                </svg>
                <span>Source</span>
              </a>
              <span className="text-gray-300">·</span>
              <a href="https://www.linkedin.com/in/muthuishere/" target="_blank" rel="noopener noreferrer" 
                 className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd"/>
                </svg>
                <span>Connect</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}