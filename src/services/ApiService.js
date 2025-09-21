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

            const endpoint = `/api/orders/completed${queryParams.toString() ? `?${queryParams.toString()}` : ""
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

    // Get deliveries assigned to the rider
    async getDeliveries() {
        try {
            const response = await this.makeAuthenticatedRequest(
                "/api/deliveries"
            );
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.deliveries || [] };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch deliveries",
                };
            }
        } catch (error) {
            console.error("Get deliveries error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Update delivery status
    async updateDeliveryStatus(deliveryId, status, location = null) {
        try {
            const body = { status };
            if (location) {
                body.location = location;
            }

            const response = await this.makeAuthenticatedRequest(
                `/api/deliveries/${deliveryId}/status`,
                {
                    method: "PUT",
                    body: JSON.stringify(body),
                }
            );

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to update delivery status",
                };
            }
        } catch (error) {
            console.error("Update delivery status error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Get notifications for the rider
    async getNotifications() {
        try {
            const response = await this.makeAuthenticatedRequest(
                "/api/notifications"
            );
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.notifications || [] };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch notifications",
                };
            }
        } catch (error) {
            console.error("Get notifications error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        try {
            const response = await this.makeAuthenticatedRequest(
                `/api/notifications/${notificationId}/read`,
                {
                    method: "PUT",
                }
            );

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to mark notification as read",
                };
            }
        } catch (error) {
            console.error("Mark notification as read error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Update rider availability
    async updateRiderAvailability(available) {
        try {
            const response = await this.makeAuthenticatedRequest(
                "/api/rider/availability",
                {
                    method: "PUT",
                    body: JSON.stringify({ available }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to update availability",
                };
            }
        } catch (error) {
            console.error("Update rider availability error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Update rider location
    async updateRiderLocation(latitude, longitude) {
        try {
            const response = await this.makeAuthenticatedRequest(
                "/api/rider/location",
                {
                    method: "PUT",
                    body: JSON.stringify({ latitude, longitude }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to update location",
                };
            }
        } catch (error) {
            console.error("Update rider location error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Get rider earnings/summary
    async getRiderEarnings(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (filters.startDate) queryParams.append("startDate", filters.startDate);
            if (filters.endDate) queryParams.append("endDate", filters.endDate);
            if (filters.month) queryParams.append("month", filters.month);
            if (filters.year) queryParams.append("year", filters.year);

            const endpoint = `/api/rider/earnings${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
            const response = await this.makeAuthenticatedRequest(endpoint);
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.earnings || {} };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch earnings",
                };
            }
        } catch (error) {
            console.error("Get rider earnings error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // AUTH CONTROLLER METHODS
    // ========================

    // Register new rider (if supported)
    async registerRider(riderData) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(riderData),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Registration failed",
                };
            }
        } catch (error) {
            console.error("Register rider error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Refresh token
    async refreshToken() {
        try {
            const response = await this.makeAuthenticatedRequest("/api/auth/refresh", {
                method: "POST",
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Token refresh failed",
                };
            }
        } catch (error) {
            console.error("Refresh token error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Update rider profile
    async updateRiderProfile(profileData) {
        try {
            const response = await this.makeAuthenticatedRequest("/api/auth/profile", {
                method: "PUT",
                body: JSON.stringify(profileData),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Profile update failed",
                };
            }
        } catch (error) {
            console.error("Update profile error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.makeAuthenticatedRequest("/api/auth/change-password", {
                method: "PUT",
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Password change failed",
                };
            }
        } catch (error) {
            console.error("Change password error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // ORDER CONTROLLER METHODS
    // =========================

    // Get order details by ID
    async getOrderDetails(orderId) {
        try {
            const response = await this.makeAuthenticatedRequest(`/api/orders/${orderId}`);
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.order || data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch order details",
                };
            }
        } catch (error) {
            console.error("Get order details error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Accept an order
    async acceptOrder(orderId) {
        try {
            const response = await this.makeAuthenticatedRequest(`/api/orders/${orderId}/accept`, {
                method: "POST",
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to accept order",
                };
            }
        } catch (error) {
            console.error("Accept order error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Reject an order
    async rejectOrder(orderId, reason = "") {
        try {
            const response = await this.makeAuthenticatedRequest(`/api/orders/${orderId}/reject`, {
                method: "POST",
                body: JSON.stringify({ reason }),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to reject order",
                };
            }
        } catch (error) {
            console.error("Reject order error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Get assigned orders
    async getAssignedOrders() {
        try {
            const response = await this.makeAuthenticatedRequest("/api/orders/assigned");
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.orders || [] };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch assigned orders",
                };
            }
        } catch (error) {
            console.error("Get assigned orders error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // RIDER CONTROLLER METHODS
    // =========================

    // Get rider statistics
    async getRiderStats(period = "month") {
        try {
            const response = await this.makeAuthenticatedRequest(`/api/rider/stats?period=${period}`);
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.stats || {} };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch rider stats",
                };
            }
        } catch (error) {
            console.error("Get rider stats error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Update rider status
    async updateRiderStatus(status) {
        try {
            const response = await this.makeAuthenticatedRequest("/api/rider/status", {
                method: "PUT",
                body: JSON.stringify({ status }),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to update rider status",
                };
            }
        } catch (error) {
            console.error("Update rider status error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Get rider shift information
    async getRiderShifts(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.append("startDate", filters.startDate);
            if (filters.endDate) queryParams.append("endDate", filters.endDate);
            if (filters.status) queryParams.append("status", filters.status);

            const endpoint = `/api/rider/shifts${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
            const response = await this.makeAuthenticatedRequest(endpoint);
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.shifts || [] };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch shifts",
                };
            }
        } catch (error) {
            console.error("Get rider shifts error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Start shift
    async startShift() {
        try {
            const response = await this.makeAuthenticatedRequest("/api/rider/shift/start", {
                method: "POST",
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to start shift",
                };
            }
        } catch (error) {
            console.error("Start shift error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // End shift
    async endShift() {
        try {
            const response = await this.makeAuthenticatedRequest("/api/rider/shift/end", {
                method: "POST",
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to end shift",
                };
            }
        } catch (error) {
            console.error("End shift error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // DELIVERY CONTROLLER METHODS (Enhanced)
    // ========================================

    // Get delivery by ID
    async getDeliveryDetails(deliveryId) {
        try {
            const response = await this.makeAuthenticatedRequest(`/api/deliveries/${deliveryId}`);
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.delivery || data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch delivery details",
                };
            }
        } catch (error) {
            console.error("Get delivery details error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Upload delivery proof (photo, signature, etc.)
    async uploadDeliveryProof(deliveryId, proofData) {
        try {
            const formData = new FormData();
            if (proofData.photo) {
                formData.append("photo", proofData.photo);
            }
            if (proofData.signature) {
                formData.append("signature", proofData.signature);
            }
            if (proofData.notes) {
                formData.append("notes", proofData.notes);
            }

            const response = await this.makeAuthenticatedRequest(
                `/api/deliveries/${deliveryId}/proof`,
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        // Remove Content-Type to let browser set it for FormData
                        ...Object.fromEntries(
                            Object.entries(await this.getAuthHeaders()).filter(
                                ([key]) => key !== "Content-Type"
                            )
                        ),
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to upload delivery proof",
                };
            }
        } catch (error) {
            console.error("Upload delivery proof error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Get delivery route/navigation
    async getDeliveryRoute(deliveryId) {
        try {
            const response = await this.makeAuthenticatedRequest(`/api/deliveries/${deliveryId}/route`);
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.route || data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch delivery route",
                };
            }
        } catch (error) {
            console.error("Get delivery route error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // NOTIFICATION CONTROLLER METHODS (Enhanced)
    // ============================================

    // Get unread notifications count
    async getUnreadNotificationsCount() {
        try {
            const response = await this.makeAuthenticatedRequest("/api/notifications/unread/count");
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.count || 0 };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch unread count",
                };
            }
        } catch (error) {
            console.error("Get unread notifications count error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Mark all notifications as read
    async markAllNotificationsAsRead() {
        try {
            const response = await this.makeAuthenticatedRequest("/api/notifications/mark-all-read", {
                method: "PUT",
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to mark all notifications as read",
                };
            }
        } catch (error) {
            console.error("Mark all notifications as read error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Delete notification
    async deleteNotification(notificationId) {
        try {
            const response = await this.makeAuthenticatedRequest(`/api/notifications/${notificationId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to delete notification",
                };
            }
        } catch (error) {
            console.error("Delete notification error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Get notification preferences
    async getNotificationPreferences() {
        try {
            const response = await this.makeAuthenticatedRequest("/api/notifications/preferences");
            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.preferences || {} };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to fetch notification preferences",
                };
            }
        } catch (error) {
            console.error("Get notification preferences error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Update notification preferences
    async updateNotificationPreferences(preferences) {
        try {
            const response = await this.makeAuthenticatedRequest("/api/notifications/preferences", {
                method: "PUT",
                body: JSON.stringify(preferences),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Failed to update notification preferences",
                };
            }
        } catch (error) {
            console.error("Update notification preferences error:", error);
            return {
                success: false,
                error: "Network error. Please try again.",
            };
        }
    }

    // Helper method to get auth headers
    async getAuthHeaders() {
        const token = await this.getAuthToken();
        return {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }
}

export default new ApiService();
