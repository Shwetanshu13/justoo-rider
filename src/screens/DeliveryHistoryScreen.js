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
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import deliveryAPI from '../services/deliveryAPI';

const DeliveryHistoryScreen = () => {
    const navigation = useNavigation();
    const { user } = useContext(AuthContext);
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, completed, failed

    useEffect(() => {
        loadDeliveries();
    }, [filter]);

    const loadDeliveries = async () => {
        try {
            setLoading(true);

            const response = await deliveryAPI.getDeliveryHistory({
                status: filter === 'all' ? undefined : filter,
            });

            if (response.success) {
                setDeliveries(response.data?.deliveries || []);
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (error) {
            console.error('Error loading deliveries:', error);
            Alert.alert('Error', 'Failed to load delivery history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadDeliveries();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#28a745';
            case 'failed': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'failed': return 'Failed';
            default: return status;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (amount) => {
        return `₹${(amount || 0).toLocaleString()}`;
    };

    const renderDeliveryItem = ({ item }) => (
        <TouchableOpacity
            style={styles.deliveryItem}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.orderId })}
        >
            <View style={styles.deliveryHeader}>
                <Text style={styles.orderId}>Order #{item.orderId}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusBadgeText}>{getStatusText(item.status)}</Text>
                </View>
            </View>

            <View style={styles.deliveryDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Delivered to:</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                        {item.customerName || 'N/A'}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValue}>{formatCurrency(item.orderAmount)}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Completed:</Text>
                    <Text style={styles.detailValue}>{formatDate(item.completedAt)}</Text>
                </View>

                {item.deliveryNotes && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Notes:</Text>
                        <Text style={styles.detailValue} numberOfLines={2}>
                            {item.deliveryNotes}
                        </Text>
                    </View>
                )}
            </View>
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

    if (loading && deliveries.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading delivery history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                {renderFilterButton('all', 'All')}
                {renderFilterButton('completed', 'Completed')}
                {renderFilterButton('failed', 'Failed')}
            </View>

            {/* Delivery List */}
            <FlatList
                data={deliveries}
                renderItem={renderDeliveryItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No deliveries found</Text>
                        <Text style={styles.emptySubtext}>
                            {filter === 'all' ? 'You haven\'t completed any deliveries yet' :
                                filter === 'completed' ? 'No completed deliveries found' :
                                    'No failed deliveries found'}
                        </Text>
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
    deliveryItem: {
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
    deliveryHeader: {
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
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    deliveryDetails: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        flex: 2,
        textAlign: 'right',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});

export default DeliveryHistoryScreen;