import dotenv from "dotenv";

dotenv.config();

export const conf = {
    dbUrl: process.env.DATABASE_SQL_URL,
};
