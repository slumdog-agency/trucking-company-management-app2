-- Add pickup city/state to routes. deliveryCity and deliveryState were already
-- added by 20250415001236_add_divisions_and_route_status.sql.
ALTER TABLE routes ADD COLUMN pickupCity TEXT;
ALTER TABLE routes ADD COLUMN pickupState TEXT;
