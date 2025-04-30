-- Create weekly_routes table
CREATE TABLE IF NOT EXISTS weekly_routes (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    division_id INTEGER REFERENCES divisions(id) ON DELETE CASCADE,
    dispatcher_id INTEGER REFERENCES dispatchers(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    total_miles DECIMAL(10,2) DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    driver_pay DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create weekly_route_details table
CREATE TABLE IF NOT EXISTS weekly_route_details (
    id SERIAL PRIMARY KEY,
    weekly_route_id INTEGER REFERENCES weekly_routes(id) ON DELETE CASCADE,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(weekly_route_id, day_of_week, sequence_number)
);

-- Create weekly_route_audits table
CREATE TABLE IF NOT EXISTS weekly_route_audits (
    id SERIAL PRIMARY KEY,
    weekly_route_id INTEGER REFERENCES weekly_routes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_weekly_routes_driver_id ON weekly_routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_weekly_routes_division_id ON weekly_routes(division_id);
CREATE INDEX IF NOT EXISTS idx_weekly_routes_dispatcher_id ON weekly_routes(dispatcher_id);
CREATE INDEX IF NOT EXISTS idx_weekly_routes_week_dates ON weekly_routes(week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_weekly_route_details_weekly_route_id ON weekly_route_details(weekly_route_id);
CREATE INDEX IF NOT EXISTS idx_weekly_route_details_route_id ON weekly_route_details(route_id);
CREATE INDEX IF NOT EXISTS idx_weekly_route_audits_weekly_route_id ON weekly_route_audits(weekly_route_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_weekly_routes_updated_at
    BEFORE UPDATE ON weekly_routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_route_details_updated_at
    BEFORE UPDATE ON weekly_route_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add function to calculate weekly totals
CREATE OR REPLACE FUNCTION calculate_weekly_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total miles and revenue for the week
    UPDATE weekly_routes wr
    SET 
        total_miles = (
            SELECT COALESCE(SUM(r.mileage), 0)
            FROM weekly_route_details wrd
            JOIN routes r ON wrd.route_id = r.id
            WHERE wrd.weekly_route_id = wr.id
        ),
        total_revenue = (
            SELECT COALESCE(SUM(r.rate), 0)
            FROM weekly_route_details wrd
            JOIN routes r ON wrd.route_id = r.id
            WHERE wrd.weekly_route_id = wr.id
        ),
        driver_pay = (
            SELECT COALESCE(SUM(r.rate * d.percentage / 100), 0)
            FROM weekly_route_details wrd
            JOIN routes r ON wrd.route_id = r.id
            JOIN drivers d ON r.driver_id = d.id
            WHERE wrd.weekly_route_id = wr.id
        )
    WHERE wr.id = NEW.weekly_route_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update weekly totals
CREATE TRIGGER update_weekly_totals
    AFTER INSERT OR UPDATE OR DELETE ON weekly_route_details
    FOR EACH ROW
    EXECUTE FUNCTION calculate_weekly_totals(); 