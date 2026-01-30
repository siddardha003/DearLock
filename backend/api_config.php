<?php
// Simple API configuration without router
// Prevent any output before headers
ob_start();

// Start session with secure settings
$isProduction = $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?? 'development';

// More flexible session configuration for Railway
$sessionConfig = [
    'cookie_lifetime' => 86400, // 24 hours
    'cookie_httponly' => true,
    'cookie_path' => '/',
    'use_cookies' => 1,
    'use_only_cookies' => 1,
];

// Only use secure/samesite settings if in production
if ($isProduction === 'production') {
    // Railway uses HTTPS by default, so always set secure in production
    $sessionConfig['cookie_secure'] = true;
    $sessionConfig['cookie_samesite'] = 'None'; // Required for cross-origin requests
    
    // Use a custom session name for better tracking
    $sessionConfig['name'] = 'DEARLOCK_SESSION';
}

try {
    session_start($sessionConfig);
    error_log("Session started. Session ID: " . session_id() . ", User ID: " . ($_SESSION['user_id'] ?? 'not set'));
} catch (Exception $e) {
    error_log("Session start error: " . $e->getMessage());
    // Continue without session for API endpoints that don't require it
}

// Set headers for API responses
$allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1',
    'https://dearlock.netlify.app'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://dearlock.netlify.app');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
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
        ob_clean(); // Clear any output buffer
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
        ob_clean(); // Clear any output buffer
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
        // Log session state for debugging
        error_log("Auth check - Session ID: " . session_id() . ", User ID: " . ($_SESSION['user_id'] ?? 'not set'));
        error_log("Session data: " . json_encode($_SESSION));
        
        // Check if session exists
        if (!isset($_SESSION['user_id'])) {
            error_log("Authentication failed - no user_id in session");
            ApiResponse::error('Authentication required. Please log in again.', 401);
        }
        
        // Check for session timeout (optional - 24 hours)
        if (isset($_SESSION['last_activity'])) {
            $timeout = 24 * 60 * 60; // 24 hours
            if (time() - $_SESSION['last_activity'] > $timeout) {
                error_log("Session expired for user: " . $_SESSION['user_id']);
                session_destroy();
                ApiResponse::error('Session expired', 401);
            }
        }
        
        // Update last activity
        $_SESSION['last_activity'] = time();
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
        error_log("User logged in - ID: $user_id, Session ID: " . session_id());
        error_log("Session after login: " . json_encode($_SESSION));
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
