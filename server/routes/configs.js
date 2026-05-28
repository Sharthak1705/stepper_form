
const express = require("express");
const { pool } = require("../db");

const router = express.Router();


// GET /api/configs
// List all form configs (basic info only)

router.get("/", async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
        id,
        title,
        created_at
      FROM form_configs
      ORDER BY created_at DESC
    `);

    res.json({
      data: result.rows
    });

  } catch (e) {

    console.error("GET /configs error:", e);

    res.status(500).json({
      error: "Failed to fetch configs"
    });
  }
});



// GET /api/configs/:id
// Get full config with steps + fields

router.get("/:id", async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM form_configs
      WHERE id = $1
      `,
      [id]
    );

    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({
        error: "Config not found"
      });
    }

    // PostgreSQL JSONB already returns object
    // No JSON.parse needed if config_json is JSONB

    res.json({
      data: row.config_json
    });

  } catch (e) {

    console.error("GET /configs/:id error:", e);

    res.status(500).json({
      error: "Failed to fetch config"
    });
  }
});


module.exports = router;
