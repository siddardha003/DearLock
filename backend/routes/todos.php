<?php
// Todo Routes - For our dreamy goals and beautiful tasks

// Get all todos
$router->addRoute('GET', '/^\/api\/todos$/', function() {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    
    $userId = Auth::getCurrentUserId();
    $categoryId = $_GET['category'] ?? null;
    $completed = isset($_GET['completed']) ? (bool)$_GET['completed'] : null;
    $priority = $_GET['priority'] ?? null;
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 50;
    $offset = ($page - 1) * $limit;
    
    try {
        // Build query conditions
        $conditions = ["t.user_id = :user_id"];
        $params = [':user_id' => $userId];
        
        if ($categoryId) {
            $conditions[] = "t.category_id = :category_id";
            $params[':category_id'] = $categoryId;
        }
        
        if ($completed !== null) {
            $conditions[] = "t.is_completed = :completed";
            $params[':completed'] = $completed ? 1 : 0;
        }
        
        if ($priority) {
            $conditions[] = "t.priority = :priority";
            $params[':priority'] = $priority;
        }
        
        $whereClause = implode(' AND ', $conditions);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM todos t WHERE $whereClause";
        $countStmt = $db->prepare($countQuery);
        foreach ($params as $param => $value) {
            $countStmt->bindValue($param, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get todos with category info
        $query = "SELECT t.id, t.title, t.description, t.is_completed, t.priority, t.due_date, 
                         t.reminder_datetime, t.color, t.position, t.completed_at, 
                         t.created_at, t.updated_at,
                         c.name as category_name, c.color as category_color, c.icon as category_icon
                  FROM todos t
                  LEFT JOIN categories c ON t.category_id = c.id
                  WHERE $whereClause
                  ORDER BY t.is_completed ASC, t.priority DESC, t.position ASC, t.created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $db->prepare($query);
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $todos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format todos for frontend
        foreach ($todos as &$todo) {
            $todo['is_completed'] = (bool)$todo['is_completed'];
            $todo['is_overdue'] = $todo['due_date'] && !$todo['is_completed'] && $todo['due_date'] < date('Y-m-d');
            $todo['days_until_due'] = $todo['due_date'] ? (int)((strtotime($todo['due_date']) - time()) / (60 * 60 * 24)) : null;
        }
        
        ApiResponse::success([
            'todos' => $todos,
            'pagination' => [
                'current_page' => (int)$page,
                'total_pages' => ceil($total / $limit),
                'total_todos' => (int)$total,
                'limit' => (int)$limit
            ]
        ], 'Your beautiful goals and tasks! ✨🎯');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to fetch todos', 500);
    }
});

// Get single todo
$router->addRoute('GET', '/^\/api\/todos\/(\d+)$/', function($todoId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
                  FROM todos t
                  LEFT JOIN categories c ON t.category_id = c.id
                  WHERE t.id = :todo_id AND t.user_id = :user_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':todo_id', $todoId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $todo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($todo) {
            $todo['is_completed'] = (bool)$todo['is_completed'];
            $todo['is_overdue'] = $todo['due_date'] && !$todo['is_completed'] && $todo['due_date'] < date('Y-m-d');
            $todo['days_until_due'] = $todo['due_date'] ? (int)((strtotime($todo['due_date']) - time()) / (60 * 60 * 24)) : null;
            ApiResponse::success($todo, 'Your beautiful task! 🌸');
        } else {
            ApiResponse::error('Todo not found', 404);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to fetch todo', 500);
    }
});

// Create new todo
$router->addRoute('POST', '/^\/api\/todos$/', function() {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!Validator::required($input['title'] ?? '')) {
        ApiResponse::error('Title is required for your beautiful goal! ✨');
    }
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "INSERT INTO todos (user_id, category_id, title, description, priority, due_date, 
                                   reminder_datetime, color, position) 
                  VALUES (:user_id, :category_id, :title, :description, :priority, :due_date, 
                          :reminder_datetime, :color, :position)";
        
        $stmt = $db->prepare($query);
        
        $categoryId = !empty($input['category_id']) ? $input['category_id'] : null;
        $description = $input['description'] ?? '';
        $priority = $input['priority'] ?? 'medium';
        $dueDate = !empty($input['due_date']) ? $input['due_date'] : null;
        $reminderDatetime = !empty($input['reminder_datetime']) ? $input['reminder_datetime'] : null;
        $color = $input['color'] ?? '#F8F6F0'; // Signature cream default
        $position = $input['position'] ?? 0;
        
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':category_id', $categoryId);
        $stmt->bindParam(':title', $input['title']);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':priority', $priority);
        $stmt->bindParam(':due_date', $dueDate);
        $stmt->bindParam(':reminder_datetime', $reminderDatetime);
        $stmt->bindParam(':color', $color);
        $stmt->bindParam(':position', $position);
        
        if ($stmt->execute()) {
            $todoId = $db->lastInsertId();
            
            // Get the created todo with category info
            $getQuery = "SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
                         FROM todos t
                         LEFT JOIN categories c ON t.category_id = c.id
                         WHERE t.id = :todo_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':todo_id', $todoId);
            $getStmt->execute();
            $newTodo = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            $newTodo['is_completed'] = (bool)$newTodo['is_completed'];
            $newTodo['is_overdue'] = false;
            $newTodo['days_until_due'] = $newTodo['due_date'] ? (int)((strtotime($newTodo['due_date']) - time()) / (60 * 60 * 24)) : null;
            
            ApiResponse::success($newTodo, 'Your beautiful goal has been added! 🌸✨', 201);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to create todo', 500);
    }
});

