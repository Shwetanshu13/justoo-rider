// apps/backend/src/lib/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import { conf } from "../config/conf.js";
import { sql } from "drizzle-orm";

const pool = new Pool({
    connectionString: conf.dbUrl,
});

export const db = drizzle(pool, { schema });

export const checkDatabaseConnection = async () => {
    try {
        // Test the connection with a simple query
        await db.execute(sql`SELECT 1`);
        return true;
    } catch (error) {
        console.error("Database connection failed:", error.message);
        return false;
    }
};

// Optional: Test connection on startup
export const initializeDatabase = async () => {
    const isConnected = await checkDatabaseConnection();

    if (isConnected) {
        console.log("✅ Database connected successfully");
    } else {
        console.error("❌ Failed to connect to database");
    }
    return isConnected;
};
