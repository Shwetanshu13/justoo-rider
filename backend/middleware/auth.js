import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { justooRiders } from "../db/schema.js";
import { eq } from "drizzle-orm";

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "your-super-secret-jwt-key-change-this-in-production";

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token required",
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            // Optional: Verify user still exists and is active
            const user = await db
                .select()
                .from(justooRiders)
                .where(eq(justooRiders.id, decoded.userId));

            if (user.length === 0 || user[0].isActive !== 1) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired token",
                });
            }

            req.user = decoded;
            next();
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }
    } catch (error) {
        console.error("Error in auth middleware:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
