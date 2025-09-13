<?php
// Change diary PIN endpoint
// Suppress errors to prevent HTML output
error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../api_config.php';

// Only allow PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    ApiResponse::error('Method not allowed', 405);
}

Auth::requireAuth();

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    ApiResponse::error('Invalid JSON input', 400);
}

$database = new Database();
$db = $database->connect();

try {
    $userId = Auth::getCurrentUserId();
    
    // Check if user has existing PIN
    $query = "SELECT diary_pin FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        ApiResponse::error('User not found', 404);
    }
    
    // If user has existing PIN, verify current PIN
    if (!empty($user['diary_pin'])) {
        if (!isset($input['current_pin']) || empty($input['current_pin'])) {
            ApiResponse::error('Current PIN is required', 400);
        }
        
        if (!password_verify($input['current_pin'], $user['diary_pin'])) {
            ApiResponse::error('Current PIN is incorrect', 401);
        }
    }
    
    // Validate new PIN
    if (!isset($input['new_pin']) || empty($input['new_pin'])) {
        ApiResponse::error('New PIN is required', 400);
    }
    
    if (!preg_match('/^\d{4}$/', $input['new_pin'])) {
        ApiResponse::error('PIN must be exactly 4 digits', 400);
    }
    
    if (isset($input['confirm_pin']) && $input['new_pin'] !== $input['confirm_pin']) {
        ApiResponse::error('PIN confirmation does not match', 400);
    }
    
    // Hash the new PIN
    $hashedPin = password_hash($input['new_pin'], PASSWORD_DEFAULT);
    
    // Update diary PIN
    $updateQuery = "UPDATE users SET diary_pin = :diary_pin, updated_at = NOW() WHERE id = :user_id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':diary_pin', $hashedPin);
    $updateStmt->bindParam(':user_id', $userId);
    
    if ($updateStmt->execute()) {
        ApiResponse::success(null, 'Diary PIN updated successfully!');
    } else {
        ApiResponse::error('Failed to update diary PIN', 500);
    }
    
} catch (PDOException $e) {
    error_log('Diary PIN change error: ' . $e->getMessage());
    ApiResponse::error('Failed to change diary PIN: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    error_log('General error in diary PIN change: ' . $e->getMessage());
    ApiResponse::error('An error occurred: ' . $e->getMessage(), 500);
}
?>