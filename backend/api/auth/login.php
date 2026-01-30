<?php
// Login endpoint
error_reporting(E_ALL);
ini_set('log_errors', 1);

// Set content type first
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../../api_config.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Configuration error',
        'error' => $e->getMessage()
    ]);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Method not allowed', 405);
}

// Get and validate input
try {
    $raw_input = file_get_contents('php://input');
    if ($raw_input === false) {
        ApiResponse::error('Failed to read input data', 400);
    }
    
    $input = json_decode($raw_input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        ApiResponse::error('Invalid JSON data: ' . json_last_error_msg(), 400);
    }
    
    if (!$input) {
        ApiResponse::error('No input data provided', 400);
    }
} catch (Exception $e) {
    error_log("Input parsing error: " . $e->getMessage());
    ApiResponse::error('Failed to process input data', 400);
}

if (!Validator::required($input['username'] ?? '')) {
    ApiResponse::error('Username is required');
}

if (!Validator::required($input['password'] ?? '')) {
    ApiResponse::error('Password is required');
}

try {
    $database = new Database();
    $db = $database->connect();
    
    if (!$db) {
        error_log("Database connection failed in login");
        ApiResponse::error('Database connection failed', 500);
    }

try {
    // Find user by username or email
    $query = "SELECT id, username, email, password_hash, full_name, profile_icon 
              FROM users WHERE username = :login1 OR email = :login2";
    $stmt = $db->prepare($query);
    $loginValue = $input['username'];
    $stmt->bindParam(':login1', $loginValue);
    $stmt->bindParam(':login2', $loginValue);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($input['password'], $user['password_hash'])) {
        // Login successful
        Auth::login($user['id'], $user['username']);
        
        // Remove password hash from response
        unset($user['password_hash']);
        
        ApiResponse::success($user, 'Welcome back to your sanctuary! 🌸');
    } else {
        ApiResponse::error('Invalid username or password', 401);
    }
} catch (PDOException $e) {
    error_log("Login database error: " . $e->getMessage());
    ApiResponse::error('Login failed: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    ApiResponse::error('Login failed', 500);
}
} catch (Exception $e) {
    error_log("Login outer error: " . $e->getMessage());
    ApiResponse::error('Login failed', 500);
}
?>
