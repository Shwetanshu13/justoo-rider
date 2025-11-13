import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { orderAPI } from '../services/orderAPI';
import { deliveryAPI } from '../services/deliveryAPI';

const OrderDetailsScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { orderId } = route.params;

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadOrderDetails();
    }, [orderId]);

    const loadOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await orderAPI.getOrderDetails(orderId);

            console.log('Order Details Response:', JSON.stringify(response, null, 2));

            if (response.success) {
                console.log('Order loaded:', response.order);
                console.log('Order items:', response.order.items);
                setOrder(response.order);
            } else {
                Alert.alert('Error', response.message);
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error loading order details:', error);
            Alert.alert('Error', 'Failed to load order details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        const statusMessages = {
            'confirmed': 'Mark order as confirmed?',
            'preparing': 'Mark order as preparing?',
            'ready': 'Mark order as ready for pickup?',
            'out_for_delivery': 'Mark order as out for delivery?',
            'delivered': 'Mark order as delivered?',
        };

        Alert.alert(
            'Update Status',
            statusMessages[newStatus] || 'Update order status?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            setUpdating(true);
                            const response = await orderAPI.updateOrderStatus(orderId, newStatus);

                            if (response.success) {
                                setOrder(prev => ({ ...prev, status: newStatus }));
                                Alert.alert('Success', 'Order status updated successfully');

                                // If order is delivered, go back to orders list
                                if (newStatus === 'delivered') {
                                    navigation.goBack();
                                }
                            } else {
                                Alert.alert('Error', response.message);
                            }
                        } catch (error) {
                            console.error('Error updating status:', error);
                            Alert.alert('Error', 'Failed to update order status');
                        } finally {
                            setUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    const handleStartDelivery = async () => {
        Alert.alert(
            'Start Delivery',
            'Are you sure you want to start delivery for this order?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start Delivery',
                    onPress: async () => {
                        try {
                            setUpdating(true);
                            const response = await deliveryAPI.startDelivery(orderId);

                            if (response.success) {
                                setOrder(prev => ({ ...prev, status: 'out_for_delivery' }));
                                Alert.alert('Success', 'Delivery started successfully');
                            } else {
                                Alert.alert('Error', response.message);
                            }
                        } catch (error) {
                            console.error('Error starting delivery:', error);
                            Alert.alert('Error', 'Failed to start delivery');
                        } finally {
                            setUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCompleteDelivery = async () => {
        Alert.alert(
            'Complete Delivery',
            'Has the order been successfully delivered to the customer?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Complete Delivery',
                    onPress: async () => {
                        try {
                            setUpdating(true);
                            const response = await deliveryAPI.completeDelivery(orderId, {
                                deliveryNotes: 'Delivered successfully',
                            });

                            if (response.success) {
                                setOrder(prev => ({ ...prev, status: 'delivered' }));
                                Alert.alert('Success', 'Delivery completed successfully');
                                navigation.goBack();
                            } else {
                                Alert.alert('Error', response.message);
                            }
                        } catch (error) {
                            console.error('Error completing delivery:', error);
                            Alert.alert('Error', 'Failed to complete delivery');
                        } finally {
                            setUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    const handleFailDelivery = async () => {
        const failureReasons = [
            'Customer not available',
            'Wrong address',
            'Customer refused delivery',
            'Damaged during transit',
            'Other',
        ];

        Alert.alert(
            'Delivery Failed',
            'Please select the reason for delivery failure:',
            failureReasons.map(reason => ({
                text: reason,
                onPress: async () => {
                    try {
                        setUpdating(true);
                        const response = await deliveryAPI.failDelivery(orderId, reason);

                        if (response.success) {
                            setOrder(prev => ({ ...prev, status: 'failed' }));
                            Alert.alert('Delivery Failed', `Order marked as failed: ${reason}`);
                            navigation.goBack();
                        } else {
                            Alert.alert('Error', response.message);
                        }
                    } catch (error) {
                        console.error('Error marking delivery as failed:', error);
                        Alert.alert('Error', 'Failed to mark delivery as failed');
                    } finally {
                        setUpdating(false);
                    }
                }
            })).concat([{ text: 'Cancel', style: 'cancel' }])
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
            case 'ready': return 'Ready for Pickup';
            case 'out_for_delivery': return 'Out for Delivery';
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const getNextStatusOptions = (currentStatus) => {
        const statusFlow = {
            'confirmed': ['preparing'],
            'preparing': ['ready'],
            'ready': ['out_for_delivery'],
            'out_for_delivery': ['delivered'],
        };

        return statusFlow[currentStatus] || [];
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (amount) => {
        return `₹${(amount || 0).toLocaleString()}`;
    };

    const renderOrderItem = ({ item }) => (
        <View style={styles.orderItem}>
            <View style={styles.itemHeader}>
                <View style={styles.itemNameContainer}>
                    <Text style={styles.itemQuantityBadge}>{item.quantity}x</Text>
                    <Text style={styles.itemName}>{item.itemName || item.name}</Text>
                </View>
                <View style={styles.itemPriceContainer}>
                    <Text style={styles.itemPrice}>
                        {formatCurrency(parseFloat(item.totalPrice || (item.unitPrice || item.price) * item.quantity))}
                    </Text>
                    <Text style={styles.itemUnitPrice}>
                        ({formatCurrency(parseFloat(item.unitPrice || item.price))} each)
                    </Text>
                </View>
            </View>
            {item.specialInstructions && (
                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsIcon}>📝</Text>
                    <Text style={styles.itemInstructions}>{item.specialInstructions}</Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Order not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const nextStatuses = getNextStatusOptions(order.status);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Order #{order.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusBadgeText}>{getStatusText(order.status)}</Text>
                </View>
            </View>

            {/* Customer Information */}
            {order.customerName && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Customer Information</Text>
                    <View style={styles.customerInfoContainer}>
                        <Text style={styles.customerIcon}>👤</Text>
                        <View style={styles.customerDetailsBox}>
                            <Text style={styles.customerNameText}>{order.customerName}</Text>
                            {order.customerPhone && (
                                <View style={styles.phoneRow}>
                                    <Text style={styles.phoneIcon}>📞</Text>
                                    <Text style={styles.customerPhoneText}>{order.customerPhone}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            )}

            {/* Order Summary */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal:</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(order.subtotal || 0)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(order.deliveryFee || 0)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax:</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(order.taxAmount || 0)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Amount:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Order Placed:</Text>
                    <Text style={styles.summaryValue}>{formatDate(order.orderPlacedAt)}</Text>
                </View>
                {order.estimatedDeliveryTime && (
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Estimated Delivery:</Text>
                        <Text style={styles.summaryValue}>{formatDate(order.estimatedDeliveryTime)}</Text>
                    </View>
                )}
                {order.actualDeliveryTime && (
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Actual Delivery:</Text>
                        <Text style={styles.summaryValue}>{formatDate(order.actualDeliveryTime)}</Text>
                    </View>
                )}
            </View>

            {/* Delivery Address */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                {order.deliveryAddress ? (
                    <View style={styles.addressContainer}>
                        <Text style={styles.addressIcon}>📍</Text>
                        <View style={styles.addressDetails}>
                            <Text style={styles.addressText}>
                                {order.deliveryAddress.fullAddress ||
                                    `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.pincode}`}
                            </Text>
                            {order.deliveryAddress.landmark && (
                                <View style={styles.landmarkRow}>
                                    <Text style={styles.landmarkIcon}>📌</Text>
                                    <Text style={styles.landmarkText}>
                                        {order.deliveryAddress.landmark}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                ) : (
                    <Text style={styles.noAddress}>No delivery address available</Text>
                )}
            </View>

            {/* Order Items */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Items</Text>
                <FlatList
                    data={order.items || []}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                />
            </View>

            {/* Status Update Actions */}
            {nextStatuses.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Update Status</Text>
                    {nextStatuses.map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.statusButton, { backgroundColor: getStatusColor(status) }]}
                            onPress={() => handleStatusUpdate(status)}
                            disabled={updating}
                        >
                            {updating ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.statusButtonText}>
                                    Mark as {getStatusText(status)}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Delivery Actions */}
            {(order.status === 'ready' || order.status === 'out_for_delivery') && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Actions</Text>
                    {order.status === 'ready' && (
                        <TouchableOpacity
                            style={[styles.deliveryButton, { backgroundColor: '#28a745' }]}
                            onPress={handleStartDelivery}
                            disabled={updating}
                        >
                            {updating ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.deliveryButtonIcon}>🚀</Text>
                                    <Text style={styles.deliveryButtonText}>Start Delivery</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    {order.status === 'out_for_delivery' && (
                        <View>
                            <TouchableOpacity
                                style={[styles.deliveryButton, { backgroundColor: '#28a745' }]}
                                onPress={handleCompleteDelivery}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.deliveryButtonIcon}>✅</Text>
                                        <Text style={styles.deliveryButtonText}>Complete Delivery</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.deliveryButton, { backgroundColor: '#dc3545' }]}
                                onPress={handleFailDelivery}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.deliveryButtonIcon}>❌</Text>
                                        <Text style={styles.deliveryButtonText}>Fail Delivery</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Special Instructions */}
            {order.specialInstructions && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Special Instructions</Text>
                    <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
                </View>
            )}
        </ScrollView>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
    },
    backButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        backgroundColor: '#fff',
        margin: 10,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    summaryLabel: {
        fontSize: 16,
        color: '#666',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    totalRow: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 10,
        marginTop: 5,
        borderRadius: 8,
        borderBottomWidth: 0,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    customerInfoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 8,
    },
    customerIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    customerDetailsBox: {
        flex: 1,
    },
    customerNameText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    phoneIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    customerPhoneText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    addressIcon: {
        fontSize: 20,
        marginRight: 10,
        marginTop: 2,
    },
    addressDetails: {
        flex: 1,
    },
    addressText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    noAddress: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
    },
    landmarkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: '#fff3cd',
        padding: 8,
        borderRadius: 6,
    },
    landmarkIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    landmarkText: {
        fontSize: 14,
        color: '#856404',
        fontWeight: '500',
    },
    orderItem: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    itemQuantityBadge: {
        backgroundColor: '#007AFF',
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    itemPriceContainer: {
        alignItems: 'flex-end',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    itemUnitPrice: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    instructionsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 10,
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 6,
    },
    instructionsIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    itemInstructions: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        flex: 1,
    },
    statusButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    statusButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deliveryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 10,
    },
    deliveryButtonIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    deliveryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    instructionsText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
});

export default OrderDetailsScreen;