<?php
// Simple session test
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Set session data
    $_SESSION['test_user'] = 'test_value';
    $_SESSION['timestamp'] = time();
    
    echo json_encode([
        'success' => true,
        'message' => 'Session data set',
        'session_id' => session_id(),
        'data' => $_SESSION
    ]);
} else {
    // Get session data
    echo json_encode([
        'success' => true,
        'message' => 'Session data retrieved',
        'session_id' => session_id(),
        'has_session' => isset($_SESSION['test_user']),
        'data' => $_SESSION ?? []
    ]);
}
?>
