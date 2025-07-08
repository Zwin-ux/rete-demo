// Network configuration for the workflow editor
// This file contains settings for network-related nodes and operations

export const NETWORK_CONFIG = {
  // Default timeout for network requests (in milliseconds)
  DEFAULT_TIMEOUT: 10000,
  
  // Maximum number of retries for failed requests
  MAX_RETRIES: 3,
  
  // Retry delay (in milliseconds)
  RETRY_DELAY: 1000,
  
  // Default headers for HTTP requests
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // WebSocket configuration
  WEBSOCKET: {
    // Default reconnect settings
    RECONNECT_INTERVAL: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
    
    // Ping interval to keep connections alive (in milliseconds)
    PING_INTERVAL: 30000
  },
  
  // API endpoints for common services (for demo purposes)
  ENDPOINTS: {
    // Mock API endpoints
    MOCK: {
      JSON_PLACEHOLDER: 'https://jsonplaceholder.typicode.com',
      ECHO_WS: 'wss://echo.websocket.org'
    },
    
    // Real API endpoints (would be configured by the user in a real app)
    PRODUCTION: {
      // These would be populated from environment variables or user settings
      API_BASE: '',
      WEBSOCKET_BASE: ''
    }
  },
  
  // Network environment settings
  ENVIRONMENTS: {
    // Development environment settings
    development: {
      USE_MOCK: true,
      SIMULATE_LATENCY: true,
      MIN_LATENCY: 200,
      MAX_LATENCY: 1000,
      ERROR_RATE: 0.1 // 10% chance of simulated errors
    },
    
    // Production environment settings
    production: {
      USE_MOCK: false,
      SIMULATE_LATENCY: false,
      ERROR_RATE: 0
    }
  },
  
  // Helper function to get current environment
  getCurrentEnvironment() {
    // In a real app, this would check environment variables
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  },
  
  // Helper function to get environment settings
  getEnvironmentSettings() {
    const env = this.getCurrentEnvironment();
    return this.ENVIRONMENTS[env];
  },
  
  // Helper function to simulate network latency (for development)
  async simulateLatency() {
    const env = this.getEnvironmentSettings();
    if (env.SIMULATE_LATENCY) {
      // Default values if not in development environment
      const minLatency = 'MIN_LATENCY' in env ? env.MIN_LATENCY : 200;
      const maxLatency = 'MAX_LATENCY' in env ? env.MAX_LATENCY : 1000;
      
      const latency = Math.random() * (maxLatency - minLatency) + minLatency;
      await new Promise(resolve => setTimeout(resolve, latency));
    }
  },
  
  // Helper function to determine if a request should fail (for development)
  shouldSimulateError() {
    const env = this.getEnvironmentSettings();
    return env.USE_MOCK && Math.random() < env.ERROR_RATE;
  }
};

// Export a network utility for making HTTP requests with the configured settings
export const NetworkUtil = {
  /**
   * Make an HTTP request with retry logic and timeout
   */
  async request(url: string, options: RequestInit = {}, retries = NETWORK_CONFIG.MAX_RETRIES): Promise<Response> {
    // Apply default headers if not overridden
    const headers = {
      ...NETWORK_CONFIG.DEFAULT_HEADERS,
      ...(options.headers || {})
    };
    
    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_CONFIG.DEFAULT_TIMEOUT);
    
    try {
      // Simulate network latency in development
      await NETWORK_CONFIG.simulateLatency();
      
      // Simulate errors in development
      if (NETWORK_CONFIG.shouldSimulateError()) {
        throw new Error('Simulated network error');
      }
      
      // Make the actual request
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle retries
      if (retries > 0 && error instanceof Error && error.name !== 'AbortError') {
        console.log(`Request failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, NETWORK_CONFIG.RETRY_DELAY));
        return this.request(url, options, retries - 1);
      }
      
      throw error;
    }
  },
  
  /**
   * Shorthand for GET requests
   */
  async get(url: string, options: Omit<RequestInit, 'method'> = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'GET' });
  },
  
  /**
   * Shorthand for POST requests
   */
  async post(url: string, data: any, options: Omit<RequestInit, 'method' | 'body'> = {}): Promise<Response> {
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    return this.request(url, { ...options, method: 'POST', body });
  },
  
  /**
   * Shorthand for PUT requests
   */
  async put(url: string, data: any, options: Omit<RequestInit, 'method' | 'body'> = {}): Promise<Response> {
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    return this.request(url, { ...options, method: 'PUT', body });
  },
  
  /**
   * Shorthand for DELETE requests
   */
  async delete(url: string, options: Omit<RequestInit, 'method'> = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'DELETE' });
  }
};

// Export default configuration
export default NETWORK_CONFIG;
