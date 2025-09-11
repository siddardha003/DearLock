<?php
// Verify diary PIN endpoint
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

$database = new Database();
$db = $database->connect();

try {
    $query = "SELECT diary_pin FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $userId = Auth::getCurrentUserId();
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        ApiResponse::error('User not found', 404);
    }
    
    if (empty($user['diary_pin']) || is_null($user['diary_pin'])) {
        ApiResponse::error('No diary PIN set. Please set a PIN first.', 404);
    }
    
    if (password_verify($input['pin'], $user['diary_pin'])) {
        // Store diary access in session
        $_SESSION['diary_unlocked'] = true;
        $_SESSION['diary_unlock_time'] = time();
        
        ApiResponse::success(null, 'Diary access granted! 📖✨');
    } else {
        ApiResponse::error('Incorrect PIN. Please try again.', 401);
    }
} catch (PDOException $e) {
    ApiResponse::error('Failed to verify PIN', 500);
}
?>
