<?php
// Simple API configuration without router
// Start session with secure settings
session_start([
    'cookie_lifetime' => 86400, // 24 hours
    'cookie_secure' => false,   // Set to true in production with HTTPS
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict'
]);

// Set headers for API responses
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost'); // Changed from * to specific origin
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once __DIR__ . '/config/database.php';

// API Response helper class
class ApiResponse {
    public static function success($data = null, $message = 'Success', $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    
    public static function error($message = 'Error', $code = 400, $errors = null) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
}

// Authentication helper class
class Auth {
    public static function requireAuth() {
        if (!isset($_SESSION['user_id'])) {
            ApiResponse::error('Authentication required', 401);
        }
    }
    
    public static function getCurrentUserId() {
        return $_SESSION['user_id'] ?? null;
    }
    
    public static function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }
    
    public static function login($user_id, $username) {
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username;
        $_SESSION['last_activity'] = time();
    }
    
    public static function logout() {
        session_destroy();
    }
}

// Input validation helper
class Validator {
    public static function email($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    }
    
    public static function required($value) {
        return !empty(trim($value));
    }
    
    public static function minLength($value, $length) {
        return strlen(trim($value)) >= $length;
    }
    
    public static function maxLength($value, $length) {
        return strlen(trim($value)) <= $length;
    }
}
?>
