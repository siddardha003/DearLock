<?php
// Todos API endpoint
require_once __DIR__ . '/../api_config.php';

Auth::requireAuth();

$database = new Database();
$db = $database->connect();
$userId = Auth::getCurrentUserId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT t.*, c.name as category_name, c.color as category_color 
                  FROM todos t 
                  LEFT JOIN categories c ON t.category_id = c.id 
                  WHERE t.user_id = :user_id 
                  ORDER BY t.is_pinned DESC, t.priority DESC, t.due_date ASC, t.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $todos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        ApiResponse::success($todos, 'Todos retrieved successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to retrieve todos: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['title'])) {
        ApiResponse::error('Title is required', 400);
    }
    
    try {
        $query = "INSERT INTO todos (user_id, title, description, category_id, priority, 
                                   due_date, reminder_datetime, created_at, updated_at) 
                  VALUES (:user_id, :title, :description, :category_id, :priority, 
                         :due_date, :reminder_datetime, NOW(), NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $data['description'] ?? null);
        $stmt->bindParam(':category_id', $data['category_id'] ?? null);
        $stmt->bindParam(':priority', $data['priority'] ?? 'medium');
        $stmt->bindParam(':due_date', $data['due_date'] ?? null);
        $stmt->bindParam(':reminder_datetime', $data['reminder_datetime'] ?? null);
        
        $stmt->execute();
        
        $todoId = $db->lastInsertId();
        
        // Get the created todo with category info
        $getQuery = "SELECT t.*, c.name as category_name, c.color as category_color 
                     FROM todos t 
                     LEFT JOIN categories c ON t.category_id = c.id 
                     WHERE t.id = :id AND t.user_id = :user_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':id', $todoId);
        $getStmt->bindParam(':user_id', $userId);
        $getStmt->execute();
        
        $todo = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        ApiResponse::success($todo, 'Todo created successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to create todo: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Get todo ID from URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    preg_match('/\/todos\/(\d+)$/', $path, $matches);
    
    if (!isset($matches[1])) {
        ApiResponse::error('Todo ID is required', 400);
    }
    
    $todoId = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        ApiResponse::error('Invalid JSON data', 400);
    }
    
    try {
        // Verify todo belongs to user
        $checkQuery = "SELECT id FROM todos WHERE id = :id AND user_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $todoId);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->execute();
        
        if (!$checkStmt->fetch()) {
            ApiResponse::error('Todo not found', 404);
        }
        
        // Build update query dynamically
        $updateFields = [];
        $params = [':id' => $todoId, ':user_id' => $userId];
        
        $allowedFields = ['title', 'description', 'category_id', 'priority', 'status', 
                         'due_date', 'reminder_datetime', 'is_pinned', 'completed_at'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
                
                // If marking as completed, set completed_at
                if ($field === 'status' && $data[$field] === 'completed') {
                    $updateFields[] = "completed_at = NOW()";
                } elseif ($field === 'status' && $data[$field] !== 'completed') {
                    $updateFields[] = "completed_at = NULL";
                }
            }
        }
        
        if (empty($updateFields)) {
            ApiResponse::error('No valid fields to update', 400);
        }
        
        $updateFields[] = "updated_at = NOW()";
        $updateQuery = "UPDATE todos SET " . implode(', ', $updateFields) . 
                      " WHERE id = :id AND user_id = :user_id";
        
        $stmt = $db->prepare($updateQuery);
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        $stmt->execute();
        
        // Get updated todo with category info
        $getQuery = "SELECT t.*, c.name as category_name, c.color as category_color 
                     FROM todos t 
                     LEFT JOIN categories c ON t.category_id = c.id 
                     WHERE t.id = :id AND t.user_id = :user_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':id', $todoId);
        $getStmt->bindParam(':user_id', $userId);
        $getStmt->execute();
        
        $todo = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        ApiResponse::success($todo, 'Todo updated successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update todo: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Get todo ID from URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    preg_match('/\/todos\/(\d+)$/', $path, $matches);
    
    if (!isset($matches[1])) {
        ApiResponse::error('Todo ID is required', 400);
    }
    
    $todoId = $matches[1];
    
    try {
        $query = "DELETE FROM todos WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $todoId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            ApiResponse::error('Todo not found', 404);
        }
        
        ApiResponse::success(null, 'Todo deleted successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to delete todo: ' . $e->getMessage(), 500);
    }
    
} else {
    ApiResponse::error('Method not allowed', 405);
}
?>
