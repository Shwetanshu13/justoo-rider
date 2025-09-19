import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import CurrentOrdersScreen from "../screens/CurrentOrdersScreen";
import CompletedOrdersScreen from "../screens/CompletedOrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const insets = useSafeAreaInsets();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === "CurrentOrders") {
                        iconName = focused ? "list" : "list-outline";
                    } else if (route.name === "CompletedOrders") {
                        iconName = focused
                            ? "checkmark-circle"
                            : "checkmark-circle-outline";
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
                    fontSize: 12,
                    fontWeight: "600",
                },
                headerShown: false, // Remove the header as requested
            })}
        >
            <Tab.Screen
                name="CurrentOrders"
                component={CurrentOrdersScreen}
                options={{
                    tabBarLabel: "Current Orders",
                }}
            />
            <Tab.Screen
                name="CompletedOrders"
                component={CompletedOrdersScreen}
                options={{
                    tabBarLabel: "Completed",
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
