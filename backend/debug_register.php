<?php
// Debug register endpoint
require_once __DIR__ . '/api_config.php';

echo "<h2>Debug Registration Process</h2>";

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Simulate POST data
$_SERVER['REQUEST_METHOD'] = 'POST';
$testInput = [
    'username' => 'debuguser',
    'email' => 'debug@example.com', 
    'password' => 'password123',
    'confirm_password' => 'password123'
];

echo "<h3>Step 1: Input validation</h3>";
if (!Validator::required($testInput['username'] ?? '') || !Validator::minLength($testInput['username'], 3)) {
    echo "<p style='color: red;'>❌ Username validation failed</p>";
} else {
    echo "<p style='color: green;'>✅ Username validation passed</p>";
}

if (!Validator::email($testInput['email'] ?? '')) {
    echo "<p style='color: red;'>❌ Email validation failed</p>";
} else {
    echo "<p style='color: green;'>✅ Email validation passed</p>";
}

echo "<h3>Step 2: Database connection</h3>";
try {
    $database = new Database();
    $db = $database->connect();
    
    if ($db) {
        echo "<p style='color: green;'>✅ Database connection successful</p>";
        
        echo "<h3>Step 3: Check existing users</h3>";
        $checkQuery = "SELECT id FROM users WHERE username = :username OR email = :email";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':username', $testInput['username']);
        $checkStmt->bindParam(':email', $testInput['email']);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            echo "<p style='color: orange;'>⚠️ User already exists</p>";
        } else {
            echo "<p style='color: green;'>✅ User doesn't exist, can proceed</p>";
            
            echo "<h3>Step 4: Create user</h3>";
            $passwordHash = password_hash($testInput['password'], PASSWORD_DEFAULT);
            $fullName = $testInput['username'];
            $bio = 'Living life one beautiful moment at a time 🌸✨';
            
            $query = "INSERT INTO users (username, email, password_hash, full_name, bio) 
                      VALUES (:username, :email, :password_hash, :full_name, :bio)";
            $stmt = $db->prepare($query);
            
            $stmt->bindParam(':username', $testInput['username']);
            $stmt->bindParam(':email', $testInput['email']);
            $stmt->bindParam(':password_hash', $passwordHash);
            $stmt->bindParam(':full_name', $fullName);
            $stmt->bindParam(':bio', $bio);
            
            if ($stmt->execute()) {
                echo "<p style='color: green;'>✅ User created successfully!</p>";
                $userId = $db->lastInsertId();
                echo "<p>New user ID: $userId</p>";
            } else {
                echo "<p style='color: red;'>❌ Failed to create user</p>";
                print_r($stmt->errorInfo());
            }
        }
        
    } else {
        echo "<p style='color: red;'>❌ Database connection failed</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Exception: " . $e->getMessage() . "</p>";
    echo "<p>Stack trace:</p><pre>" . $e->getTraceAsString() . "</pre>";
}
?>
