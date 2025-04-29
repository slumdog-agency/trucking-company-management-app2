-- Create zip codes table for storing user-added zip code data
CREATE TABLE zipCodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zipCode TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  county TEXT,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);