# 🔒 DearLock - Your Personal Sanctuary

A beautiful, Pinterest-inspired personal productivity application that combines diary entries, notes, and todo management in one secure sanctuary. Built with a clean, modern interface and robust backend API.

![DearLock Logo](frontend/love-letter.svg)

## ✨ Features

### 📔 Diary Management
- **Secure Diary Entries**: Write personal thoughts and memories with PIN protection
- **Date-based Organization**: View entries by specific dates
- **CRUD Operations**: Create, read, update, and delete diary entries
- **Beautiful Interface**: Clean, card-based UI with modern styling

### 📝 Notes System
- **Rich Text Notes**: Create detailed notes with beautiful formatting
- **Category Organization**: Organize notes with customizable categories and colors
- **Image Support**: Add background images to your notes
- **Pin Important Notes**: Keep important notes at the top
- **Search Functionality**: Quickly find notes with powerful search

### ✅ Todo Management
- **Task Creation**: Add todos with titles and priorities
- **Priority Levels**: Organize tasks by low, medium, and high priority
- **Due Dates**: Set deadlines for your tasks
- **Progress Tracking**: Mark tasks as completed
- **Filter Options**: View tasks by status and priority

### 👤 Profile Customization
- **Custom Profiles**: Personalize your account information
- **Font Selection**: Choose your preferred reading font
- **Profile Icons**: Select from available profile icons

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties and flexbox/grid
- **Vanilla JavaScript** - No frameworks, pure ES6+ JavaScript
- **Responsive Design** - Works on all device sizes

### Backend & Server Requirements
- **PHP 7.4+** - Server-side logic
- **MySQL** - Database management
- **PDO** - Database abstraction layer
- **RESTful API** - Clean API endpoints
- **Session-based Authentication** - Secure user sessions
- **XAMPP/WAMP/LAMP** - Local development environment


## 🚀 Quick Start

### Prerequisites
- XAMPP, WAMP, or LAMP stack installed
- Git installed on your system
- Web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
     If you prefer to clone directly into your web server directory:

     ```bash
     # Navigate to your web server document root
     cd /path/to/xampp/htdocs/  # or /var/www/html/ for Linux

     # Clone the repository
     git clone https://github.com/siddardha003/DearLock.git

     # Navigate to the project
     cd DearLock
     ```

2. **Start your web server**
   - Start Apache and MySQL services in XAMPP/WAMP
   - Ensure Apache is running on port 80 (or your preferred port)
   - Ensure MySQL is running on port 3306 (or update config accordingly)

3. **Configure the database**
   ```bash
   # Update database credentials in backend/config/database.php
   # Default settings:
   # - Host: localhost
   # - Database: dearlock_db
   # - Username: root
   # - Password: (set your MySQL password)
   # - Port: 3307 (update if different)
   ```

4. **Create the database**
   ```bash
   # Option 1: Run the setup script
   # Visit: http://localhost/DearLock/backend/setup.php
   
   # Option 2: Manual database creation
   # Import backend/database/schema.sql into your MySQL server
   ```

5. **Access the application**
   ```
   Frontend: http://localhost/DearLock/frontend/
   API Base: http://localhost/DearLock/backend/api/
   ```


## 📁 Project Structure

