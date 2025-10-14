import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// Configure your API base URL here
const API_BASE_URL = API_CONFIG.BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, clear stored token
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    // Login with email and password
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', {
                email: email.toLowerCase(),
                password,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Logout
    logout: async () => {
        try {
            const response = await api.post('/auth/logout');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get user profile
    getProfile: async () => {
        try {
            const response = await api.get('/auth/profile');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Verify token validity (optional utility)
    verifyToken: async () => {
        try {
            await authAPI.getProfile();
            return true;
        } catch (error) {
            return false;
        }
    },
};

export default api;