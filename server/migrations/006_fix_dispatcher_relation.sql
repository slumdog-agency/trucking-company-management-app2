-- First, make sure all dispatcher_id values are valid
UPDATE drivers
SET dispatcher_id = NULL
WHERE dispatcher_id NOT IN (SELECT id FROM dispatchers);

-- Add foreign key constraint to dispatcher_id
ALTER TABLE drivers
DROP COLUMN dispatcher,
ADD CONSTRAINT fk_driver_dispatcher
    FOREIGN KEY (dispatcher_id)
    REFERENCES dispatchers(id)
    ON DELETE SET NULL; 