```
DearLock/
├── 📁 frontend/                 # Client-side application
│   ├── 📁 css/
│   │   └── style.css           # Main stylesheet
│   ├── 📁 js/                  # JavaScript modules
│   │   ├── main.js             # Main navigation
│   │   ├── login.js            # Authentication
│   │   ├── signup.js           # User registration
│   │   ├── dashboard.js        # Dashboard functionality
│   │   ├── diary.js            # Diary management
│   │   ├── notes.js            # Notes management
│   │   ├── todo.js             # Todo management
│   │   └── profile.js          # Profile management
│   ├── index.html              # Landing page
│   ├── login.html              # Login page
│   ├── signup.html             # Registration page
│   ├── dashboard.html          # Main dashboard
│   ├── diary.html              # Diary interface
│   ├── notes.html              # Notes interface
│   ├── todo.html               # Todo interface
│   ├── profile.html            # Profile page
│   └── love-letter.svg         # App icon
│
├── 📁 backend/                  # Server-side application
│   ├── 📁 api/                 # API endpoints
│   │   ├── 📁 auth/            # Authentication endpoints
│   │   │   ├── register.php    # User registration
│   │   │   ├── login.php       # User login
│   │   │   ├── logout.php      # User logout
│   │   │   ├── me.php          # User profile info
│   │   │   ├── password.php    # Password management
│   │   │   ├── set-diary-pin.php # Diary PIN setup
│   │   │   └── verify-diary-pin.php # Diary PIN verification
│   │   ├── diary.php           # Diary CRUD operations
│   │   ├── notes.php           # Notes CRUD operations
│   │   └── todos.php           # Todo CRUD operations
│   ├── 📁 config/
│   │   └── database.php        # Database connection
│   ├── 📁 database/
│   │   └── schema.sql          # Database structure
│   ├── api_config.php          # API configuration
│   ├── setup.php               # Database setup script
│   └── .htaccess               # Apache URL rewriting
│
└── README.md                   # This file
```

## 🔧 Configuration

### Database Configuration

Edit `backend/config/database.php`:

```php
private $host = 'localhost';
private $db_name = 'dearlock_db';
private $username = 'root';
private $password = 'your_mysql_password';
// Update port if needed (default: 3307)
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user info |
| PUT | `/api/auth/password` | Change password |
| PUT | `/api/auth/set-diary-pin` | Set diary PIN |
| POST | `/api/auth/verify-diary-pin` | Verify diary PIN |

### Notes Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get all notes |
| GET | `/api/notes/{id}` | Get single note |
| POST | `/api/notes` | Create new note |
| PUT | `/api/notes/{id}` | Update note |
| DELETE | `/api/notes/{id}` | Delete note |

### Diary Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/diary` | Get diary entries |
| GET | `/api/diary/{id}` | Get single entry |
| POST | `/api/diary` | Create new entry |
| PUT | `/api/diary/{id}` | Update entry |
| DELETE | `/api/diary/{id}` | Delete entry |

### Todo Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Get all todos |
| GET | `/api/todos/{id}` | Get single todo |
| POST | `/api/todos` | Create new todo |
| PUT | `/api/todos/{id}` | Update todo |
| DELETE | `/api/todos/{id}` | Delete todo |


## 🎨 Design Features

- **Modern UI**: Clean, Pinterest-inspired design
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Custom Color Scheme**: Soft pink and cream theme
- **Typography**: Inter font family for excellent readability
- **Card-based Interface**: Clean card layouts for all content
- **Smooth Interactions**: CSS transitions for better UX

## 🧪 Testing

### Manual Testing

1. **User Registration**: Create a new account
2. **User Login**: Log in with credentials
3. **Diary Functionality**: 
   - Set a diary PIN
   - Create, edit, and delete diary entries
4. **Notes Management**: 
   - Create notes with categories
   - Pin important notes
   - Search functionality
5. **Todo Management**: 
   - Create todos with priorities
   - Mark todos as complete
   - Filter by status

### Test Data

The database schema includes sample data:
- Test user: `dreamer` / `dreamer@dearlock.com` (password: `dreamy123`)
- Default categories: Personal, Work, Ideas, Important


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Siddardha** - [GitHub Profile](https://github.com/siddardha003)
**Sarayu** - [GitHub Profile](https://github.com/msarayu20)


## 🙏 Acknowledgments

- Design inspiration from Pinterest and modern note-taking apps
- Icons and SVG graphics for enhanced user experience
- PHP and MySQL communities for excellent documentation

---

**DearLock** - Keep your thoughts, dreams, and goals safe in your personal digital sanctuary. 🏰✨