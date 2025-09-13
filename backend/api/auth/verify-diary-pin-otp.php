<?php
// Verify OTP and reset diary PIN
// Suppress errors to prevent HTML output
error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../api_config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    
    // Validate OTP
    if (!isset($input['otp']) || empty($input['otp'])) {
        ApiResponse::error('OTP is required', 400);
    }
    
    if (!isset($_SESSION['diary_pin_otp'])) {
        ApiResponse::error('No OTP found. Please request a new OTP', 400);
    }
    
    $otpData = $_SESSION['diary_pin_otp'];
    
    // Check if OTP is expired
    if (time() > strtotime($otpData['expiry'])) {
        unset($_SESSION['diary_pin_otp']);
        ApiResponse::error('OTP has expired. Please request a new OTP', 400);
    }
    
    // Check if OTP belongs to current user
    if ($otpData['user_id'] != $userId) {
        ApiResponse::error('Invalid OTP session', 400);
    }
    
    // Verify OTP
    if ($input['otp'] !== $otpData['code']) {
        ApiResponse::error('Invalid OTP', 400);
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
        // Clear OTP from session
        unset($_SESSION['diary_pin_otp']);
        ApiResponse::success(null, 'Diary PIN reset successfully!');
    } else {
        ApiResponse::error('Failed to reset diary PIN', 500);
    }
    
} catch (PDOException $e) {
    error_log('OTP verification error: ' . $e->getMessage());
    ApiResponse::error('Failed to verify OTP: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    error_log('General error in OTP verification: ' . $e->getMessage());
    ApiResponse::error('An error occurred: ' . $e->getMessage(), 500);
}
?>