// Update todo
$router->addRoute('PUT', '/^\/api\/todos\/(\d+)$/', function($todoId) {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!Validator::required($input['title'] ?? '')) {
        ApiResponse::error('Title is required');
    }
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        // Check if todo belongs to user
        $checkQuery = "SELECT id FROM todos WHERE id = :todo_id AND user_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':todo_id', $todoId);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            ApiResponse::error('Todo not found', 404);
        }
        
        // Update the todo
        $query = "UPDATE todos 
                  SET title = :title, description = :description, category_id = :category_id, 
                      priority = :priority, due_date = :due_date, reminder_datetime = :reminder_datetime, 
                      color = :color, position = :position
                  WHERE id = :todo_id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        
        $categoryId = !empty($input['category_id']) ? $input['category_id'] : null;
        $description = $input['description'] ?? '';
        $priority = $input['priority'] ?? 'medium';
        $dueDate = !empty($input['due_date']) ? $input['due_date'] : null;
        $reminderDatetime = !empty($input['reminder_datetime']) ? $input['reminder_datetime'] : null;
        $color = $input['color'] ?? '#F8F6F0';
        $position = $input['position'] ?? 0;
        
        $stmt->bindParam(':title', $input['title']);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':category_id', $categoryId);
        $stmt->bindParam(':priority', $priority);
        $stmt->bindParam(':due_date', $dueDate);
        $stmt->bindParam(':reminder_datetime', $reminderDatetime);
        $stmt->bindParam(':color', $color);
        $stmt->bindParam(':position', $position);
        $stmt->bindParam(':todo_id', $todoId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute()) {
            // Get updated todo
            $getQuery = "SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
                         FROM todos t
                         LEFT JOIN categories c ON t.category_id = c.id
                         WHERE t.id = :todo_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':todo_id', $todoId);
            $getStmt->execute();
            $updatedTodo = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            $updatedTodo['is_completed'] = (bool)$updatedTodo['is_completed'];
            $updatedTodo['is_overdue'] = $updatedTodo['due_date'] && !$updatedTodo['is_completed'] && $updatedTodo['due_date'] < date('Y-m-d');
            $updatedTodo['days_until_due'] = $updatedTodo['due_date'] ? (int)((strtotime($updatedTodo['due_date']) - time()) / (60 * 60 * 24)) : null;
            
            ApiResponse::success($updatedTodo, 'Your beautiful task has been updated! 🌸');
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update todo', 500);
    }
});

// Toggle todo completion
$router->addRoute('PUT', '/^\/api\/todos\/(\d+)\/complete$/', function($todoId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        // Get current status
        $getQuery = "SELECT is_completed FROM todos WHERE id = :todo_id AND user_id = :user_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':todo_id', $todoId);
        $getStmt->bindParam(':user_id', $userId);
        $getStmt->execute();
        $current = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$current) {
            ApiResponse::error('Todo not found', 404);
        }
        
        $newStatus = !$current['is_completed'];
        $completedAt = $newStatus ? date('Y-m-d H:i:s') : null;
        
        // Update completion status
        $query = "UPDATE todos SET is_completed = :completed, completed_at = :completed_at 
                  WHERE id = :todo_id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':completed', $newStatus, PDO::PARAM_BOOL);
        $stmt->bindParam(':completed_at', $completedAt);
        $stmt->bindParam(':todo_id', $todoId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute()) {
            $message = $newStatus ? 'Congratulations! Goal completed! 🎉✨' : 'Task marked as incomplete 🤍';
            ApiResponse::success([
                'is_completed' => $newStatus,
                'completed_at' => $completedAt
            ], $message);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update completion status', 500);
    }
});

// Delete todo
$router->addRoute('DELETE', '/^\/api\/todos\/(\d+)$/', function($todoId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "DELETE FROM todos WHERE id = :todo_id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':todo_id', $todoId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            ApiResponse::success(null, 'Your task has been gently removed 🕊️');
        } else {
            ApiResponse::error('Todo not found', 404);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to delete todo', 500);
    }
});

// Reorder todos
$router->addRoute('PUT', '/^\/api\/todos\/reorder$/', function() {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['todos']) || !is_array($input['todos'])) {
        ApiResponse::error('Todos array is required');
    }
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $db->beginTransaction();
        
        $query = "UPDATE todos SET position = :position WHERE id = :todo_id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        
        foreach ($input['todos'] as $index => $todoData) {
            if (!isset($todoData['id'])) continue;
            
            $stmt->bindParam(':position', $index);
            $stmt->bindParam(':todo_id', $todoData['id']);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
        }
        
        $db->commit();
        ApiResponse::success(null, 'Tasks reordered beautifully! ✨');
        
    } catch (PDOException $e) {
        $db->rollBack();
        ApiResponse::error('Failed to reorder todos', 500);
    }
});

// Get todo statistics
$router->addRoute('GET', '/^\/api\/todos\/stats$/', function() {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "SELECT 
                    COUNT(*) as total_todos,
                    SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_todos,
                    SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) as pending_todos,
                    SUM(CASE WHEN due_date < CURDATE() AND is_completed = 0 THEN 1 ELSE 0 END) as overdue_todos,
                    SUM(CASE WHEN due_date = CURDATE() AND is_completed = 0 THEN 1 ELSE 0 END) as due_today
                  FROM todos 
                  WHERE user_id = :user_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Calculate completion rate
        $stats['completion_rate'] = $stats['total_todos'] > 0 
            ? round(($stats['completed_todos'] / $stats['total_todos']) * 100, 1) 
            : 0;
        
        ApiResponse::success($stats, 'Your beautiful progress! 📊✨');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to get statistics', 500);
    }
});
?>
