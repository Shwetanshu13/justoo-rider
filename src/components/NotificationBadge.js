import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationBadge = ({ children }) => {
    const { notificationCount } = useNotifications();

    return (
        <View style={styles.container}>
            {children}
            {notificationCount.unread > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {notificationCount.unread > 99 ? '99+' : notificationCount.unread.toString()}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default NotificationBadge;