// API Configuration for different environments
const API_CONFIG = {
    // Development (local)
    development: {
        baseUrl: '../backend/api',
        cors: true
    },
    // Production (Netlify + backend hosting)
    production: {
        baseUrl: 'https://dearlock-production.up.railway.app/api',
        cors: true
    }
};

// Determine current environment
const ENVIRONMENT = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'development' 
    : 'production';

// Get current API configuration
const API_BASE_URL = API_CONFIG[ENVIRONMENT].baseUrl;

// Default fetch options for cross-origin requests with credentials
const FETCH_OPTIONS = {
    credentials: 'include', // Always send cookies
    headers: {
        'Content-Type': 'application/json'
    }
};

// Helper function to make API calls with credentials
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    return fetch(url, { ...defaultOptions, ...options });
}

console.log(`Environment: ${ENVIRONMENT}`);
console.log(`API Base URL: ${API_BASE_URL}`);