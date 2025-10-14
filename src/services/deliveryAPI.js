import api from './authAPI';

// Delivery API functions
export const deliveryAPI = {
    // Start delivery for an order
    startDelivery: async (orderId, estimatedDeliveryTime = null) => {
        try {
            const response = await api.post(`/delivery/${orderId}/start`, {
                estimatedDeliveryTime,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Complete delivery
    completeDelivery: async (orderId, deliveryData = {}) => {
        try {
            const response = await api.post(`/delivery/${orderId}/complete`, deliveryData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Mark delivery as failed
    failDelivery: async (orderId, failureReason, failureNotes = null) => {
        try {
            const response = await api.post(`/delivery/${orderId}/fail`, {
                failureReason,
                failureNotes,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update delivery progress/location
    updateDeliveryProgress: async (orderId, progressData) => {
        try {
            const response = await api.put(`/delivery/${orderId}/progress`, progressData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get delivery history for rider
    getDeliveryHistory: async (params = {}) => {
        try {
            const { page = 1, limit = 10, status } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (status) {
                queryParams.append('status', status);
            }

            const response = await api.get(`/delivery/history?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get delivery statistics for rider
    getDeliveryStats: async (period = 'month') => {
        try {
            const queryParams = new URLSearchParams({
                period,
            });

            const response = await api.get(`/delivery/stats?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default deliveryAPI;