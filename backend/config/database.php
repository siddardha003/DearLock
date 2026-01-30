<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $conn;
    
    public function __construct() {
        // Try Railway's MYSQL_URL or DATABASE_URL first (most reliable)
        $mysql_url = $_ENV['MYSQL_URL'] ?? getenv('MYSQL_URL') ?? $_ENV['MYSQL_PRIVATE_URL'] ?? getenv('MYSQL_PRIVATE_URL');
        $database_url = $_ENV['DATABASE_URL'] ?? getenv('DATABASE_URL') ?? $_ENV['DATABASE_PRIVATE_URL'] ?? getenv('DATABASE_PRIVATE_URL');
        
        // Parse URL if available
        $connection_url = $mysql_url ?: $database_url;
        
        if ($connection_url) {
            $url_parts = parse_url($connection_url);
            if ($url_parts) {
                $this->host = $url_parts['host'] ?? 'localhost';
                $this->db_name = ltrim($url_parts['path'] ?? '', '/') ?: 'dearlock_db';
                $this->username = $url_parts['user'] ?? 'root';
                $this->password = $url_parts['pass'] ?? '';
                $this->port = $url_parts['port'] ?? 3306;
            } else {
                // Fallback to individual variables
                $this->host = $_ENV['MYSQLHOST'] ?? getenv('MYSQLHOST') ?? $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost';
                $this->db_name = $_ENV['MYSQLDATABASE'] ?? getenv('MYSQLDATABASE') ?? $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'dearlock_db';
                $this->username = $_ENV['MYSQLUSER'] ?? getenv('MYSQLUSER') ?? $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'root';
                $this->password = $_ENV['MYSQLPASSWORD'] ?? getenv('MYSQLPASSWORD') ?? $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?? '';
                $this->port = $_ENV['MYSQLPORT'] ?? getenv('MYSQLPORT') ?? $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?? 3306;
            }
        } else {
            // Railway uses specific MySQL variable names, fallback to standard names, then local values
            $this->host = $_ENV['MYSQLHOST'] ?? getenv('MYSQLHOST') ?? $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost';
            $this->db_name = $_ENV['MYSQLDATABASE'] ?? getenv('MYSQLDATABASE') ?? $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'dearlock_db';
            $this->username = $_ENV['MYSQLUSER'] ?? getenv('MYSQLUSER') ?? $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'root';
            $this->password = $_ENV['MYSQLPASSWORD'] ?? getenv('MYSQLPASSWORD') ?? $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?? '';
            $this->port = $_ENV['MYSQLPORT'] ?? getenv('MYSQLPORT') ?? $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?? 3306;
        }
        
        // Log environment detection
        error_log("Database Config - Host: " . $this->host . ", Port: " . $this->port . ", DB: " . $this->db_name . ", User: " . $this->username);
    }
    
    public function connect() {
        $this->conn = null;
        
        try {
            // Use the port from constructor
            $port = $this->port ?? 3306;
            
            $dsn = "mysql:host=" . $this->host . ";port=" . $port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
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
