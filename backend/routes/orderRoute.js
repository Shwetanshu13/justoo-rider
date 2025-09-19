import express from "express";
import {
    getCurrentOrderForRider,
    getCompletedOrdersForRider,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Get the current order assigned to the rider
router.get("/current", authMiddleware, getCurrentOrderForRider);

// Get all completed orders for the rider
router.get("/completed", authMiddleware, getCompletedOrdersForRider);

export default router;
