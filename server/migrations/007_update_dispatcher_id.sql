-- First, ensure we have a backup of the data
CREATE TABLE IF NOT EXISTS dispatchers_backup AS SELECT * FROM dispatchers;

-- Drop existing foreign key constraints that reference dispatchers
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_dispatcher_id_fkey;
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_dispatcherid_fkey;
ALTER TABLE weekly_routes DROP CONSTRAINT IF EXISTS weekly_routes_dispatcher_id_fkey;

-- Drop the primary key constraint with CASCADE to handle all dependencies
ALTER TABLE dispatchers DROP CONSTRAINT dispatchers_pkey CASCADE;

-- Rename the id column to dispatcher_id
ALTER TABLE dispatchers RENAME COLUMN id TO dispatcher_id;

-- Add back the primary key constraint
ALTER TABLE dispatchers ADD PRIMARY KEY (dispatcher_id);

-- Update the drivers table to use the new column name
ALTER TABLE drivers 
  DROP COLUMN IF EXISTS "dispatcherId",
  ADD COLUMN IF NOT EXISTS dispatcher_id INTEGER REFERENCES dispatchers(dispatcher_id);

-- Update any existing data in drivers table to use the new column
UPDATE drivers d
SET dispatcher_id = (
  SELECT dispatcher_id 
  FROM dispatchers_backup 
  WHERE id = d.dispatcher_id
);

-- Recreate the weekly_routes foreign key constraint
ALTER TABLE weekly_routes
  ADD CONSTRAINT weekly_routes_dispatcher_id_fkey 
  FOREIGN KEY (dispatcher_id) REFERENCES dispatchers(dispatcher_id);

-- Drop the backup table
DROP TABLE IF EXISTS dispatchers_backup;

-- Recreate the index
DROP INDEX IF EXISTS idx_drivers_dispatcher_id;
CREATE INDEX idx_drivers_dispatcher_id ON drivers(dispatcher_id); 