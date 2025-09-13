-- Migration to add priority and due_date fields to todos table
-- Run this script if you have an existing database

USE dearlock_db;

-- Add priority column if it doesn't exist
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'dearlock_db' 
               AND TABLE_NAME = 'todos' 
               AND COLUMN_NAME = 'priority');

SET @sql = IF(@exist = 0, 
    'ALTER TABLE todos ADD COLUMN priority ENUM(\'low\', \'medium\', \'high\') DEFAULT \'medium\' AFTER description',
    'SELECT "Priority column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add due_date column if it doesn't exist
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'dearlock_db' 
               AND TABLE_NAME = 'todos' 
               AND COLUMN_NAME = 'due_date');

SET @sql = IF(@exist = 0, 
    'ALTER TABLE todos ADD COLUMN due_date DATE NULL AFTER priority',
    'SELECT "Due date column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes if they don't exist
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'dearlock_db' 
               AND TABLE_NAME = 'todos' 
               AND INDEX_NAME = 'idx_due_date');

SET @sql = IF(@exist = 0, 
    'ALTER TABLE todos ADD INDEX idx_due_date (due_date)',
    'SELECT "Due date index already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'dearlock_db' 
               AND TABLE_NAME = 'todos' 
               AND INDEX_NAME = 'idx_priority');

SET @sql = IF(@exist = 0, 
    'ALTER TABLE todos ADD INDEX idx_priority (priority)',
    'SELECT "Priority index already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;