import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import ApiService from "../services/ApiService";
import { useAuth } from "../context/AuthContext";

const RiderDashboardScreen = () => {
    const { user } = useAuth();
    const [availability, setAvailability] = useState(user?.available || false);
    const [earnings, setEarnings] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboardData = async (showLoading = true) => {
        if (showLoading) setLoading(true);

        try {
            // Load earnings for current month
            const currentDate = new Date();
            const filters = {
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear(),
            };

            const earningsResult = await ApiService.getRiderEarnings(filters);
            if (earningsResult.success) {
                setEarnings(earningsResult.data);
            }

            // Set availability from user data
            if (user) {
                setAvailability(user.available || false);
            }
        } catch (error) {
            console.error("Load dashboard data error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData(false);
    };

    const toggleAvailability = async () => {
        try {
            const newAvailability = !availability;
            const result = await ApiService.updateRiderAvailability(newAvailability);

            if (result.success) {
                setAvailability(newAvailability);
                Alert.alert(
                    "Success",
                    `You are now ${newAvailability ? "available" : "unavailable"} for deliveries`
                );
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update availability");
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [user])
    );

    const formatCurrency = (amount) => {
        return `₹${(amount || 0).toLocaleString()}`;
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <Text style={styles.pageTitle}>Dashboard</Text>

                {/* Availability Toggle */}
                <View style={styles.availabilityCard}>
                    <Text style={styles.cardTitle}>Availability Status</Text>
                    <View style={styles.availabilityContent}>
                        <Text style={styles.availabilityText}>
                            You are currently {availability ? "available" : "unavailable"}
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.availabilityButton,
                                availability ? styles.availableButton : styles.unavailableButton
                            ]}
                            onPress={toggleAvailability}
                        >
                            <Text style={styles.availabilityButtonText}>
                                {availability ? "Go Offline" : "Go Online"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Earnings Summary */}
                <View style={styles.earningsCard}>
                    <Text style={styles.cardTitle}>This Month's Earnings</Text>
                    <View style={styles.earningsGrid}>
                        <View style={styles.earningItem}>
                            <Text style={styles.earningAmount}>
                                {formatCurrency(earnings.total_earnings)}
                            </Text>
                            <Text style={styles.earningLabel}>Total Earnings</Text>
                        </View>
                        <View style={styles.earningItem}>
                            <Text style={styles.earningAmount}>
                                {earnings.total_deliveries || 0}
                            </Text>
                            <Text style={styles.earningLabel}>Deliveries</Text>
                        </View>
                        <View style={styles.earningItem}>
                            <Text style={styles.earningAmount}>
                                {formatCurrency(earnings.average_per_delivery)}
                            </Text>
                            <Text style={styles.earningLabel}>Avg/Delivery</Text>
                        </View>
                        <View style={styles.earningItem}>
                            <Text style={styles.earningAmount}>
                                {earnings.total_distance || 0} km
                            </Text>
                            <Text style={styles.earningLabel}>Distance</Text>
                        </View>
                    </View>
                </View>

                {/* Performance Stats */}
                <View style={styles.statsCard}>
                    <Text style={styles.cardTitle}>Performance</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {earnings.rating || "N/A"}
                            </Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {earnings.on_time_percentage || 0}%
                            </Text>
                            <Text style={styles.statLabel}>On Time</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {earnings.completion_rate || 0}%
                            </Text>
                            <Text style={styles.statLabel}>Completion</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsCard}>
                    <Text style={styles.cardTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>View Today's Orders</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Contact Support</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Update Location</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>View Earnings History</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Pull down to refresh dashboard data
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    scrollContent: {
        paddingBottom: 40,
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
    pageTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        padding: 20,
        paddingBottom: 10,
    },
    availabilityCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        margin: 20,
        marginTop: 10,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 16,
    },
    availabilityContent: {
        alignItems: "center",
    },
    availabilityText: {
        fontSize: 16,
        color: "#666",
        marginBottom: 16,
    },
    availabilityButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        minWidth: 120,
        alignItems: "center",
    },
    availableButton: {
        backgroundColor: "#28A745",
    },
    unavailableButton: {
        backgroundColor: "#DC3545",
    },
    availabilityButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    earningsCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        margin: 20,
        marginTop: 0,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    earningsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    earningItem: {
        width: "48%",
        alignItems: "center",
        marginBottom: 16,
    },
    earningAmount: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#28A745",
        marginBottom: 4,
    },
    earningLabel: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
    },
    statsCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        margin: 20,
        marginTop: 0,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    statItem: {
        alignItems: "center",
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#007AFF",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: "#666",
    },
    actionsCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        margin: 20,
        marginTop: 0,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    actionButton: {
        width: "48%",
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e9ecef",
    },
    actionButtonText: {
        fontSize: 14,
        color: "#495057",
        fontWeight: "500",
        textAlign: "center",
    },
    footer: {
        padding: 20,
        alignItems: "center",
    },
    footerText: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
    },
});

export default RiderDashboardScreen;