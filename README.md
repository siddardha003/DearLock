# DearLock - Your Personal Sanctuary

<table>
  <tr>
    <td width="70%">
      <p>
        <b>A beautiful, Pinterest-inspired personal productivity application that combines diary entries, notes, and todo management in one secure sanctuary. Built with a clean, modern interface and robust backend API.</b> <br/><br/>
        <b>🔗 Live Demo:</b> https://siddardha003.github.io/Popcorn_Picks/
      </p>
    </td>
    <td width="30%" align="center">
      <img src="frontend/love-letter.svg" alt="DearLock Logo" width="160"/>
    </td>
  </tr>
</table

## ✨ Features

### 📔 Diary Management
- **Secure Diary Entries**: Write personal thoughts and memories with PIN protection
- **Date-based Organization**: View entries by specific dates
- **Beautiful Interface**: Clean, card-based UI with modern styling

### 📝 Notes System
- **Rich Text Notes**: Create detailed notes with beautiful formatting
- **Pin Important Notes**: Keep important notes at the top
- **Search Functionality**: Quickly find notes with powerful search

### ✅ Todo Management
- **Task Creation**: Add todos with titles and priorities
- **Priority Levels**: Organize tasks by low, medium, and high priority
- **Due Dates**: Set deadlines for your tasks
- **Progress Tracking**: Mark tasks as completed

### 👤 Profile Customization
- **Custom Profiles**: Personalize your account information
- **Font Selection**: Choose your preferred reading font
- **Profile Icons**: Select from available profile icons

## 🛠️ Tech Stack

### Frontend & Backend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties and flexbox/grid
- **Vanilla JavaScript** - No frameworks, pure ES6+ JavaScript
- **Responsive Design** - Works on all device sizes
- **PHP 7.4+** - Server-side logic
- **MySQL** - Database management
- **RESTful API** - Clean API endpoints


## 🚀 Quick Start

### Installation

1. **Clone the repository**

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


3. **Create the database**
   ```bash
   # Option 1: Run the setup script
   # Visit: http://localhost/DearLock/backend/setup.php
   
   # Option 2: Manual database creation
   # Import backend/database/schema.sql into your MySQL server
   ```

4. **Access the application**
   ```
   Frontend: http://localhost/DearLock/frontend/
   API Base: http://localhost/DearLock/backend/api/
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

## 👨‍💻 Author

**Siddardha** - [GitHub Profile](https://github.com/siddardha003)
**Sarayu** - [GitHub Profile](https://github.com/msarayu20)

---

<div align="center">
     
**DearLock** - Keep your thoughts, dreams, and goals safe in your personal digital sanctuary. 🏰✨
</div>