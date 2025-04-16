-- Create dispatchers table
CREATE TABLE dispatchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key to drivers table
ALTER TABLE drivers ADD COLUMN dispatcherId INTEGER REFERENCES dispatchers(id);