-- Create drivers table
CREATE TABLE drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  count INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  dispatcher TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table
CREATE TABLE routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driverId INTEGER NOT NULL,
  date DATE NOT NULL,
  pickupZip TEXT NOT NULL,
  pickupCounty TEXT,
  deliveryZip TEXT NOT NULL,
  deliveryCounty TEXT,
  mileage DECIMAL(10,2),
  rate DECIMAL(10,2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE
);