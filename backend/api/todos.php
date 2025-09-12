<?php
// Todos API endpoint
require_once __DIR__ . '/../api_config.php';

Auth::requireAuth();

$database = new Database();
$db = $database->connect();
$userId = Auth::getCurrentUserId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT * FROM todos 
                  WHERE user_id = :user_id 
                  ORDER BY is_completed ASC, priority DESC, created_at DESC";
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
        $query = "INSERT INTO todos (user_id, title, description, priority, total_steps, created_at, updated_at) 
                  VALUES (:user_id, :title, :description, :priority, :total_steps, NOW(), NOW())";
        
        $stmt = $db->prepare($query);
        
        // Prepare variables for binding
        $title = $data['title'];
        $description = $data['description'] ?? null;
        $priority = $data['priority'] ?? 'medium';
        $totalSteps = $data['total_steps'] ?? 1;
        
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':priority', $priority);
        $stmt->bindParam(':total_steps', $totalSteps);
        
        $stmt->execute();
        $todoId = $db->lastInsertId();
        
        // Get the created todo
        $getQuery = "SELECT * FROM todos WHERE id = :id AND user_id = :user_id";
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
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['id'])) {
        ApiResponse::error('Todo ID is required', 400);
    }
    
    try {
        // Build dynamic query based on provided fields
        $updateFields = [];
        $params = [':id' => $data['id'], ':user_id' => $userId];
        
        if (isset($data['title'])) {
            $updateFields[] = "title = :title";
            $params[':title'] = $data['title'];
        }
        
        if (isset($data['description'])) {
            $updateFields[] = "description = :description";
            $params[':description'] = $data['description'];
        }
        
        if (isset($data['priority'])) {
            $updateFields[] = "priority = :priority";
            $params[':priority'] = $data['priority'];
        }
        
        if (isset($data['total_steps'])) {
            $updateFields[] = "total_steps = :total_steps";
            $params[':total_steps'] = $data['total_steps'];
        }
        
        if (isset($data['completed_steps'])) {
            $updateFields[] = "completed_steps = :completed_steps";
            $params[':completed_steps'] = $data['completed_steps'];
        }
        
        if (isset($data['is_completed'])) {
            $updateFields[] = "is_completed = :is_completed";
            $params[':is_completed'] = $data['is_completed'] ? 1 : 0;
            
            if ($data['is_completed']) {
                $updateFields[] = "completed_at = NOW()";
            } else {
                $updateFields[] = "completed_at = NULL";
            }
        }
        
        $updateFields[] = "updated_at = NOW()";
        
        if (empty($updateFields)) {
            ApiResponse::error('No fields to update', 400);
        }
        
        $query = "UPDATE todos SET " . implode(', ', $updateFields) . " 
                  WHERE id = :id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            ApiResponse::error('Todo not found or no changes made', 404);
        }
        
        // Get the updated todo
        $getQuery = "SELECT * FROM todos WHERE id = :id AND user_id = :user_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':id', $data['id']);
        $getStmt->bindParam(':user_id', $userId);
        $getStmt->execute();
        
        $todo = $getStmt->fetch(PDO::FETCH_ASSOC);
        ApiResponse::success($todo, 'Todo updated successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update todo: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['id'])) {
        ApiResponse::error('Todo ID is required', 400);
    }
    
    try {
        $query = "DELETE FROM todos WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data['id']);
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

            ApiResponse::error('Failed to retrieve todos: ' . $e->getMessage(), 500);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {    }

    $data = json_decode(file_get_contents('php://input'), true);    

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!$data || !isset($data['title'])) {    $data = json_decode(file_get_contents('php://input'), true);

        ApiResponse::error('Title is required', 400);    

    }    if (!$data || !isset($data['title'])) {

            ApiResponse::error('Title is required', 400);

    try {    }

        $query = "INSERT INTO todos (user_id, title, description, priority, created_at, updated_at)     

                  VALUES (:user_id, :title, :description, :priority, NOW(), NOW())";    try {

                $query = "INSERT INTO todos (user_id, title, description, category_id, priority, 

        $stmt = $db->prepare($query);                                   due_date, reminder_datetime, created_at, updated_at) 

        $stmt->bindParam(':user_id', $userId);                  VALUES (:user_id, :title, :description, :category_id, :priority, 

        $stmt->bindParam(':title', $data['title']);                         :due_date, :reminder_datetime, NOW(), NOW())";

        $stmt->bindParam(':description', $data['description'] ?? null);        

        $stmt->bindParam(':priority', $data['priority'] ?? 'medium');        $stmt = $db->prepare($query);

                $stmt->bindParam(':user_id', $userId);

        $stmt->execute();        $stmt->bindParam(':title', $data['title']);

        $todoId = $db->lastInsertId();        $stmt->bindParam(':description', $data['description'] ?? null);

                $stmt->bindParam(':category_id', $data['category_id'] ?? null);

        // Get the created todo        $stmt->bindParam(':priority', $data['priority'] ?? 'medium');

        $getQuery = "SELECT * FROM todos WHERE id = :id AND user_id = :user_id";        $stmt->bindParam(':due_date', $data['due_date'] ?? null);

        $getStmt = $db->prepare($getQuery);        $stmt->bindParam(':reminder_datetime', $data['reminder_datetime'] ?? null);

        $getStmt->bindParam(':id', $todoId);        

        $getStmt->bindParam(':user_id', $userId);        $stmt->execute();

        $getStmt->execute();        

                $todoId = $db->lastInsertId();

        $todo = $getStmt->fetch(PDO::FETCH_ASSOC);        

                // Get the created todo with category info

        ApiResponse::success($todo, 'Todo created successfully');        $getQuery = "SELECT t.*, c.name as category_name, c.color as category_color 

                             FROM todos t 

    } catch (PDOException $e) {                     LEFT JOIN categories c ON t.category_id = c.id 

        ApiResponse::error('Failed to create todo: ' . $e->getMessage(), 500);                     WHERE t.id = :id AND t.user_id = :user_id";

    }        $getStmt = $db->prepare($getQuery);

            $getStmt->bindParam(':id', $todoId);

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {        $getStmt->bindParam(':user_id', $userId);

    // Get todo ID from URL path        $getStmt->execute();

    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);        

    preg_match('/\/todos\/(\d+)$/', $path, $matches);        $todo = $getStmt->fetch(PDO::FETCH_ASSOC);

            

    if (!isset($matches[1])) {        ApiResponse::success($todo, 'Todo created successfully');

        ApiResponse::error('Todo ID is required', 400);        

    }    } catch (PDOException $e) {

            ApiResponse::error('Failed to create todo: ' . $e->getMessage(), 500);

    $todoId = $matches[1];    }

    $data = json_decode(file_get_contents('php://input'), true);    

    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {

    if (!$data) {    // Get todo ID from URL path

        ApiResponse::error('Invalid JSON data', 400);    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    }    preg_match('/\/todos\/(\d+)$/', $path, $matches);

        

    try {    if (!isset($matches[1])) {

        // Verify todo belongs to user        ApiResponse::error('Todo ID is required', 400);

        $checkQuery = "SELECT id FROM todos WHERE id = :id AND user_id = :user_id";    }

        $checkStmt = $db->prepare($checkQuery);    

        $checkStmt->bindParam(':id', $todoId);    $todoId = $matches[1];

        $checkStmt->bindParam(':user_id', $userId);    $data = json_decode(file_get_contents('php://input'), true);

        $checkStmt->execute();    

            if (!$data) {

        if (!$checkStmt->fetch()) {        ApiResponse::error('Invalid JSON data', 400);

            ApiResponse::error('Todo not found', 404);    }

        }    

            try {

        // Build update query dynamically        // Verify todo belongs to user

        $updateFields = [];        $checkQuery = "SELECT id FROM todos WHERE id = :id AND user_id = :user_id";

        $params = [':id' => $todoId, ':user_id' => $userId];        $checkStmt = $db->prepare($checkQuery);

                $checkStmt->bindParam(':id', $todoId);

        $allowedFields = ['title', 'description', 'priority', 'completed', 'is_completed'];        $checkStmt->bindParam(':user_id', $userId);

                $checkStmt->execute();

        foreach ($allowedFields as $field) {        

            if (isset($data[$field])) {        if (!$checkStmt->fetch()) {

                $updateFields[] = "$field = :$field";            ApiResponse::error('Todo not found', 404);

                $params[":$field"] = $data[$field];        }

            }        

        }        // Build update query dynamically

                $updateFields = [];

        if (empty($updateFields)) {        $params = [':id' => $todoId, ':user_id' => $userId];

            ApiResponse::error('No valid fields to update', 400);        

        }        $allowedFields = ['title', 'description', 'category_id', 'priority', 'status', 

                                 'due_date', 'reminder_datetime', 'is_pinned', 'completed_at'];

        $updateFields[] = "updated_at = NOW()";        

        $updateQuery = "UPDATE todos SET " . implode(', ', $updateFields) .         foreach ($allowedFields as $field) {

                      " WHERE id = :id AND user_id = :user_id";            if (isset($data[$field])) {

                        $updateFields[] = "$field = :$field";

        $stmt = $db->prepare($updateQuery);                $params[":$field"] = $data[$field];

        foreach ($params as $param => $value) {                

            $stmt->bindValue($param, $value);                // If marking as completed, set completed_at

        }                if ($field === 'status' && $data[$field] === 'completed') {

        $stmt->execute();                    $updateFields[] = "completed_at = NOW()";

                        } elseif ($field === 'status' && $data[$field] !== 'completed') {

        // Get updated todo                    $updateFields[] = "completed_at = NULL";

        $getQuery = "SELECT * FROM todos WHERE id = :id AND user_id = :user_id";                }

        $getStmt = $db->prepare($getQuery);            }

        $getStmt->bindParam(':id', $todoId);        }

        $getStmt->bindParam(':user_id', $userId);        

        $getStmt->execute();        if (empty($updateFields)) {

                    ApiResponse::error('No valid fields to update', 400);

        $todo = $getStmt->fetch(PDO::FETCH_ASSOC);        }

                

        ApiResponse::success($todo, 'Todo updated successfully');        $updateFields[] = "updated_at = NOW()";

                $updateQuery = "UPDATE todos SET " . implode(', ', $updateFields) . 

    } catch (PDOException $e) {                      " WHERE id = :id AND user_id = :user_id";

        ApiResponse::error('Failed to update todo: ' . $e->getMessage(), 500);        

    }        $stmt = $db->prepare($updateQuery);

            foreach ($params as $param => $value) {

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {            $stmt->bindValue($param, $value);

    // Get todo ID from URL path        }

    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);        $stmt->execute();

    preg_match('/\/todos\/(\d+)$/', $path, $matches);        

            // Get updated todo with category info

    if (!isset($matches[1])) {        $getQuery = "SELECT t.*, c.name as category_name, c.color as category_color 

        ApiResponse::error('Todo ID is required', 400);                     FROM todos t 

    }                     LEFT JOIN categories c ON t.category_id = c.id 

                         WHERE t.id = :id AND t.user_id = :user_id";

    $todoId = $matches[1];        $getStmt = $db->prepare($getQuery);

            $getStmt->bindParam(':id', $todoId);

    try {        $getStmt->bindParam(':user_id', $userId);

        $query = "DELETE FROM todos WHERE id = :id AND user_id = :user_id";        $getStmt->execute();

        $stmt = $db->prepare($query);        

        $stmt->bindParam(':id', $todoId);        $todo = $getStmt->fetch(PDO::FETCH_ASSOC);

        $stmt->bindParam(':user_id', $userId);        

        $stmt->execute();        ApiResponse::success($todo, 'Todo updated successfully');

                

        if ($stmt->rowCount() === 0) {    } catch (PDOException $e) {

            ApiResponse::error('Todo not found', 404);        ApiResponse::error('Failed to update todo: ' . $e->getMessage(), 500);

        }    }

            

        ApiResponse::success(null, 'Todo deleted successfully');} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {

            // Get todo ID from URL path

    } catch (PDOException $e) {    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        ApiResponse::error('Failed to delete todo: ' . $e->getMessage(), 500);    preg_match('/\/todos\/(\d+)$/', $path, $matches);

    }    

        if (!isset($matches[1])) {

} else {        ApiResponse::error('Todo ID is required', 400);

    ApiResponse::error('Method not allowed', 405);    }

}    

?>    $todoId = $matches[1];
    
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
