<?php
// Logout endpoint
require_once __DIR__ . '/../../api_config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Method not allowed', 405);
}

Auth::logout();
ApiResponse::success(null, 'Successfully logged out. Sweet dreams! 🌙');
?>
