-- Create route_statuses table
CREATE TABLE IF NOT EXISTS route_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#FF9E44',
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
  division_id INTEGER REFERENCES divisions(id),
  date DATE NOT NULL,
  pickup_zip VARCHAR(10) NOT NULL,
  pickup_city VARCHAR(100),
  pickup_state VARCHAR(2),
  pickup_county VARCHAR(100),
  delivery_zip VARCHAR(10) NOT NULL,
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(2),
  delivery_county VARCHAR(100),
  mileage INTEGER,
  rate DECIMAL(10,2) NOT NULL,
  sold_for DECIMAL(10,2),
  status VARCHAR(50) NOT NULL DEFAULT 'Empty',
  status_color VARCHAR(7) NOT NULL DEFAULT '#FF9E44',
  customer_load_number VARCHAR(50),
  previous_route_ids TEXT,
  comments TEXT,
  last_comment_by VARCHAR(100),
  last_comment_at TIMESTAMP WITH TIME ZONE,
  last_edited_by VARCHAR(100),
  last_edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create route_comments table
CREATE TABLE IF NOT EXISTS route_comments (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create route_audits table
CREATE TABLE IF NOT EXISTS route_audits (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  comment TEXT,
  user_name VARCHAR(100),
  changed_fields TEXT NOT NULL,
  old_values TEXT,
  new_values TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_routes_driver_id ON routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_routes_division_id ON routes(division_id);
CREATE INDEX IF NOT EXISTS idx_routes_date ON routes(date);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_route_comments_route_id ON route_comments(route_id);
CREATE INDEX IF NOT EXISTS idx_route_audits_route_id ON route_audits(route_id);

-- Insert default route statuses
INSERT INTO route_statuses (name, color, is_default, sort_order) VALUES
  ('Empty', '#FF9E44', true, 1),
  ('Loaded', '#4CAF50', false, 2),
  ('Delivered', '#2196F3', false, 3),
  ('Cancelled', '#F44336', false, 4),
  ('Driving previous route', '#9C27B0', false, 5)
ON CONFLICT (name) DO NOTHING; 