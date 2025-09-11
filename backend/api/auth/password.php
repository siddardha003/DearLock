<?php
// Change password endpoint
require_once __DIR__ . '/../../api_config.php';

// Only allow PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    ApiResponse::error('Method not allowed', 405);
}

Auth::requireAuth();

$input = json_decode(file_get_contents('php://input'), true);

if (!Validator::required($input['current_password'] ?? '')) {
    ApiResponse::error('Current password is required');
}

if (!Validator::required($input['new_password'] ?? '') || !Validator::minLength($input['new_password'], 6)) {
    ApiResponse::error('New password must be at least 6 characters');
}

if ($input['new_password'] !== ($input['confirm_password'] ?? '')) {
    ApiResponse::error('New passwords do not match');
}

$database = new Database();
$db = $database->connect();

try {
    // Verify current password
    $query = "SELECT password_hash FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', Auth::getCurrentUserId());
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !password_verify($input['current_password'], $user['password_hash'])) {
        ApiResponse::error('Current password is incorrect', 401);
    }
    
    // Update password
    $newPasswordHash = password_hash($input['new_password'], PASSWORD_DEFAULT);
    $updateQuery = "UPDATE users SET password_hash = :password_hash WHERE id = :user_id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':password_hash', $newPasswordHash);
    $updateStmt->bindParam(':user_id', Auth::getCurrentUserId());
    
    if ($updateStmt->execute()) {
        ApiResponse::success(null, 'Password changed successfully!');
    } else {
        ApiResponse::error('Failed to change password');
    }
} catch (PDOException $e) {
    ApiResponse::error('Failed to change password', 500);
}
?>
