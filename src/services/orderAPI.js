import api from './authAPI';

// Order API functions
export const orderAPI = {
    // Get current order for rider
    getCurrentOrder: async () => {
        try {
            const response = await api.get('/order/current');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get assigned orders for rider
    getAssignedOrders: async (params = {}) => {
        try {
            const { status, page = 1, limit = 10 } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (status) {
                queryParams.append('status', status);
            }

            const response = await api.get(`/order/assigned?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get completed orders for rider
    getCompletedOrders: async (params = {}) => {
        try {
            const { page = 1, limit = 10 } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            const response = await api.get(`/order/completed?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get order details by ID
    getOrderDetails: async (orderId) => {
        try {
            const response = await api.get(`/order/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update order status
    updateOrderStatus: async (orderId, status, notes = null) => {
        try {
            const response = await api.put(`/order/${orderId}/status`, {
                status,
                ...(notes && { notes }),
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Accept order assignment
    acceptOrder: async (orderId) => {
        try {
            const response = await api.post(`/order/${orderId}/accept`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default orderAPI;