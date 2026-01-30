<?php
// Health check endpoint
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$health = [
    'status' => 'ok',
    'timestamp' => date('Y-m-d H:i:s'),
    'environment' => $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?? 'unknown',
    'php_version' => PHP_VERSION,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown'
];

// Test database connection
try {
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $db = $database->connect();
    
    if ($db) {
        $health['database'] = 'connected';
        $testQuery = $db->query("SELECT 1 as test");
        $health['database_test'] = $testQuery ? 'passed' : 'failed';
    } else {
        $health['database'] = 'failed';
    }
} catch (Exception $e) {
    $health['database'] = 'error';
    $health['database_error'] = $e->getMessage();
}

echo json_encode($health, JSON_PRETTY_PRINT);
?>