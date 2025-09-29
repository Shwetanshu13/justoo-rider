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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { orderAPI } from '../services/orderAPI';

const OrdersScreen = () => {
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const statusFilters = [
        { label: 'All', value: null },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Preparing', value: 'preparing' },
        { label: 'Ready', value: 'ready' },
        { label: 'Out for Delivery', value: 'out_for_delivery' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
    ];

    const loadOrders = async (page = 1, status = selectedStatus, showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const params = { page, limit: 10 };
            if (status) {
                params.status = status;
            }

            const response = await orderAPI.getAssignedOrders(params);

            if (response.success) {
                if (page === 1) {
                    setOrders(response.orders);
                } else {
                    setOrders(prev => [...prev, ...response.orders]);
                }
                setPagination(response.pagination);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            Alert.alert('Error', 'Failed to load orders. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadOrders(1, selectedStatus);
        }, [selectedStatus])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadOrders(1, selectedStatus, false);
    };

    const handleStatusFilter = (status) => {
        setSelectedStatus(status);
        setCurrentPage(1);
        // loadOrders will be called by useEffect when selectedStatus changes
    };

    const handleOrderPress = (order) => {
        navigation.navigate('OrderDetails', { orderId: order.id });
    };

    const loadMoreOrders = () => {
        if (pagination?.hasNext && !loading) {
            loadOrders(currentPage + 1, selectedStatus, false);
        }
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
                    📍 {item.deliveryAddress.street}, {item.deliveryAddress.city}
                </Text>
            )}
        </TouchableOpacity>
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

    if (loading && orders.length === 0) {
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
                <Text style={styles.title}>My Orders</Text>
            </View>

            {renderStatusFilter()}

            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.ordersList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                onEndReached={loadMoreOrders}
                onEndReachedThreshold={0.1}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>📦</Text>
                        <Text style={styles.emptyTitle}>No orders found</Text>
                        <Text style={styles.emptySubtitle}>
                            {selectedStatus ? 'No orders with selected status' : 'You don\'t have any assigned orders yet'}
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    pagination?.hasNext ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color="#007AFF" />
                            <Text style={styles.loadingMoreText}>Loading more orders...</Text>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    loadingMore: {
        padding: 20,
        alignItems: 'center',
    },
    loadingMoreText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
});

export default OrdersScreen;