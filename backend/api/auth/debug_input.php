<?php
// Debug JSON input handling
require_once __DIR__ . '/../../api_config.php';

echo "<h2>Debug JSON Input</h2>";

echo "<h3>Raw Input:</h3>";
$rawInput = file_get_contents('php://input');
echo "<pre>" . htmlspecialchars($rawInput) . "</pre>";

echo "<h3>Content Type:</h3>";
echo "<p>" . ($_SERVER['CONTENT_TYPE'] ?? 'Not set') . "</p>";

echo "<h3>Request Method:</h3>";
echo "<p>" . ($_SERVER['REQUEST_METHOD'] ?? 'Not set') . "</p>";

echo "<h3>Decoded JSON:</h3>";
$input = json_decode($rawInput, true);
if ($input === null) {
    echo "<p style='color: red;'>❌ JSON decode failed</p>";
    echo "<p>JSON Error: " . json_last_error_msg() . "</p>";
} else {
    echo "<p style='color: green;'>✅ JSON decoded successfully</p>";
    echo "<pre>" . print_r($input, true) . "</pre>";
}

echo "<h3>POST Data:</h3>";
echo "<pre>" . print_r($_POST, true) . "</pre>";

echo "<h3>All Headers:</h3>";
echo "<pre>" . print_r(getallheaders(), true) . "</pre>";
?>
