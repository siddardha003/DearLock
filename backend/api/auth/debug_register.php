<?php
// Debug version of register endpoint
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set content type for JSON response
header('Content-Type: application/json');

// Allow CORS
$allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1',
    'https://dearlock.netlify.app'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://dearlock.netlify.app');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Test environment variables
    $debug_info = [
        'timestamp' => date('Y-m-d H:i:s'),
        'method' => $_SERVER['REQUEST_METHOD'],
        'environment' => [
            'APP_ENV' => $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?? 'not set',
            'MYSQLHOST' => $_ENV['MYSQLHOST'] ?? getenv('MYSQLHOST') ?? 'not set',
            'MYSQLDATABASE' => $_ENV['MYSQLDATABASE'] ?? getenv('MYSQLDATABASE') ?? 'not set', 
            'MYSQLUSER' => $_ENV['MYSQLUSER'] ?? getenv('MYSQLUSER') ?? 'not set',
            'MYSQLPASSWORD' => isset($_ENV['MYSQLPASSWORD']) || getenv('MYSQLPASSWORD') ? 'set' : 'not set',
            'MYSQLPORT' => $_ENV['MYSQLPORT'] ?? getenv('MYSQLPORT') ?? 'not set'
        ]
    ];
    
    // Test database connection
    try {
        require_once __DIR__ . '/../../config/database.php';
        $database = new Database();
        $db = $database->connect();
        
        if ($db) {
            $debug_info['database'] = 'Connected successfully';
            
            // Test a simple query
            $testQuery = $db->query("SELECT 1 as test");
            $debug_info['database_test'] = $testQuery ? 'Query test passed' : 'Query test failed';
            
            // Check if users table exists
            $tableQuery = $db->query("SHOW TABLES LIKE 'users'");
            $debug_info['users_table'] = $tableQuery && $tableQuery->rowCount() > 0 ? 'exists' : 'missing';
            
        } else {
            $debug_info['database'] = 'Connection failed';
        }
    } catch (Exception $e) {
        $debug_info['database'] = 'Error: ' . $e->getMessage();
    }
    
    // Test session
    try {
        $isProduction = $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?? 'development';
        session_start([
            'cookie_lifetime' => 86400,
            'cookie_secure' => $isProduction === 'production',
            'cookie_httponly' => true,
            'cookie_samesite' => 'None',
            'cookie_path' => '/'
        ]);
        $debug_info['session'] = 'Started successfully';
        $debug_info['session_id'] = session_id();
    } catch (Exception $e) {
        $debug_info['session'] = 'Error: ' . $e->getMessage();
    }
    
    // Test input reading
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw_input = file_get_contents('php://input');
        $debug_info['raw_input'] = $raw_input;
        
        $input = json_decode($raw_input, true);
        $debug_info['parsed_input'] = $input;
        $debug_info['json_error'] = json_last_error_msg();
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Debug information',
        'debug' => $debug_info
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Debug failed',
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?>