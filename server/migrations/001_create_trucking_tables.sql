-- Create base tables for trucking application
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    first_name TEXT,
    last_name TEXT,
    count INTEGER DEFAULT 0,
    percentage DECIMAL DEFAULT 0,
    dispatcher TEXT,
    dispatcher_id INTEGER,
    truck TEXT,
    trailer TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dispatchers (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- Create function for updating timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

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