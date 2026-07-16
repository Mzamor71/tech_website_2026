const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from server/.env");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on("connect", () => {
    console.log("Connected to Neon PostgreSQL.");
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error);
});

module.exports = pool;