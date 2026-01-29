// API Configuration for different environments
const API_CONFIG = {
    // Development (local)
    development: {
        baseUrl: '../backend/api',
        cors: true
    },
    // Production (Netlify + backend hosting)
    production: {
        baseUrl: 'https://your-backend-url.com/api', // You'll update this after backend deployment
        cors: true
    }
};

// Determine current environment
const ENVIRONMENT = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'development' 
    : 'production';

// Get current API configuration
const API_BASE_URL = API_CONFIG[ENVIRONMENT].baseUrl;

console.log(`Environment: ${ENVIRONMENT}`);
console.log(`API Base URL: ${API_BASE_URL}`);