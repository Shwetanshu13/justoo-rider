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
import { AuthContext } from '../contexts/AuthContext';
import { orderAPI } from '../services/orderAPI';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigation } from '@react-navigation/native';

const AvailableOrdersScreen = () => {
    const { user } = useContext(AuthContext);
    const { refreshNotifications } = useNotifications();
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [acceptingOrderId, setAcceptingOrderId] = useState(null);

    useEffect(() => {
        loadAvailableOrders();
    }, []);

    const loadAvailableOrders = async () => {
        try {
            setLoading(true);

            const response = await orderAPI.getAvailableOrders();

            if (response.success) {
                setOrders(response.orders || []);
            } else {
                Alert.alert('Error', response.message || 'Failed to load available orders');
            }
        } catch (error) {
            console.error('Error loading available orders:', error);
            Alert.alert('Error', 'Failed to load available orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadAvailableOrders();
    };

    const handleAcceptOrder = async (orderId) => {
        Alert.alert(
            'Accept Order',
            'Are you sure you want to accept this order?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    onPress: async () => {
                        try {
                            setAcceptingOrderId(orderId);
                            const response = await orderAPI.acceptOrder(orderId);

                            if (response.success) {
                                // Remove the accepted order from the list
                                setOrders(prev => prev.filter(order => order.id !== orderId));

                                // Refresh notifications to update counts
                                await refreshNotifications();

                                Alert.alert(
                                    'Order Accepted!',
                                    'The order has been assigned to you. You can view it in your Orders tab.',
                                    [
                                        {
                                            text: 'View Order',
                                            onPress: () => navigation.navigate('OrderDetails', { orderId }),
                                        },
                                        { text: 'Continue', style: 'cancel' },
                                    ]
                                );
                            } else {
                                Alert.alert('Error', response.message || 'Failed to accept order');
                            }
                        } catch (error) {
                            console.error('Error accepting order:', error);
                            Alert.alert('Error', 'Failed to accept order. Please try again.');
                        } finally {
                            setAcceptingOrderId(null);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else {
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) {
                return `${diffInHours}h ago`;
            } else {
                return date.toLocaleDateString();
            }
        }
    };

    const formatCurrency = (amount) => {
        return `₹${(amount || 0).toLocaleString()}`;
    };

    const renderOrderItem = ({ item }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>Order #{item.id}</Text>
                    <Text style={styles.orderTime}>{formatDate(item.orderPlacedAt)}</Text>
                </View>
                <View style={styles.orderAmount}>
                    <Text style={styles.amountText}>{formatCurrency(item.totalAmount)}</Text>
                    <Text style={styles.deliveryFee}>+ {formatCurrency(item.deliveryFee)} delivery</Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📦</Text>
                    <Text style={styles.detailText}>{item.itemCount} items</Text>
                </View>

                {item.deliveryAddress && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📍</Text>
                        <Text style={styles.detailText} numberOfLines={2}>
                            {item.deliveryAddress.fullAddress}
                            {item.deliveryAddress.landmark && ` (${item.deliveryAddress.landmark})`}
                        </Text>
                    </View>
                )}

                {item.estimatedDeliveryTime && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>⏰</Text>
                        <Text style={styles.detailText}>
                            Deliver by {new Date(item.estimatedDeliveryTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.orderActions}>
                <TouchableOpacity
                    style={[styles.acceptButton, acceptingOrderId === item.id && styles.acceptButtonDisabled]}
                    onPress={() => handleAcceptOrder(item.id)}
                    disabled={acceptingOrderId === item.id}
                >
                    {acceptingOrderId === item.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Text style={styles.acceptButtonIcon}>✅</Text>
                            <Text style={styles.acceptButtonText}>Accept Order</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading available orders...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Available Orders</Text>
            </View>

            {/* Orders List */}
            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📦</Text>
                        <Text style={styles.emptyText}>No available orders</Text>
                        <Text style={styles.emptySubtext}>
                            New orders will appear here when customers place them
                        </Text>
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={handleRefresh}
                        >
                            <Text style={styles.refreshButtonText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
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
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    listContainer: {
        padding: 10,
        flexGrow: 1,
    },
    orderCard: {
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
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    orderTime: {
        fontSize: 14,
        color: '#666',
    },
    orderAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    deliveryFee: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    orderDetails: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    detailIcon: {
        fontSize: 16,
        marginRight: 8,
        marginTop: 2,
    },
    detailText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        lineHeight: 20,
    },
    orderActions: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 15,
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#28a745',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    acceptButtonDisabled: {
        backgroundColor: '#6c757d',
    },
    acceptButtonIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
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
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    refreshButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default AvailableOrdersScreen;
