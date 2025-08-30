<?php
// Diary Routes - For our most precious thoughts and memories

// Get all diary entries
$router->addRoute('GET', '/^\/api\/diary$/', function() {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    
    $userId = Auth::getCurrentUserId();
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 10;
    $offset = ($page - 1) * $limit;
    
    try {
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM diary_entries WHERE user_id = :user_id";
        $countStmt = $db->prepare($countQuery);
        $countStmt->bindParam(':user_id', $userId);
        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get entries with pagination
        $query = "SELECT id, title, content, mood, weather, entry_date, is_favorite, 
                         privacy_level, created_at, updated_at 
                  FROM diary_entries 
                  WHERE user_id = :user_id 
                  ORDER BY entry_date DESC, created_at DESC 
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format entries for frontend
        foreach ($entries as &$entry) {
            $entry['content_preview'] = substr(strip_tags($entry['content']), 0, 150) . '...';
            $entry['is_favorite'] = (bool)$entry['is_favorite'];
        }
        
        ApiResponse::success([
            'entries' => $entries,
            'pagination' => [
                'current_page' => (int)$page,
                'total_pages' => ceil($total / $limit),
                'total_entries' => (int)$total,
                'limit' => (int)$limit
            ]
        ], 'Your beautiful diary entries 📖✨');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to fetch diary entries', 500);
    }
});

// Get single diary entry
$router->addRoute('GET', '/^\/api\/diary\/(\d+)$/', function($entryId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "SELECT id, title, content, mood, weather, entry_date, is_favorite, 
                         privacy_level, created_at, updated_at 
                  FROM diary_entries 
                  WHERE id = :entry_id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':entry_id', $entryId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $entry = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($entry) {
            $entry['is_favorite'] = (bool)$entry['is_favorite'];
            ApiResponse::success($entry, 'Your precious memory 🌸');
        } else {
            ApiResponse::error('Diary entry not found', 404);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to fetch diary entry', 500);
    }
});

// Create new diary entry
$router->addRoute('POST', '/^\/api\/diary$/', function() {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!Validator::required($input['title'] ?? '')) {
        ApiResponse::error('Title is required for your precious thoughts 💭');
    }
    
    if (!Validator::required($input['content'] ?? '')) {
        ApiResponse::error('Content is required - share your beautiful thoughts! ✨');
    }
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "INSERT INTO diary_entries (user_id, title, content, mood, weather, entry_date, 
                                           is_favorite, privacy_level) 
                  VALUES (:user_id, :title, :content, :mood, :weather, :entry_date, 
                          :is_favorite, :privacy_level)";
        
        $stmt = $db->prepare($query);
        
        $entryDate = $input['entry_date'] ?? date('Y-m-d');
        $mood = $input['mood'] ?? null;
        $weather = $input['weather'] ?? null;
        $isFavorite = isset($input['is_favorite']) ? (bool)$input['is_favorite'] : false;
        $privacyLevel = $input['privacy_level'] ?? 'private';
        
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':title', $input['title']);
        $stmt->bindParam(':content', $input['content']);
        $stmt->bindParam(':mood', $mood);
        $stmt->bindParam(':weather', $weather);
        $stmt->bindParam(':entry_date', $entryDate);
        $stmt->bindParam(':is_favorite', $isFavorite, PDO::PARAM_BOOL);
        $stmt->bindParam(':privacy_level', $privacyLevel);
        
        if ($stmt->execute()) {
            $entryId = $db->lastInsertId();
            
            // Get the created entry
            $getQuery = "SELECT * FROM diary_entries WHERE id = :entry_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':entry_id', $entryId);
            $getStmt->execute();
            $newEntry = $getStmt->fetch(PDO::FETCH_ASSOC);
            $newEntry['is_favorite'] = (bool)$newEntry['is_favorite'];
            
            ApiResponse::success($newEntry, 'Your beautiful thoughts have been saved! 🌸✨', 201);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to create diary entry', 500);
    }
});

// Update diary entry
$router->addRoute('PUT', '/^\/api\/diary\/(\d+)$/', function($entryId) {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!Validator::required($input['title'] ?? '')) {
        ApiResponse::error('Title is required');
    }
    
    if (!Validator::required($input['content'] ?? '')) {
        ApiResponse::error('Content is required');
    }
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        // Check if entry belongs to user
        $checkQuery = "SELECT id FROM diary_entries WHERE id = :entry_id AND user_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':entry_id', $entryId);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            ApiResponse::error('Diary entry not found', 404);
        }
        
        // Update the entry
        $query = "UPDATE diary_entries 
                  SET title = :title, content = :content, mood = :mood, weather = :weather, 
                      entry_date = :entry_date, is_favorite = :is_favorite, privacy_level = :privacy_level 
                  WHERE id = :entry_id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        
        $entryDate = $input['entry_date'] ?? date('Y-m-d');
        $mood = $input['mood'] ?? null;
        $weather = $input['weather'] ?? null;
        $isFavorite = isset($input['is_favorite']) ? (bool)$input['is_favorite'] : false;
        $privacyLevel = $input['privacy_level'] ?? 'private';
        
        $stmt->bindParam(':title', $input['title']);
        $stmt->bindParam(':content', $input['content']);
        $stmt->bindParam(':mood', $mood);
        $stmt->bindParam(':weather', $weather);
        $stmt->bindParam(':entry_date', $entryDate);
        $stmt->bindParam(':is_favorite', $isFavorite, PDO::PARAM_BOOL);
        $stmt->bindParam(':privacy_level', $privacyLevel);
        $stmt->bindParam(':entry_id', $entryId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute()) {
            // Get updated entry
            $getQuery = "SELECT * FROM diary_entries WHERE id = :entry_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':entry_id', $entryId);
            $getStmt->execute();
            $updatedEntry = $getStmt->fetch(PDO::FETCH_ASSOC);
            $updatedEntry['is_favorite'] = (bool)$updatedEntry['is_favorite'];
            
            ApiResponse::success($updatedEntry, 'Your precious thoughts have been updated! 🌸');
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update diary entry', 500);
    }
});

// Delete diary entry
$router->addRoute('DELETE', '/^\/api\/diary\/(\d+)$/', function($entryId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "DELETE FROM diary_entries WHERE id = :entry_id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':entry_id', $entryId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            ApiResponse::success(null, 'Your diary entry has been gently removed 🕊️');
        } else {
            ApiResponse::error('Diary entry not found', 404);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to delete diary entry', 500);
    }
});

// Toggle favorite status
$router->addRoute('PUT', '/^\/api\/diary\/(\d+)\/favorite$/', function($entryId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "UPDATE diary_entries SET is_favorite = NOT is_favorite 
                  WHERE id = :entry_id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':entry_id', $entryId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            // Get updated status
            $getQuery = "SELECT is_favorite FROM diary_entries WHERE id = :entry_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':entry_id', $entryId);
            $getStmt->execute();
            $result = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            $message = $result['is_favorite'] ? 'Added to favorites! 💖' : 'Removed from favorites 🤍';
            ApiResponse::success(['is_favorite' => (bool)$result['is_favorite']], $message);
        } else {
            ApiResponse::error('Diary entry not found', 404);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update favorite status', 500);
    }
});
?>
