import { db } from "../db/index.js";
import { justooRiders as usersTable } from "../db/schema.js";
import { eq, and, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// Firebase integration fully removed

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET =
    process.env.JWT_SECRET ||
    "your-super-secret-jwt-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "676h";

// Email/Password Login function - matches the API specification
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Find user by email
        const user = await db
            .select()
            .from(usersTable)
            .where(
                and(
                    eq(usersTable.isActive, 1),
                    eq(usersTable.email, email.toLowerCase())
                )
            );

        if (user.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const foundUser = user[0];

        // Check if user has a password (might be Firebase-only user)
        if (!foundUser.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
            password,
            foundUser.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Update last login time
        await db
            .update(usersTable)
            .set({
                lastLogin: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(usersTable.id, foundUser.id));

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: foundUser.id,
                email: foundUser.email,
                phone: foundUser.phone,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Return success response (excluding password)
        res.status(200).json({
            success: true,
            user: {
                id: foundUser.id.toString(),
                email: foundUser.email,
                name: foundUser.name,
                phone: foundUser.phone,
                status: foundUser.status,
            },
            token,
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Logout function (mainly for clearing client-side tokens)
export const logout = async (req, res) => {
    try {
        // In a stateless JWT system, logout is mainly handled client-side
        // You could maintain a blacklist of tokens in Redis/database if needed

        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId));

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Return user data without password
        const { password, ...userWithoutPassword } = user[0];

        res.status(200).json({
            success: true,
            data: userWithoutPassword,
        });
    } catch (error) {
        console.error("Error getting user profile:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Verify token (for middleware use)
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};
