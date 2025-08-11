
let VITE_API_URL=import.meta.env.VITE_API_URL || "http://localhost";
const mode = import.meta.env.MODE || "development";
if (mode === "production") {
  VITE_API_URL = "";  
}

console.log(VITE_API_URL);

// API Configuration
const API_CONFIG = {
  // Base URL for the Dual-Crypt API
  // If VITE_API_URL is not set, use relative path (for embedded deployment)
  BASE_URL: VITE_API_URL,
  
  // API Endpoints
  ENDPOINTS: {
    // Symmetric encryption endpoints
    SYMMETRIC: {
      GENERATE: '/api/symmetric/generate',
      ENCRYPT: '/api/symmetric/encrypt',
      DECRYPT: '/api/symmetric/decrypt'
    },
    // Asymmetric encryption endpoints
    ASYMMETRIC: {
      GENERATE: '/api/asymmetric/generate',
      ENCRYPT: '/api/asymmetric/encrypt',
      DECRYPT: '/api/asymmetric/decrypt'
    },

  },
  
  // Default request timeout (in milliseconds)
  TIMEOUT: 10000,
};
console.log(import.meta.env)
// Helper function to build full URL
export const buildUrl = (endpoint, params = {}) => {
  const url = new URL(endpoint, API_CONFIG.BASE_URL.startsWith('http') 
    ? API_CONFIG.BASE_URL 
    : `${window.location.origin}${API_CONFIG.BASE_URL}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });
  
  return url.toString();
};

// Helper functions for symmetric encryption endpoints
export const getSymmetricGenerateUrl = () => buildUrl(API_CONFIG.ENDPOINTS.SYMMETRIC.GENERATE);
export const getSymmetricEncryptUrl = () => buildUrl(API_CONFIG.ENDPOINTS.SYMMETRIC.ENCRYPT);
export const getSymmetricDecryptUrl = () => buildUrl(API_CONFIG.ENDPOINTS.SYMMETRIC.DECRYPT);

// Helper functions for asymmetric encryption endpoints
export const getAsymmetricGenerateUrl = () => buildUrl(API_CONFIG.ENDPOINTS.ASYMMETRIC.GENERATE);
export const getAsymmetricEncryptUrl = () => buildUrl(API_CONFIG.ENDPOINTS.ASYMMETRIC.ENCRYPT);
export const getAsymmetricDecryptUrl = () => buildUrl(API_CONFIG.ENDPOINTS.ASYMMETRIC.DECRYPT);

// Helper function to create request headers
export const createHeaders = (additionalHeaders = {}) => {
  return {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
};

export default API_CONFIG;
