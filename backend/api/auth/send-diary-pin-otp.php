<?php
// Send OTP for diary PIN reset
// Suppress errors to prevent HTML output
error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../api_config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Method not allowed', 405);
}

Auth::requireAuth();

$database = new Database();
$db = $database->connect();

try {
    $userId = Auth::getCurrentUserId();
    
    // Get user email
    $query = "SELECT email, full_name FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        ApiResponse::error('User not found', 404);
    }
    
    // Generate 6-digit OTP
    $otp = sprintf('%06d', mt_rand(0, 999999));
    $expiry = date('Y-m-d H:i:s', time() + 600); // 10 minutes expiry
    
    // Store OTP in session (in production, you might want to use database)
    $_SESSION['diary_pin_otp'] = [
        'code' => $otp,
        'expiry' => $expiry,
        'user_id' => $userId
    ];
    
    // Email content
    $subject = 'DearLock - Diary PIN Reset OTP';
    $message = "
    <html>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background: linear-gradient(135deg, #E8B4B8, #F5D5D7); padding: 30px; border-radius: 15px; text-align: center;'>
                <h1 style='color: #6B4C57; margin: 0; font-size: 28px;'>🔐 DearLock</h1>
                <p style='color: #8B6B7A; margin: 10px 0 0 0; font-size: 16px;'>Your Digital Sanctuary</p>
            </div>
            
            <div style='background: white; padding: 30px; border-radius: 15px; margin-top: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);'>
                <h2 style='color: #6B4C57; margin-top: 0;'>Diary PIN Reset Request</h2>
                
                <p>Hello " . htmlspecialchars($user['full_name'] ?: 'User') . ",</p>
                
                <p>You requested to reset your diary PIN. Please use the following One-Time Password (OTP) to proceed:</p>
                
                <div style='background: #F8F9FA; border: 2px dashed #E8B4B8; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;'>
                    <span style='font-size: 32px; font-weight: bold; color: #6B4C57; letter-spacing: 5px;'>{$otp}</span>
                </div>
                
                <p style='color: #E74C3C; font-weight: bold;'>⏰ This OTP expires in 10 minutes.</p>
                
                <p style='font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;'>
                    If you didn't request this, please ignore this email or contact support if you're concerned about your account security.
                </p>
            </div>
            
            <div style='text-align: center; margin-top: 20px; color: #999; font-size: 12px;'>
                <p>© 2025 DearLock. Keep your thoughts safe and secure.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: DearLock <noreply@dearlock.com>" . "\r\n";
    
    // Send email
    if (mail($user['email'], $subject, $message, $headers)) {
        ApiResponse::success(null, 'OTP sent to your email address');
    } else {
        ApiResponse::error('Failed to send OTP email', 500);
    }
    
} catch (PDOException $e) {
    error_log('OTP send error: ' . $e->getMessage());
    ApiResponse::error('Failed to send OTP: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    error_log('General error in OTP send: ' . $e->getMessage());
    ApiResponse::error('An error occurred: ' . $e->getMessage(), 500);
}
?>