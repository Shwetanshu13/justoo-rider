import express from "express";
import { login, logout, getProfile } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Email/Password login endpoint
router.post("/login", login);

// Removed mobile OTP and Firebase authentication endpoints

// Logout endpoint
router.post("/logout", logout);

// Get user profile (protected route)
router.get("/profile", authMiddleware, getProfile);

// Legacy login endpoint for backward compatibility

export default router;
