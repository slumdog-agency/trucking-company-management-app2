-- Create route audits table for tracking changes
CREATE TABLE routeAudits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  routeId INTEGER NOT NULL,
  userId INTEGER,
  userName TEXT,
  changedFields TEXT NOT NULL,
  oldValues TEXT,
  newValues TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE
);

-- Add lastEditedBy and lastEditedAt columns to routes table
ALTER TABLE routes ADD COLUMN lastEditedBy TEXT;
ALTER TABLE routes ADD COLUMN lastEditedAt TIMESTAMP;