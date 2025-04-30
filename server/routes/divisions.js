import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all divisions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, description, mc, dot, address, phone_number FROM divisions ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new division
router.post('/', async (req, res) => {
  try {
    const { name, description, mc, dot, address, phone_number } = req.body;
    const result = await pool.query(
      `INSERT INTO divisions (name, description, mc, dot, address, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, description, mc, dot, address, phone_number`,
      [name, description, mc, dot, address, phone_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update division
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, mc, dot, address, phone_number } = req.body;
    
    const result = await pool.query(
      `UPDATE divisions 
       SET name = $1, description = $2, mc = $3, dot = $4, address = $5, phone_number = $6
       WHERE id = $7
       RETURNING id, name, description, mc, dot, address, phone_number`,
      [name, description, mc, dot, address, phone_number, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Division not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete division
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM divisions WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Division not found' });
    }
    res.json({ message: 'Division deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 