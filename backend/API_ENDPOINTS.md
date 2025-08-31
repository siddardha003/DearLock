# DearLock API Endpoints

## Authentication Routes

### User Registration & Login
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/status` - Check authentication status
- `GET /api/auth/me` - Get current user info

### Profile Management
- `PUT /api/auth/profile` - Update user profile (name, email, icon, font)
- `PUT /api/auth/password` - Change password
- `GET /api/auth/icons` - Get available profile icons
- `GET /api/auth/fonts` - Get available fonts

### Diary PIN System
- `PUT /api/auth/diary-pin` - Set diary PIN (exactly 4 digits)
- `POST /api/auth/verify-diary-pin` - Verify PIN to access diary
- `GET /api/auth/diary-access` - Check diary access status

## Notes Routes

### Basic CRUD
- `GET /api/notes` - Get all notes (with pagination, category filter)
- `GET /api/notes/{id}` - Get single note
- `POST /api/notes` - Create new note
- `PUT /api/notes/{id}` - Update note
- `DELETE /api/notes/{id}` - Delete note

### Note Features
- `PUT /api/notes/{id}/pin` - Toggle pin status

### Note Fields
- `title` - Note title (required)
- `content` - Note content (required)
- `category_id` - Category/label ID (optional)
- `background_image` - Path to background image (optional)
- `is_pinned` - Pin status (boolean)

## Todo Routes

### Basic CRUD
- `GET /api/todos` - Get all todos (with pagination)
- `GET /api/todos/{id}` - Get single todo
- `POST /api/todos` - Create new todo
- `PUT /api/todos/{id}` - Update todo
- `DELETE /api/todos/{id}` - Delete todo

### Todo Features
- `PUT /api/todos/{id}/complete` - Toggle completion status
- `PUT /api/todos/{id}/progress` - Update individual steps progress

### Todo Fields
- `title` - Todo title (required)
- `description` - Todo description (optional)
- `total_steps` - Total number of steps (default: 1)
- `completed_steps` - Number of completed steps (default: 0)
- `is_completed` - Overall completion status (boolean)
- Returns `progress_text` as "3/4" format

## Diary Routes (PIN Protected)

### Basic CRUD
- `GET /api/diary` - Get all diary entries (with pagination)
- `GET /api/diary/{id}` - Get single diary entry
- `POST /api/diary` - Create new diary entry
- `PUT /api/diary/{id}` - Update diary entry
- `DELETE /api/diary/{id}` - Delete diary entry

### Diary Fields
- `title` - Entry title (required)
- `content` - Entry content (required)
- `entry_date` - Date of entry (default: current date)

**Note**: All diary routes require PIN verification if PIN is set.

## Categories Routes (For Notes Only)

### Category Management
- `GET /api/categories` - Get all categories with note counts
- `GET /api/categories/{id}` - Get single category
- `POST /api/categories` - Create new category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Category Fields
- `name` - Category name (required)
- `color` - Hex color code (default: #E8B4B8)

## Images Routes

### Image Management
- `GET /api/images/{type}/{id}` - Get images for specific type and ID
- `GET /api/images/backgrounds` - Get available background images
- `POST /api/images/upload` - Upload new image
- `DELETE /api/images/{id}` - Delete image

### Image Types
- `note_background` - Background images for notes
- `profile` - Profile pictures

### Upload Fields
- `image` - Image file (required)
- `image_type` - Type: "note_background" or "profile" (required)
- `related_id` - ID of note or user (required)

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {...},
  "timestamp": "2025-08-31 10:30:00"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {...},
  "timestamp": "2025-08-31 10:30:00"
}
```

## Authentication

- Most endpoints require authentication
- Use session-based authentication
- Include session cookie with requests
- PIN verification required for diary access (if PIN is set)

## File Upload

- Maximum file size: 5MB
- Supported formats: JPEG, PNG, GIF, WebP
- Files stored in `/backend/uploads/` directory
- Unique filenames generated automatically

## Pagination

Default pagination parameters for list endpoints:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: varies by endpoint)

Response includes pagination info:
- `current_page`
- `total_pages`
- `total_items`
- `limit`
