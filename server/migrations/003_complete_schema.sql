-- Create dispatchers table first since it's referenced by drivers
CREATE TABLE IF NOT EXISTS dispatchers (
    id SERIAL PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create divisions table since it's referenced by routes
CREATE TABLE IF NOT EXISTS divisions (
    id SERIAL PRIMARY KEY,
    companyName VARCHAR(255) NOT NULL,
    mc VARCHAR(50),
    dot VARCHAR(50),
    address TEXT,
    phoneNumber VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    percentage DECIMAL NOT NULL DEFAULT 0,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    dispatcher VARCHAR(255) NOT NULL,
    dispatcherId INTEGER REFERENCES dispatchers(id),
    truck VARCHAR(255),
    trailer VARCHAR(255),
    phone VARCHAR(50),
    emergencyContactName VARCHAR(255),
    emergencyContactPhone VARCHAR(50),
    email VARCHAR(255),
    category VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create route_statuses table since it's referenced by routes
CREATE TABLE IF NOT EXISTS route_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    isDefault BOOLEAN DEFAULT false,
    sortOrder INTEGER,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    driverId INTEGER NOT NULL REFERENCES drivers(id),
    date DATE NOT NULL,
    pickupZip VARCHAR(20) NOT NULL,
    pickupCounty VARCHAR(100),
    pickupCity VARCHAR(100),
    pickupState VARCHAR(50),
    deliveryZip VARCHAR(20) NOT NULL,
    deliveryCounty VARCHAR(100),
    deliveryCity VARCHAR(100),
    deliveryState VARCHAR(50),
    mileage DECIMAL,
    rate DECIMAL NOT NULL,
    soldFor DECIMAL,
    divisionId INTEGER REFERENCES divisions(id),
    status VARCHAR(50),
    statusColor VARCHAR(50),
    customerLoadNumber VARCHAR(100),
    statusStartDate TIMESTAMP,
    statusEndDate TIMESTAMP,
    previousRouteIds TEXT,
    lastEditedBy VARCHAR(255),
    lastEditedAt TIMESTAMP,
    comments TEXT,
    lastCommentBy VARCHAR(255),
    lastCommentAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create route_audits table
CREATE TABLE IF NOT EXISTS route_audits (
    id SERIAL PRIMARY KEY,
    routeId INTEGER NOT NULL REFERENCES routes(id),
    userId INTEGER,
    userName VARCHAR(255),
    changedFields TEXT NOT NULL,
    oldValues TEXT,
    newValues TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trucks table
CREATE TABLE IF NOT EXISTS trucks (
    id SERIAL PRIMARY KEY,
    number VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    vin VARCHAR(50),
    licensePlate VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trailers table
CREATE TABLE IF NOT EXISTS trailers (
    id SERIAL PRIMARY KEY,
    number VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    type VARCHAR(100),
    length VARCHAR(50),
    vin VARCHAR(50),
    licensePlate VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create zip_codes table
CREATE TABLE IF NOT EXISTS zip_codes (
    id SERIAL PRIMARY KEY,
    zipCode VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    county VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    extension VARCHAR(20) NOT NULL,
    "group" VARCHAR(100) NOT NULL,
    permissions TEXT[] NOT NULL,
    isActive BOOLEAN NOT NULL DEFAULT true,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deactivatedAt TIMESTAMP,
    updatedAt TIMESTAMP
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    section VARCHAR(100) NOT NULL,
    canRead BOOLEAN NOT NULL DEFAULT false,
    canWrite BOOLEAN NOT NULL DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_drivers_dispatcher_id ON drivers(dispatcherId);
CREATE INDEX IF NOT EXISTS idx_routes_driver_id ON routes(driverId);
CREATE INDEX IF NOT EXISTS idx_routes_division_id ON routes(divisionId);
CREATE INDEX IF NOT EXISTS idx_route_audits_route_id ON route_audits(routeId);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(userId);
CREATE INDEX IF NOT EXISTS idx_zip_codes_zip_code ON zip_codes(zipCode);

-- Add triggers to automatically update updatedAt timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updatedAt
CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON routes
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

CREATE TRIGGER update_zip_codes_updated_at
    BEFORE UPDATE ON zip_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_statuses_updated_at
    BEFORE UPDATE ON route_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 