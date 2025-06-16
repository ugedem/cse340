const { Pool } = require("pg");
require("dotenv").config();

/*
 * Unified Database Pool with consistent export
 * SSL is required for production (Render)
 * Logs queries only in development for debugging
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = {
  async query(text, params) {
    try {
      const res = await pool.query(text, params);
      if (process.env.NODE_ENV === "development") {
        console.log("executed query", { text });
      }
      return res;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  },
};
