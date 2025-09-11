<?php
// Test database connection
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->connect();
    
    if ($db) {
        echo "Database connection successful!\n";
        
        // Test if the users table exists
        $stmt = $db->query("SHOW TABLES LIKE 'users'");
        if ($stmt->rowCount() > 0) {
            echo "Users table exists!\n";
        } else {
            echo "Users table NOT found!\n";
        }
    } else {
        echo "Database connection failed!\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
