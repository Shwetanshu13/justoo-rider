import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import CurrentOrdersScreen from "../screens/CurrentOrdersScreen";
import CompletedOrdersScreen from "../screens/CompletedOrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import DeliveryScreen from "../screens/DeliveryScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import RiderDashboardScreen from "../screens/RiderDashboardScreen";
import AssignedOrdersScreen from "../screens/AssignedOrdersScreen";
import ShiftManagementScreen from "../screens/ShiftManagementScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const insets = useSafeAreaInsets();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === "Dashboard") {
                        iconName = focused ? "home" : "home-outline";
                    } else if (route.name === "AssignedOrders") {
                        iconName = focused ? "list-circle" : "list-circle-outline";
                    } else if (route.name === "CurrentOrders") {
                        iconName = focused ? "list" : "list-outline";
                    } else if (route.name === "Shifts") {
                        iconName = focused ? "time" : "time-outline";
                    } else if (route.name === "Profile") {
                        iconName = focused ? "person" : "person-outline";
                    }

                    return (
                        <Ionicons name={iconName} size={size} color={color} />
                    );
                },
                tabBarActiveTintColor: "#007AFF",
                tabBarInactiveTintColor: "gray",
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopWidth: 1,
                    borderTopColor: "#e0e0e0",
                    paddingBottom: Math.max(insets.bottom - 4, 6),
                    paddingTop: 5,
                    height: 60 + Math.max(insets.bottom - 4, 0),
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "600",
                },
                headerShown: false, // Remove the header as requested
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={RiderDashboardScreen}
                options={{
                    tabBarLabel: "Dashboard",
                }}
            />
            <Tab.Screen
                name="AssignedOrders"
                component={AssignedOrdersScreen}
                options={{
                    tabBarLabel: "Assigned",
                }}
            />
            <Tab.Screen
                name="CurrentOrders"
                component={CurrentOrdersScreen}
                options={{
                    tabBarLabel: "Current",
                }}
            />
            <Tab.Screen
                name="Shifts"
                component={ShiftManagementScreen}
                options={{
                    tabBarLabel: "Shifts",
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: "Profile",
                }}
            />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
