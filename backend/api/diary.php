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
        // Check if getting specific entry by ID or date
        $entryId = $_GET['id'] ?? null;
        $entryDate = $_GET['date'] ?? null;
        
        if ($entryId) {
            // Get entry by ID
            $query = "SELECT * FROM diary_entries WHERE id = :id AND user_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $entryId);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            
            $entry = $stmt->fetch(PDO::FETCH_ASSOC);
            ApiResponse::success($entry ?: null, 'Diary entry retrieved successfully');
        } elseif ($entryDate) {
            // Get entry for specific date
            $query = "SELECT * FROM diary_entries WHERE user_id = :user_id AND entry_date = :entry_date";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':entry_date', $entryDate);
            $stmt->execute();
            
            $entry = $stmt->fetch(PDO::FETCH_ASSOC);
            ApiResponse::success($entry ?: null, 'Diary entry retrieved successfully');
        } else {
            // Get all entries
            $query = "SELECT * FROM diary_entries 
                      WHERE user_id = :user_id 
                      ORDER BY entry_date DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            
            $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
            ApiResponse::success($entries, 'Diary entries retrieved successfully');
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to retrieve diary entries: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['content']) || !isset($data['entry_date'])) {
        ApiResponse::error('Content and entry date are required', 400);
    }
    
    try {
        // Check if entry already exists for this date
        $checkQuery = "SELECT id FROM diary_entries WHERE user_id = :user_id AND entry_date = :entry_date";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->bindParam(':entry_date', $data['entry_date']);
        $checkStmt->execute();
        
        if ($checkStmt->fetch()) {
            ApiResponse::error('Diary entry already exists for this date. Use PUT to update.', 400);
        }
        
        $query = "INSERT INTO diary_entries (user_id, title, content, entry_date, created_at, updated_at) 
                  VALUES (:user_id, :title, :content, :entry_date, NOW(), NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':title', $data['title'] ?? 'My Thoughts');
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':entry_date', $data['entry_date']);
        
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
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || (!isset($data['id']) && !isset($data['entry_date']))) {
        ApiResponse::error('Entry ID or entry date is required', 400);
    }
    
    try {
        // Build query based on whether we have ID or date
        if (isset($data['id'])) {
            $whereClause = "id = :id AND user_id = :user_id";
            $whereParams = [':id' => $data['id'], ':user_id' => $userId];
        } else {
            $whereClause = "entry_date = :entry_date AND user_id = :user_id";
            $whereParams = [':entry_date' => $data['entry_date'], ':user_id' => $userId];
        }
        
        $updateFields = [];
        $params = $whereParams;
        
        if (isset($data['content'])) {
            $updateFields[] = "content = :content";
            $params[':content'] = $data['content'];
        }
        
        $updateFields[] = "updated_at = NOW()";
        
        if (empty($updateFields)) {
            ApiResponse::error('No fields to update', 400);
        }
        
        $query = "UPDATE diary_entries SET " . implode(', ', $updateFields) . " WHERE " . $whereClause;
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            ApiResponse::error('Diary entry not found or no changes made', 404);
        }
        
        // Get the updated entry
        $getQuery = "SELECT * FROM diary_entries WHERE " . $whereClause;
        $getStmt = $db->prepare($getQuery);
        $getStmt->execute($whereParams);
        
        $entry = $getStmt->fetch(PDO::FETCH_ASSOC);
        ApiResponse::success($entry, 'Diary entry updated successfully');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update diary entry: ' . $e->getMessage(), 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || (!isset($data['id']) && !isset($data['entry_date']))) {
        ApiResponse::error('Entry ID or entry date is required', 400);
    }
    
    try {
        if (isset($data['id'])) {
            $query = "DELETE FROM diary_entries WHERE id = :id AND user_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $data['id']);
            $stmt->bindParam(':user_id', $userId);
        } else {
            $query = "DELETE FROM diary_entries WHERE entry_date = :entry_date AND user_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':entry_date', $data['entry_date']);
            $stmt->bindParam(':user_id', $userId);
        }
        
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