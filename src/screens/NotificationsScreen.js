import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationsScreen = ({ navigation }) => {
    const {
        notifications,
        notificationCount,
        loading,
        refreshing,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
    } = useNotifications();

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread

    useEffect(() => {
        // Load notifications when filter changes
        loadNotifications({ page: 1, unreadOnly: filter === 'unread' });
        setPage(1);
        setHasMore(true);
    }, [filter]);

    const handleRefresh = () => {
        refreshNotifications();
        setPage(1);
        setHasMore(true);
    };

    const handleLoadMore = () => {
        if (hasMore && !loading) {
            const nextPage = page + 1;
            loadNotifications({
                page: nextPage,
                unreadOnly: filter === 'unread'
            }).then(result => {
                if (result) {
                    setPage(nextPage);
                    setHasMore(result.pagination.hasNext);
                }
            }).catch(() => {
                // Error handled in context
            });
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(notificationId);
        } catch (error) {
            Alert.alert('Error', 'Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        Alert.alert(
            'Mark All as Read',
            'Are you sure you want to mark all notifications as read?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Mark All',
                    onPress: async () => {
                        try {
                            await markAllAsRead();
                            Alert.alert('Success', 'All notifications marked as read');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to mark all notifications as read');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteNotification = async (notificationId) => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteNotification(notificationId);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete notification');
                        }
                    }
                }
            ]
        );
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order_assigned': return '📦';
            case 'order_ready': return '✅';
            case 'order_cancelled': return '❌';
            case 'payment': return '💰';
            case 'system': return '🔔';
            default: return '📱';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const renderNotificationItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
            onPress={() => handleMarkAsRead(item.id)}
            onLongPress={() => handleDeleteNotification(item.id)}
        >
            <View style={styles.notificationHeader}>
                <View style={styles.iconContainer}>
                    <Text style={styles.notificationIcon}>
                        {getNotificationIcon(item.type)}
                    </Text>
                </View>
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationTime}>{formatDate(item.sentAt)}</Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            {item.data && (
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    const renderFilterButton = (filterValue, label) => (
        <TouchableOpacity
            style={[styles.filterButton, filter === filterValue && styles.filterButtonActive]}
            onPress={() => setFilter(filterValue)}
        >
            <Text style={[styles.filterButtonText, filter === filterValue && styles.filterButtonTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    if (loading && page === 1) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with actions */}
            <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
                {notificationCount.unread > 0 && (
                    <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
                        <Text style={styles.markAllText}>Mark All Read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                {renderFilterButton('all', `All (${notificationCount.total})`)}
                {renderFilterButton('unread', `Unread (${notificationCount.unread})`)}
            </View>

            {/* Notifications List */}
            <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.1}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🔔</Text>
                        <Text style={styles.emptyText}>
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {filter === 'unread'
                                ? 'You\'ve read all your notifications!'
                                : 'Notifications about orders and updates will appear here'
                            }
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    loading && page > 1 ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color="#007AFF" />
                            <Text style={styles.footerLoaderText}>Loading more...</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 5,
    },
    backButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        flex: 1,
    },
    markAllButton: {
        padding: 5,
    },
    markAllText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginHorizontal: 5,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
    },
    filterButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    listContainer: {
        padding: 10,
    },
    notificationItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    unreadNotification: {
        backgroundColor: '#f0f8ff',
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    notificationIcon: {
        fontSize: 20,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    notificationTime: {
        fontSize: 12,
        color: '#666',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#007AFF',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 10,
    },
    actionButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerLoaderText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
});

export default NotificationsScreen;