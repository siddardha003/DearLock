<?php
// Diary API endpoint - Secure diary entries with PIN protection
require_once __DIR__ . '/../api_config.php';

Auth::requireAuth();

// Check if diary is unlocked in session
if (!isset($_SESSION['diary_unlocked']) || $_SESSION['diary_unlocked'] !== true) {
    ApiResponse::error('Diary is locked. Please enter your PIN first.', 403);
}

$database = new Database();
$db = $database->connect();
$userId = Auth::getCurrentUserId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get specific entry by ID if provided
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/diary\/(\d+)$/', $path, $matches);
        
        if (isset($matches[1])) {
            // Get single entry
            $entryId = $matches[1];
            $query = "SELECT * FROM diary_entries WHERE id = :id AND user_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $entryId);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            
            $entry = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$entry) {
                ApiResponse::error('Diary entry not found', 404);
            }
            
            ApiResponse::success($entry, 'Diary entry retrieved successfully');
        } else {
            // Get all entries with optional filters
            $date = $_GET['date'] ?? null;
            $month = $_GET['month'] ?? null;
            $year = $_GET['year'] ?? null;
            $mood = $_GET['mood'] ?? null;
            $limit = $_GET['limit'] ?? 50;
            $offset = $_GET['offset'] ?? 0;
            
            $conditions = ["user_id = :user_id"];
            $params = [':user_id' => $userId];
            
            if ($date) {
                $conditions[] = "DATE(entry_date) = :date";
                $params[':date'] = $date;
            } elseif ($month && $year) {
                $conditions[] = "MONTH(entry_date) = :month AND YEAR(entry_date) = :year";
                $params[':month'] = $month;
                $params[':year'] = $year;
            } elseif ($year) {
                $conditions[] = "YEAR(entry_date) = :year";
                $params[':year'] = $year;
            }
            
            if ($mood) {
                $conditions[] = "mood = :mood";
                $params[':mood'] = $mood;
            }
            
            $whereClause = implode(' AND ', $conditions);
            
            $query = "SELECT * FROM diary_entries 
                      WHERE $whereClause 
                      ORDER BY entry_date DESC, created_at DESC 
                      LIMIT :limit OFFSET :offset";
            
            $stmt = $db->prepare($query);
            foreach ($params as $param => $value) {
                $stmt->bindValue($param, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            ApiResponse::success($entries, 'Diary entries retrieved successfully');
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to retrieve diary entries: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['title']) || !isset($data['content'])) {
        ApiResponse::error('Title and content are required', 400);
    }
    
    try {
        $query = "INSERT INTO diary_entries (user_id, title, content, entry_date, created_at, updated_at) 
                  VALUES (:user_id, :title, :content, :entry_date, NOW(), NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':content', $data['content']);
        
        $entryDate = $data['entry_date'] ?? date('Y-m-d');
        $stmt->bindParam(':entry_date', $entryDate);
        
        $stmt->execute();
        
        $entryId = $db->lastInsertId();
        
        // Get the created entry
        $getQuery = "SELECT * FROM diary_entries WHERE id = :id AND user_id = :user_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':id', $entryId);
        $getStmt->bindParam(':user_id', $userId);
        $getStmt->execute();
        
        $entry = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        ApiResponse::success($entry, 'Diary entry created successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to create diary entry: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Get entry ID from URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    preg_match('/\/diary\/(\d+)$/', $path, $matches);
    
    if (!isset($matches[1])) {
        ApiResponse::error('Diary entry ID is required', 400);
    }
    
    $entryId = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        ApiResponse::error('Invalid JSON data', 400);
    }
    
    try {
        // Verify entry belongs to user
        $checkQuery = "SELECT id FROM diary_entries WHERE id = :id AND user_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $entryId);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->execute();
        
        if (!$checkStmt->fetch()) {
            ApiResponse::error('Diary entry not found', 404);
        }
        
        // Build update query dynamically
        $updateFields = [];
        $params = [':id' => $entryId, ':user_id' => $userId];
        
        $allowedFields = ['title', 'content', 'entry_date', 'mood', 'weather', 
                         'location', 'is_favorite'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'tags' && is_array($data[$field])) {
                    $updateFields[] = "$field = :$field";
                    $params[":$field"] = implode(',', $data[$field]);
                } else {
                    $updateFields[] = "$field = :$field";
                    $params[":$field"] = $data[$field];
                }
            }
        }
        
        // Handle tags separately if provided
        if (isset($data['tags']) && is_array($data['tags'])) {
            $updateFields[] = "tags = :tags";
            $params[":tags"] = implode(',', $data['tags']);
        }
        
        if (empty($updateFields)) {
            ApiResponse::error('No valid fields to update', 400);
        }
        
        $updateFields[] = "updated_at = NOW()";
        $updateQuery = "UPDATE diary_entries SET " . implode(', ', $updateFields) . 
                      " WHERE id = :id AND user_id = :user_id";
        
        $stmt = $db->prepare($updateQuery);
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        $stmt->execute();
        
        // Get updated entry
        $getQuery = "SELECT * FROM diary_entries WHERE id = :id AND user_id = :user_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':id', $entryId);
        $getStmt->bindParam(':user_id', $userId);
        $getStmt->execute();
        
        $entry = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        ApiResponse::success($entry, 'Diary entry updated successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update diary entry: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Get entry ID from URL path
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    preg_match('/\/diary\/(\d+)$/', $path, $matches);
    
    if (!isset($matches[1])) {
        ApiResponse::error('Diary entry ID is required', 400);
    }
    
    $entryId = $matches[1];
    
    try {
        $query = "DELETE FROM diary_entries WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $entryId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            ApiResponse::error('Diary entry not found', 404);
        }
        
        ApiResponse::success(null, 'Diary entry deleted successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to delete diary entry: ' . $e->getMessage(), 500);
    }
    
} else {
    ApiResponse::error('Method not allowed', 405);
}
?>
