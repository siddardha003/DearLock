<?php
// Temporary script to set diary PIN for a specific user
require_once 'config/database.php';

$database = new Database();
$db = $database->connect();

// Generate hash for PIN 1234
$pin = '1234';
$hashedPin = password_hash($pin, PASSWORD_DEFAULT);

echo "Generated hash: " . $hashedPin . "\n";
echo "Hash length: " . strlen($hashedPin) . "\n";

// Update user with email sarayu@gmail.com
try {
    $query = "UPDATE users SET diary_pin = :diary_pin WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':diary_pin', $hashedPin);
    $email = 'sarayu@gmail.com';
    $stmt->bindParam(':email', $email);
    
    if ($stmt->execute()) {
        echo "Successfully set diary PIN for sarayu@gmail.com\n";
        
        // Verify it was set
        $verifyQuery = "SELECT id, email, diary_pin FROM users WHERE email = :email";
        $verifyStmt = $db->prepare($verifyQuery);
        $verifyStmt->bindParam(':email', $email);
        $verifyStmt->execute();
        $user = $verifyStmt->fetch(PDO::FETCH_ASSOC);
        
        echo "Stored PIN length: " . strlen($user['diary_pin']) . "\n";
        echo "PIN starts with: " . substr($user['diary_pin'], 0, 10) . "\n";
        
        // Test verification
        if (password_verify('1234', $user['diary_pin'])) {
            echo "✅ PIN verification test passed!\n";
        } else {
            echo "❌ PIN verification test failed!\n";
        }
        
    } else {
        echo "Failed to set diary PIN\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
