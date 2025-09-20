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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ApiService from "../services/ApiService";
import { SafeAreaView } from "react-native-safe-area-context";

const DeliveryScreen = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDeliveries = async (showLoading = true) => {
        if (showLoading) setLoading(true);

        try {
            const result = await ApiService.getDeliveries();
            if (result.success) {
                setDeliveries(result.data);
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to load deliveries");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDeliveries(false);
    };

    const updateDeliveryStatus = async (deliveryId, newStatus) => {
        try {
            const result = await ApiService.updateDeliveryStatus(deliveryId, newStatus);
            if (result.success) {
                Alert.alert("Success", "Delivery status updated successfully");
                loadDeliveries(false);
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update delivery status");
        }
    };

    const handleStatusUpdate = (deliveryId, currentStatus) => {
        const statusOptions = [
            { label: "Mark as Picked Up", value: "picked_up" },
            { label: "Mark as In Transit", value: "in_transit" },
            { label: "Mark as Delivered", value: "delivered" },
        ];

        const availableOptions = statusOptions.filter((option) => {
            if (currentStatus === "assigned") return true;
            if (currentStatus === "picked_up" && option.value !== "picked_up") return true;
            if (currentStatus === "in_transit" && option.value === "delivered") return true;
            return false;
        });

        if (availableOptions.length === 0) {
            Alert.alert("Info", "No status updates available for this delivery");
            return;
        }

        Alert.alert("Update Delivery Status", "Select new status:", [
            ...availableOptions.map((option) => ({
                text: option.label,
                onPress: () => updateDeliveryStatus(deliveryId, option.value),
            })),
            { text: "Cancel", style: "cancel" },
        ]);
    };

    useFocusEffect(
        useCallback(() => {
            loadDeliveries();
        }, [])
    );

    const renderDeliveryItem = ({ item }) => (
        <View style={styles.deliveryCard}>
            <View style={styles.deliveryHeader}>
                <Text style={styles.deliveryId}>Delivery #{item.id}</Text>
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

            <View style={styles.deliveryDetails}>
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

            <TouchableOpacity
                style={styles.updateButton}
                onPress={() => handleStatusUpdate(item.id, item.status)}
            >
                <Text style={styles.updateButtonText}>Update Status</Text>
            </TouchableOpacity>
        </View>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case "assigned":
                return "#FFA500";
            case "picked_up":
                return "#007AFF";
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
                <Text style={styles.loadingText}>Loading deliveries...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <Text style={styles.pageTitle}>My Deliveries</Text>
            {deliveries.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        No deliveries assigned
                    </Text>
                    <Text style={styles.emptySubText}>
                        Pull down to refresh
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={deliveries}
                    renderItem={renderDeliveryItem}
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
    deliveryCard: {
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
    deliveryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    deliveryId: {
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
    deliveryDetails: {
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
    updateButton: {
        backgroundColor: "#007AFF",
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
    },
    updateButtonText: {
        color: "#fff",
        fontSize: 16,
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
});

export default DeliveryScreen;