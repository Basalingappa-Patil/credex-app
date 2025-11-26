const CONFIG = {
    // Default to localhost for development, but allow overriding or auto-detection
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5001/api'
        : 'https://your-backend-service-name.onrender.com/api' // Placeholder, will need to be updated after deployment
};

// Make it globally available
window.API_URL = CONFIG.API_URL;
