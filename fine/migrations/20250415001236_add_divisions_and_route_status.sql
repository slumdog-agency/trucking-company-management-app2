-- Create divisions table
CREATE TABLE divisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  companyName TEXT NOT NULL,
  mc TEXT,
  dot TEXT,
  address TEXT,
  phoneNumber TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add division and status fields to routes table
ALTER TABLE routes ADD COLUMN divisionId INTEGER REFERENCES divisions(id);
ALTER TABLE routes ADD COLUMN status TEXT;
ALTER TABLE routes ADD COLUMN statusColor TEXT;
ALTER TABLE routes ADD COLUMN customerLoadNumber TEXT;
ALTER TABLE routes ADD COLUMN city TEXT;
ALTER TABLE routes ADD COLUMN state TEXT;
ALTER TABLE routes ADD COLUMN deliveryCity TEXT;
ALTER TABLE routes ADD COLUMN deliveryState TEXT;
ALTER TABLE routes ADD COLUMN statusStartDate TEXT;
ALTER TABLE routes ADD COLUMN statusEndDate TEXT;
ALTER TABLE routes ADD COLUMN previousRouteIds TEXT;