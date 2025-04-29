-- Create trucks table
CREATE TABLE IF NOT EXISTS trucks (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
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
  category VARCHAR(50) NOT NULL,
  type VARCHAR(50),
  length VARCHAR(50),
  vin VARCHAR(50),
  licensePlate VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dispatchers table
CREATE TABLE IF NOT EXISTS dispatchers (
  id SERIAL PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create divisions table
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

-- Create route audits table
CREATE TABLE IF NOT EXISTS routeAudits (
  id SERIAL PRIMARY KEY,
  routeId INTEGER NOT NULL,
  userId INTEGER,
  userName VARCHAR(255),
  changedFields TEXT NOT NULL,
  oldValues TEXT,
  newValues TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE
);

-- Create user permissions table
CREATE TABLE IF NOT EXISTS userPermissions (
  id SERIAL PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  section VARCHAR(100) NOT NULL,
  canRead BOOLEAN DEFAULT FALSE,
  canWrite BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, section)
);

-- Create route statuses table
CREATE TABLE IF NOT EXISTS routeStatuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(50) NOT NULL,
  isDefault BOOLEAN DEFAULT FALSE,
  sortOrder INTEGER,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  extension VARCHAR(50),
  "group" VARCHAR(100) NOT NULL,
  permissions TEXT NOT NULL, -- Stored as JSON array
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deactivatedAt TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key to drivers table for dispatcher
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS dispatcherId INTEGER REFERENCES dispatchers(id);

-- Add additional columns to routes table
ALTER TABLE routes ADD COLUMN IF NOT EXISTS soldFor DECIMAL(10,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS divisionId INTEGER REFERENCES divisions(id);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS status VARCHAR(100);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS statusColor VARCHAR(50);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS customerLoadNumber VARCHAR(100);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS statusStartDate TIMESTAMP;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS statusEndDate TIMESTAMP;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS previousRouteIds TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS comments TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS lastCommentBy VARCHAR(255);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS lastCommentAt TIMESTAMP;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS lastEditedBy VARCHAR(255);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS lastEditedAt TIMESTAMP;

-- Insert default route statuses
INSERT INTO routeStatuses (name, color, isDefault, sortOrder) VALUES
('Empty', '#FF9E44', TRUE, 1),
('Service', '#4169E1', FALSE, 2),
('Driving previous route', '#FFB6C1', FALSE, 3),
('Hometime', '#A9A9A9', FALSE, 4),
('Loaded', '#2E8B57', FALSE, 5),
('AT PU', '#FFD700', FALSE, 6),
('AT DEL', '#FFA500', FALSE, 7),
('34 hour reset', '#DDA0DD', FALSE, 8),
('Not answering', '#4682B4', FALSE, 9)
ON CONFLICT (name) DO NOTHING; 