import api from './authAPI';

// Rider API functions
export const riderAPI = {
    // Get rider profile
    getProfile: async () => {
        try {
            const response = await api.get('/rider/profile');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update rider profile
    updateProfile: async (profileData) => {
        try {
            const response = await api.put('/rider/profile', profileData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update rider password
    updatePassword: async (passwordData) => {
        try {
            const response = await api.put('/rider/password', passwordData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update rider status
    updateStatus: async (status) => {
        try {
            const response = await api.put('/rider/status', { status });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get rider statistics
    getStats: async () => {
        try {
            const response = await api.get('/rider/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default riderAPI;