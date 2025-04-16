-- Add additional driver fields
ALTER TABLE drivers ADD COLUMN phone TEXT;
ALTER TABLE drivers ADD COLUMN emergencyContactName TEXT;
ALTER TABLE drivers ADD COLUMN emergencyContactPhone TEXT;
ALTER TABLE drivers ADD COLUMN email TEXT;
ALTER TABLE drivers ADD COLUMN category TEXT DEFAULT 'Semi';