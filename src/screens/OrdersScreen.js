import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Alert,
    ScrollView,
    SectionList,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { orderAPI } from '../services/orderAPI';
import { useNotifications } from '../contexts/NotificationContext';

const OrdersScreen = () => {
    const navigation = useNavigation();
    const { refreshNotifications } = useNotifications();
    const [orders, setOrders] = useState([]);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [acceptingOrderId, setAcceptingOrderId] = useState(null);
    const [selectedTab, setSelectedTab] = useState('available'); // 'available' or 'assigned'

    const statusFilters = [
        { label: 'All', value: null },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Preparing', value: 'preparing' },
        { label: 'Ready', value: 'ready' },
        { label: 'Out for Delivery', value: 'out_for_delivery' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
    ];

    const loadOrders = async (status = selectedStatus, showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const params = {};
            if (status) {
                params.status = status;
            }

            const response = await orderAPI.getAssignedOrders(params);

            if (response.success) {
                setOrders(response.orders || []);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            Alert.alert('Error', 'Failed to load orders. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadAvailableOrders = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const response = await orderAPI.getAvailableOrders();

            console.log('Available Orders Response:', JSON.stringify(response, null, 2));

            if (response.success) {
                const orders = response.orders || [];
                console.log('Available orders count:', orders.length);
                if (orders.length > 0) {
                    console.log('First available order:', JSON.stringify(orders[0], null, 2));
                }
                setAvailableOrders(orders);
            }
        } catch (error) {
            console.error('Error loading available orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (selectedTab === 'available') {
                loadAvailableOrders();
            } else {
                loadOrders(selectedStatus);
            }
        }, [selectedStatus, selectedTab])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        if (selectedTab === 'available') {
            loadAvailableOrders();
        } else {
            loadOrders(selectedStatus, false);
        }
        setRefreshing(false);
    };

    const handleStatusFilter = (status) => {
        setSelectedStatus(status);
        // loadOrders will be called by useFocusEffect when selectedStatus changes
    };

    const handleOrderPress = (order) => {
        navigation.navigate('OrderDetails', { orderId: order.id });
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
                                // Remove the accepted order from the available list
                                setAvailableOrders(prev => prev.filter(order => order.id !== orderId));

                                // Refresh notifications
                                await refreshNotifications();

                                Alert.alert(
                                    'Order Accepted!',
                                    'The order has been assigned to you.',
                                    [
                                        {
                                            text: 'View Order',
                                            onPress: () => navigation.navigate('OrderDetails', { orderId }),
                                        },
                                        { text: 'OK', style: 'cancel' },
                                    ]
                                );

                                // Reload assigned orders
                                loadOrders(selectedStatus, false);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return '#007AFF';
            case 'preparing': return '#ffc107';
            case 'ready': return '#28a745';
            case 'out_for_delivery': return '#17a2b8';
            case 'delivered': return '#28a745';
            case 'cancelled': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'confirmed': return 'Confirmed';
            case 'preparing': return 'Preparing';
            case 'ready': return 'Ready';
            case 'out_for_delivery': return 'Out for Delivery';
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (amount) => {
        return `₹${(amount || 0).toLocaleString()}`;
    };

    const formatTimeAgo = (dateString) => {
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

    const renderAvailableOrderItem = ({ item }) => {
        console.log('Rendering available order:', item.id, 'Total:', item.totalAmount, 'Delivery Fee:', item.deliveryFee);

        return (
            <View style={styles.availableOrderCard}>
                <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderId}>Order #{item.id}</Text>
                        <Text style={styles.orderTime}>{formatTimeAgo(item.orderPlacedAt)}</Text>
                    </View>
                    <View style={styles.orderAmount}>
                        <Text style={styles.amountText}>{formatCurrency(item.totalAmount)}</Text>
                        <Text style={styles.deliveryFee}>+ {formatCurrency(item.deliveryFee)} delivery</Text>
                    </View>
                </View>

                {/* Customer Information */}
                {item.customerName && (
                    <View style={styles.customerSection}>
                        <View style={styles.customerInfo}>
                            <Text style={styles.detailIcon}>👤</Text>
                            <View style={styles.customerDetails}>
                                <Text style={styles.customerName}>{item.customerName}</Text>
                                {item.customerPhone && (
                                    <Text style={styles.customerPhone}>📞 {item.customerPhone}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* Order Items List */}
                {item.items && item.items.length > 0 && (
                    <View style={styles.itemsSection}>
                        <Text style={styles.itemsSectionTitle}>📦 Order Items ({item.items.length}):</Text>
                        {item.items.map((orderItem, index) => (
                            <View key={index} style={styles.orderItemRow}>
                                <Text style={styles.orderItemName}>
                                    {orderItem.quantity}x {orderItem.itemName || orderItem.name}
                                </Text>
                                <Text style={styles.orderItemPrice}>
                                    {formatCurrency(parseFloat(orderItem.totalPrice || (orderItem.unitPrice || orderItem.price) * orderItem.quantity))}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Delivery Address */}
                {item.deliveryAddress && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📍</Text>
                        <View style={styles.addressContainer}>
                            <Text style={styles.addressLabel}>Delivery Address:</Text>
                            <Text style={styles.addressText}>
                                {item.deliveryAddress.fullAddress || 'Address not available'}
                                {item.deliveryAddress.landmark && `\n📌 ${item.deliveryAddress.landmark}`}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Estimated Delivery Time */}
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
    };

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => handleOrderPress(item)}
        >
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <Text style={styles.orderAmount}>{formatCurrency(item.totalAmount)}</Text>
                <Text style={styles.orderDate}>{formatDate(item.orderPlacedAt)}</Text>
            </View>

            {item.deliveryAddress && (
                <Text style={styles.deliveryAddress} numberOfLines={2}>
                    📍 {item.deliveryAddress.street || item.deliveryAddress.fullAddress}, {item.deliveryAddress.city}
                </Text>
            )}
        </TouchableOpacity>
    );

    const renderTabButtons = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tabButton, selectedTab === 'available' && styles.tabButtonActive]}
                onPress={() => setSelectedTab('available')}
            >
                <Text style={[styles.tabButtonText, selectedTab === 'available' && styles.tabButtonTextActive]}>
                    Available Orders
                </Text>
                {availableOrders.length > 0 && (
                    <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>{availableOrders.length}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tabButton, selectedTab === 'assigned' && styles.tabButtonActive]}
                onPress={() => setSelectedTab('assigned')}
            >
                <Text style={[styles.tabButtonText, selectedTab === 'assigned' && styles.tabButtonTextActive]}>
                    My Orders
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderStatusFilter = () => (
        <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>Filter by Status:</Text>
            <View style={styles.filterButtons}>
                {statusFilters.map((filter) => (
                    <TouchableOpacity
                        key={filter.value || 'all'}
                        style={[
                            styles.filterButton,
                            selectedStatus === filter.value && styles.filterButtonActive
                        ]}
                        onPress={() => handleStatusFilter(filter.value)}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            selectedStatus === filter.value && styles.filterButtonTextActive
                        ]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    if (loading && orders.length === 0 && availableOrders.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Orders</Text>
            </View>

            {renderTabButtons()}

            {selectedTab === 'available' ? (
                <FlatList
                    data={availableOrders}
                    renderItem={renderAvailableOrderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.ordersList}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>📦</Text>
                            <Text style={styles.emptyTitle}>No available orders</Text>
                            <Text style={styles.emptySubtitle}>
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
            ) : (
                <>
                    {renderStatusFilter()}
                    <FlatList
                        data={orders}
                        renderItem={renderOrderItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.ordersList}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>📦</Text>
                                <Text style={styles.emptyTitle}>No orders found</Text>
                                <Text style={styles.emptySubtitle}>
                                    {selectedStatus ? 'No orders with selected status' : 'You don\'t have any assigned orders yet'}
                                </Text>
                            </View>
                        }
                    />
                </>
            )}
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
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    filterContainer: {
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 10,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    filterButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterButton: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
    },
    filterButtonText: {
        fontSize: 14,
        color: '#666',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    ordersList: {
        padding: 10,
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
        alignItems: 'center',
        marginBottom: 10,
    },
    orderId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    orderDetails: {
        marginBottom: 8,
    },
    orderAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    orderDate: {
        fontSize: 14,
        color: '#666',
    },
    deliveryAddress: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 48,
        marginBottom: 10,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginHorizontal: 5,
        backgroundColor: '#f8f9fa',
    },
    tabButtonActive: {
        backgroundColor: '#007AFF',
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    tabButtonTextActive: {
        color: '#fff',
    },
    tabBadge: {
        backgroundColor: '#dc3545',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    availableOrderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#28a745',
    },
    orderInfo: {
        flex: 1,
    },
    orderTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    amountText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
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
    customerSection: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    customerDetails: {
        flex: 1,
        marginLeft: 8,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    customerPhone: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    addressContainer: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    itemsSection: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    itemsSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    orderItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    orderItemName: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    orderItemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
        marginLeft: 10,
    },
    orderActions: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 15,
        marginTop: 10,
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
    refreshButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 15,
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default OrdersScreen;