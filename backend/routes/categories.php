<?php
// Categories Routes - For organizing our beautiful thoughts

// Get all categories for current user
$router->addRoute('GET', '/^\/api\/categories$/', function() {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "SELECT c.id, c.name, c.color, c.created_at,
                         COUNT(DISTINCT n.id) as notes_count
                  FROM categories c
                  LEFT JOIN notes n ON c.id = n.category_id AND n.user_id = :user_id
                  WHERE c.user_id = :user_id
                  GROUP BY c.id, c.name, c.color, c.created_at
                  ORDER BY c.name ASC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convert counts to integers
        foreach ($categories as &$category) {
            $category['notes_count'] = (int)$category['notes_count'];
        }
        
        ApiResponse::success($categories, 'Your beautiful categories! 🏷️✨');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to fetch categories', 500);
    }
});

// Get single category
$router->addRoute('GET', '/^\/api\/categories\/(\d+)$/', function($categoryId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "SELECT c.*, 
                         COUNT(DISTINCT n.id) as notes_count,
                         COUNT(DISTINCT t.id) as todos_count
                  FROM categories c
                  LEFT JOIN notes n ON c.id = n.category_id
                  LEFT JOIN todos t ON c.id = t.category_id
                  WHERE c.id = :category_id AND c.user_id = :user_id
                  GROUP BY c.id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':category_id', $categoryId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($category) {
            $category['notes_count'] = (int)$category['notes_count'];
            $category['todos_count'] = (int)$category['todos_count'];
            $category['total_items'] = $category['notes_count'] + $category['todos_count'];
            ApiResponse::success($category, 'Your beautiful category! 🌸');
        } else {
            ApiResponse::error('Category not found', 404);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to fetch category', 500);
    }
});

// Create new category
$router->addRoute('POST', '/^\/api\/categories$/', function() {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!Validator::required($input['name'] ?? '')) {
        ApiResponse::error('Category name is required! ✨');
    }
    
    if (!Validator::maxLength($input['name'], 50)) {
        ApiResponse::error('Category name must be 50 characters or less');
    }
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        // Check if category name already exists for this user
        $checkQuery = "SELECT id FROM categories WHERE user_id = :user_id AND name = :name";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->bindParam(':name', $input['name']);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            ApiResponse::error('A category with this name already exists');
        }
        
        // Create the category
        $query = "INSERT INTO categories (user_id, name, color, icon) 
                  VALUES (:user_id, :name, :color, :icon)";
        
        $stmt = $db->prepare($query);
        
        $color = $input['color'] ?? '#E8B4B8'; // Dusty rose default
        $icon = $input['icon'] ?? '🌸'; // Default icon
        
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':name', $input['name']);
        $stmt->bindParam(':color', $color);
        $stmt->bindParam(':icon', $icon);
        
        if ($stmt->execute()) {
            $categoryId = $db->lastInsertId();
            
            // Get the created category
            $getQuery = "SELECT * FROM categories WHERE id = :category_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':category_id', $categoryId);
            $getStmt->execute();
            $newCategory = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            $newCategory['notes_count'] = 0;
            $newCategory['todos_count'] = 0;
            $newCategory['total_items'] = 0;
            
            ApiResponse::success($newCategory, 'Beautiful new category created! 🌸✨', 201);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to create category', 500);
    }
});

// Update category
$router->addRoute('PUT', '/^\/api\/categories\/(\d+)$/', function($categoryId) {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!Validator::required($input['name'] ?? '')) {
        ApiResponse::error('Category name is required');
    }
    
    if (!Validator::maxLength($input['name'], 50)) {
        ApiResponse::error('Category name must be 50 characters or less');
    }
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        // Check if category belongs to user
        $checkQuery = "SELECT id FROM categories WHERE id = :category_id AND user_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':category_id', $categoryId);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            ApiResponse::error('Category not found', 404);
        }
        
        // Check if name already exists for this user (excluding current category)
        $nameCheckQuery = "SELECT id FROM categories WHERE user_id = :user_id AND name = :name AND id != :category_id";
        $nameCheckStmt = $db->prepare($nameCheckQuery);
        $nameCheckStmt->bindParam(':user_id', $userId);
        $nameCheckStmt->bindParam(':name', $input['name']);
        $nameCheckStmt->bindParam(':category_id', $categoryId);
        $nameCheckStmt->execute();
        
        if ($nameCheckStmt->rowCount() > 0) {
            ApiResponse::error('A category with this name already exists');
        }
        
        // Update the category
        $query = "UPDATE categories 
                  SET name = :name, color = :color, icon = :icon
                  WHERE id = :category_id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        
        $color = $input['color'] ?? '#E8B4B8';
        $icon = $input['icon'] ?? '🌸';
        
        $stmt->bindParam(':name', $input['name']);
        $stmt->bindParam(':color', $color);
        $stmt->bindParam(':icon', $icon);
        $stmt->bindParam(':category_id', $categoryId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute()) {
            // Get updated category with counts
            $getQuery = "SELECT c.*, 
                                COUNT(DISTINCT n.id) as notes_count,
                                COUNT(DISTINCT t.id) as todos_count
                         FROM categories c
                         LEFT JOIN notes n ON c.id = n.category_id
                         LEFT JOIN todos t ON c.id = t.category_id
                         WHERE c.id = :category_id
                         GROUP BY c.id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':category_id', $categoryId);
            $getStmt->execute();
            $updatedCategory = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            $updatedCategory['notes_count'] = (int)$updatedCategory['notes_count'];
            $updatedCategory['todos_count'] = (int)$updatedCategory['todos_count'];
            $updatedCategory['total_items'] = $updatedCategory['notes_count'] + $updatedCategory['todos_count'];
            
            ApiResponse::success($updatedCategory, 'Category updated beautifully! 🌸');
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update category', 500);
    }
});

