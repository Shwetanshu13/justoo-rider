import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import notificationAPI from '../services/notificationAPI';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState({ unread: 0, total: 0 });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Load notification count
    const loadNotificationCount = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const response = await notificationAPI.getNotificationCount();
            if (response.success) {
                setNotificationCount(response.data);
            }
        } catch (error) {
            console.error('Error loading notification count:', error);
        }
    }, [isAuthenticated]);

    // Load notifications
    const loadNotifications = useCallback(async (params = {}, isRefresh = false) => {
        if (!isAuthenticated) return;

        try {
            if (!isRefresh) setLoading(true);
            const response = await notificationAPI.getNotifications(params);

            if (response.success) {
                if (isRefresh || params.page === 1) {
                    setNotifications(response.data.notifications);
                } else {
                    setNotifications(prev => [...prev, ...response.data.notifications]);
                }
                return response.data;
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            throw error;
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAuthenticated]);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            const response = await notificationAPI.markAsRead(notificationId);
            if (response.success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notification =>
                        notification.id === notificationId
                            ? { ...notification, isRead: 1, readAt: new Date() }
                            : notification
                    )
                );
                // Update count
                setNotificationCount(prev => ({
                    ...prev,
                    unread: Math.max(0, prev.unread - 1)
                }));
                return response.data;
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            const response = await notificationAPI.markAllAsRead();
            if (response.success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notification => ({
                        ...notification,
                        isRead: 1,
                        readAt: new Date()
                    }))
                );
                // Update count
                setNotificationCount(prev => ({
                    ...prev,
                    unread: 0
                }));
                return response;
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }, []);

    // Delete notification
    const deleteNotification = useCallback(async (notificationId) => {
        try {
            const response = await notificationAPI.deleteNotification(notificationId);
            if (response.success) {
                // Update local state
                setNotifications(prev =>
                    prev.filter(notification => notification.id !== notificationId)
                );
                // Update count
                setNotificationCount(prev => ({
                    ...prev,
                    total: Math.max(0, prev.total - 1),
                    unread: Math.max(0, prev.unread - (notifications.find(n => n.id === notificationId)?.isRead === 0 ? 1 : 0))
                }));
                return response;
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }, [notifications]);

    // Refresh notifications
    const refreshNotifications = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            loadNotificationCount(),
            loadNotifications({ page: 1 }, true)
        ]);
    }, [loadNotificationCount, loadNotifications]);

    // Load initial data when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadNotificationCount();
            loadNotifications({ page: 1 });
        } else {
            // Clear data when not authenticated
            setNotifications([]);
            setNotificationCount({ unread: 0, total: 0 });
        }
    }, [isAuthenticated, loadNotificationCount, loadNotifications]);

    // Auto-refresh notification count every 30 seconds when authenticated
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(() => {
            loadNotificationCount();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [isAuthenticated, loadNotificationCount]);

    const value = {
        notifications,
        notificationCount,
        loading,
        refreshing,
        loadNotifications,
        loadNotificationCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};