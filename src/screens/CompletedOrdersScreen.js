import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ApiService from "../services/ApiService";
import { SafeAreaView } from "react-native-safe-area-context";

const CompletedOrdersScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [currentFilters, setCurrentFilters] = useState({});

    const filterOptions = [
        { label: "All Orders", value: "all" },
        { label: "Today", value: "today" },
        { label: "This Week", value: "week" },
        { label: "This Month", value: "month" },
        { label: "Last Month", value: "lastMonth" },
        { label: "Last 3 Months", value: "last3Months" },
    ];

    const getFilterParams = (filterType) => {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        switch (filterType) {
            case "today":
                return {
                    startDate: today.toISOString().split("T")[0],
                    endDate: today.toISOString().split("T")[0],
                };
            case "week":
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                return {
                    startDate: weekStart.toISOString().split("T")[0],
                    endDate: today.toISOString().split("T")[0],
                };
            case "month":
                return {
                    month: now.getMonth() + 1,
                    year: now.getFullYear(),
                };
            case "lastMonth":
                const lastMonth = new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1
                );
                return {
                    month: lastMonth.getMonth() + 1,
                    year: lastMonth.getFullYear(),
                };
            case "last3Months":
                const threeMonthsAgo = new Date(
                    now.getFullYear(),
                    now.getMonth() - 3,
                    1
                );
                return {
                    startDate: threeMonthsAgo.toISOString().split("T")[0],
                    endDate: today.toISOString().split("T")[0],
                };
            default:
                return {};
        }
    };

    const loadCompletedOrders = async (showLoading = true, filters = {}) => {
        if (showLoading) setLoading(true);

        try {
            const result = await ApiService.getCompletedOrders(filters);
            if (result.success) {
                setOrders(result.data);
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to load orders");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadCompletedOrders(false, currentFilters);
    };

    const applyFilter = (filterType) => {
        const filters = getFilterParams(filterType);
        setCurrentFilters(filters);
        setSelectedFilter(filterType);
        setFilterModalVisible(false);
        loadCompletedOrders(true, filters);
    };

    useFocusEffect(
        useCallback(() => {
            loadCompletedOrders();
        }, [])
    );

    const renderOrderItem = ({ item }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>COMPLETED</Text>
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
                    Completed:{" "}
                    {new Date(
                        item.completed_at || item.updated_at
                    ).toLocaleString()}
                </Text>
                {item.rating && (
                    <Text style={styles.rating}>
                        Rating: {"⭐".repeat(item.rating)} ({item.rating}/5)
                    </Text>
                )}
            </View>
        </View>
    );

    const renderFilterModal = () => (
        <Modal
            visible={filterModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setFilterModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Filter Orders</Text>

                    {filterOptions.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.filterOption,
                                selectedFilter === option.value &&
                                    styles.selectedFilterOption,
                            ]}
                            onPress={() => applyFilter(option.value)}
                        >
                            <Text
                                style={[
                                    styles.filterOptionText,
                                    selectedFilter === option.value &&
                                        styles.selectedFilterOptionText,
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setFilterModalVisible(false)}
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <View style={styles.header}>
                <Text style={styles.pageTitle}>Completed Orders</Text>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Text style={styles.filterButtonText}>Filter</Text>
                </TouchableOpacity>
            </View>

            {selectedFilter !== "all" && (
                <View style={styles.activeFilterContainer}>
                    <Text style={styles.activeFilterText}>
                        Filter:{" "}
                        {
                            filterOptions.find(
                                (f) => f.value === selectedFilter
                            )?.label
                        }
                    </Text>
                    <TouchableOpacity onPress={() => applyFilter("all")}>
                        <Text style={styles.clearFilterText}>Clear</Text>
                    </TouchableOpacity>
                </View>
            )}

            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        No completed orders found
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

            {renderFilterModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        paddingBottom: 10,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
    },
    filterButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    activeFilterContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#E3F2FD",
        marginHorizontal: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 10,
    },
    activeFilterText: {
        fontSize: 14,
        color: "#1976D2",
        fontWeight: "500",
    },
    clearFilterText: {
        fontSize: 14,
        color: "#1976D2",
        fontWeight: "600",
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
        backgroundColor: "#28A745",
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
        marginBottom: 8,
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
    rating: {
        fontSize: 14,
        color: "#FF9500",
        fontWeight: "500",
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
        width: "80%",
        maxHeight: "80%",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 20,
        textAlign: "center",
    },
    filterOption: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: "#f5f5f5",
    },
    selectedFilterOption: {
        backgroundColor: "#007AFF",
    },
    filterOptionText: {
        fontSize: 16,
        color: "#333",
        textAlign: "center",
    },
    selectedFilterOptionText: {
        color: "#fff",
        fontWeight: "600",
    },
    closeButton: {
        backgroundColor: "#6C757D",
        padding: 12,
        borderRadius: 8,
        marginTop: 20,
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
});

export default CompletedOrdersScreen;