// Delete category
$router->addRoute('DELETE', '/^\/api\/categories\/(\d+)$/', function($categoryId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        // Check if category belongs to user and get item counts
        $checkQuery = "SELECT c.id, c.name,
                              COUNT(DISTINCT n.id) as notes_count,
                              COUNT(DISTINCT t.id) as todos_count
                       FROM categories c
                       LEFT JOIN notes n ON c.id = n.category_id
                       LEFT JOIN todos t ON c.id = t.category_id
                       WHERE c.id = :category_id AND c.user_id = :user_id
                       GROUP BY c.id, c.name";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':category_id', $categoryId);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->execute();
        
        $category = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$category) {
            ApiResponse::error('Category not found', 404);
        }
        
        $totalItems = (int)$category['notes_count'] + (int)$category['todos_count'];
        
        if ($totalItems > 0) {
            ApiResponse::error("Cannot delete category '{$category['name']}' because it contains {$totalItems} items. Please move or delete the items first.");
        }
        
        // Delete the category
        $query = "DELETE FROM categories WHERE id = :category_id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':category_id', $categoryId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            ApiResponse::success(null, 'Category has been gently removed 🕊️');
        } else {
            ApiResponse::error('Failed to delete category', 500);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to delete category', 500);
    }
});

// Get popular colors for categories
$router->addRoute('GET', '/^\/api\/categories\/colors$/', function() {
    Auth::requireAuth();
    
    // Return our beautiful Pinterest-inspired color palette
    $colors = [
        ['name' => 'Signature Cream', 'hex' => '#F8F6F0', 'description' => 'Your signature color'],
        ['name' => 'Dusty Rose', 'hex' => '#E8B4B8', 'description' => 'Soft and dreamy'],
        ['name' => 'Gentle Pink', 'hex' => '#F4E4E6', 'description' => 'Warm and loving'],
        ['name' => 'Lavender Touch', 'hex' => '#E6E6FA', 'description' => 'Dreamy and calm'],
        ['name' => 'Sage Green', 'hex' => '#9CAF88', 'description' => 'Nature vibes'],
        ['name' => 'Golden Hour', 'hex' => '#F5DEB3', 'description' => 'Warm and inspiring'],
        ['name' => 'Peach Whisper', 'hex' => '#FFCCCB', 'description' => 'Soft and gentle'],
        ['name' => 'Cloud White', 'hex' => '#F7F7F7', 'description' => 'Pure and clean']
    ];
    
    ApiResponse::success($colors, 'Beautiful color palette for your categories! 🎨✨');
});

// Get popular icons for categories
$router->addRoute('GET', '/^\/api\/categories\/icons$/', function() {
    Auth::requireAuth();
    
    $icons = [
        ['emoji' => '✨', 'name' => 'Sparkles', 'category' => 'Dreams & Goals'],
        ['emoji' => '🌸', 'name' => 'Cherry Blossom', 'category' => 'Memories & Love'],
        ['emoji' => '🎯', 'name' => 'Target', 'category' => 'Goals & Tasks'],
        ['emoji' => '💫', 'name' => 'Shooting Star', 'category' => 'Inspiration'],
        ['emoji' => '☀️', 'name' => 'Sun', 'category' => 'Daily Life'],
        ['emoji' => '🌙', 'name' => 'Moon', 'category' => 'Night Thoughts'],
        ['emoji' => '🌿', 'name' => 'Leaf', 'category' => 'Nature & Growth'],
        ['emoji' => '💖', 'name' => 'Heart', 'category' => 'Love & Relationships'],
        ['emoji' => '📚', 'name' => 'Books', 'category' => 'Learning & Reading'],
        ['emoji' => '🎨', 'name' => 'Art', 'category' => 'Creativity'],
        ['emoji' => '☕', 'name' => 'Coffee', 'category' => 'Daily Moments'],
        ['emoji' => '🏡', 'name' => 'House', 'category' => 'Home & Family'],
        ['emoji' => '✈️', 'name' => 'Airplane', 'category' => 'Travel & Adventure'],
        ['emoji' => '🌺', 'name' => 'Hibiscus', 'category' => 'Beauty & Wellness'],
        ['emoji' => '📝', 'name' => 'Memo', 'category' => 'Notes & Ideas'],
        ['emoji' => '🎭', 'name' => 'Theater', 'category' => 'Entertainment']
    ];
    
    ApiResponse::success($icons, 'Beautiful icons for your categories! 🌸✨');
});
?>
