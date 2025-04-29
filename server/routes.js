import express from 'express';
import pool from './db.js';

const router = express.Router();

// Get all routes with related data
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*,
             CONCAT(d.first_name, ' ', d.last_name) as driver_name,
             div.name as division_name,
             pz.city as pickup_city,
             pz.state as pickup_state,
             pz.county as pickup_county,
             dz.city as delivery_city,
             dz.state as delivery_state,
             dz.county as delivery_county
      FROM routes r
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN divisions div ON r.division_id = div.id
      LEFT JOIN zip_codes pz ON r.pickup_zip = pz.zip_code
      LEFT JOIN zip_codes dz ON r.delivery_zip = dz.zip_code
      ORDER BY r.date DESC, r.id DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single route by ID with related data
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*,
             CONCAT(d.first_name, ' ', d.last_name) as driver_name,
             div.name as division_name,
             pz.city as pickup_city,
             pz.state as pickup_state,
             pz.county as pickup_county,
             dz.city as delivery_city,
             dz.state as delivery_state,
             dz.county as delivery_county
      FROM routes r
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN divisions div ON r.division_id = div.id
      LEFT JOIN zip_codes pz ON r.pickup_zip = pz.zip_code
      LEFT JOIN zip_codes dz ON r.delivery_zip = dz.zip_code
      WHERE r.id = $1`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Get route comments
    const commentsResult = await pool.query(`
      SELECT * FROM route_comments 
      WHERE route_id = $1 
      ORDER BY created_at DESC`, [id]);

    // Get route audit history
    const auditResult = await pool.query(`
      SELECT * FROM route_audits 
      WHERE route_id = $1 
      ORDER BY created_at DESC`, [id]);

    const route = result.rows[0];
    route.comments = commentsResult.rows;
    route.audit_history = auditResult.rows;

    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new route
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      driver_id, division_id, date, 
      pickup_zip, delivery_zip,
      mileage, rate, sold_for,
      status, customer_load_number,
      previous_route_ids, comments,
      last_comment_by
    } = req.body;

    // Get status color from route_statuses table
    const statusResult = await client.query(
      'SELECT color FROM route_statuses WHERE name = $1',
      [status]
    );
    const status_color = statusResult.rows[0]?.color;

    // Insert the route
    const routeResult = await client.query(
      `INSERT INTO routes (
        driver_id, division_id, date,
        pickup_zip, delivery_zip,
        mileage, rate, sold_for,
        status, status_color,
        customer_load_number,
        previous_route_ids,
        comments, last_comment_by,
        status_start_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        driver_id, division_id, date,
        pickup_zip, delivery_zip,
        mileage, rate, sold_for,
        status, status_color,
        customer_load_number,
        previous_route_ids,
        comments, last_comment_by
      ]
    );

    // Add audit entry
    await client.query(
      `INSERT INTO route_audits (
        route_id, status, comment,
        user_name, changed_fields,
        new_values
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        routeResult.rows[0].id,
        'created',
        'Route created',
        last_comment_by,
        'all',
        JSON.stringify(routeResult.rows[0])
      ]
    );

    // Add initial comment if provided
    if (comments) {
      await client.query(
        `INSERT INTO route_comments (
          route_id, text, by
        ) VALUES ($1, $2, $3)`,
        [routeResult.rows[0].id, comments, last_comment_by]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(routeResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update a route
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      driver_id, division_id, date,
      pickup_zip, delivery_zip,
      mileage, rate, sold_for,
      status, customer_load_number,
      previous_route_ids, comments,
      last_edited_by
    } = req.body;

    // Get current route data
    const currentRoute = await client.query(
      'SELECT * FROM routes WHERE id = $1',
      [id]
    );

    if (currentRoute.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Get status color from route_statuses table
    const statusResult = await client.query(
      'SELECT color FROM route_statuses WHERE name = $1',
      [status]
    );
    const status_color = statusResult.rows[0]?.color;

    // Update the route
    const result = await client.query(
      `UPDATE routes SET
        driver_id = $1,
        division_id = $2,
        date = $3,
        pickup_zip = $4,
        delivery_zip = $5,
        mileage = $6,
        rate = $7,
        sold_for = $8,
        status = $9,
        status_color = $10,
        customer_load_number = $11,
        previous_route_ids = $12,
        last_edited_by = $13,
        last_edited_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *`,
      [
        driver_id, division_id, date,
        pickup_zip, delivery_zip,
        mileage, rate, sold_for,
        status, status_color,
        customer_load_number,
        previous_route_ids,
        last_edited_by,
        id
      ]
    );

    // Compare old and new values to track changes
    const oldRoute = currentRoute.rows[0];
    const newRoute = result.rows[0];
    const changedFields = [];
    const oldValues = {};
    const newValues = {};

    for (const key in newRoute) {
      if (oldRoute[key] !== newRoute[key]) {
        changedFields.push(key);
        oldValues[key] = oldRoute[key];
        newValues[key] = newRoute[key];
      }
    }

    // Add audit entry if there were changes
    if (changedFields.length > 0) {
      await client.query(
        `INSERT INTO route_audits (
          route_id, status, comment,
          user_name, changed_fields,
          old_values, new_values
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          'updated',
          'Route updated',
          last_edited_by,
          changedFields.join(', '),
          JSON.stringify(oldValues),
          JSON.stringify(newValues)
        ]
      );
    }

    // Add new comment if provided
    if (comments) {
      await client.query(
        `INSERT INTO route_comments (
          route_id, text, by
        ) VALUES ($1, $2, $3)`,
        [id, comments, last_edited_by]
      );

      // Update last comment info in routes table
      await client.query(
        `UPDATE routes SET
          last_comment_by = $1,
          last_comment_at = CURRENT_TIMESTAMP
        WHERE id = $2`,
        [last_edited_by, id]
      );
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Delete a route
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { user_name } = req.body; // Require user_name for audit

    // Get route data before deletion
    const routeData = await client.query(
      'SELECT * FROM routes WHERE id = $1',
      [id]
    );

    if (routeData.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Add audit entry before deletion
    await client.query(
      `INSERT INTO route_audits (
        route_id, status, comment,
        user_name, changed_fields,
        old_values
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        'deleted',
        'Route deleted',
        user_name,
        'all',
        JSON.stringify(routeData.rows[0])
      ]
    );

    // Delete the route (cascade will handle related records)
    await client.query('DELETE FROM routes WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Route deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get all tables in the database
router.get('/tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 