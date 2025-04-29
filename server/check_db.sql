-- List all tables in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check drivers table structure
SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'drivers'
ORDER BY ordinal_position;

-- Check dispatchers table structure
SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'dispatchers'
ORDER BY ordinal_position;

-- Check routes table structure
SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'routes'
ORDER BY ordinal_position;

-- Check foreign keys
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';

-- Check indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    indexname;

-- Check triggers
SELECT 
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS trigger_event,
    action_statement AS trigger_action
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY
    event_object_table,
    trigger_name;

-- Sample data from drivers
SELECT * FROM drivers LIMIT 5;

-- Sample data from dispatchers
SELECT * FROM dispatchers LIMIT 5;

-- Sample data from routes
SELECT * FROM routes LIMIT 5;

-- Count records in each table
SELECT 
    'drivers' as table_name, COUNT(*) as record_count FROM drivers
UNION ALL
SELECT 'dispatchers', COUNT(*) FROM dispatchers
UNION ALL
SELECT 'routes', COUNT(*) FROM routes
UNION ALL
SELECT 'route_audits', COUNT(*) FROM route_audits
UNION ALL
SELECT 'trucks', COUNT(*) FROM trucks
UNION ALL
SELECT 'trailers', COUNT(*) FROM trailers
UNION ALL
SELECT 'divisions', COUNT(*) FROM divisions
UNION ALL
SELECT 'zip_codes', COUNT(*) FROM zip_codes
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'user_permissions', COUNT(*) FROM user_permissions
UNION ALL
SELECT 'route_statuses', COUNT(*) FROM route_statuses
ORDER BY table_name; 