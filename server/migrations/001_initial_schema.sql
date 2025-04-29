-- Create and set schema
CREATE SCHEMA IF NOT EXISTS public;
SET search_path TO public;

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    dispatcher TEXT,
    dispatcher_id INTEGER,
    truck TEXT,
    trailer TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    category TEXT DEFAULT 'semi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create dispatchers table
CREATE TABLE IF NOT EXISTS dispatchers (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trucks table
CREATE TABLE IF NOT EXISTS trucks (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL,
    category TEXT NOT NULL,
    make TEXT,
    model TEXT,
    year INTEGER,
    vin TEXT,
    license_plate TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trailers table
CREATE TABLE IF NOT EXISTS trailers (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT,
    length TEXT,
    vin TEXT,
    license_plate TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create divisions table
CREATE TABLE IF NOT EXISTS divisions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    mc TEXT,
    dot TEXT,
    address TEXT,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create route_statuses table
CREATE TABLE IF NOT EXISTS route_statuses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create zip_codes table
CREATE TABLE IF NOT EXISTS zip_codes (
    id SERIAL PRIMARY KEY,
    zip_code TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    county TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    division_id INTEGER REFERENCES divisions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    pickup_zip TEXT REFERENCES zip_codes(zip_code),
    pickup_city TEXT,
    pickup_state TEXT,
    pickup_county TEXT,
    delivery_zip TEXT REFERENCES zip_codes(zip_code),
    delivery_city TEXT,
    delivery_state TEXT,
    delivery_county TEXT,
    mileage DECIMAL(10,2),
    rate DECIMAL(10,2),
    sold_for DECIMAL(10,2),
    status TEXT,
    status_color TEXT,
    customer_load_number TEXT,
    status_start_date TIMESTAMP WITH TIME ZONE,
    status_end_date TIMESTAMP WITH TIME ZONE,
    previous_route_ids TEXT,
    comments TEXT,
    last_comment_by TEXT,
    last_comment_at TIMESTAMP WITH TIME ZONE,
    last_edited_by TEXT,
    last_edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create route_audits table
CREATE TABLE IF NOT EXISTS route_audits (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    comment TEXT,
    user_id INTEGER,
    user_name TEXT,
    changed_fields TEXT,
    old_values TEXT,
    new_values TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create route_comments table
CREATE TABLE IF NOT EXISTS route_comments (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    extension TEXT,
    "group" TEXT NOT NULL,
    -- permissions stored as json array
    permissions TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    can_read BOOLEAN NOT NULL DEFAULT FALSE,
    can_write BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, section)
);

-- Create triggers for updating timestamps
CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispatchers_updated_at
    BEFORE UPDATE ON dispatchers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trucks_updated_at
    BEFORE UPDATE ON trucks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trailers_updated_at
    BEFORE UPDATE ON trailers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_divisions_updated_at
    BEFORE UPDATE ON divisions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_statuses_updated_at
    BEFORE UPDATE ON route_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_audits_updated_at
    BEFORE UPDATE ON route_audits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zip_codes_updated_at
    BEFORE UPDATE ON zip_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default route statuses
INSERT INTO route_statuses (name, color, is_default, sort_order, description) VALUES
    ('empty', '#ff9e44', TRUE, 1, 'Driver is empty'),
    ('service', '#4169e1', FALSE, 2, 'Driver is in service'),
    ('driving previous route', '#ffb6c1', FALSE, 3, 'Driver is completing previous route'),
    ('hometime', '#a9a9a9', FALSE, 4, 'Driver is at home'),
    ('loaded', '#2e8b57', FALSE, 5, 'Driver is loaded'),
    ('at pu', '#ffd700', FALSE, 6, 'Driver is at pickup'),
    ('at del', '#ffa500', FALSE, 7, 'Driver is at delivery'),
    ('34 hour reset', '#dda0dd', FALSE, 8, 'Driver is on 34-hour reset'),
    ('not answering', '#4682b4', FALSE, 9, 'Driver is not responding')
ON CONFLICT (name) DO NOTHING;

-- Insert sample division
INSERT INTO divisions (name, description) VALUES 
    ('Main Division', 'Primary division of the company')
ON CONFLICT DO NOTHING; 