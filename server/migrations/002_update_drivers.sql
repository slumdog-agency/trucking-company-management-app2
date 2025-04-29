-- Split name into firstName and lastName and add new fields
ALTER TABLE drivers 
  ADD COLUMN firstName VARCHAR(255),
  ADD COLUMN lastName VARCHAR(255),
  ADD COLUMN count INTEGER DEFAULT 0,
  ADD COLUMN percentage DECIMAL DEFAULT 0,
  ADD COLUMN dispatcher VARCHAR(255),
  ADD COLUMN dispatcherId INTEGER REFERENCES dispatchers(id),
  ADD COLUMN truck VARCHAR(255),
  ADD COLUMN trailer VARCHAR(255),
  ADD COLUMN emergencyContactName VARCHAR(255),
  ADD COLUMN emergencyContactPhone VARCHAR(255),
  ADD COLUMN category VARCHAR(255);

-- Split existing name into firstName and lastName
UPDATE drivers 
SET 
  firstName = SPLIT_PART(name, ' ', 1),
  lastName = SUBSTRING(name FROM POSITION(' ' IN name) + 1);

-- Make the new columns required after data migration
ALTER TABLE drivers 
  ALTER COLUMN firstName SET NOT NULL,
  ALTER COLUMN lastName SET NOT NULL,
  ALTER COLUMN count SET NOT NULL,
  ALTER COLUMN percentage SET NOT NULL,
  ALTER COLUMN dispatcher SET NOT NULL;

-- Drop the old name column
ALTER TABLE drivers DROP COLUMN name; 