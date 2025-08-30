<?php
// Authentication Routes for our dreamy DearLock app

// Register new user - Creating a beautiful new soul
$router->addRoute('POST', '/^\/api\/auth\/register$/', function() {
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
    
    // Connect to database
    $database = new Database();
    $db = $database->connect();
    
    try {
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
        $query = "INSERT INTO users (username, email, password_hash, full_name, bio) 
                  VALUES (:username, :email, :password_hash, :full_name, :bio)";
        $stmt = $db->prepare($query);
        
        $fullName = $input['full_name'] ?? '';
        $bio = $input['bio'] ?? 'Living life one beautiful moment at a time 🌸✨';
        
        $stmt->bindParam(':username', $input['username']);
        $stmt->bindParam(':email', $input['email']);
        $stmt->bindParam(':password_hash', $passwordHash);
        $stmt->bindParam(':full_name', $fullName);
        $stmt->bindParam(':bio', $bio);
        
        if ($stmt->execute()) {
            $userId = $db->lastInsertId();
            
            // Create default categories for new user
            $defaultCategories = [
                ['Dreams', '#E8B4B8', '✨'],
                ['Memories', '#F4E4E6', '🌸'],
                ['Goals', '#F8F6F0', '🎯'],
                ['Inspiration', '#E8B4B8', '💫'],
                ['Daily Life', '#F4E4E6', '☀️']
            ];
            
            $catQuery = "INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)";
            $catStmt = $db->prepare($catQuery);
            
            foreach ($defaultCategories as $category) {
                $catStmt->execute([$userId, $category[0], $category[1], $category[2]]);
            }
            
            // Auto-login the user
            Auth::login($userId, $input['username']);
            
            ApiResponse::success([
                'user_id' => $userId,
                'username' => $input['username'],
                'email' => $input['email']
            ], 'Welcome to your dreamy sanctuary! 🌸✨');
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Registration failed', 500);
    }
});

// Login user - Welcome back to your sanctuary
$router->addRoute('POST', '/^\/api\/auth\/login$/', function() {
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
        $query = "SELECT id, username, email, password_hash, full_name, profile_image, bio 
                  FROM users WHERE username = :login OR email = :login";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':login', $input['username']);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($input['password'], $user['password_hash'])) {
            // Login successful
            Auth::login($user['id'], $user['username']);
            
            // Return user data (without password)
            unset($user['password_hash']);
            
            ApiResponse::success($user, 'Welcome back, beautiful soul! 🌸');
        } else {
            ApiResponse::error('Invalid username or password', 401);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Login failed', 500);
    }
});

// Get current user info - Who am I?
$router->addRoute('GET', '/^\/api\/auth\/me$/', function() {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    
    try {
        $query = "SELECT id, username, email, full_name, profile_image, bio, favorite_color, created_at 
                  FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            ApiResponse::success($user, 'Here you are, beautiful! 🌸');
        } else {
            ApiResponse::error('User not found', 404);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to get user info', 500);
    }
});

// Logout user - Sweet dreams
$router->addRoute('POST', '/^\/api\/auth\/logout$/', function() {
    Auth::requireAuth();
    Auth::logout();
    ApiResponse::success(null, 'Sweet dreams! See you soon 🌙✨');
});

// Check authentication status
$router->addRoute('GET', '/^\/api\/auth\/status$/', function() {
    if (Auth::isLoggedIn()) {
        ApiResponse::success([
            'authenticated' => true,
            'user_id' => Auth::getCurrentUserId()
        ]);
    } else {
        ApiResponse::success([
            'authenticated' => false
        ]);
    }
});
?>
