-- Migration to remove unnecessary fields from todos table
-- Run this script to simplify the todos table structure

USE dearlock_db;

-- Remove description column if it exists
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'dearlock_db' 
               AND TABLE_NAME = 'todos' 
               AND COLUMN_NAME = 'description');

SET @sql = IF(@exist > 0, 
    'ALTER TABLE todos DROP COLUMN description',
    'SELECT "Description column already removed"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remove total_steps column if it exists
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'dearlock_db' 
               AND TABLE_NAME = 'todos' 
               AND COLUMN_NAME = 'total_steps');

SET @sql = IF(@exist > 0, 
    'ALTER TABLE todos DROP COLUMN total_steps',
    'SELECT "Total steps column already removed"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remove completed_steps column if it exists
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'dearlock_db' 
               AND TABLE_NAME = 'todos' 
               AND COLUMN_NAME = 'completed_steps');

SET @sql = IF(@exist > 0, 
    'ALTER TABLE todos DROP COLUMN completed_steps',
    'SELECT "Completed steps column already removed"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show final table structure
DESCRIBE todos;