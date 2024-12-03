// API configuration
import axios from 'axios';

const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  ENDPOINTS: {
    OPENAI_CHAT: '/api/openai/chat',
    OPENAI_HEALTH: '/api/openai/health',
    NEARBY_STORES: '/api/nearbyStores',
    MEAL_SUGGESTIONS: '/api/meals/suggest',
    USER_PREFERENCES: '/api/user/preferences'
  },
  TIMEOUT: 30000, // Increased timeout for OpenAI calls
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
    BACKOFF_FACTOR: 2
  }
};

// Create axios instance with retry logic
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add retry interceptor
apiClient.interceptors.response.use(null, async (error) => {
  const { config } = error;
  if (!config || !config.retry) {
    return Promise.reject(error);
  }

  config.retryCount = config.retryCount || 0;

  if (config.retryCount >= API_CONFIG.RETRY.MAX_ATTEMPTS) {
    return Promise.reject(error);
  }

  // If rate limited, wait for the specified time
  if (error.response?.status === 429) {
    const resetTime = error.response.data?.resetTime;
    if (resetTime) {
      const waitTime = resetTime - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  config.retryCount += 1;
  const backoffDelay = API_CONFIG.RETRY.DELAY * Math.pow(API_CONFIG.RETRY.BACKOFF_FACTOR, config.retryCount - 1);
  await new Promise(resolve => setTimeout(resolve, backoffDelay));
  
  return apiClient(config);
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 429) {
      console.log('Rate limited, will retry after cooldown');
    }
    return Promise.reject(error);
  }
);

// Helper function to get full endpoint URL
export function getEndpointUrl(endpoint) {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
}

export { apiClient };
export default API_CONFIG;
