import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ApiService from "../services/ApiService";
import { SafeAreaView } from "react-native-safe-area-context";

const AssignedOrdersScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);

    const loadAssignedOrders = async (showLoading = true) => {
        if (showLoading) setLoading(true);

        try {
            const result = await ApiService.getAssignedOrders();
            if (result.success) {
                setOrders(result.data);
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to load assigned orders");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadAssignedOrders(false);
    };

    const acceptOrder = async (orderId) => {
        try {
            const result = await ApiService.acceptOrder(orderId);
            if (result.success) {
                Alert.alert("Success", "Order accepted successfully");
                loadAssignedOrders(false);
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to accept order");
        }
    };

    const rejectOrder = async (orderId, reason = "") => {
        try {
            const result = await ApiService.rejectOrder(orderId, reason);
            if (result.success) {
                Alert.alert("Success", "Order rejected");
                loadAssignedOrders(false);
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to reject order");
        }
    };

    const handleOrderAction = (order, action) => {
        if (action === "accept") {
            Alert.alert(
                "Accept Order",
                `Do you want to accept order #${order.id}?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Accept", onPress: () => acceptOrder(order.id) },
                ]
            );
        } else if (action === "reject") {
            Alert.alert(
                "Reject Order",
                "Why are you rejecting this order?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Too Far", onPress: () => rejectOrder(order.id, "Too far") },
                    { text: "Vehicle Issue", onPress: () => rejectOrder(order.id, "Vehicle issue") },
                    { text: "Other", onPress: () => rejectOrder(order.id, "Other reason") },
                ]
            );
        } else if (action === "details") {
            setSelectedOrder(order);
            setOrderDetailsVisible(true);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const result = await ApiService.updateOrderStatus(orderId, newStatus);
            if (result.success) {
                Alert.alert("Success", "Order status updated successfully");
                loadAssignedOrders(false);
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update order status");
        }
    };

    const handleStatusUpdate = (orderId, currentStatus) => {
        const statusOptions = [
            { label: "Mark as Picked Up", value: "picked_up" },
            { label: "Mark as In Transit", value: "in_transit" },
            { label: "Mark as Delivered", value: "delivered" },
        ];

        const availableOptions = statusOptions.filter((option) => {
            if (currentStatus === "assigned") return true;
            if (currentStatus === "accepted") return true;
            if (currentStatus === "picked_up" && option.value !== "picked_up") return true;
            if (currentStatus === "in_transit" && option.value === "delivered") return true;
            return false;
        });

        if (availableOptions.length === 0) {
            Alert.alert("Info", "No status updates available for this order");
            return;
        }

        Alert.alert("Update Order Status", "Select new status:", [
            ...availableOptions.map((option) => ({
                text: option.label,
                onPress: () => updateOrderStatus(orderId, option.value),
            })),
            { text: "Cancel", style: "cancel" },
        ]);
    };

    useFocusEffect(
        useCallback(() => {
            loadAssignedOrders();
        }, [])
    );

    const renderOrderItem = ({ item }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) },
                    ]}
                >
                    <Text style={styles.statusText}>
                        {item.status?.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <Text style={styles.customer}>
                    Customer: {item.customer_name}
                </Text>
                <Text style={styles.phone}>Phone: {item.customer_phone}</Text>
                <Text style={styles.address}>
                    Pickup: {item.pickup_address}
                </Text>
                <Text style={styles.address}>
                    Delivery: {item.delivery_address}
                </Text>
                <Text style={styles.amount}>Amount: ₹{item.total_amount}</Text>
                <Text style={styles.time}>
                    Created: {new Date(item.created_at).toLocaleString()}
                </Text>
                {item.estimated_delivery_time && (
                    <Text style={styles.estimatedTime}>
                        ETA: {new Date(item.estimated_delivery_time).toLocaleString()}
                    </Text>
                )}
            </View>

            <View style={styles.actionButtons}>
                {item.status === "assigned" && (
                    <>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handleOrderAction(item, "accept")}
                        >
                            <Text style={styles.acceptButtonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleOrderAction(item, "reject")}
                        >
                            <Text style={styles.rejectButtonText}>Reject</Text>
                        </TouchableOpacity>
                    </>
                )}
                {(item.status === "accepted" || item.status === "picked_up" || item.status === "in_transit") && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.updateButton]}
                        onPress={() => handleStatusUpdate(item.id, item.status)}
                    >
                        <Text style={styles.updateButtonText}>Update Status</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.actionButton, styles.detailsButton]}
                    onPress={() => handleOrderAction(item, "details")}
                >
                    <Text style={styles.detailsButtonText}>Details</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderOrderDetailsModal = () => (
        <Modal
            visible={orderDetailsVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setOrderDetailsVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Order Details</Text>

                    {selectedOrder && (
                        <View style={styles.modalOrderDetails}>
                            <Text style={styles.modalDetailText}>
                                Order ID: #{selectedOrder.id}
                            </Text>
                            <Text style={styles.modalDetailText}>
                                Customer: {selectedOrder.customer_name}
                            </Text>
                            <Text style={styles.modalDetailText}>
                                Phone: {selectedOrder.customer_phone}
                            </Text>
                            <Text style={styles.modalDetailText}>
                                Status: {selectedOrder.status?.toUpperCase()}
                            </Text>
                            <Text style={styles.modalDetailText}>
                                Amount: ₹{selectedOrder.total_amount}
                            </Text>
                            <Text style={styles.modalDetailText}>
                                Pickup: {selectedOrder.pickup_address}
                            </Text>
                            <Text style={styles.modalDetailText}>
                                Delivery: {selectedOrder.delivery_address}
                            </Text>
                            {selectedOrder.special_instructions && (
                                <Text style={styles.modalDetailText}>
                                    Instructions: {selectedOrder.special_instructions}
                                </Text>
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setOrderDetailsVisible(false)}
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case "assigned":
                return "#FFA500";
            case "accepted":
                return "#007AFF";
            case "picked_up":
                return "#17A2B8";
            case "in_transit":
                return "#34C759";
            case "delivered":
                return "#28A745";
            default:
                return "#6C757D";
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading assigned orders...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <Text style={styles.pageTitle}>Assigned Orders</Text>
            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        No orders assigned
                    </Text>
                    <Text style={styles.emptySubText}>
                        Pull down to refresh
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                    contentContainerStyle={styles.listContainer}
                />
            )}
            {renderOrderDetailsModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        padding: 20,
        paddingBottom: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
    },
    listContainer: {
        padding: 20,
        paddingTop: 10,
    },
    orderCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    orderId: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
    },
    orderDetails: {
        marginBottom: 16,
    },
    customer: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    phone: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    address: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    amount: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#28A745",
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
        color: "#999",
        marginBottom: 4,
    },
    estimatedTime: {
        fontSize: 12,
        color: "#FF9500",
        fontWeight: "500",
    },
    actionButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    actionButton: {
        flex: 1,
        minWidth: 80,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignItems: "center",
    },
    acceptButton: {
        backgroundColor: "#28A745",
    },
    rejectButton: {
        backgroundColor: "#DC3545",
    },
    updateButton: {
        backgroundColor: "#007AFF",
    },
    detailsButton: {
        backgroundColor: "#6C757D",
    },
    acceptButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    rejectButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    updateButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    detailsButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: 18,
        color: "#666",
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: "#999",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        width: "90%",
        maxHeight: "80%",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 20,
        textAlign: "center",
    },
    modalOrderDetails: {
        marginBottom: 20,
    },
    modalDetailText: {
        fontSize: 16,
        color: "#333",
        marginBottom: 8,
        lineHeight: 24,
    },
    closeButton: {
        backgroundColor: "#007AFF",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default AssignedOrdersScreen;