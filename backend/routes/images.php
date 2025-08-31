<?php
// Images Routes - For our beautiful memories and uploads

// Get images for a specific type and related ID
$router->addRoute('GET', '/^\/api\/images\/(\w+)\/(\d+)$/', function($type, $relatedId) {
    Auth::requireAuth();
    
    if (!in_array($type, ['note_background', 'profile'])) {
        ApiResponse::error('Invalid image type');
    }
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "SELECT id, original_name, stored_name, file_path, file_size, mime_type, created_at
                  FROM images 
                  WHERE user_id = :user_id AND image_type = :type AND related_id = :related_id
                  ORDER BY created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':related_id', $relatedId);
        $stmt->execute();
        
        $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add full URL to images
        foreach ($images as &$image) {
            $image['url'] = '/backend/uploads/' . $image['stored_name'];
            $image['file_size_formatted'] = formatFileSize($image['file_size']);
        }
        
        ApiResponse::success($images, 'Your beautiful images! 📸✨');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to fetch images', 500);
    }
});

// Get available background images for notes
$router->addRoute('GET', '/^\/api\/images\/backgrounds$/', function() {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "SELECT id, original_name, stored_name, file_path, created_at
                  FROM images 
                  WHERE user_id = :user_id AND image_type = 'note_background'
                  ORDER BY created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add full URL to images
        foreach ($images as &$image) {
            $image['url'] = '/backend/uploads/' . $image['stored_name'];
        }
        
        ApiResponse::success($images, 'Available background images! �️✨');
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to fetch background images', 500);
    }
});

// Upload image
$router->addRoute('POST', '/^\/api\/images\/upload$/', function() {
    Auth::requireAuth();
    
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        ApiResponse::error('No image uploaded or upload error occurred');
    }
    
    if (!isset($_POST['image_type']) || !isset($_POST['related_id'])) {
        ApiResponse::error('Image type and related ID are required');
    }
    
    $imageType = $_POST['image_type'];
    $relatedId = (int)$_POST['related_id'];
    
    if (!in_array($imageType, ['note_background', 'profile'])) {
        ApiResponse::error('Invalid image type');
    }
    
    $file = $_FILES['image'];
    $userId = Auth::getCurrentUserId();
    
    // Validate file
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        ApiResponse::error('Only JPEG, PNG, GIF, and WebP images are allowed');
    }
    
    // Check file size (max 5MB)
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxSize) {
        ApiResponse::error('Image size must be less than 5MB');
    }
    
    try {
        // Create uploads directory if it doesn't exist
        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $storedName = uniqid('img_' . $userId . '_') . '.' . $extension;
        $filePath = $uploadDir . $storedName;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            ApiResponse::error('Failed to save uploaded image');
        }
        
        // Save to database
        $database = new Database();
        $db = $database->connect();
        
        $query = "INSERT INTO images (user_id, original_name, stored_name, file_path, file_size, 
                                    mime_type, image_type, related_id) 
                  VALUES (:user_id, :original_name, :stored_name, :file_path, :file_size, 
                          :mime_type, :image_type, :related_id)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':original_name', $file['name']);
        $stmt->bindParam(':stored_name', $storedName);
        $stmt->bindParam(':file_path', $filePath);
        $stmt->bindParam(':file_size', $file['size']);
        $stmt->bindParam(':mime_type', $file['type']);
        $stmt->bindParam(':image_type', $imageType);
        $stmt->bindParam(':related_id', $relatedId);
        
        if ($stmt->execute()) {
            $imageId = $db->lastInsertId();
            
            // Get the saved image info
            $getQuery = "SELECT * FROM images WHERE id = :image_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':image_id', $imageId);
            $getStmt->execute();
            $savedImage = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            $savedImage['url'] = '/backend/uploads/' . $savedImage['stored_name'];
            $savedImage['file_size_formatted'] = formatFileSize($savedImage['file_size']);
            
            ApiResponse::success($savedImage, 'Beautiful image uploaded! 📸✨', 201);
        }
        
    } catch (Exception $e) {
        // Clean up file if database save fails
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        ApiResponse::error('Failed to save image information', 500);
    }
});

// Delete image
$router->addRoute('DELETE', '/^\/api\/images\/(\d+)$/', function($imageId) {
    Auth::requireAuth();
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        // Get image info first
        $getQuery = "SELECT * FROM images WHERE id = :image_id AND user_id = :user_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':image_id', $imageId);
        $getStmt->bindParam(':user_id', $userId);
        $getStmt->execute();
        
        $image = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$image) {
            ApiResponse::error('Image not found', 404);
        }
        
        // Delete from database
        $deleteQuery = "DELETE FROM images WHERE id = :image_id AND user_id = :user_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(':image_id', $imageId);
        $deleteStmt->bindParam(':user_id', $userId);
        
        if ($deleteStmt->execute() && $deleteStmt->rowCount() > 0) {
            // Delete physical file
            if (file_exists($image['file_path'])) {
                unlink($image['file_path']);
            }
            
            ApiResponse::success(null, 'Image has been gently removed 🕊️');
        } else {
            ApiResponse::error('Failed to delete image', 500);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to delete image', 500);
    }
});

// Update image details
$router->addRoute('PUT', '/^\/api\/images\/(\d+)$/', function($imageId) {
    Auth::requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $database = new Database();
    $db = $database->connect();
    $userId = Auth::getCurrentUserId();
    
    try {
        $query = "UPDATE images SET alt_text = :alt_text 
                  WHERE id = :image_id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        $altText = $input['alt_text'] ?? '';
        $stmt->bindParam(':alt_text', $altText);
        $stmt->bindParam(':image_id', $imageId);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            // Get updated image
            $getQuery = "SELECT * FROM images WHERE id = :image_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':image_id', $imageId);
            $getStmt->execute();
            $updatedImage = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            $updatedImage['url'] = '/backend/uploads/' . $updatedImage['stored_name'];
            $updatedImage['file_size_formatted'] = formatFileSize($updatedImage['file_size']);
            
            ApiResponse::success($updatedImage, 'Image details updated! 🌸');
        } else {
            ApiResponse::error('Image not found', 404);
        }
        
    } catch (PDOException $e) {
        ApiResponse::error('Failed to update image', 500);
    }
});

// Serve uploaded images
$router->addRoute('GET', '/^\/uploads\/(.+)$/', function($filename) {
    $filePath = __DIR__ . '/../uploads/' . $filename;
    
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo 'Image not found';
        exit;
    }
    
    // Get file info
    $mimeType = mime_content_type($filePath);
    $fileSize = filesize($filePath);
    
    // Set appropriate headers
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . $fileSize);
    header('Cache-Control: public, max-age=31536000'); // 1 year cache
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
    
    // Output the file
    readfile($filePath);
    exit;
});

// Helper function to format file size
function formatFileSize($bytes) {
    if ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}
?>
