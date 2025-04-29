import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes endpoints
app.use('/api/routes', routes);

// Divisions endpoints
app.get('/api/divisions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM divisions ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/divisions', async (req, res) => {
  try {
    const { name, description, mc, dot, address, phone_number } = req.body;
    const result = await pool.query(
      `INSERT INTO divisions (name, description, mc, dot, address, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, mc, dot, address, phone_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Drivers endpoints
app.get('/api/drivers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*,
             CONCAT(disp.first_name, ' ', disp.last_name) as dispatcher_name
      FROM drivers d
      LEFT JOIN dispatchers disp ON d.dispatcher_id = disp.id
      ORDER BY d.last_name, d.first_name`);
    res.json(result.rows);
  } catch (err) {
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
      `INSERT INTO drivers (
        first_name, last_name, email, phone,
        count, percentage, dispatcher_id,
        truck, trailer, emergency_contact_name,
        emergency_contact_phone, category
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        first_name, last_name, email, phone,
        count, percentage, dispatcher_id,
        truck, trailer, emergency_contact_name,
        emergency_contact_phone, category
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
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
      `UPDATE drivers SET 
        first_name = $1, last_name = $2, email = $3, phone = $4,
        count = $5, percentage = $6, dispatcher_id = $7,
        truck = $8, trailer = $9, emergency_contact_name = $10,
        emergency_contact_phone = $11, category = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 RETURNING *`,
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
    const result = await pool.query('SELECT * FROM route_statuses ORDER BY sort_order');
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

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Trucking Company Management Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 