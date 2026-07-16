const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("API Running");
});

/*
 * Shows exactly which Neon database, schema, and user
 * your Express server is connected to.
 */
app.get("/api/database-test", async (req, res) => {
    try {
        const connectionResult = await pool.query(`
            SELECT
                current_database() AS database_name,
                current_schema() AS schema_name,
                current_user AS database_user,
                NOW() AS database_time
        `);

        const tableResult = await pool.query(`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'service_requests'
            ) AS table_exists
        `);

        res.json({
            success: true,
            message: "Connected to Neon",
            connection: connectionResult.rows[0],
            serviceRequestsTableExists:
                tableResult.rows[0].table_exists
        });
    } catch (error) {
        console.error("Database test failed:", error);

        res.status(500).json({
            success: false,
            message: "Could not connect to Neon",
            error: error.message
        });
    }
});

/*
 * Displays saved requests for testing.
 * Remove or protect this route before production.
 */
app.get("/api/contact", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public.service_requests
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            count: result.rowCount,
            requests: result.rows
        });
    } catch (error) {
        console.error("Could not load requests:", error);

        res.status(500).json({
            success: false,
            message: "Could not load service requests.",
            error: error.message
        });
    }
});

/*
 * Saves a new service request.
 */
app.post("/api/contact", async (req, res) => {
    console.log("====== REQUEST RECEIVED ======");
    console.log(req.body);

    const {
        name,
        email,
        phone,
        device,
        message
    } = req.body;

    if (
        !name?.trim() ||
        !email?.trim() ||
        !phone?.trim() ||
        !device?.trim() ||
        !message?.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "All required fields must be completed."
        });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO public.service_requests
                (name, email, phone, device, message)
            VALUES
                ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                name.trim(),
                email.trim(),
                phone.trim(),
                device.trim(),
                message.trim()
            ]
        );

        console.log("====== SAVED TO NEON ======");
        console.log(result.rows[0]);

        res.status(201).json({
            success: true,
            message: "Service request saved successfully.",
            request: result.rows[0]
        });
    } catch (error) {
        console.error("====== DATABASE INSERT FAILED ======");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "The service request could not be saved.",
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});