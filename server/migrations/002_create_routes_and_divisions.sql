-- Create divisions table
CREATE TABLE IF NOT EXISTS divisions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create route_statuses table
CREATE TABLE IF NOT EXISTS route_statuses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    division_id INTEGER REFERENCES divisions(id) ON DELETE CASCADE,
    pickup_location TEXT,
    delivery_location TEXT,
    pickup_city TEXT,
    pickup_state TEXT,
    delivery_city TEXT,
    delivery_state TEXT,
    pickup_county TEXT,
    delivery_county TEXT,
    status TEXT,
    status_start_date TIMESTAMP WITH TIME ZONE,
    status_end_date TIMESTAMP WITH TIME ZONE,
    last_comment_by TEXT,
    last_comment_at TIMESTAMP WITH TIME ZONE,
    sold_for DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create route_audits table
CREATE TABLE IF NOT EXISTS route_audits (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    comment TEXT,
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

-- Create triggers for updating timestamps
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

-- Insert default route statuses
INSERT INTO route_statuses (name, description) VALUES
    ('Pending', 'Route is pending'),
    ('In Progress', 'Route is in progress'),
    ('Completed', 'Route is completed'),
    ('Cancelled', 'Route is cancelled');

-- Insert sample division
INSERT INTO divisions (name, description) VALUES 
    ('Main Division', 'Primary division of the company'); 