<?php
// Test registration
require_once __DIR__ . '/api_config.php';

echo "Testing registration...\n";

$testData = [
    'username' => 'testuser',
    'email' => 'test@test.com',
    'password' => 'password123',
    'full_name' => 'Test User'
];

echo "Test data: " . json_encode($testData) . "\n";

// Simulate POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST = $testData;

// Capture output
ob_start();
include __DIR__ . '/api/auth/register.php';
$output = ob_get_clean();

echo "Registration output: " . $output . "\n";
?>
