<?php<?php

// Diary API endpoint - Secure diary entries with PIN protection// Diary API endpoint - Secure diary entries with PIN protection

require_once __DIR__ . '/../api_config.php';require_once __DIR__ . '/../api_config.php';



Auth::requireAuth();Auth::requireAuth();



// Check if diary is unlocked in session// Check if diary is unlocked in session

if (!isset($_SESSION['diary_unlocked']) || $_SESSION['diary_unlocked'] !== true) {if (!isset($_SESSION['diary_unlocked']) || $_SESSION['diary_unlocked'] !== true) {

    ApiResponse::error('Diary is locked. Please enter your PIN first.', 403);    ApiResponse::error('Diary is locked. Please enter your PIN first.', 403);

}}



$database = new Database();$database = new Database();

$db = $database->connect();$db = $database->connect();

$userId = Auth::getCurrentUserId();$userId = Auth::getCurrentUserId();



if ($_SERVER['REQUEST_METHOD'] === 'GET') {if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    try {    try {

        $query = "SELECT * FROM diary_entries         // Get specific entry by ID if provided

                  WHERE user_id = :user_id         $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

                  ORDER BY created_at DESC";        preg_match('/\/diary\/(\d+)$/', $path, $matches);

        $stmt = $db->prepare($query);        

        $stmt->bindParam(':user_id', $userId);        if (isset($matches[1])) {

        $stmt->execute();            // Get single entry

                    $entryId = $matches[1];

        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);            $query = "SELECT * FROM diary_entries WHERE id = :id AND user_id = :user_id";

        ApiResponse::success($entries, 'Diary entries retrieved successfully');            $stmt = $db->prepare($query);

                    $stmt->bindParam(':id', $entryId);

    } catch (PDOException $e) {            $stmt->bindParam(':user_id', $userId);

        ApiResponse::error('Failed to retrieve diary entries: ' . $e->getMessage(), 500);            $stmt->execute();

    }            

                $entry = $stmt->fetch(PDO::FETCH_ASSOC);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {            

    $data = json_decode(file_get_contents('php://input'), true);            if (!$entry) {

                    ApiResponse::error('Diary entry not found', 404);

    if (!$data || !isset($data['content'])) {            }

        ApiResponse::error('Content is required', 400);            

    }            ApiResponse::success($entry, 'Diary entry retrieved successfully');

            } else {

    try {            // Get all entries with optional filters

        $query = "INSERT INTO diary_entries (user_id, content, mood, created_at, updated_at)             $date = $_GET['date'] ?? null;

                  VALUES (:user_id, :content, :mood, NOW(), NOW())";            $month = $_GET['month'] ?? null;

                    $year = $_GET['year'] ?? null;

        $stmt = $db->prepare($query);            $mood = $_GET['mood'] ?? null;

        $stmt->bindParam(':user_id', $userId);            $limit = $_GET['limit'] ?? 50;

        $stmt->bindParam(':content', $data['content']);            $offset = $_GET['offset'] ?? 0;

        $stmt->bindParam(':mood', $data['mood'] ?? 'calm');            

                    $conditions = ["user_id = :user_id"];

        $stmt->execute();            $params = [':user_id' => $userId];

        $entryId = $db->lastInsertId();            

                    if ($date) {

        // Get the created entry                $conditions[] = "DATE(entry_date) = :date";

        $getQuery = "SELECT * FROM diary_entries WHERE id = :id AND user_id = :user_id";                $params[':date'] = $date;

        $getStmt = $db->prepare($getQuery);            } elseif ($month && $year) {

        $getStmt->bindParam(':id', $entryId);                $conditions[] = "MONTH(entry_date) = :month AND YEAR(entry_date) = :year";

        $getStmt->bindParam(':user_id', $userId);                $params[':month'] = $month;

        $getStmt->execute();                $params[':year'] = $year;

                    } elseif ($year) {

        $entry = $getStmt->fetch(PDO::FETCH_ASSOC);                $conditions[] = "YEAR(entry_date) = :year";

                        $params[':year'] = $year;

        ApiResponse::success($entry, 'Diary entry created successfully');            }

                    

    } catch (PDOException $e) {            if ($mood) {

        ApiResponse::error('Failed to create diary entry: ' . $e->getMessage(), 500);                $conditions[] = "mood = :mood";

    }                $params[':mood'] = $mood;

                }

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {            

    // Get entry ID from URL path            $whereClause = implode(' AND ', $conditions);

    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);            

    preg_match('/\/diary\/(\d+)$/', $path, $matches);            $query = "SELECT * FROM diary_entries 

                          WHERE $whereClause 

    if (!isset($matches[1])) {                      ORDER BY entry_date DESC, created_at DESC 

        ApiResponse::error('Entry ID is required', 400);                      LIMIT :limit OFFSET :offset";

    }            

                $stmt = $db->prepare($query);

    $entryId = $matches[1];            foreach ($params as $param => $value) {

    $data = json_decode(file_get_contents('php://input'), true);                $stmt->bindValue($param, $value);

                }

    if (!$data) {            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);

        ApiResponse::error('Invalid JSON data', 400);            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);

    }            $stmt->execute();

                

    try {            $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Verify entry belongs to user            

        $checkQuery = "SELECT id FROM diary_entries WHERE id = :id AND user_id = :user_id";            ApiResponse::success($entries, 'Diary entries retrieved successfully');

        $checkStmt = $db->prepare($checkQuery);        }

        $checkStmt->bindParam(':id', $entryId);        

        $checkStmt->bindParam(':user_id', $userId);    } catch (PDOException $e) {

        $checkStmt->execute();        ApiResponse::error('Failed to retrieve diary entries: ' . $e->getMessage(), 500);

            }

        if (!$checkStmt->fetch()) {    

            ApiResponse::error('Diary entry not found', 404);} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {

        }    $data = json_decode(file_get_contents('php://input'), true);

            

        // Build update query dynamically    if (!$data || !isset($data['title']) || !isset($data['content'])) {

        $updateFields = [];        ApiResponse::error('Title and content are required', 400);

        $params = [':id' => $entryId, ':user_id' => $userId];    }

            

        $allowedFields = ['content', 'mood'];    try {

                $query = "INSERT INTO diary_entries (user_id, title, content, entry_date, created_at, updated_at) 

        foreach ($allowedFields as $field) {                  VALUES (:user_id, :title, :content, :entry_date, NOW(), NOW())";

            if (isset($data[$field])) {        

                $updateFields[] = "$field = :$field";        $stmt = $db->prepare($query);

                $params[":$field"] = $data[$field];        $stmt->bindParam(':user_id', $userId);

            }        $stmt->bindParam(':title', $data['title']);

        }        $stmt->bindParam(':content', $data['content']);

                

        if (empty($updateFields)) {        $entryDate = $data['entry_date'] ?? date('Y-m-d');

            ApiResponse::error('No valid fields to update', 400);        $stmt->bindParam(':entry_date', $entryDate);

        }        

                $stmt->execute();

        $updateFields[] = "updated_at = NOW()";        

        $updateQuery = "UPDATE diary_entries SET " . implode(', ', $updateFields) .         $entryId = $db->lastInsertId();

                      " WHERE id = :id AND user_id = :user_id";        

                // Get the created entry

        $stmt = $db->prepare($updateQuery);        $getQuery = "SELECT * FROM diary_entries WHERE id = :id AND user_id = :user_id";

        foreach ($params as $param => $value) {        $getStmt = $db->prepare($getQuery);

            $stmt->bindValue($param, $value);        $getStmt->bindParam(':id', $entryId);

        }        $getStmt->bindParam(':user_id', $userId);

        $stmt->execute();        $getStmt->execute();

                

        // Get updated entry        $entry = $getStmt->fetch(PDO::FETCH_ASSOC);

        $getQuery = "SELECT * FROM diary_entries WHERE id = :id AND user_id = :user_id";        

        $getStmt = $db->prepare($getQuery);        ApiResponse::success($entry, 'Diary entry created successfully');

        $getStmt->bindParam(':id', $entryId);        

        $getStmt->bindParam(':user_id', $userId);    } catch (PDOException $e) {

        $getStmt->execute();        ApiResponse::error('Failed to create diary entry: ' . $e->getMessage(), 500);

            }

        $entry = $getStmt->fetch(PDO::FETCH_ASSOC);    

        } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {

        ApiResponse::success($entry, 'Diary entry updated successfully');    // Get entry ID from URL path

            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    } catch (PDOException $e) {    preg_match('/\/diary\/(\d+)$/', $path, $matches);

        ApiResponse::error('Failed to update diary entry: ' . $e->getMessage(), 500);    

    }    if (!isset($matches[1])) {

            ApiResponse::error('Diary entry ID is required', 400);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {    }

    // Get entry ID from URL path    

    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);    $entryId = $matches[1];

    preg_match('/\/diary\/(\d+)$/', $path, $matches);    $data = json_decode(file_get_contents('php://input'), true);

        

    if (!isset($matches[1])) {    if (!$data) {

        ApiResponse::error('Entry ID is required', 400);        ApiResponse::error('Invalid JSON data', 400);

    }    }

        

    $entryId = $matches[1];    try {

            // Verify entry belongs to user

    try {        $checkQuery = "SELECT id FROM diary_entries WHERE id = :id AND user_id = :user_id";

        $query = "DELETE FROM diary_entries WHERE id = :id AND user_id = :user_id";        $checkStmt = $db->prepare($checkQuery);

        $stmt = $db->prepare($query);        $checkStmt->bindParam(':id', $entryId);

        $stmt->bindParam(':id', $entryId);        $checkStmt->bindParam(':user_id', $userId);

        $stmt->bindParam(':user_id', $userId);        $checkStmt->execute();

        $stmt->execute();        

                if (!$checkStmt->fetch()) {

        if ($stmt->rowCount() === 0) {            ApiResponse::error('Diary entry not found', 404);

            ApiResponse::error('Diary entry not found', 404);        }

        }        

                // Build update query dynamically

        ApiResponse::success(null, 'Diary entry deleted successfully');        $updateFields = [];

                $params = [':id' => $entryId, ':user_id' => $userId];

    } catch (PDOException $e) {        

        ApiResponse::error('Failed to delete diary entry: ' . $e->getMessage(), 500);        $allowedFields = ['title', 'content', 'entry_date', 'mood', 'weather', 

    }                         'location', 'is_favorite'];

            

} else {        foreach ($allowedFields as $field) {

    ApiResponse::error('Method not allowed', 405);            if (isset($data[$field])) {

}                if ($field === 'tags' && is_array($data[$field])) {

?>                    $updateFields[] = "$field = :$field";
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
