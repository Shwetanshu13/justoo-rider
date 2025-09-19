import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Resolve a backend URL that works across emulator, device, and dev client.
// Priority:
// 1. Explicit env var EXPO_PUBLIC_RIDER_BACKEND_URL
// 2. Derive from Expo packager host (LAN) if available
// 3. Fallback to localhost (mapped for Android emulator)
function resolveBackendBaseUrl() {
    let raw = process.env.EXPO_PUBLIC_RIDER_BACKEND_URL;

    if (!raw || raw.trim() === "") {
        // Try to infer from debugger / Metro host
        try {
            // For Expo SDK 49+, hostUri may be under Constants.expoConfig.hostUri
            const hostUri =
                Constants.expoConfig?.hostUri ||
                Constants.manifest2?.extra?.expoClient?.hostUri ||
                Constants.manifest?.debuggerHost;
            if (hostUri && hostUri.includes(":")) {
                const host = hostUri.split(":")[0];
                raw = `http://${host}:3006`;
            }
        } catch (e) {
            // silent fallback
        }
    }

    if (!raw) {
        raw = "http://localhost:3006";
    }

    // If running on Android emulator, replace localhost with 10.0.2.2
    if (
        Platform.OS === "android" &&
        /^(http:\/\/)(localhost|127\.0\.0\.1)/.test(raw)
    ) {
        raw = raw.replace(/localhost|127\.0\.0\.1/, "10.0.2.2");
    }

    return raw.replace(/\/$/, ""); // remove trailing slash if any
}

const BACKEND_URL = resolveBackendBaseUrl();

// Optional: expose for debugging
if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[ApiService] Using backend base URL:", BACKEND_URL);
}

class ApiService {
    async getAuthToken() {
        return await AsyncStorage.getItem("authToken");
    }

    async makeAuthenticatedRequest(endpoint, options = {}) {
        const token = await this.getAuthToken();

        const headers = {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        const url = `${BACKEND_URL}${endpoint}`;
        if (__DEV__) {
            console.log(`[ApiService] Request ${url}`, options.method || "GET");
        }
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Token expired or invalid
            throw new Error("Authentication required");
        }

        return response;
    }

    // Get current orders assigned to the rider
    async getCurrentOrders() {
        try {
            const response = await this.makeAuthenticatedRequest(
                "/api/orders/current"
            );
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.orders || [] };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch current orders",
                };
            }
        } catch (error) {
            console.error("Get current orders error", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Get completed orders by the rider
    async getCompletedOrders(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (filters.startDate)
                queryParams.append("startDate", filters.startDate);
            if (filters.endDate) queryParams.append("endDate", filters.endDate);
            if (filters.month) queryParams.append("month", filters.month);
            if (filters.year) queryParams.append("year", filters.year);

            const endpoint = `/api/orders/completed${
                queryParams.toString() ? `?${queryParams.toString()}` : ""
            }`;
            const response = await this.makeAuthenticatedRequest(endpoint);
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.orders || [] };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch completed orders",
                };
            }
        } catch (error) {
            console.error("Get completed orders error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Update order status
    async updateOrderStatus(orderId, status) {
        try {
            const response = await this.makeAuthenticatedRequest(
                `/api/orders/${orderId}/status`,
                {
                    method: "PUT",
                    body: JSON.stringify({ status }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to update order status",
                };
            }
        } catch (error) {
            console.error("Update order status error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Get rider profile
    async getRiderProfile() {
        try {
            const response = await this.makeAuthenticatedRequest(
                "/api/auth/profile"
            );
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch profile",
                };
            }
        } catch (error) {
            console.error("Get rider profile error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }
}

export default new ApiService();
