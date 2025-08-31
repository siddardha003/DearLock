<?php
// Notes Routes - For our quick beautiful thoughts and ideas

// Get all notes
$router->addRoute('GET', '/^\/api\/notes$/', function() {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    
    $userId = Auth::getCurrentUserId();
    $categoryId = $_GET['category'] ?? null;
    $noteType = $_GET['type'] ?? null;
    $search = $_GET['search'] ?? null;
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 20;
    $offset = ($page - 1) * $limit;
    
    try {
        // Build query conditions
        $conditions = ["n.user_id = :user_id"];
        $params = [':user_id' => $userId];
        
        if ($categoryId) {
            $conditions[] = "n.category_id = :category_id";
            $params[':category_id'] = $categoryId;
        }
        
        if ($noteType) {
            $conditions[] = "n.note_type = :note_type";
            $params[':note_type'] = $noteType;
        }
        
        if ($search) {
            $conditions[] = "(n.title LIKE :search OR n.content LIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        $whereClause = implode(' AND ', $conditions);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM notes n WHERE $whereClause";
        $countStmt = $db->prepare($countQuery);
        foreach ($params as $param => $value) {
            $countStmt->bindValue($param, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get notes with category info
        $query = "SELECT n.id, n.title, n.content, n.background_image, n.is_pinned, 
                         n.created_at, n.updated_at,
                         c.name as category_name, c.color as category_color
                  FROM notes n
                  LEFT JOIN categories c ON n.category_id = c.id
                  WHERE $whereClause
                  ORDER BY n.is_pinned DESC, n.updated_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $db->prepare($query);
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format notes for frontend
        foreach ($notes as &$note) {
            $note['content_preview'] = substr(strip_tags($note['content']), 0, 100) . '...';
            $note['is_pinned'] = (bool)$note['is_pinned'];
        }
        
        ApiResponse::success([
            'notes' => $notes,
            'pagination' => [
                'current_page' => (int)$page,
                'total_pages' => ceil($total / $limit),
                'total_notes' => (int)$total,
                'limit' => (int)$limit
            ]
        ], 'Your beautiful collection of thoughts! 🌸✨');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to fetch notes', 500);
    }
});

// Get single note
$router->addRoute('GET', '/^\/api\/notes\/(\d+)$/', function($noteId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "SELECT n.*, c.name as category_name, c.color as category_color
                  FROM notes n
                  LEFT JOIN categories c ON n.category_id = c.id
                  WHERE n.id = :note_id AND n.user_id = :user_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':note_id', $noteId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $note = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($note) {
            $note['is_pinned'] = (bool)$note['is_pinned'];
            ApiResponse::success($note, 'Your beautiful note! 🌸');
        } else {
            ApiResponse::error('Note not found', 404);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to fetch note', 500);
    }
});

// Create new note
$router->addRoute('POST', '/^\/api\/notes$/', function() {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!Validator::required($input['title'] ?? '')) {
        ApiResponse::error('Title is required for your note ✨');
    }
    
    if (!Validator::required($input['content'] ?? '')) {
        ApiResponse::error('Content is required - share your thoughts! 💭');
    }
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "INSERT INTO notes (user_id, category_id, title, content, background_image, is_pinned) 
                  VALUES (:user_id, :category_id, :title, :content, :background_image, :is_pinned)";
        
        $stmt = $db->prepare($query);
        
        $categoryId = !empty($input['category_id']) ? $input['category_id'] : null;
        $backgroundImage = $input['background_image'] ?? null;
        $isPinned = isset($input['is_pinned']) ? (bool)$input['is_pinned'] : false;
        
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':category_id', $categoryId);
        $stmt->bindParam(':title', $input['title']);
        $stmt->bindParam(':content', $input['content']);
        $stmt->bindParam(':background_image', $backgroundImage);
        $stmt->bindParam(':is_pinned', $isPinned, PDO::PARAM_BOOL);
        
        if ($stmt->execute()) {
            $noteId = $db->lastInsertId();
            
            // Get the created note with category info
            $getQuery = "SELECT n.*, c.name as category_name, c.color as category_color
                         FROM notes n
                         LEFT JOIN categories c ON n.category_id = c.id
                         WHERE n.id = :note_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':note_id', $noteId);
            $getStmt->execute();
            $newNote = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            $newNote['is_pinned'] = (bool)$newNote['is_pinned'];
            
            ApiResponse::success($newNote, 'Your beautiful note has been saved! 🌸✨', 201);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to create note', 500);
    }
});

// Update note
$router->addRoute('PUT', '/^\/api\/notes\/(\d+)$/', function($noteId) {
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
        // Check if note belongs to user
        $checkQuery = "SELECT id FROM notes WHERE id = :note_id AND user_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':note_id', $noteId);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            ApiResponse::error('Note not found', 404);
        }
        
        // Update the note
        $query = "UPDATE notes 
                  SET title = :title, content = :content, category_id = :category_id, 
                      background_image = :background_image, is_pinned = :is_pinned
                  WHERE id = :note_id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        
        $categoryId = !empty($input['category_id']) ? $input['category_id'] : null;
        $backgroundImage = $input['background_image'] ?? null;
        $isPinned = isset($input['is_pinned']) ? (bool)$input['is_pinned'] : false;
        
        $stmt->bindParam(':title', $input['title']);
        $stmt->bindParam(':content', $input['content']);
        $stmt->bindParam(':category_id', $categoryId);
        $stmt->bindParam(':background_image', $backgroundImage);
        $stmt->bindParam(':is_pinned', $isPinned, PDO::PARAM_BOOL);
        $stmt->bindParam(':note_id', $noteId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute()) {
            // Get updated note
            $getQuery = "SELECT n.*, c.name as category_name, c.color as category_color
                         FROM notes n
                         LEFT JOIN categories c ON n.category_id = c.id
                         WHERE n.id = :note_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':note_id', $noteId);
            $getStmt->execute();
            $updatedNote = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            $updatedNote['is_pinned'] = (bool)$updatedNote['is_pinned'];
            
            ApiResponse::success($updatedNote, 'Your beautiful note has been updated! 🌸');
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update note', 500);
    }
});

// Delete note
$router->addRoute('DELETE', '/^\/api\/notes\/(\d+)$/', function($noteId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "DELETE FROM notes WHERE id = :note_id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':note_id', $noteId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            ApiResponse::success(null, 'Your note has been gently removed 🕊️');
        } else {
            ApiResponse::error('Note not found', 404);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to delete note', 500);
    }
});

// Toggle pin status
$router->addRoute('PUT', '/^\/api\/notes\/(\d+)\/pin$/', function($noteId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "UPDATE notes SET is_pinned = NOT is_pinned 
                  WHERE id = :note_id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':note_id', $noteId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            // Get updated status
            $getQuery = "SELECT is_pinned FROM notes WHERE id = :note_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':note_id', $noteId);
            $getStmt->execute();
            $result = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            $message = $result['is_pinned'] ? 'Note pinned! 📌' : 'Note unpinned 🤍';
            ApiResponse::success(['is_pinned' => (bool)$result['is_pinned']], $message);
        } else {
            ApiResponse::error('Note not found', 404);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update pin status', 500);
    }
});
?>
