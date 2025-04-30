import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all weekly routes
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, driver_id, division_id, dispatcher_id } = req.query;
    
    let query = `
      SELECT wr.*,
             d.first_name || ' ' || d.last_name as driver_name,
             div.name as division_name,
             disp.first_name || ' ' || disp.last_name as dispatcher_name
      FROM weekly_routes wr
      LEFT JOIN drivers d ON wr.driver_id = d.id
      LEFT JOIN divisions div ON wr.division_id = div.id
      LEFT JOIN dispatchers disp ON wr.dispatcher_id = disp.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (start_date) {
      query += ` AND wr.week_start_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND wr.week_end_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    if (driver_id) {
      query += ` AND wr.driver_id = $${paramCount}`;
      params.push(driver_id);
      paramCount++;
    }
    
    if (division_id) {
      query += ` AND wr.division_id = $${paramCount}`;
      params.push(division_id);
      paramCount++;
    }
    
    if (dispatcher_id) {
      query += ` AND wr.dispatcher_id = $${paramCount}`;
      params.push(dispatcher_id);
      paramCount++;
    }
    
    query += ' ORDER BY wr.week_start_date DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get weekly route by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get weekly route details
    const weeklyRouteQuery = `
      SELECT wr.*,
             d.first_name || ' ' || d.last_name as driver_name,
             div.name as division_name,
             disp.first_name || ' ' || disp.last_name as dispatcher_name
      FROM weekly_routes wr
      LEFT JOIN drivers d ON wr.driver_id = d.id
      LEFT JOIN divisions div ON wr.division_id = div.id
      LEFT JOIN dispatchers disp ON wr.dispatcher_id = disp.id
      WHERE wr.id = $1
    `;
    
    const weeklyRouteResult = await pool.query(weeklyRouteQuery, [id]);
    
    if (weeklyRouteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Weekly route not found' });
    }
    
    // Get route details for each day
    const routeDetailsQuery = `
      SELECT wrd.*,
             r.*,
             rs.name as status_name,
             rs.color as status_color
      FROM weekly_route_details wrd
      JOIN routes r ON wrd.route_id = r.id
      LEFT JOIN route_statuses rs ON r.status = rs.name
      WHERE wrd.weekly_route_id = $1
      ORDER BY wrd.day_of_week, wrd.sequence_number
    `;
    
    const routeDetailsResult = await pool.query(routeDetailsQuery, [id]);
    
    // Get audit history
    const auditQuery = `
      SELECT *
      FROM weekly_route_audits
      WHERE weekly_route_id = $1
      ORDER BY created_at DESC
    `;
    
    const auditResult = await pool.query(auditQuery, [id]);
    
    res.json({
      ...weeklyRouteResult.rows[0],
      routes: routeDetailsResult.rows,
      audit_history: auditResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new weekly route
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      driver_id,
      division_id,
      dispatcher_id,
      week_start_date,
      week_end_date,
      notes
    } = req.body;
    
    // Insert weekly route
    const weeklyRouteQuery = `
      INSERT INTO weekly_routes (
        driver_id, division_id, dispatcher_id,
        week_start_date, week_end_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const weeklyRouteResult = await client.query(weeklyRouteQuery, [
      driver_id,
      division_id,
      dispatcher_id,
      week_start_date,
      week_end_date,
      notes
    ]);
    
    // Create audit entry
    const auditQuery = `
      INSERT INTO weekly_route_audits (
        weekly_route_id, user_id, user_name,
        action, details
      )
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await client.query(auditQuery, [
      weeklyRouteResult.rows[0].id,
      req.user?.id,
      req.user?.name,
      'created',
      'Weekly route created'
    ]);
    
    await client.query('COMMIT');
    res.status(201).json(weeklyRouteResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update weekly route
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      driver_id,
      division_id,
      dispatcher_id,
      week_start_date,
      week_end_date,
      status,
      notes
    } = req.body;
    
    // Update weekly route
    const updateQuery = `
      UPDATE weekly_routes
      SET driver_id = $1,
          division_id = $2,
          dispatcher_id = $3,
          week_start_date = $4,
          week_end_date = $5,
          status = $6,
          notes = $7
      WHERE id = $8
      RETURNING *
    `;
    
    const updateResult = await client.query(updateQuery, [
      driver_id,
      division_id,
      dispatcher_id,
      week_start_date,
      week_end_date,
      status,
      notes,
      id
    ]);
    
    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Weekly route not found' });
    }
    
    // Create audit entry
    const auditQuery = `
      INSERT INTO weekly_route_audits (
        weekly_route_id, user_id, user_name,
        action, details
      )
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await client.query(auditQuery, [
      id,
      req.user?.id,
      req.user?.name,
      'updated',
      'Weekly route updated'
    ]);
    
    await client.query('COMMIT');
    res.json(updateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Add route to weekly schedule
router.post('/:id/routes', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { route_id, day_of_week, sequence_number } = req.body;
    
    // Insert route detail
    const insertQuery = `
      INSERT INTO weekly_route_details (
        weekly_route_id, route_id, day_of_week, sequence_number
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const insertResult = await client.query(insertQuery, [
      id,
      route_id,
      day_of_week,
      sequence_number
    ]);
    
    // Create audit entry
    const auditQuery = `
      INSERT INTO weekly_route_audits (
        weekly_route_id, user_id, user_name,
        action, details
      )
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await client.query(auditQuery, [
      id,
      req.user?.id,
      req.user?.name,
      'route_added',
      `Route ${route_id} added to day ${day_of_week}`
    ]);
    
    await client.query('COMMIT');
    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Remove route from weekly schedule
router.delete('/:id/routes/:detail_id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id, detail_id } = req.params;
    
    // Get route details before deletion for audit
    const getDetailQuery = `
      SELECT * FROM weekly_route_details
      WHERE id = $1 AND weekly_route_id = $2
    `;
    
    const detailResult = await client.query(getDetailQuery, [detail_id, id]);
    
    if (detailResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Route detail not found' });
    }
    
    // Delete route detail
    const deleteQuery = `
      DELETE FROM weekly_route_details
      WHERE id = $1 AND weekly_route_id = $2
      RETURNING *
    `;
    
    const deleteResult = await client.query(deleteQuery, [detail_id, id]);
    
    // Create audit entry
    const auditQuery = `
      INSERT INTO weekly_route_audits (
        weekly_route_id, user_id, user_name,
        action, details
      )
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await client.query(auditQuery, [
      id,
      req.user?.id,
      req.user?.name,
      'route_removed',
      `Route ${detailResult.rows[0].route_id} removed from day ${detailResult.rows[0].day_of_week}`
    ]);
    
    await client.query('COMMIT');
    res.json(deleteResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router; 