<?php
// Profile endpoints (me, update profile)
require_once __DIR__ . '/../../api_config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get current user profile
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    
    try {
        $query = "SELECT id, username, email, full_name, profile_icon, font_family, created_at, 
                  CASE WHEN diary_pin IS NOT NULL AND diary_pin != '' THEN 1 ELSE 0 END as has_diary_pin 
                  FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $userId = Auth::getCurrentUserId();
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            ApiResponse::success($user, 'Profile retrieved successfully');
        } else {
            ApiResponse::error('User not found', 404);
        }
    } catch (PDOException $e) {
        ApiResponse::error('Failed to retrieve profile', 500);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update user profile
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $database = new Database();
    $db = $database->connect();
    
    try {
        $updateFields = [];
        $params = [':user_id' => Auth::getCurrentUserId()];
        
        if (isset($input['full_name']) && !empty($input['full_name'])) {
            $updateFields[] = "full_name = :full_name";
            $params[':full_name'] = $input['full_name'];
        }
        
        if (isset($input['email']) && !empty($input['email'])) {
            if (!Validator::email($input['email'])) {
                ApiResponse::error('Invalid email format');
            }
            $updateFields[] = "email = :email";
            $params[':email'] = $input['email'];
        }
        
        if (empty($updateFields)) {
            ApiResponse::error('No fields to update');
        }
        
        $query = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = :user_id";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute($params)) {
            // Get updated user data
            $userQuery = "SELECT id, username, email, full_name, bio, profile_icon, font_family FROM users WHERE id = :id";
            $userStmt = $db->prepare($userQuery);
            $userId = Auth::getCurrentUserId();
            $userStmt->bindParam(':id', $userId);
            $userStmt->execute();
            $updatedUser = $userStmt->fetch(PDO::FETCH_ASSOC);
            
            ApiResponse::success($updatedUser, 'Profile updated successfully!');
        } else {
            ApiResponse::error('Failed to update profile');
        }
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update profile', 500);
    }

} else {
    ApiResponse::error('Method not allowed', 405);
}
?>
