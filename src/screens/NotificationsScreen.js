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
    Switch,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ApiService from "../services/ApiService";
import { SafeAreaView } from "react-native-safe-area-context";

const NotificationsScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [preferencesVisible, setPreferencesVisible] = useState(false);
    const [preferences, setPreferences] = useState({});

    const loadNotifications = async (showLoading = true) => {
        if (showLoading) setLoading(true);

        try {
            // Load notifications and unread count in parallel
            const [notificationsResult, unreadResult] = await Promise.all([
                ApiService.getNotifications(),
                ApiService.getUnreadNotificationsCount(),
            ]);

            if (notificationsResult.success) {
                setNotifications(notificationsResult.data);
            } else {
                Alert.alert("Error", notificationsResult.error);
            }

            if (unreadResult.success) {
                setUnreadCount(unreadResult.data);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to load notifications");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadPreferences = async () => {
        try {
            const result = await ApiService.getNotificationPreferences();
            if (result.success) {
                setPreferences(result.data);
            }
        } catch (error) {
            console.error("Load preferences error:", error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications(false);
    };

    const markAsRead = async (notificationId) => {
        try {
            const result = await ApiService.markNotificationAsRead(notificationId);
            if (result.success) {
                // Update the notification locally
                setNotifications(prev =>
                    prev.map(notification =>
                        notification.id === notificationId
                            ? { ...notification, read: true }
                            : notification
                    )
                );
                // Update unread count
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to mark notification as read");
        }
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0) {
            Alert.alert("Info", "All notifications are already read");
            return;
        }

        try {
            const result = await ApiService.markAllNotificationsAsRead();
            if (result.success) {
                // Update all notifications locally
                setNotifications(prev =>
                    prev.map(notification => ({ ...notification, read: true }))
                );
                setUnreadCount(0);
                Alert.alert("Success", "All notifications marked as read");
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to mark all notifications as read");
        }
    };

    const deleteNotification = async (notificationId) => {
        Alert.alert(
            "Delete Notification",
            "Are you sure you want to delete this notification?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => confirmDelete(notificationId) },
            ]
        );
    };

    const confirmDelete = async (notificationId) => {
        try {
            const result = await ApiService.deleteNotification(notificationId);
            if (result.success) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                Alert.alert("Success", "Notification deleted");
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to delete notification");
        }
    };

    const updatePreferences = async (newPreferences) => {
        try {
            const result = await ApiService.updateNotificationPreferences(newPreferences);
            if (result.success) {
                setPreferences(newPreferences);
                Alert.alert("Success", "Notification preferences updated");
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update preferences");
        }
    };

    const openPreferences = () => {
        loadPreferences();
        setPreferencesVisible(true);
    };

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [])
    );

    const renderNotificationItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                !item.read && styles.unreadNotification
            ]}
            onPress={() => !item.read && markAsRead(item.id)}
            onLongPress={() => deleteNotification(item.id)}
        >
            <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                {!item.read && <View style={styles.unreadDot} />}
            </View>

            <Text style={styles.notificationMessage}>{item.message}</Text>

            <View style={styles.notificationFooter}>
                <Text style={styles.notificationTime}>
                    {new Date(item.created_at).toLocaleString()}
                </Text>
                <Text style={styles.notificationType}>
                    {item.type?.toUpperCase()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderPreferencesModal = () => (
        <Modal
            visible={preferencesVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setPreferencesVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Notification Preferences</Text>

                    <View style={styles.preferencesList}>
                        <View style={styles.preferenceItem}>
                            <Text style={styles.preferenceLabel}>New Orders</Text>
                            <Switch
                                value={preferences.new_orders || true}
                                onValueChange={(value) =>
                                    updatePreferences({ ...preferences, new_orders: value })
                                }
                            />
                        </View>

                        <View style={styles.preferenceItem}>
                            <Text style={styles.preferenceLabel}>Order Updates</Text>
                            <Switch
                                value={preferences.order_updates || true}
                                onValueChange={(value) =>
                                    updatePreferences({ ...preferences, order_updates: value })
                                }
                            />
                        </View>

                        <View style={styles.preferenceItem}>
                            <Text style={styles.preferenceLabel}>Earnings Updates</Text>
                            <Switch
                                value={preferences.earnings_updates || true}
                                onValueChange={(value) =>
                                    updatePreferences({ ...preferences, earnings_updates: value })
                                }
                            />
                        </View>

                        <View style={styles.preferenceItem}>
                            <Text style={styles.preferenceLabel}>System Announcements</Text>
                            <Switch
                                value={preferences.system_announcements || true}
                                onValueChange={(value) =>
                                    updatePreferences({ ...preferences, system_announcements: value })
                                }
                            />
                        </View>

                        <View style={styles.preferenceItem}>
                            <Text style={styles.preferenceLabel}>Push Notifications</Text>
                            <Switch
                                value={preferences.push_notifications || true}
                                onValueChange={(value) =>
                                    updatePreferences({ ...preferences, push_notifications: value })
                                }
                            />
                        </View>

                        <View style={styles.preferenceItem}>
                            <Text style={styles.preferenceLabel}>SMS Notifications</Text>
                            <Switch
                                value={preferences.sms_notifications || false}
                                onValueChange={(value) =>
                                    updatePreferences({ ...preferences, sms_notifications: value })
                                }
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setPreferencesVisible(false)}
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const getUnreadCount = () => {
        return unreadCount;
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <View style={styles.header}>
                <Text style={styles.pageTitle}>Notifications</Text>
                <View style={styles.headerActions}>
                    {getUnreadCount() > 0 && (
                        <TouchableOpacity
                            style={styles.markAllButton}
                            onPress={markAllAsRead}
                        >
                            <Text style={styles.markAllButtonText}>
                                Mark All Read ({getUnreadCount()})
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.preferencesButton}
                        onPress={openPreferences}
                    >
                        <Text style={styles.preferencesButtonText}>⚙️</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        No notifications yet
                    </Text>
                    <Text style={styles.emptySubText}>
                        Pull down to refresh
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotificationItem}
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

            {renderPreferencesModal()}
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
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    preferencesButton: {
        padding: 8,
    },
    preferencesButtonText: {
        fontSize: 20,
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
    preferencesList: {
        marginBottom: 20,
    },
    preferenceItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    preferenceLabel: {
        fontSize: 16,
        color: "#333",
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
    },
    markAllButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    markAllButtonText: {
        color: "#fff",
        fontSize: 12,
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
    notificationCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    unreadNotification: {
        borderLeftWidth: 4,
        borderLeftColor: "#007AFF",
        backgroundColor: "#F0F8FF",
    },
    notificationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#007AFF",
    },
    notificationMessage: {
        fontSize: 14,
        color: "#666",
        marginBottom: 12,
        lineHeight: 20,
    },
    notificationFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    notificationTime: {
        fontSize: 12,
        color: "#999",
    },
    notificationType: {
        fontSize: 10,
        color: "#007AFF",
        fontWeight: "bold",
        backgroundColor: "#E3F2FD",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
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

export default NotificationsScreen;