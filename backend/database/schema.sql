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
    profile_image VARCHAR(255) DEFAULT 'avatar1.jpg',
    bio TEXT,
    favorite_color VARCHAR(7) DEFAULT '#F8F6F0', -- Default to signature cream
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table - For organizing our thoughts beautifully
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#E8B4B8', -- Default dusty rose
    icon VARCHAR(50) DEFAULT '🌸',
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
    mood VARCHAR(50), -- happy, dreamy, peaceful, nostalgic, etc.
    weather VARCHAR(50), -- sunny, rainy, cloudy, etc.
    entry_date DATE NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    privacy_level ENUM('private', 'semi-private') DEFAULT 'private',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, entry_date),
    INDEX idx_mood (mood),
    INDEX idx_favorite (is_favorite)
);

-- Notes table - Quick beautiful thoughts
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    title VARCHAR(200) NOT NULL,
    content LONGTEXT NOT NULL,
    note_type ENUM('text', 'list', 'idea', 'quote') DEFAULT 'text',
    color VARCHAR(7) DEFAULT '#F4E4E6', -- Gentle pink
    is_pinned BOOLEAN DEFAULT FALSE,
    tags JSON, -- Store tags as JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_notes (user_id),
    INDEX idx_category (category_id),
    INDEX idx_pinned (is_pinned),
    INDEX idx_type (note_type)
);

-- Todos table - Our dreamy goals and tasks
CREATE TABLE todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    due_date DATE,
    reminder_datetime DATETIME,
    color VARCHAR(7) DEFAULT '#F8F6F0', -- Signature cream
    position INT DEFAULT 0, -- For custom ordering
    completed_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_todos (user_id),
    INDEX idx_completed (is_completed),
    INDEX idx_priority (priority),
    INDEX idx_due_date (due_date)
);

-- Images table - For our beautiful memories
CREATE TABLE images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    related_type ENUM('diary', 'note', 'profile') NOT NULL,
    related_id INT, -- ID of diary_entry, note, or user
    alt_text VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_images (user_id),
    INDEX idx_related (related_type, related_id)
);

-- Insert default categories for new users
INSERT INTO categories (user_id, name, color, icon) VALUES 
(1, 'Dreams', '#E8B4B8', '✨'),
(1, 'Memories', '#F4E4E6', '🌸'),
(1, 'Goals', '#F8F6F0', '🎯'),
(1, 'Inspiration', '#E8B4B8', '💫'),
(1, 'Daily Life', '#F4E4E6', '☀️');

-- Sample user for testing (password: 'dreamy123')
INSERT INTO users (username, email, password_hash, full_name, bio) VALUES 
('dreamer', 'dreamer@dearlock.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dream Keeper', 'Living life one beautiful moment at a time 🌸✨');
