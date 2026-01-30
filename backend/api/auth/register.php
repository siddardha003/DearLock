<?php
// Register endpoint
// Enable error reporting for debugging
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

$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!Validator::required($input['username'] ?? '')) {
    ApiResponse::error('Username is required');
}

if (!Validator::required($input['email'] ?? '') || !Validator::email($input['email'])) {
    ApiResponse::error('Valid email is required');
}

if (!Validator::required($input['password'] ?? '') || !Validator::minLength($input['password'], 6)) {
    ApiResponse::error('Password must be at least 6 characters');
}

if ($input['password'] !== ($input['confirm_password'] ?? '')) {
    ApiResponse::error('Passwords do not match');
}

// Connect to database with better error handling
try {
    $database = new Database();
    $db = $database->connect();
    
    if (!$db) {
        error_log("Database connection returned null");
        ApiResponse::error('Database connection failed', 500);
    }
    
    // Test the connection with a simple query
    $testStmt = $db->query("SELECT 1");
    if (!$testStmt) {
        error_log("Database connection test failed");
        ApiResponse::error('Database connection test failed', 500);
    }
    // Check if username or email already exists
    $checkQuery = "SELECT id FROM users WHERE username = :username OR email = :email";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':username', $input['username']);
    $checkStmt->bindParam(':email', $input['email']);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        ApiResponse::error('Username or email already exists');
    }
    
    // Hash password
    $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
    
    // Create user
    $query = "INSERT INTO users (username, email, password_hash, full_name) 
              VALUES (:username, :email, :password_hash, :full_name)";
    $stmt = $db->prepare($query);
    
    $fullName = $input['full_name'] ?? $input['username'];
    
    $stmt->bindParam(':username', $input['username']);
    $stmt->bindParam(':email', $input['email']);
    $stmt->bindParam(':password_hash', $passwordHash);
    $stmt->bindParam(':full_name', $fullName);
    
    if ($stmt->execute()) {
        $userId = $db->lastInsertId();
        
        // Auto-login the user
        Auth::login($userId, $input['username']);
        
        // Get user data for response
        $userQuery = "SELECT id, username, email, full_name, profile_icon, font_family, created_at FROM users WHERE id = :id";
        $userStmt = $db->prepare($userQuery);
        $userStmt->bindParam(':id', $userId);
        $userStmt->execute();
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        ApiResponse::success($user, 'Welcome to DearLock! Your sanctuary awaits 🌸');
    } else {
        ApiResponse::error('Failed to create account');
    }
} catch (Exception $e) {
    // Log the actual error for debugging
    error_log("Registration Error: " . $e->getMessage());
    ApiResponse::error('Registration failed. Please try again.', 500);
}
?>
