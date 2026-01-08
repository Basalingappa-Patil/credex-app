const CONFIG = {
    // Default to localhost for development
    // For production, this should be updated to the actual Render backend URL
    // You can also define window.BACKEND_URL in your HTML before loading this script to override
    API_URL: window.BACKEND_URL || (
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5001/api'
            : 'https://credex-backend.onrender.com/api' // Updated from deployment logs
    )
};

// Make it globally available
window.API_URL = CONFIG.API_URL;
console.log('API Configured:', window.API_URL);
