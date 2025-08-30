<?php
// Simple test script to verify API endpoints
header('Content-Type: application/json');

echo json_encode([
    'message' => 'Welcome to your beautiful DearLock API! 🌸✨',
    'status' => 'Backend is running perfectly!',
    'endpoints' => [
        'Authentication' => '/api/auth/*',
        'Diary Entries' => '/api/diary/*', 
        'Notes' => '/api/notes/*',
        'Todos' => '/api/todos/*',
        'Categories' => '/api/categories/*',
        'Images' => '/api/images/*'
    ],
    'colors' => [
        'signature_cream' => '#F8F6F0',
        'dusty_rose' => '#E8B4B8', 
        'gentle_pink' => '#F4E4E6',
        'lavender_touch' => '#E6E6FA'
    ],
    'ready' => true,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
