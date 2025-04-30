import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import weeklyRoutes from './routes/weekly-routes.js';
import divisionsRoutes from './routes/divisions.js';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes endpoints
app.use('/api/routes', routes);

// Weekly routes endpoints
app.use('/api/weekly-routes', weeklyRoutes);

// Divisions endpoints
app.use('/api/divisions', divisionsRoutes);

// Drivers endpoints
app.get('/api/drivers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.id,
        d.count,
        d.percentage,
        d.first_name,
        d.last_name,
        d.email,
        d.phone,
        d.dispatcher_id,
        d.truck,
        d.trailer,
        d.emergency_contact_name,
        d.emergency_contact_phone,
        d.category,
        d.created_at,
        d.updated_at,
        CONCAT(disp.first_name, ' ', disp.last_name) as dispatcher
      FROM drivers d
      LEFT JOIN dispatchers disp ON disp.dispatcher_id = d.dispatcher_id
      ORDER BY d.last_name, d.first_name`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/drivers:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add new driver
app.post('/api/drivers', async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone,
      count, percentage, dispatcher_id,
      truck, trailer, emergency_contact_name,
      emergency_contact_phone, category
    } = req.body;
    
    const result = await pool.query(
      `WITH inserted_driver AS (
        INSERT INTO drivers (
          first_name, last_name, email, phone,
          count, percentage, dispatcher_id,
          truck, trailer, emergency_contact_name,
          emergency_contact_phone, category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      )
      SELECT 
        d.id,
        d.count,
        d.percentage,
        d.first_name,
        d.last_name,
        d.email,
        d.phone,
        d.dispatcher_id,
        d.truck,
        d.trailer,
        d.emergency_contact_name,
        d.emergency_contact_phone,
        d.category,
        d.created_at,
        d.updated_at,
        CONCAT(disp.first_name, ' ', disp.last_name) as dispatcher
      FROM inserted_driver d
      LEFT JOIN dispatchers disp ON disp.dispatcher_id = d.dispatcher_id`,
      [
        first_name, last_name, email, phone,
        count, percentage, dispatcher_id,
        truck, trailer, emergency_contact_name,
        emergency_contact_phone, category
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error in POST /api/drivers:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update driver
app.put('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, email, phone,
      count, percentage, dispatcher_id,
      truck, trailer, emergency_contact_name,
      emergency_contact_phone, category
    } = req.body;
    
    const result = await pool.query(
      `WITH updated_driver AS (
        UPDATE drivers SET 
          first_name = $1, last_name = $2, email = $3, phone = $4,
          count = $5, percentage = $6, dispatcher_id = $7,
          truck = $8, trailer = $9, emergency_contact_name = $10,
          emergency_contact_phone = $11, category = $12,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING *
      )
      SELECT 
        d.id,
        d.count,
        d.percentage,
        d.first_name,
        d.last_name,
        d.email,
        d.phone,
        d.dispatcher_id,
        d.truck,
        d.trailer,
        d.emergency_contact_name,
        d.emergency_contact_phone,
        d.category,
        d.created_at,
        d.updated_at,
        CONCAT(disp.first_name, ' ', disp.last_name) as dispatcher
      FROM updated_driver d
      LEFT JOIN dispatchers disp ON disp.dispatcher_id = d.dispatcher_id`,
      [
        first_name, last_name, email, phone,
        count, percentage, dispatcher_id,
        truck, trailer, emergency_contact_name,
        emergency_contact_phone, category, id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in PUT /api/drivers/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete driver
app.delete('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM drivers WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dispatchers endpoints
app.get('/api/dispatchers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dispatchers ORDER BY last_name, first_name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dispatchers', async (req, res) => {
  try {
    const { first_name, last_name, email, phone } = req.body;
    const result = await pool.query(
      `INSERT INTO dispatchers (first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [first_name, last_name, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route statuses endpoints
app.get('/api/route-statuses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM route_statuses 
      ORDER BY sort_order, name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/route-statuses', async (req, res) => {
  try {
    const { name, color, is_default, sort_order } = req.body;
    
    // If this is being set as default, update all other statuses to not be default
    if (is_default) {
      await pool.query('UPDATE route_statuses SET is_default = false');
    }
    
    const result = await pool.query(
      `INSERT INTO route_statuses (name, color, is_default, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, color, is_default, sort_order]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/route-statuses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, is_default, sort_order } = req.body;
    
    // If this is being set as default, update all other statuses to not be default
    if (is_default) {
      await pool.query('UPDATE route_statuses SET is_default = false');
    }
    
    const result = await pool.query(
      `UPDATE route_statuses 
       SET name = $1, color = $2, is_default = $3, sort_order = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, color, is_default, sort_order, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route status not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/route-statuses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if this is the default status
    const statusCheck = await pool.query(
      'SELECT is_default FROM route_statuses WHERE id = $1',
      [id]
    );
    
    if (statusCheck.rows[0]?.is_default) {
      return res.status(400).json({ 
        error: 'Cannot delete the default route status. Please set another status as default first.' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM route_statuses WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route status not found' });
    }
    
    res.json({ message: 'Route status deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trucks endpoints
app.get('/api/trucks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trucks ORDER BY number');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trucks', async (req, res) => {
  try {
    const { number, category, make, model, year, vin, license_plate } = req.body;
    const result = await pool.query(
      `INSERT INTO trucks (number, category, make, model, year, vin, license_plate)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [number, category, make, model, year, vin, license_plate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/trucks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { number, category, make, model, year, vin, license_plate } = req.body;
    const result = await pool.query(
      `UPDATE trucks 
       SET number = $1, category = $2, make = $3, model = $4, 
           year = $5, vin = $6, license_plate = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [number, category, make, model, year, vin, license_plate, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trucks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM trucks WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    res.json({ message: 'Truck deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trailers endpoints
app.get('/api/trailers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trailers ORDER BY number');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trailers', async (req, res) => {
  try {
    const { number, category, type, length, vin, license_plate } = req.body;
    const result = await pool.query(
      `INSERT INTO trailers (number, category, type, length, vin, license_plate)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [number, category, type, length, vin, license_plate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/trailers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { number, category, type, length, vin, license_plate } = req.body;
    const result = await pool.query(
      `UPDATE trailers 
       SET number = $1, category = $2, type = $3, length = $4,
           vin = $5, license_plate = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [number, category, type, length, vin, license_plate, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trailer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trailers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM trailers WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trailer not found' });
    }
    res.json({ message: 'Trailer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, phone, extension, group, permissions, is_active } = req.body;
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, extension, group, permissions, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, email, phone, extension, group, permissions, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, extension, group, permissions, is_active } = req.body;
    const result = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, phone = $3, extension = $4,
           group = $5, permissions = $6, is_active = $7,
           updated_at = CURRENT_TIMESTAMP,
           deactivated_at = CASE WHEN is_active = false THEN CURRENT_TIMESTAMP ELSE deactivated_at END
       WHERE id = $8
       RETURNING *`,
      [name, email, phone, extension, group, permissions, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete by setting is_active to false
    const result = await pool.query(
      `UPDATE users 
       SET is_active = false, 
           deactivated_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Permissions endpoints
app.get('/api/user-permissions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_permissions ORDER BY user_id, section');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user-permissions', async (req, res) => {
  try {
    const { user_id, section, can_read, can_write } = req.body;
    const result = await pool.query(
      `INSERT INTO user_permissions (user_id, section, can_read, can_write)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, section, can_read, can_write]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user-permissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, section, can_read, can_write } = req.body;
    const result = await pool.query(
      `UPDATE user_permissions 
       SET user_id = $1, section = $2, can_read = $3, can_write = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [user_id, section, can_read, can_write, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/user-permissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM user_permissions WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.json({ message: 'Permission deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get ZIP code details
app.get('/api/zip-codes/:zip', async (req, res) => {
  try {
    const { zip } = req.params;
    const result = await pool.query(`
      SELECT * FROM zip_codes 
      WHERE zip_code = $1
    `, [zip]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ZIP code not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate mileage between ZIP codes
app.post('/api/calculate-mileage', async (req, res) => {
  try {
    const { pickup_zip, delivery_zip } = req.body;
    
    // Get coordinates for both ZIP codes
    const [pickupResult, deliveryResult] = await Promise.all([
      pool.query('SELECT lat, lng FROM zip_codes WHERE zip_code = $1', [pickup_zip]),
      pool.query('SELECT lat, lng FROM zip_codes WHERE zip_code = $1', [delivery_zip])
    ]);
    
    if (pickupResult.rows.length === 0 || deliveryResult.rows.length === 0) {
      return res.status(404).json({ error: 'One or both ZIP codes not found' });
    }
    
    const pickup = pickupResult.rows[0];
    const delivery = deliveryResult.rows[0];
    
    // Calculate distance using Haversine formula
    const R = 3959; // Earth's radius in miles
    const lat1 = pickup.lat * Math.PI / 180;
    const lat2 = delivery.lat * Math.PI / 180;
    const dLat = (delivery.lat - pickup.lat) * Math.PI / 180;
    const dLon = (delivery.lng - pickup.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = Math.round(R * c);
    
    res.json({ mileage: distance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add route comment
app.post('/api/routes/:id/comments', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { text, by } = req.body;
    
    // Add comment
    const commentResult = await client.query(`
      INSERT INTO route_comments (route_id, text, by)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [id, text, by]);
    
    // Update route's last comment info
    await client.query(`
      UPDATE routes SET
        last_comment_by = $1,
        last_comment_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [by, id]);
    
    await client.query('COMMIT');
    res.status(201).json(commentResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Trucking Company Management Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 