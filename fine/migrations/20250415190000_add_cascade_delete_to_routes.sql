-- First drop the existing foreign key constraint
PRAGMA foreign_keys=OFF;

-- Create a temporary table with the desired structure
CREATE TABLE routes_temp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driverId INTEGER NOT NULL,
  date DATE NOT NULL,
  pickupZip TEXT NOT NULL,
  pickupCounty TEXT,
  pickupCity TEXT,
  pickupState TEXT,
  deliveryZip TEXT NOT NULL,
  deliveryCounty TEXT,
  deliveryCity TEXT,
  deliveryState TEXT,
  mileage DECIMAL(10,2),
  rate DECIMAL(10,2) NOT NULL,
  soldFor DECIMAL(10,2),
  divisionId INTEGER REFERENCES divisions(id),
  status TEXT,
  statusColor TEXT,
  customerLoadNumber TEXT,
  statusStartDate TEXT,
  statusEndDate TEXT,
  previousRouteIds TEXT,
  lastEditedBy TEXT,
  lastEditedAt TIMESTAMP,
  comments TEXT,
  lastCommentBy TEXT,
  lastCommentAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE
);

-- Copy data from the old table
INSERT INTO routes_temp SELECT * FROM routes;

-- Drop the old table
DROP TABLE routes;

-- Rename the temporary table
ALTER TABLE routes_temp RENAME TO routes;

PRAGMA foreign_keys=ON; 