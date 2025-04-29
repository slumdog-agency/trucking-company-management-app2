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

-- Create triggers for updating timestamps
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