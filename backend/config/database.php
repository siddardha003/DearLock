<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'dearlock_db';
    private $username = 'root'; // Change as needed
    private $password = ''; // Your phpMyAdmin password
    private $conn;
    
    public function connect() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
        
        return $this->conn;
    }
}
?>
