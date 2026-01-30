<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;
    
    public function __construct() {
        // Use environment variables in production, fallback to local values
        $this->host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? $_ENV['DATABASE_URL'] ?? getenv('DATABASE_URL') ?? 'localhost';
        $this->db_name = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'dearlock_db';
        $this->username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?? '';
        
        // Handle Railway's DATABASE_URL format if present
        $database_url = $_ENV['DATABASE_URL'] ?? getenv('DATABASE_URL');
        if ($database_url) {
            $url_parts = parse_url($database_url);
            if ($url_parts) {
                $this->host = $url_parts['host'] ?? $this->host;
                $this->db_name = ltrim($url_parts['path'] ?? '', '/') ?: $this->db_name;
                $this->username = $url_parts['user'] ?? $this->username;
                $this->password = $url_parts['pass'] ?? $this->password;
            }
        }
        
        // Log environment detection (remove in production)
        error_log("Database Config - Host: " . $this->host . ", DB: " . $this->db_name . ", User: " . $this->username);
    }
    
    public function connect() {
        $this->conn = null;
        
        try {
            // Add port support for Railway
            $port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?? 3306;
            
            $dsn = "mysql:host=" . $this->host . ";port=" . $port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false, // For production SSL
                ]
            );
            
            error_log("Database connected successfully to " . $this->host . ":" . $port);
            
        } catch(PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            error_log("Connection details - Host: " . $this->host . ", DB: " . $this->db_name . ", User: " . $this->username);
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
        
        return $this->conn;
    }
}
?>
