import api from './authAPI';

// Notification API functions
export const notificationAPI = {
    // Get notifications with pagination
    getNotifications: async (params = {}) => {
        try {
            const { page = 1, limit = 20, unreadOnly = false } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (unreadOnly) {
                queryParams.append('unreadOnly', 'true');
            }

            const response = await api.get(`/notifications?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get notification count (unread and total)
    getNotificationCount: async () => {
        try {
            const response = await api.get('/notifications/count');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        try {
            const response = await api.put(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        try {
            const response = await api.put('/notifications/read-all');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete notification
    deleteNotification: async (notificationId) => {
        try {
            const response = await api.delete(`/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default notificationAPI;