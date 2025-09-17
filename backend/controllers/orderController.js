import { db } from "../db/index.js";
import { orders } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

// 1. Get the current order assigned to the rider (status: out_for_delivery or ready, etc.)
export const getCurrentOrderForRider = async (req, res) => {
    try {
        const riderId = req.user.userId;
        // You may want to adjust the status filter as per your business logic
        const currentOrder = await db
            .select()
            .from(orders)
            .where(and(eq(orders.riderId, riderId)));
        if (currentOrder.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No current order assigned to this rider.",
            });
        }
        res.status(200).json({
            success: true,
            order: currentOrder[0],
        });
    } catch (error) {
        console.error("Error fetching current order for rider:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 2. Get all orders completed by the rider (status: delivered)
export const getCompletedOrdersForRider = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const completedOrders = await db
            .select()
            .from(orders)
            .where(
                and(eq(orders.riderId, riderId), eq(orders.status, "delivered"))
            );
        res.status(200).json({
            success: true,
            orders: completedOrders,
        });
    } catch (error) {
        console.error("Error fetching completed orders for rider:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
