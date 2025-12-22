// API Configuration

console.log(process.env.EXPO_PUBLIC_API_BASE_URL);
export const API_CONFIG = {
    // Update this to your actual backend URL
    BASE_URL: `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/rider`,

    // Timeout for API requests (in milliseconds)
    TIMEOUT: 10000,
};

// For production, you might want to use environment variables
// BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://your-production-api.com/api',