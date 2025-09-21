import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import ApiService from "../services/ApiService";

const ShiftManagementScreen = () => {
    const [shifts, setShifts] = useState([]);
    const [currentShift, setCurrentShift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [shiftActionLoading, setShiftActionLoading] = useState(false);

    const loadShiftData = async (showLoading = true) => {
        if (showLoading) setLoading(true);

        try {
            // Get recent shifts
            const shiftsResult = await ApiService.getRiderShifts({
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
                endDate: new Date().toISOString().split('T')[0],
            });

            if (shiftsResult.success) {
                setShifts(shiftsResult.data);
                // Find current active shift
                const activeShift = shiftsResult.data.find(shift => shift.status === 'active');
                setCurrentShift(activeShift || null);
            }
        } catch (error) {
            console.error("Load shift data error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadShiftData(false);
    };

    const startShift = async () => {
        setShiftActionLoading(true);
        try {
            const result = await ApiService.startShift();
            if (result.success) {
                Alert.alert("Success", "Shift started successfully");
                loadShiftData(false);
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to start shift");
        } finally {
            setShiftActionLoading(false);
        }
    };

    const endShift = async () => {
        Alert.alert(
            "End Shift",
            "Are you sure you want to end your current shift?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "End Shift", onPress: confirmEndShift, style: "destructive" },
            ]
        );
    };

    const confirmEndShift = async () => {
        setShiftActionLoading(true);
        try {
            const result = await ApiService.endShift();
            if (result.success) {
                Alert.alert("Success", "Shift ended successfully");
                loadShiftData(false);
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to end shift");
        } finally {
            setShiftActionLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadShiftData();
        }, [])
    );

    const formatDuration = (start, end) => {
        if (!start) return "N/A";
        const startTime = new Date(start);
        const endTime = end ? new Date(end) : new Date();
        const diffMs = endTime - startTime;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleTimeString();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString();
    };

    const renderShiftItem = ({ item }) => (
        <View style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
                <Text style={styles.shiftDate}>{formatDate(item.start_time)}</Text>
                <View
                    style={[
                        styles.shiftStatusBadge,
                        { backgroundColor: item.status === 'active' ? '#28A745' : '#6C757D' },
                    ]}
                >
                    <Text style={styles.shiftStatusText}>
                        {item.status?.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.shiftDetails}>
                <Text style={styles.shiftTime}>
                    Start: {formatTime(item.start_time)}
                </Text>
                {item.end_time && (
                    <Text style={styles.shiftTime}>
                        End: {formatTime(item.end_time)}
                    </Text>
                )}
                <Text style={styles.shiftDuration}>
                    Duration: {formatDuration(item.start_time, item.end_time)}
                </Text>
                {item.total_deliveries !== undefined && (
                    <Text style={styles.shiftStats}>
                        Deliveries: {item.total_deliveries}
                    </Text>
                )}
                {item.total_earnings && (
                    <Text style={styles.shiftEarnings}>
                        Earnings: ₹{item.total_earnings}
                    </Text>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading shift data...</Text>
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
                <Text style={styles.pageTitle}>Shift Management</Text>

                {/* Current Shift Status */}
                <View style={styles.currentShiftCard}>
                    <Text style={styles.cardTitle}>Current Shift</Text>

                    {currentShift ? (
                        <View style={styles.currentShiftDetails}>
                            <Text style={styles.currentShiftText}>
                                Started: {formatTime(currentShift.start_time)}
                            </Text>
                            <Text style={styles.currentShiftText}>
                                Duration: {formatDuration(currentShift.start_time, null)}
                            </Text>
                            {currentShift.total_deliveries !== undefined && (
                                <Text style={styles.currentShiftText}>
                                    Deliveries: {currentShift.total_deliveries}
                                </Text>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.noShiftText}>
                            No active shift
                        </Text>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.shiftButton,
                            currentShift ? styles.endShiftButton : styles.startShiftButton,
                            shiftActionLoading && styles.disabledButton,
                        ]}
                        onPress={currentShift ? endShift : startShift}
                        disabled={shiftActionLoading}
                    >
                        {shiftActionLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.shiftButtonText}>
                                {currentShift ? "End Shift" : "Start Shift"}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Shift History */}
                <View style={styles.historyCard}>
                    <Text style={styles.cardTitle}>Recent Shifts</Text>

                    {shifts.length === 0 ? (
                        <Text style={styles.noHistoryText}>
                            No shift history available
                        </Text>
                    ) : (
                        <FlatList
                            data={shifts.slice(0, 10)} // Show last 10 shifts
                            renderItem={renderShiftItem}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                {/* Shift Guidelines */}
                <View style={styles.guidelinesCard}>
                    <Text style={styles.cardTitle}>Shift Guidelines</Text>
                    <View style={styles.guidelinesList}>
                        <Text style={styles.guidelineItem}>
                            • Start your shift when you're ready to accept orders
                        </Text>
                        <Text style={styles.guidelineItem}>
                            • Keep your location services enabled during shifts
                        </Text>
                        <Text style={styles.guidelineItem}>
                            • End your shift when you finish work for the day
                        </Text>
                        <Text style={styles.guidelineItem}>
                            • You can only have one active shift at a time
                        </Text>
                        <Text style={styles.guidelineItem}>
                            • Earnings are calculated per completed shift
                        </Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Pull down to refresh shift data
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
    currentShiftCard: {
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
    currentShiftDetails: {
        marginBottom: 20,
    },
    currentShiftText: {
        fontSize: 16,
        color: "#666",
        marginBottom: 8,
    },
    noShiftText: {
        fontSize: 16,
        color: "#999",
        textAlign: "center",
        marginBottom: 20,
    },
    shiftButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: "center",
    },
    startShiftButton: {
        backgroundColor: "#28A745",
    },
    endShiftButton: {
        backgroundColor: "#DC3545",
    },
    disabledButton: {
        backgroundColor: "#999",
    },
    shiftButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    historyCard: {
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
    noHistoryText: {
        fontSize: 16,
        color: "#999",
        textAlign: "center",
        marginTop: 10,
    },
    shiftCard: {
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e9ecef",
    },
    shiftHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    shiftDate: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    shiftStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    shiftStatusText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    shiftDetails: {
        gap: 4,
    },
    shiftTime: {
        fontSize: 14,
        color: "#666",
    },
    shiftDuration: {
        fontSize: 14,
        color: "#007AFF",
        fontWeight: "500",
    },
    shiftStats: {
        fontSize: 14,
        color: "#333",
    },
    shiftEarnings: {
        fontSize: 14,
        color: "#28A745",
        fontWeight: "600",
    },
    guidelinesCard: {
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
    guidelinesList: {
        gap: 8,
    },
    guidelineItem: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
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

export default ShiftManagementScreen;