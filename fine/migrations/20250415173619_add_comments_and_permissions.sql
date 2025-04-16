-- Add comments to routes
ALTER TABLE routes ADD COLUMN comments TEXT;

-- Create users permissions table
CREATE TABLE userPermissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  section TEXT NOT NULL,
  canRead BOOLEAN DEFAULT FALSE,
  canWrite BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, section)
);

-- Add comment fields to routes
ALTER TABLE routes ADD COLUMN lastCommentBy TEXT;
ALTER TABLE routes ADD COLUMN lastCommentAt TIMESTAMP;