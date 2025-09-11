<?php
// Check existing users
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->connect();

try {
    $query = "SELECT id, username, email, full_name FROM users LIMIT 5";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Existing users:\n";
    foreach ($users as $user) {
        echo "ID: {$user['id']}, Username: {$user['username']}, Email: {$user['email']}, Name: {$user['full_name']}\n";
    }
    
    if (count($users) == 0) {
        echo "No users found in database.\n";
    }
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?>
