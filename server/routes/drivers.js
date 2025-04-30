import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all drivers with related data
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*,
             CONCAT(disp.first_name, ' ', disp.last_name) as dispatcher
      FROM drivers d
      LEFT JOIN dispatchers disp ON d.dispatcher_id = disp.id
      ORDER BY d.count ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ... rest of the routes stay the same ... 