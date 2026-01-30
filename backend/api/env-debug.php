<?php
// Railway environment debug
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Get all environment variables related to MySQL/Database
$env_vars = [
    // Standard Railway MySQL variables
    'MYSQLHOST' => $_ENV['MYSQLHOST'] ?? getenv('MYSQLHOST') ?? 'not set',
    'MYSQLPORT' => $_ENV['MYSQLPORT'] ?? getenv('MYSQLPORT') ?? 'not set',
    'MYSQLDATABASE' => $_ENV['MYSQLDATABASE'] ?? getenv('MYSQLDATABASE') ?? 'not set',
    'MYSQLUSER' => $_ENV['MYSQLUSER'] ?? getenv('MYSQLUSER') ?? 'not set',
    'MYSQLPASSWORD' => (isset($_ENV['MYSQLPASSWORD']) || getenv('MYSQLPASSWORD')) ? 'SET (hidden)' : 'not set',
    
    // Alternative names
    'MYSQL_HOST' => $_ENV['MYSQL_HOST'] ?? getenv('MYSQL_HOST') ?? 'not set',
    'MYSQL_PORT' => $_ENV['MYSQL_PORT'] ?? getenv('MYSQL_PORT') ?? 'not set',
    'MYSQL_DATABASE' => $_ENV['MYSQL_DATABASE'] ?? getenv('MYSQL_DATABASE') ?? 'not set',
    'MYSQL_USER' => $_ENV['MYSQL_USER'] ?? getenv('MYSQL_USER') ?? 'not set',
    'MYSQL_PASSWORD' => (isset($_ENV['MYSQL_PASSWORD']) || getenv('MYSQL_PASSWORD')) ? 'SET (hidden)' : 'not set',
    
    // URL variants
    'DATABASE_URL' => $_ENV['DATABASE_URL'] ?? getenv('DATABASE_URL') ?? 'not set',
    'MYSQL_URL' => $_ENV['MYSQL_URL'] ?? getenv('MYSQL_URL') ?? 'not set',
    
    // Private/Public URLs (Railway specific)
    'DATABASE_PRIVATE_URL' => $_ENV['DATABASE_PRIVATE_URL'] ?? getenv('DATABASE_PRIVATE_URL') ?? 'not set',
    'DATABASE_PUBLIC_URL' => $_ENV['DATABASE_PUBLIC_URL'] ?? getenv('DATABASE_PUBLIC_URL') ?? 'not set',
    'MYSQL_PRIVATE_URL' => $_ENV['MYSQL_PRIVATE_URL'] ?? getenv('MYSQL_PRIVATE_URL') ?? 'not set',
    'MYSQL_PUBLIC_URL' => $_ENV['MYSQL_PUBLIC_URL'] ?? getenv('MYSQL_PUBLIC_URL') ?? 'not set',
    
    // Other
    'APP_ENV' => $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?? 'not set',
    'RAILWAY_ENVIRONMENT' => $_ENV['RAILWAY_ENVIRONMENT'] ?? getenv('RAILWAY_ENVIRONMENT') ?? 'not set',
];

// Check what getenv() returns for all env vars
$all_env = getenv();

$response = [
    'status' => 'ok',
    'message' => 'Railway Environment Variables Debug',
    'timestamp' => date('Y-m-d H:i:s'),
    'checked_variables' => $env_vars,
    'all_mysql_related_vars' => []
];

// Filter all env vars for MySQL related ones
if (is_array($all_env)) {
    foreach ($all_env as $key => $value) {
        if (stripos($key, 'MYSQL') !== false || stripos($key, 'DATABASE') !== false || stripos($key, 'DB_') !== false) {
            $response['all_mysql_related_vars'][$key] = (stripos($key, 'PASS') !== false || stripos($key, 'PASSWORD') !== false) ? 'SET (hidden)' : $value;
        }
    }
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>
