<?php
// Notes API endpoint
require_once __DIR__ . '/../api_config.php';

Auth::requireAuth();

$database = new Database();
$db = $database->connect();
$userId = Auth::getCurrentUserId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT n.*, c.name as category_name, c.color as category_color 
                  FROM notes n 
                  LEFT JOIN categories c ON n.category_id = c.id 
                  WHERE n.user_id = :user_id 
                  ORDER BY n.is_pinned DESC, n.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        ApiResponse::success($notes, 'Notes retrieved successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to retrieve notes: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['title']) || !isset($data['content'])) {
        ApiResponse::error('Title and content are required', 400);
    }
    
    try {
        $query = "INSERT INTO notes (user_id, title, content, category_id, note_type, 
                                   color_theme, created_at, updated_at) 
                  VALUES (:user_id, :title, :content, :category_id, :note_type, 
                         :color_theme, NOW(), NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':category_id', $data['category_id'] ?? null);
        $stmt->bindParam(':note_type', $data['note_type'] ?? 'text');
        $stmt->bindParam(':color_theme', $data['color_theme'] ?? 'default');
        
        $stmt->execute();
        
        $noteId = $db->lastInsertId();
        
        // Get the created note with category info
        $getQuery = "SELECT n.*, c.name as category_name, c.color as category_color 
                     FROM notes n 
                     LEFT JOIN categories c ON n.category_id = c.id 
                     WHERE n.id = :id AND n.user_id = :user_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':id', $noteId);
        $getStmt->bindParam(':user_id', $userId);
        $getStmt->execute();
        
        $note = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        ApiResponse::success($note, 'Note created successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to create note: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Get note ID from URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    preg_match('/\/notes\/(\d+)$/', $path, $matches);
    
    if (!isset($matches[1])) {
        ApiResponse::error('Note ID is required', 400);
    }
    
    $noteId = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        ApiResponse::error('Invalid JSON data', 400);
    }
    
    try {
        // Verify note belongs to user
        $checkQuery = "SELECT id FROM notes WHERE id = :id AND user_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $noteId);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->execute();
        
        if (!$checkStmt->fetch()) {
            ApiResponse::error('Note not found', 404);
        }
        
        // Build update query dynamically
        $updateFields = [];
        $params = [':id' => $noteId, ':user_id' => $userId];
        
        $allowedFields = ['title', 'content', 'category_id', 'note_type', 'is_pinned', 
                         'is_favorited', 'color_theme'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            ApiResponse::error('No valid fields to update', 400);
        }
        
        $updateFields[] = "updated_at = NOW()";
        $updateQuery = "UPDATE notes SET " . implode(', ', $updateFields) . 
                      " WHERE id = :id AND user_id = :user_id";
        
        $stmt = $db->prepare($updateQuery);
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        $stmt->execute();
        
        // Get updated note with category info
        $getQuery = "SELECT n.*, c.name as category_name, c.color as category_color 
                     FROM notes n 
                     LEFT JOIN categories c ON n.category_id = c.id 
                     WHERE n.id = :id AND n.user_id = :user_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':id', $noteId);
        $getStmt->bindParam(':user_id', $userId);
        $getStmt->execute();
        
        $note = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        ApiResponse::success($note, 'Note updated successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update note: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Get note ID from URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    preg_match('/\/notes\/(\d+)$/', $path, $matches);
    
    if (!isset($matches[1])) {
        ApiResponse::error('Note ID is required', 400);
    }
    
    $noteId = $matches[1];
    
    try {
        $query = "DELETE FROM notes WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $noteId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            ApiResponse::error('Note not found', 404);
        }
        
        ApiResponse::success(null, 'Note deleted successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to delete note: ' . $e->getMessage(), 500);
    }
    
} else {
    ApiResponse::error('Method not allowed', 405);
}
?>
