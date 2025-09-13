-- DearLock Database Schema
-- A dreamy, Pinterest-inspired notes + diary + todo application

CREATE DATABASE IF NOT EXISTS dearlock_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dearlock_db;

-- Users table - Our beautiful souls
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    profile_icon VARCHAR(50) DEFAULT 'avatar1.jpg',
    font_family VARCHAR(50) DEFAULT 'Inter',
    diary_pin VARCHAR(255), -- Bcrypt hash for diary PIN (needs 60+ chars)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table - For organizing notes with beautiful labels
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#E8B4B8', -- Default dusty rose
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category (user_id, name)
);

-- Diary Entries table - Our most precious thoughts
CREATE TABLE diary_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content LONGTEXT NOT NULL,
    entry_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, entry_date)
);

-- Notes table - Quick beautiful thoughts
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    title VARCHAR(200) NOT NULL,
    content LONGTEXT NOT NULL,
    background_image VARCHAR(255), -- Path to background image
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_notes (user_id),
    INDEX idx_category (category_id),
    INDEX idx_pinned (is_pinned)
);

-- Todos table - Our simple goals and tasks
CREATE TABLE todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    due_date DATE NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_todos (user_id),
    INDEX idx_completed (is_completed),
    INDEX idx_due_date (due_date),
    INDEX idx_priority (priority)
);

-- Images table - For note backgrounds and profile pictures
CREATE TABLE images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    image_type ENUM('note_background', 'profile') NOT NULL,
    related_id INT, -- ID of note or user
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_images (user_id),
    INDEX idx_type_related (image_type, related_id)
);

-- Sample user for testing (password: 'dreamy123')
INSERT INTO users (username, email, password_hash, full_name) VALUES 
('dreamer', 'dreamer@dearlock.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dream Keeper');

-- Insert default categories for new users
INSERT INTO categories (user_id, name, color) VALUES 
(1, 'Personal', '#E8B4B8'),
(1, 'Work', '#F4E4E6'),
(1, 'Ideas', '#F8F6F0'),
(1, 'Important', '#E8B4B8');
