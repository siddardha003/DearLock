<?php
// Database Setup Script for DearLock
// This script will create the database and tables

// Connection without database to create it
$host = 'localhost';
$username = 'root';
$password = '';
$database_name = 'dearlock_db';

try {
    // Connect to MySQL server (without specifying database)
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$database_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "Database '$database_name' created successfully or already exists.<br>";
    
    // Connect to the specific database
    $pdo = new PDO("mysql:host=$host;dbname=$database_name", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Read and execute the schema file
    $schemaPath = __DIR__ . '/database/schema.sql';
    if (file_exists($schemaPath)) {
        $schema = file_get_contents($schemaPath);
        
        // Split the schema into individual statements
        $statements = explode(';', $schema);
        
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement)) {
                try {
                    $pdo->exec($statement);
                    echo "Executed: " . substr($statement, 0, 50) . "...<br>";
                } catch (PDOException $e) {
                    echo "Error executing statement: " . $e->getMessage() . "<br>";
                    echo "Statement: " . substr($statement, 0, 100) . "...<br>";
                }
            }
        }
        
        echo "<br><strong>Database setup completed successfully!</strong><br>";
        echo "<a href='api/test'>Test API</a> | <a href='api/db-test'>Test Database</a>";
        
    } else {
        echo "Schema file not found: $schemaPath<br>";
    }
    
} catch (PDOException $e) {
    echo "Database setup error: " . $e->getMessage() . "<br>";
}
?>
