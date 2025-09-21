import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import ApiService from "../services/ApiService";

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(user);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [editedProfile, setEditedProfile] = useState({});
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const lastFetchedRef = useRef(0);
    const fetchingRef = useRef(false);

    const shallowEqual = (a, b) => {
        if (a === b) return true;
        if (!a || !b) return false;
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) return false;
        for (const k of aKeys) {
            if (a[k] !== b[k]) return false;
        }
        return true;
    };

    const loadProfile = useCallback(
        async (showLoading = true) => {
            if (fetchingRef.current) return; // guard concurrent
            const now = Date.now();
            // Debounce auto fetches (allow manual refresh via pull-to-refresh)
            if (!showLoading && now - lastFetchedRef.current < 5000) return; // 5s throttle
            fetchingRef.current = true;
            if (showLoading) setLoading(true);
            try {
                const result = await ApiService.getRiderProfile();
                if (result.success && result.data) {
                    if (!shallowEqual(profile, result.data)) {
                        setProfile(result.data);
                        if (__DEV__)
                            console.log("[Profile] Updated profile from API");
                    } else if (__DEV__) {
                        console.log("[Profile] Skipped update (no changes)");
                    }
                } else if (!profile && user) {
                    setProfile(user);
                }
            } catch (error) {
                if (__DEV__) console.log("[Profile] loadProfile error", error);
                if (!profile && user) setProfile(user);
            } finally {
                lastFetchedRef.current = Date.now();
                fetchingRef.current = false;
                setLoading(false);
                setRefreshing(false);
            }
        },
        [profile, user]
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadProfile(false); // showLoading false to avoid spinner overlay
    };

    const handleLogout = () => {
        Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Logout",
                style: "destructive",
                onPress: logout,
            },
        ]);
    };

    const openEditModal = () => {
        setEditedProfile({
            name: profile?.name || "",
            email: profile?.email || "",
            phone: profile?.phone || "",
            license_number: profile?.license_number || "",
            vehicle_number: profile?.vehicle_number || "",
        });
        setEditModalVisible(true);
    };

    const saveProfile = async () => {
        try {
            const result = await ApiService.updateRiderProfile(editedProfile);
            if (result.success) {
                setProfile({ ...profile, ...editedProfile });
                setEditModalVisible(false);
                Alert.alert("Success", "Profile updated successfully");
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update profile");
        }
    };

    const openChangePassword = () => {
        setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setChangePasswordVisible(true);
    };

    const changePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            Alert.alert("Error", "Please fill in all password fields");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            Alert.alert("Error", "New passwords don't match");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            Alert.alert("Error", "New password must be at least 6 characters long");
            return;
        }

        try {
            const result = await ApiService.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            );
            if (result.success) {
                setChangePasswordVisible(false);
                Alert.alert("Success", "Password changed successfully");
            } else {
                Alert.alert("Error", result.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to change password");
        }
    };

    useEffect(() => {
        // Initialize with user context data once
        if (user && !profile) {
            setProfile(user);
        }
    }, [user, profile]);

    // Load when screen gains focus (throttled)
    useFocusEffect(
        useCallback(() => {
            loadProfile(true);
            return () => { };
        }, [loadProfile])
    );

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString();
    };

    const formatPhoneNumber = (phone) => {
        if (!phone) return "N/A";
        return phone.toString().replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    };

    if (loading && !profile) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading profile...</Text>
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
                <Text style={styles.pageTitle}>Profile</Text>

                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {profile?.name
                                    ? profile.name.charAt(0).toUpperCase()
                                    : "R"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.profileInfo}>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Name</Text>
                            <Text style={styles.value}>
                                {profile?.name || "N/A"}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>
                                {profile?.email || "N/A"}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Phone</Text>
                            <Text style={styles.value}>
                                {formatPhoneNumber(profile?.phone)}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Rider ID</Text>
                            <Text style={styles.value}>
                                #{profile?.id || "N/A"}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Status</Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor:
                                            profile?.status === "active"
                                                ? "#28A745"
                                                : "#6C757D",
                                    },
                                ]}
                            >
                                <Text style={styles.statusText}>
                                    {profile?.status
                                        ? profile.status.toUpperCase()
                                        : "UNKNOWN"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>License Number</Text>
                            <Text style={styles.value}>
                                {profile?.license_number || "N/A"}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Vehicle Number</Text>
                            <Text style={styles.value}>
                                {profile?.vehicle_number || "N/A"}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Joined Date</Text>
                            <Text style={styles.value}>
                                {formatDate(profile?.created_at)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Statistics Card */}
                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>Statistics</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>
                                {profile?.total_orders || 0}
                            </Text>
                            <Text style={styles.statLabel}>Total Orders</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>
                                {profile?.completed_orders || 0}
                            </Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>
                                {profile?.average_rating || "N/A"}
                            </Text>
                            <Text style={styles.statLabel}>Avg Rating</Text>
                        </View>
                    </View>
                </View>

                {/* Profile Actions */}
                <View style={styles.actionsCard}>
                    <Text style={styles.statsTitle}>Profile Actions</Text>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={openEditModal}
                    >
                        <Text style={styles.actionText}>Edit Profile</Text>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={openChangePassword}
                    >
                        <Text style={styles.actionText}>Change Password</Text>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => Alert.alert("Info", "Contact support feature coming soon")}
                    >
                        <Text style={styles.actionText}>Contact Support</Text>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Pull down to refresh profile information
                    </Text>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editedProfile.name}
                                onChangeText={(text) =>
                                    setEditedProfile({ ...editedProfile, name: text })
                                }
                                placeholder="Enter your name"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={editedProfile.email}
                                onChangeText={(text) =>
                                    setEditedProfile({ ...editedProfile, email: text })
                                }
                                placeholder="Enter your email"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={editedProfile.phone}
                                onChangeText={(text) =>
                                    setEditedProfile({ ...editedProfile, phone: text })
                                }
                                placeholder="Enter your phone"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>License Number</Text>
                            <TextInput
                                style={styles.input}
                                value={editedProfile.license_number}
                                onChangeText={(text) =>
                                    setEditedProfile({ ...editedProfile, license_number: text })
                                }
                                placeholder="Enter license number"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Vehicle Number</Text>
                            <TextInput
                                style={styles.input}
                                value={editedProfile.vehicle_number}
                                onChangeText={(text) =>
                                    setEditedProfile({ ...editedProfile, vehicle_number: text })
                                }
                                placeholder="Enter vehicle number"
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={saveProfile}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                visible={changePasswordVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setChangePasswordVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Change Password</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Current Password</Text>
                            <TextInput
                                style={styles.input}
                                value={passwordData.currentPassword}
                                onChangeText={(text) =>
                                    setPasswordData({ ...passwordData, currentPassword: text })
                                }
                                placeholder="Enter current password"
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>New Password</Text>
                            <TextInput
                                style={styles.input}
                                value={passwordData.newPassword}
                                onChangeText={(text) =>
                                    setPasswordData({ ...passwordData, newPassword: text })
                                }
                                placeholder="Enter new password"
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Confirm New Password</Text>
                            <TextInput
                                style={styles.input}
                                value={passwordData.confirmPassword}
                                onChangeText={(text) =>
                                    setPasswordData({ ...passwordData, confirmPassword: text })
                                }
                                placeholder="Confirm new password"
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setChangePasswordVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={changePassword}
                            >
                                <Text style={styles.saveButtonText}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    profileCard: {
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
    avatarContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#007AFF",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
    },
    profileInfo: {
        gap: 16,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    label: {
        fontSize: 16,
        color: "#666",
        fontWeight: "500",
    },
    value: {
        fontSize: 16,
        color: "#333",
        fontWeight: "600",
        flex: 1,
        textAlign: "right",
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
    statsTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 16,
        textAlign: "center",
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    statItem: {
        alignItems: "center",
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#007AFF",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
    },
    logoutButton: {
        backgroundColor: "#DC3545",
        borderRadius: 12,
        margin: 20,
        marginTop: 0,
        padding: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logoutButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
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
    actionItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    actionText: {
        fontSize: 16,
        color: "#333",
    },
    actionArrow: {
        fontSize: 18,
        color: "#007AFF",
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
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: "#f9f9f9",
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    cancelButton: {
        backgroundColor: "#6C757D",
    },
    saveButton: {
        backgroundColor: "#007AFF",
    },
    cancelButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default ProfileScreen;
