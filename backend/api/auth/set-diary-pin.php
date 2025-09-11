<?php
// Set diary PIN endpoint
require_once __DIR__ . '/../../api_config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Method not allowed', 405);
}

Auth::requireAuth();

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['pin']) || !preg_match('/^\d{4}$/', $input['pin'])) {
    ApiResponse::error('Invalid PIN format - must be exactly 4 digits');
}

if (!isset($input['confirm_pin']) || $input['pin'] !== $input['confirm_pin']) {
    ApiResponse::error('PIN confirmation does not match');
}

$database = new Database();
$db = $database->connect();

try {
    // Hash the PIN for security
    $hashedPin = password_hash($input['pin'], PASSWORD_DEFAULT);
    
    $query = "UPDATE users SET diary_pin = :diary_pin WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':diary_pin', $hashedPin);
    $userId = Auth::getCurrentUserId();
    $stmt->bindParam(':user_id', $userId);
    
    if ($stmt->execute()) {
        // Automatically unlock diary after setting PIN
        $_SESSION['diary_unlocked'] = true;
        $_SESSION['diary_unlock_time'] = time();
        
        ApiResponse::success(null, 'Diary PIN set successfully! Your diary is now protected 🔒✨');
    } else {
        ApiResponse::error('Failed to set diary PIN');
    }
} catch (PDOException $e) {
    ApiResponse::error('Failed to set PIN', 500);
}
?>
