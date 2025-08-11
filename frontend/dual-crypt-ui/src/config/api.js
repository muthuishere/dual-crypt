




// Helper function to build full URL
export const buildUrl = (endpoint, params = {}) => {


  const url = new URL(endpoint, API_CONFIG.BASE_URL);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });
  
  return url.toString();
};

// Helper function to get products URL
export const getProductsUrl = (count) => {
  return buildUrl(API_CONFIG.ENDPOINTS.PRODUCTS, { count });
};

// Helper function to create request headers
export const createHeaders = (format = API_CONFIG.FORMATS.JSON, additionalHeaders = {}) => {
  return {
    'Accept': format,
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
};

export default API_CONFIG;
