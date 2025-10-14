import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import orderAPI from '../services/orderAPI';
import deliveryAPI from '../services/deliveryAPI';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
    const navigation = useNavigation();
    const { user, riderStats, refreshRiderStats, updateRiderStatus } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [loadingCurrentOrder, setLoadingCurrentOrder] = useState(false);
    const [deliveryStats, setDeliveryStats] = useState(null);
    const [loadingDeliveryStats, setLoadingDeliveryStats] = useState(false);
    const [deliveryStatsError, setDeliveryStatsError] = useState(false);

    useEffect(() => {
        // Load stats when component mounts
        refreshRiderStats();
        loadCurrentOrder();
        loadDeliveryStats();
    }, []);

    const loadCurrentOrder = async () => {
        try {
            setLoadingCurrentOrder(true);
            const response = await orderAPI.getCurrentOrder();
            if (response.success) {
                setCurrentOrder(response.order);
            } else {
                setCurrentOrder(null);
            }
        } catch (error) {
            console.error('Error loading current order:', error);
            setCurrentOrder(null);
        } finally {
            setLoadingCurrentOrder(false);
        }
    };

    const loadDeliveryStats = async () => {
        try {
            setLoadingDeliveryStats(true);
            setDeliveryStatsError(false);
            const response = await deliveryAPI.getDeliveryStats();
            if (response.success) {
                setDeliveryStats(response.data);
            } else {
                setDeliveryStatsError(true);
            }
        } catch (error) {
            console.error('Error loading delivery stats:', error);
            setDeliveryStatsError(true);
        } finally {
            setLoadingDeliveryStats(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshRiderStats();
        await loadCurrentOrder();
        await loadDeliveryStats();
        setRefreshing(false);
    };

    const handleStatusToggle = async () => {
        const newStatus = user?.status === 'active' ? 'inactive' : 'active';
        setStatusLoading(true);
        try {
            await updateRiderStatus(newStatus);
        } catch (error) {
            console.error('Status update error:', error);
        } finally {
            setStatusLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `₹${(amount || 0).toLocaleString()}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#28a745';
            case 'busy': return '#ffc107';
            case 'inactive': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Active';
            case 'busy': return 'Busy';
            case 'inactive': return 'Inactive';
            default: return 'Unknown';
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {user?.name || 'Rider'}!</Text>
                    <Text style={styles.subtitle}>Ready for deliveries today?</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user?.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(user?.status)}</Text>
                </View>
            </View>

            {/* Current Order */}
            {loadingCurrentOrder ? (
                <View style={styles.currentOrderSection}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading current order...</Text>
                </View>
            ) : currentOrder ? (
                <View style={styles.currentOrderSection}>
                    <Text style={styles.sectionTitle}>Current Order</Text>
                    <TouchableOpacity
                        style={styles.currentOrderCard}
                        onPress={() => navigation.navigate('OrderDetails', { orderId: currentOrder.id })}
                    >
                        <View style={styles.orderHeader}>
                            <Text style={styles.orderId}>Order #{currentOrder.id}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentOrder.status) }]}>
                                <Text style={styles.statusText}>{getStatusText(currentOrder.status)}</Text>
                            </View>
                        </View>
                        <Text style={styles.orderAmount}>{formatCurrency(currentOrder.totalAmount)}</Text>
                        {currentOrder.deliveryAddress && (
                            <Text style={styles.deliveryAddress} numberOfLines={1}>
                                📍 {currentOrder.deliveryAddress.street}, {currentOrder.deliveryAddress.city}
                            </Text>
                        )}
                        <Text style={styles.viewDetailsText}>Tap to view details →</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
                <Text style={styles.sectionTitle}>Today's Performance</Text>

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{riderStats?.todayDeliveries || 0}</Text>
                        <Text style={styles.statLabel}>Deliveries Today</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{formatCurrency(riderStats?.totalEarnings)}</Text>
                        <Text style={styles.statLabel}>Total Earnings</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Overall Statistics</Text>

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{riderStats?.totalDeliveries || 0}</Text>
                        <Text style={styles.statLabel}>Total Deliveries</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{riderStats?.completedDeliveries || 0}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{riderStats?.averageRating?.toFixed(1) || '5.0'}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                </View>

                {/* Delivery Statistics */}
                {loadingDeliveryStats ? (
                    <View style={styles.loadingStats}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.loadingText}>Loading delivery stats...</Text>
                    </View>
                ) : deliveryStatsError ? (
                    <View style={styles.errorStats}>
                        <Text style={styles.errorText}>Delivery stats unavailable</Text>
                        <Text style={styles.errorSubtext}>Backend service may be updating</Text>
                    </View>
                ) : deliveryStats ? (
                    <View>
                        <Text style={styles.sectionTitle}>Delivery Performance</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{deliveryStats.totalDeliveries || 0}</Text>
                                <Text style={styles.statLabel}>Total Deliveries</Text>
                            </View>

                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{deliveryStats.completedDeliveries || 0}</Text>
                                <Text style={styles.statLabel}>Completed</Text>
                            </View>

                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{deliveryStats.failedDeliveries || 0}</Text>
                                <Text style={styles.statLabel}>Failed</Text>
                            </View>

                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>
                                    {deliveryStats.totalDeliveries > 0
                                        ? `${((deliveryStats.completedDeliveries / deliveryStats.totalDeliveries) * 100).toFixed(1)}%`
                                        : '0%'
                                    }
                                </Text>
                                <Text style={styles.statLabel}>Success Rate</Text>
                            </View>
                        </View>
                    </View>
                ) : null}
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Orders')}
                    >
                        <Text style={styles.actionIcon}>📦</Text>
                        <Text style={styles.actionText}>View Orders</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('DeliveryHistory')}
                    >
                        <Text style={styles.actionIcon}>📋</Text>
                        <Text style={styles.actionText}>Delivery History</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Text style={styles.actionIcon}>🔔</Text>
                        <Text style={styles.actionText}>Notifications</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <Text style={styles.actionIcon}>📞</Text>
                        <Text style={styles.actionText}>Support</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    statusSection: {
        backgroundColor: '#fff',
        margin: 10,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    statusToggle: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        minWidth: 120,
        alignItems: 'center',
    },
    statusToggleText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    currentOrderSection: {
        backgroundColor: '#fff',
        margin: 10,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
    },
    currentOrderCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        width: '100%',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    orderAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 5,
    },
    deliveryAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    viewDetailsText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
        textAlign: 'right',
    },
    loadingStats: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    errorStats: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginHorizontal: 10,
        marginBottom: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    errorSubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    statsContainer: {
        backgroundColor: '#fff',
        margin: 10,
        borderRadius: 12,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        margin: 5,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    actionsContainer: {
        backgroundColor: '#fff',
        margin: 10,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 20,
        marginBottom: 10,
        alignItems: 'center',
    },
    actionIcon: {
        fontSize: 30,
        marginBottom: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
});

export default HomeScreen;