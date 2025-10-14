import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const SettingsScreen = () => {
    const { user, updateRiderPassword, updateRiderStatus, logout } = useAuth();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    const statusOptions = [
        { value: 'active', label: 'Active', color: '#28a745', description: 'Available for deliveries' },
        { value: 'busy', label: 'Busy', color: '#ffc107', description: 'Currently on a delivery' },
        { value: 'inactive', label: 'Inactive', color: '#dc3545', description: 'Not available' },
    ];

    const handleStatusChange = async (newStatus) => {
        if (newStatus === user?.status) return;

        Alert.alert(
            'Change Status',
            `Are you sure you want to change your status to "${statusOptions.find(s => s.value === newStatus)?.label}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const result = await updateRiderStatus(newStatus);
                            if (result.success) {
                                Alert.alert('Success', result.message);
                            } else {
                                Alert.alert('Error', result.message);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update status. Please try again.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters long');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const result = await updateRiderPassword(passwordData.currentPassword, passwordData.newPassword);
            if (result.success) {
                Alert.alert('Success', result.message);
                setShowPasswordModal(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to change password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error) {
                            console.error('Logout error:', error);
                        }
                    }
                }
            ]
        );
    };

    const currentStatus = statusOptions.find(s => s.value === user?.status) || statusOptions[0];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            {/* Status Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Status</Text>
                <View style={[styles.statusCard, { borderLeftColor: currentStatus.color }]}>
                    <View style={styles.statusInfo}>
                        <Text style={styles.statusLabel}>{currentStatus.label}</Text>
                        <Text style={styles.statusDescription}>{currentStatus.description}</Text>
                    </View>
                    <View style={[styles.statusIndicator, { backgroundColor: currentStatus.color }]} />
                </View>

                <Text style={styles.sectionSubtitle}>Change Status</Text>
                {statusOptions.map((status) => (
                    <TouchableOpacity
                        key={status.value}
                        style={[
                            styles.statusOption,
                            user?.status === status.value && styles.statusOptionActive
                        ]}
                        onPress={() => handleStatusChange(status.value)}
                        disabled={loading}
                    >
                        <View style={styles.statusOptionContent}>
                            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                            <View style={styles.statusTextContainer}>
                                <Text style={styles.statusOptionLabel}>{status.label}</Text>
                                <Text style={styles.statusOptionDescription}>{status.description}</Text>
                            </View>
                        </View>
                        {user?.status === status.value && (
                            <Text style={styles.currentStatusText}>Current</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Account Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>

                <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => setShowPasswordModal(true)}
                >
                    <View style={styles.settingItemContent}>
                        <Text style={styles.settingItemTitle}>Change Password</Text>
                        <Text style={styles.settingItemSubtitle}>Update your account password</Text>
                    </View>
                    <Text style={styles.settingItemArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.settingItem, styles.logoutItem]}
                    onPress={handleLogout}
                >
                    <View style={styles.settingItemContent}>
                        <Text style={[styles.settingItemTitle, styles.logoutText]}>Logout</Text>
                        <Text style={styles.settingItemSubtitle}>Sign out of your account</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Password Change Modal */}
            <Modal
                visible={showPasswordModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Change Password</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Current Password</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={passwordData.currentPassword}
                                onChangeText={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
                                secureTextEntry
                                placeholder="Enter current password"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>New Password</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={passwordData.newPassword}
                                onChangeText={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
                                secureTextEntry
                                placeholder="Enter new password"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirm New Password</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={passwordData.confirmPassword}
                                onChangeText={(value) => setPasswordData(prev => ({ ...prev, confirmPassword: value }))}
                                secureTextEntry
                                placeholder="Confirm new password"
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelModalButton]}
                                onPress={() => {
                                    setShowPasswordModal(false);
                                    setPasswordData({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: '',
                                    });
                                }}
                            >
                                <Text style={styles.cancelModalButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmModalButton, loading && styles.confirmModalButtonDisabled]}
                                onPress={handlePasswordChange}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.confirmModalButtonText}>Change Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
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
    sectionSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginTop: 20,
        marginBottom: 10,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        borderLeftWidth: 4,
        marginBottom: 15,
    },
    statusInfo: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statusDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        marginBottom: 8,
    },
    statusOptionActive: {
        backgroundColor: '#e3f2fd',
        borderColor: '#007AFF',
        borderWidth: 1,
    },
    statusOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusOptionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    statusOptionDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    currentStatusText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingItemContent: {
        flex: 1,
    },
    settingItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    settingItemSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    settingItemArrow: {
        fontSize: 20,
        color: '#ccc',
    },
    logoutItem: {
        borderBottomWidth: 0,
        marginTop: 10,
    },
    logoutText: {
        color: '#dc3545',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelModalButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelModalButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmModalButton: {
        backgroundColor: '#007AFF',
    },
    confirmModalButtonDisabled: {
        backgroundColor: '#ccc',
    },
    confirmModalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SettingsScreen;