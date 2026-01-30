<?php
// Notes API endpoint
error_reporting(E_ALL);
ini_set('log_errors', 1);

try {
    require_once __DIR__ . '/../api_config.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Configuration error', 'error' => $e->getMessage()]);
    exit;
}

Auth::requireAuth();

try {
    $database = new Database();
    $db = $database->connect();
    if (!$db) {
        error_log("Database connection failed in notes.php");
        ApiResponse::error('Database connection failed', 500);
    }
} catch (Exception $e) {
    error_log("Database error in notes.php: " . $e->getMessage());
    ApiResponse::error('Database error', 500);
}
$userId = Auth::getCurrentUserId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT * FROM notes 
                  WHERE user_id = :user_id 
                  ORDER BY is_pinned DESC, created_at DESC";
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
        $query = "INSERT INTO notes (user_id, title, content, created_at, updated_at) 
                  VALUES (:user_id, :title, :content, NOW(), NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':content', $data['content']);
        
        $stmt->execute();
        $noteId = $db->lastInsertId();
        
        // Get the created note
        $getQuery = "SELECT * FROM notes WHERE id = :id AND user_id = :user_id";
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
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['id'])) {
        ApiResponse::error('Note ID is required', 400);
    }
    
    $noteId = $data['id'];
    
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
        
        $allowedFields = ['title', 'content', 'is_pinned'];
        
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
        
        // Get updated note
        $getQuery = "SELECT * FROM notes WHERE id = :id AND user_id = :user_id";
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
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['id'])) {
        ApiResponse::error('Note ID is required', 400);
    }
    
    $noteId = $data['id'];
    
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