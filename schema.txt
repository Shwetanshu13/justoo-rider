import {
    pgTable,
    serial,
    varchar,
    integer,
    numeric,
    text,
    timestamp,
    pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const adminRole = pgEnum("admin_role", [
    "superadmin",
    "admin",
    "inventory_admin",
    "viewer",
]);
export const inventoryUserRole = pgEnum("inventory_user_role", [
    "admin",
    "user",
]);
export const orderStatus = pgEnum("order_status", [
    "placed",
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled",
]);
export const paymentMethod = pgEnum("payment_method", [
    "cash",
    "upi",
    "card",
    "wallet",
    "online",
]);
export const paymentStatus = pgEnum("payment_status", [
    "pending",
    "completed",
    "failed",
    "refunded",
]);
export const riderStatus = pgEnum("rider_status", [
    "active",
    "inactive",
    "busy",
    "suspended",
]);

// Tables
export const justooAdmins = pgTable("justoo_admins", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    role: adminRole("role").default("viewer").notNull(),
    isActive: integer("is_active").default(1).notNull(),
    lastLogin: timestamp("last_login"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventoryUsers = pgTable("inventory_users", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    role: inventoryUserRole("role").default("user").notNull(),
    isActive: integer("is_active").default(1).notNull(),
    firebaseToken: varchar("firebase_token", { length: 500 }),
    lastLogin: timestamp("last_login"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const items = pgTable("items", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 255 }).notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").default(0).notNull(),
    discount: numeric("discount", { precision: 5, scale: 2 }).default("0.00"),
    unit: varchar("unit", { length: 50 }).notNull(),
    description: text("description"),
    minStockLevel: integer("minStockLevel").default(10).notNull(),
    category: varchar("category", { length: 100 }),
    isActive: integer("isActive").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const orders = pgTable("orders", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("userId").notNull(),
    status: orderStatus("status").default("placed").notNull(),
    totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }).notNull(),
    itemCount: integer("itemCount").notNull(),
    notes: text("notes"),
    customerName: varchar("customerName", { length: 255 }),
    customerPhone: varchar("customerPhone", { length: 20 }),
    customerEmail: varchar("customerEmail", { length: 255 }),
    deliveryAddress: text("deliveryAddress"),
    riderId: integer("riderId"),
    estimatedDeliveryTime: timestamp("estimatedDeliveryTime"),
    deliveredAt: timestamp("deliveredAt"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const orderItems = pgTable("order_items", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer("orderId").notNull(),
    itemId: integer("itemId").notNull(),
    itemName: varchar("itemName", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unitPrice", { precision: 10, scale: 2 }).notNull(),
    totalPrice: numeric("totalPrice", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 50 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
});

export const justooPayments = pgTable("justoo_payments", {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    method: paymentMethod("method").notNull(),
    status: paymentStatus("status").default("pending").notNull(),
    transactionId: varchar("transaction_id", { length: 255 }),
    gatewayResponse: varchar("gateway_response", { length: 500 }),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const justooRiders = pgTable("justoo_riders", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }).notNull(),
    password: varchar("password", { length: 255 }),
    vehicleType: varchar("vehicle_type", { length: 50 }).notNull(),
    vehicleNumber: varchar("vehicle_number", { length: 50 }).notNull(),
    licenseNumber: varchar("license_number", { length: 100 }),
    status: riderStatus("status").default("active").notNull(),
    totalDeliveries: integer("total_deliveries").default(0).notNull(),
    rating: integer("rating").default(5),
    isActive: integer("is_active").default(1).notNull(),
    firebaseToken: varchar("firebase_token", { length: 500 }),
    lastLogin: timestamp("last_login"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Aliases for backward compatibility
export const justoo_admins = justooAdmins;
export const justoo_riders = justooRiders;
export const order_items = orderItems;
export const inventory_users = inventoryUsers;
export const users = inventoryUsers;
