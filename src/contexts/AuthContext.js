import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/authAPI';
import { riderAPI } from '../services/riderAPI';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [riderStats, setRiderStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing authentication on app start
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const userData = await AsyncStorage.getItem('userData');

            if (token && userData) {
                // Verify token is still valid
                const isValid = await authAPI.verifyToken();
                if (isValid) {
                    setUser(JSON.parse(userData));
                    setIsAuthenticated(true);
                    // Load rider stats
                    await loadRiderStats();
                } else {
                    // Token expired, clear storage
                    await AsyncStorage.removeItem('authToken');
                    await AsyncStorage.removeItem('userData');
                }
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadRiderStats = async () => {
        try {
            const response = await riderAPI.getStats();
            if (response.success) {
                setRiderStats(response.data);
            }
        } catch (error) {
            console.error('Error loading rider stats:', error);
        }
    };

    const login = async (email, password) => {
        try {
            setIsLoading(true);
            const response = await authAPI.login(email, password);

            if (response.success) {
                const { user, token } = response;

                // Store token and user data
                await AsyncStorage.setItem('authToken', token);
                await AsyncStorage.setItem('userData', JSON.stringify(user));

                setUser(user);
                setIsAuthenticated(true);

                // Load rider stats after login
                await loadRiderStats();

                return { success: true };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Login failed. Please try again.'
            };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);

            // Call logout API
            await authAPI.logout();

            // Clear local storage
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');

            // Reset state
            setUser(null);
            setRiderStats(null);
            setIsAuthenticated(false);

            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            // Even if API call fails, clear local data
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
            setUser(null);
            setRiderStats(null);
            setIsAuthenticated(false);

            return { success: false, message: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async () => {
        try {
            const response = await authAPI.getProfile();
            if (response.success) {
                const updatedUser = response.data;
                setUser(updatedUser);
                await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, message: error.message };
        }
    };

    const updateRiderProfile = async (profileData) => {
        try {
            const response = await riderAPI.updateProfile(profileData);
            if (response.success) {
                const updatedUser = response.data;
                setUser(updatedUser);
                await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
                return { success: true, message: response.message };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Update rider profile error:', error);
            return { success: false, message: error.message };
        }
    };

    const updateRiderPassword = async (currentPassword, newPassword) => {
        try {
            const response = await riderAPI.updatePassword({
                currentPassword,
                newPassword,
            });
            return { success: response.success, message: response.message };
        } catch (error) {
            console.error('Update password error:', error);
            return { success: false, message: error.message };
        }
    };

    const updateRiderStatus = async (status) => {
        try {
            const response = await riderAPI.updateStatus(status);
            if (response.success) {
                // Update user status in local state
                setUser(prev => prev ? { ...prev, status } : null);
                await AsyncStorage.setItem('userData', JSON.stringify({ ...user, status }));
                return { success: true, message: response.message };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Update status error:', error);
            return { success: false, message: error.message };
        }
    };

    const refreshRiderStats = async () => {
        await loadRiderStats();
    };

    const value = {
        isAuthenticated,
        user,
        riderStats,
        isLoading,
        login,
        logout,
        updateProfile,
        updateRiderProfile,
        updateRiderPassword,
        updateRiderStatus,
        refreshRiderStats,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};