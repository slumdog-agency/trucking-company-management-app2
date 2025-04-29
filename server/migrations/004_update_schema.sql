-- Create dispatchers table
CREATE TABLE IF NOT EXISTS dispatchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create trucks table
CREATE TABLE IF NOT EXISTS trucks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL,
    category TEXT NOT NULL,
    make TEXT,
    model TEXT,
    year INTEGER,
    vin TEXT,
    licensePlate TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create trailers table
CREATE TABLE IF NOT EXISTS trailers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT,
    length TEXT,
    vin TEXT,
    licensePlate TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create zip_codes table
CREATE TABLE IF NOT EXISTS zip_codes (
    id SERIAL PRIMARY KEY,
    zip_code TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    county TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    extension TEXT NOT NULL,
    "group" TEXT NOT NULL,
    permissions TEXT NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deactivatedAt DATETIME,
    updatedAt DATETIME
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    section TEXT NOT NULL,
    canRead INTEGER NOT NULL DEFAULT 0,
    canWrite INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Update drivers table with new columns
ALTER TABLE drivers 
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT,
    ADD COLUMN IF NOT EXISTS count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS percentage DECIMAL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS dispatcher TEXT,
    ADD COLUMN IF NOT EXISTS dispatcher_id INTEGER REFERENCES dispatchers(id),
    ADD COLUMN IF NOT EXISTS truck TEXT,
    ADD COLUMN IF NOT EXISTS trailer TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT;

-- Update routes table with new columns
ALTER TABLE routes 
    ADD COLUMN IF NOT EXISTS pickup_county TEXT,
    ADD COLUMN IF NOT EXISTS delivery_county TEXT,
    ADD COLUMN IF NOT EXISTS status_start_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS status_end_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_comment_by TEXT,
    ADD COLUMN IF NOT EXISTS last_comment_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_drivers_dispatcher_id ON drivers(dispatcher_id);
CREATE INDEX IF NOT EXISTS idx_routes_driver_id ON routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_routes_division_id ON routes(division_id);
CREATE INDEX IF NOT EXISTS idx_route_audits_route_id ON route_audits(route_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(userId);
CREATE INDEX IF NOT EXISTS idx_zip_codes_zip_code ON zip_codes(zip_code);

-- Create trigger to update updatedAt timestamp
CREATE TRIGGER IF NOT EXISTS update_drivers_timestamp 
   AFTER UPDATE ON drivers
   BEGIN
      UPDATE drivers SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END;

CREATE TRIGGER IF NOT EXISTS update_routes_timestamp
   AFTER UPDATE ON routes
   BEGIN
      UPDATE routes SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END;

CREATE TRIGGER IF NOT EXISTS update_dispatchers_timestamp
   AFTER UPDATE ON dispatchers
   BEGIN
      UPDATE dispatchers SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END;

CREATE TRIGGER IF NOT EXISTS update_trucks_timestamp
   AFTER UPDATE ON trucks
   BEGIN
      UPDATE trucks SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END;

CREATE TRIGGER IF NOT EXISTS update_trailers_timestamp
   AFTER UPDATE ON trailers
   BEGIN
      UPDATE trailers SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END;

CREATE TRIGGER IF NOT EXISTS update_divisions_timestamp
   AFTER UPDATE ON divisions
   BEGIN
      UPDATE divisions SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END;

CREATE TRIGGER IF NOT EXISTS update_zip_codes_timestamp
   AFTER UPDATE ON zip_codes
   BEGIN
      UPDATE zip_codes SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END;

CREATE TRIGGER IF NOT EXISTS update_user_permissions_timestamp
   AFTER UPDATE ON user_permissions
   BEGIN
      UPDATE user_permissions SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END;

-- Create trigger for zip_codes
CREATE TRIGGER update_zip_codes_updated_at
    BEFORE UPDATE ON zip_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing drivers data to split name into first_name and last_name
UPDATE drivers 
SET 
    first_name = split_part(name, ' ', 1),
    last_name = split_part(name, ' ', 2)
WHERE name IS NOT NULL; 