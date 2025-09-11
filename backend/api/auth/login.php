<?php
// Login endpoint
require_once __DIR__ . '/../../api_config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!Validator::required($input['username'] ?? '')) {
    ApiResponse::error('Username is required');
}

if (!Validator::required($input['password'] ?? '')) {
    ApiResponse::error('Password is required');
}

$database = new Database();
$db = $database->connect();

try {
    // Find user by username or email
    $query = "SELECT id, username, email, password_hash, full_name, profile_icon 
              FROM users WHERE username = :login OR email = :login";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':login', $input['username']);
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
    ApiResponse::error('Login failed', 500);
}
?>
