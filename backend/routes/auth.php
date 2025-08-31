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
        $query = "SELECT id, username, email, full_name, profile_icon, font_family, created_at 
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

// Update user profile
$router->addRoute('PUT', '/^\/api\/auth\/profile$/', function() {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $updateFields = [];
        $params = [':user_id' => $userId];
        
        // Validate and add fields to update
        if (isset($input['full_name']) && Validator::required($input['full_name'])) {
            $updateFields[] = "full_name = :full_name";
            $params[':full_name'] = $input['full_name'];
        }
        
        if (isset($input['email']) && Validator::email($input['email'])) {
            // Check if email is already taken by another user
            $checkQuery = "SELECT id FROM users WHERE email = :email AND id != :user_id";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(':email', $input['email']);
            $checkStmt->bindParam(':user_id', $userId);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                ApiResponse::error('Email is already taken by another user');
            }
            
            $updateFields[] = "email = :email";
            $params[':email'] = $input['email'];
        }
        
        if (isset($input['profile_icon']) && !empty($input['profile_icon'])) {
            $updateFields[] = "profile_icon = :profile_icon";
            $params[':profile_icon'] = $input['profile_icon'];
        }
        
        if (isset($input['font_family']) && !empty($input['font_family'])) {
            $updateFields[] = "font_family = :font_family";
            $params[':font_family'] = $input['font_family'];
        }
        
        if (empty($updateFields)) {
            ApiResponse::error('No valid fields to update');
        }
        
        $query = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = :user_id";
        $stmt = $db->prepare($query);
        
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        
        if ($stmt->execute()) {
            // Get updated user info
            $getQuery = "SELECT id, username, email, full_name, profile_icon, font_family, created_at 
                         FROM users WHERE id = :user_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':user_id', $userId);
            $getStmt->execute();
            $updatedUser = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            ApiResponse::success($updatedUser, 'Profile updated beautifully! 🌸');
        } else {
            ApiResponse::error('Failed to update profile');
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update profile', 500);
    }
});

// Change password
$router->addRoute('PUT', '/^\/api\/auth\/password$/', function() {
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
    $userId = Auth::getCurrentUserId();
    
    try {
        // Verify current password
        $query = "SELECT password_hash FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
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
        $updateStmt->bindParam(':user_id', $userId);
        
        if ($updateStmt->execute()) {
            ApiResponse::success(null, 'Password changed successfully! 🔐');
        } else {
            ApiResponse::error('Failed to change password');
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to change password', 500);
    }
});

// Get available profile icons
$router->addRoute('GET', '/^\/api\/auth\/icons$/', function() {
    $icons = [
        'avatar1.jpg', 'avatar2.jpg', 'avatar3.jpg', 'avatar4.jpg', 'avatar5.jpg', 'avatar6.jpg',
        'cat-avatar.jpg', 'dog-avatar.jpg', 'lion-avatar.jpg', 'panda-avatar.jpg'
    ];
    
    ApiResponse::success($icons, 'Available profile icons! ✨');
});

// Get available fonts
$router->addRoute('GET', '/^\/api\/auth\/fonts$/', function() {
    $fonts = [
        'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 
        'Source Sans Pro', 'Nunito', 'Raleway', 'Ubuntu'
    ];
    
    ApiResponse::success($fonts, 'Available fonts! 📝');
});

// Set diary PIN
$router->addRoute('PUT', '/^\/api\/auth\/diary-pin$/', function() {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['pin']) || !preg_match('/^\d{4}$/', $input['pin'])) {
        ApiResponse::error('PIN must be exactly 4 digits');
    }
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $pinHash = password_hash($input['pin'], PASSWORD_DEFAULT);
        $query = "UPDATE users SET diary_pin = :pin WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':pin', $pinHash);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute()) {
            ApiResponse::success(null, 'Diary PIN set successfully! 🔒');
        } else {
            ApiResponse::error('Failed to set diary PIN');
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to set diary PIN', 500);
    }
});

// Verify diary PIN
$router->addRoute('POST', '/^\/api\/auth\/verify-diary-pin$/', function() {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['pin']) || !preg_match('/^\d{4}$/', $input['pin'])) {
        ApiResponse::error('Invalid PIN format - must be exactly 4 digits');
    }
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "SELECT diary_pin FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !$user['diary_pin']) {
            ApiResponse::error('No diary PIN set. Please set a PIN first.', 400);
        }
        
        if (password_verify($input['pin'], $user['diary_pin'])) {
            // Store diary access in session
            $_SESSION['diary_access'] = time();
            ApiResponse::success(['access_granted' => true], 'Diary access granted! 📖');
        } else {
            ApiResponse::error('Incorrect PIN', 401);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to verify PIN', 500);
    }
});

// Check diary access
$router->addRoute('GET', '/^\/api\/auth\/diary-access$/', function() {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "SELECT diary_pin FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user['diary_pin']) {
            // No PIN set, allow access
            ApiResponse::success(['requires_pin' => false, 'access_granted' => true]);
        } else {
            // Check if user has access in current session (valid for 1 hour)
            $hasAccess = isset($_SESSION['diary_access']) && 
                        (time() - $_SESSION['diary_access']) < 3600;
            
            ApiResponse::success([
                'requires_pin' => true, 
                'access_granted' => $hasAccess
            ]);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to check diary access', 500);
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
