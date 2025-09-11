<?php
// Detailed database test
require_once 'config/database.php';

echo "<h2>Database Connection Test</h2>";

try {
    $database = new Database();
    $db = $database->connect();
    
    if ($db) {
        echo "<p style='color: green;'>✅ Database connection successful!</p>";
        
        // Test if database exists
        $stmt = $db->query("SELECT DATABASE() as current_db");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "<p>Current database: " . $result['current_db'] . "</p>";
        
        // List all tables
        $stmt = $db->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "<h3>Tables in database:</h3>";
        if (count($tables) > 0) {
            echo "<ul>";
            foreach ($tables as $table) {
                echo "<li>$table</li>";
            }
            echo "</ul>";
        } else {
            echo "<p style='color: red;'>❌ No tables found in database!</p>";
        }
        
        // Check if users table exists and has the right structure
        if (in_array('users', $tables)) {
            echo "<h3>Users table structure:</h3>";
            $stmt = $db->query("DESCRIBE users");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo "<table border='1'>";
            echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
            foreach ($columns as $column) {
                echo "<tr>";
                echo "<td>" . $column['Field'] . "</td>";
                echo "<td>" . $column['Type'] . "</td>";
                echo "<td>" . $column['Null'] . "</td>";
                echo "<td>" . $column['Key'] . "</td>";
                echo "<td>" . $column['Default'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
        
    } else {
        echo "<p style='color: red;'>❌ Database connection failed!</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}
?>
