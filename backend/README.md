# DearLock Backend Setup Guide 🌸✨

Welcome to your beautiful DearLock backend! This guide will help you set up your dreamy API server.

## Prerequisites
- PHP 7.4 or higher
- MySQL/MariaDB database
- Web server (Apache/Nginx) or PHP built-in server

## Quick Setup

### 1. Database Setup
1. Create a MySQL database named `dearlock_db`
2. Import the schema: `mysql -u root -p dearlock_db < database/schema.sql`
3. Update database credentials in `config/database.php`

### 2. Configuration
Edit `config/database.php` with your database details:
```php
private $host = 'localhost';
private $db_name = 'dearlock_db';
private $username = 'your_db_username';
private $password = 'your_db_password';
```

### 3. Permissions
Create uploads directory and set permissions:
```bash
mkdir uploads
chmod 755 uploads
```

### 4. Start the Server

#### Option A: PHP Built-in Server (for development)
```bash
cd backend
php -S localhost:8000 api.php
```

#### Option B: Apache/Nginx
Point your web server document root to the `backend` directory.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/status` - Check auth status

### Diary Entries 📖
- `GET /api/diary` - Get all diary entries (with pagination)
- `GET /api/diary/{id}` - Get single diary entry
- `POST /api/diary` - Create new diary entry
- `PUT /api/diary/{id}` - Update diary entry
- `DELETE /api/diary/{id}` - Delete diary entry
- `PUT /api/diary/{id}/favorite` - Toggle favorite status

### Notes 📝
- `GET /api/notes` - Get all notes (with filters)
- `GET /api/notes/{id}` - Get single note
- `POST /api/notes` - Create new note
- `PUT /api/notes/{id}` - Update note
- `DELETE /api/notes/{id}` - Delete note
- `PUT /api/notes/{id}/pin` - Toggle pin status
- `GET /api/notes/search?q=query` - Search notes

### Todos ✨
- `GET /api/todos` - Get all todos (with filters)
- `GET /api/todos/{id}` - Get single todo
- `POST /api/todos` - Create new todo
- `PUT /api/todos/{id}` - Update todo
- `DELETE /api/todos/{id}` - Delete todo
- `PUT /api/todos/{id}/complete` - Toggle completion
- `PUT /api/todos/reorder` - Reorder todos
- `GET /api/todos/stats` - Get statistics

### Categories 🏷️
- `GET /api/categories` - Get all categories
- `GET /api/categories/{id}` - Get single category
- `POST /api/categories` - Create new category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category
- `GET /api/categories/colors` - Get color palette
- `GET /api/categories/icons` - Get icon options

### Images 📸
- `GET /api/images/{type}/{id}` - Get images for item
- `POST /api/images/upload` - Upload new image
- `PUT /api/images/{id}` - Update image details
- `DELETE /api/images/{id}` - Delete image
- `GET /uploads/{filename}` - Serve uploaded images

## Color Palette 🎨
Your beautiful Pinterest-inspired colors:
- **Signature Cream**: #F8F6F0 (Your signature color!)
- **Dusty Rose**: #E8B4B8 (Soft and dreamy)
- **Gentle Pink**: #F4E4E6 (Warm and loving)
- **Lavender Touch**: #E6E6FA (For special moments)
- **Sage Green**: #9CAF88 (When nature vibes are needed)
- **Golden Hour**: #F5DEB3 (For special elements)

## Authentication
This backend uses PHP sessions for authentication. Users stay logged in until they explicitly log out or the session expires.

## Security Features
- Password hashing with PHP's `password_hash()`
- SQL injection protection with prepared statements
- Input validation and sanitization
- Session-based authentication
- File upload validation and security

## Error Handling
All API responses follow a consistent format:
```json
{
  "success": true/false,
  "message": "Beautiful message 🌸",
  "data": { ... },
  "timestamp": "2025-08-30 10:30:00"
}
```

## Testing
You can test the API with:
1. Postman or similar API client
2. Frontend JavaScript fetch requests
3. cURL commands

Example login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dreamer","password":"dreamy123"}'
```

Your beautiful DearLock backend is ready to serve your dreamy frontend! 🌸✨

Remember: This is your personal sanctuary - keep it beautiful and secure! 💖
