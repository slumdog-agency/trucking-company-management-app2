-- Create route statuses table for customizable statuses
CREATE TABLE routeStatuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  isDefault BOOLEAN DEFAULT FALSE,
  sortOrder INTEGER,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
('Not answering', '#4682B4', FALSE, 9);