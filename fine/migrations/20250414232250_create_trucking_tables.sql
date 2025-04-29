-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  count INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  dispatcher VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create zip codes table
CREATE TABLE IF NOT EXISTS zip (
  zip VARCHAR(10) PRIMARY KEY,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  city VARCHAR(100),
  state_id CHAR(2),
  state_name VARCHAR(50)
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  driverId INTEGER NOT NULL,
  date DATE NOT NULL,
  pickupZip VARCHAR(10) NOT NULL,
  pickupCounty VARCHAR(100),
  deliveryZip VARCHAR(10) NOT NULL,
  deliveryCounty VARCHAR(100),
  mileage DECIMAL(10,2),
  rate DECIMAL(10,2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (pickupZip) REFERENCES zip(zip),
  FOREIGN KEY (deliveryZip) REFERENCES zip(zip)
);