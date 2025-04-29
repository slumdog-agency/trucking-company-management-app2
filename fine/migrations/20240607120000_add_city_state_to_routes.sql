-- Add city and state columns to routes table
ALTER TABLE routes ADD COLUMN pickupCity VARCHAR(100);
ALTER TABLE routes ADD COLUMN pickupState VARCHAR(100);
ALTER TABLE routes ADD COLUMN deliveryCity VARCHAR(100);
ALTER TABLE routes ADD COLUMN deliveryState VARCHAR(100); 