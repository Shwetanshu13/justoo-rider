import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import DeliveryHistoryScreen from '../screens/DeliveryHistoryScreen';
// Import components

const RootStack = createStackNavigator();
const MainStack = createStackNavigator();
const TabNav = createBottomTabNavigator();

const AuthStack = () => (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Login" component={LoginScreen} />
    </RootStack.Navigator>
);

const MainTabNavigator = () => {
    const insets = useSafeAreaInsets();

    return (
        <TabNav.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#e0e0e0',
                    paddingBottom: Math.max(10, insets.bottom),
                    paddingTop: 6,
                    height: 60 + insets.bottom,
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#666',
            }}
        >
            <TabNav.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ color, fontSize: size }}>🏠</Text>
                    ),
                }}
            />
            <TabNav.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                    tabBarLabel: 'Orders',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ color, fontSize: size }}>📦</Text>
                    ),
                }}
            />
            <TabNav.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ color, fontSize: size }}>⚙️</Text>
                    ),
                }}
            />
        </TabNav.Navigator>
    );
};

const MainStackNavigator = () => (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
        <MainStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <MainStack.Screen name="DeliveryHistory" component={DeliveryHistoryScreen} />
    </MainStack.Navigator>
);

const AppNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        // You could return a loading screen here
        return null;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <MainStackNavigator /> : <AuthStack />}
        </NavigationContainer>
    );
};

export default AppNavigator;