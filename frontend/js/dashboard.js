// DearLock - Dashboard JavaScript
let currentPin = '';
let currentTab = 'dashboard';
let currentSection = 'dashboard';
let diaryUnlocked = false;

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Load user data
    loadUserData();
    
    // Load dashboard stats
    loadDashboardStats();
});

function checkAuthStatus() {
    // In a real app, you'd check session or token
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const userData = JSON.parse(user);
        document.getElementById('userGreeting').textContent = `Hello, ${userData.full_name || userData.username || 'User'}!`;
    } catch (e) {
        console.error('Error parsing user data:', e);
    }
}

function loadUserData() {
    // This would typically fetch from API
    const user = localStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        document.getElementById('userGreeting').textContent = `Hello, ${userData.full_name || userData.username || 'User'}!`;
    }
}

async function loadDashboardStats() {
    try {
        // Load notes count
        const notesResponse = await fetch('../backend/api/notes.php');
        if (notesResponse.ok) {
            const notesResult = await notesResponse.json();
            if (notesResult.success) {
                document.getElementById('notesCount').textContent = `${notesResult.data.length} notes`;
            }
        }

        // Load todos count
        const todosResponse = await fetch('../backend/api/todos.php');
        if (todosResponse.ok) {
            const todosResult = await todosResponse.json();
            if (todosResult.success) {
                const completedTodos = todosResult.data.filter(todo => todo.status === 'completed').length;
                document.getElementById('todosCount').textContent = `${completedTodos}/${todosResult.data.length} completed`;
            }
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function switchTab(tabName) {
    // Redirect to respective pages instead of showing content within dashboard
    switch (tabName) {
        case 'notes':
            window.location.href = 'notes.html';
            break;
        case 'todos':
            window.location.href = 'todo.html';
            break;
        case 'diary':
            window.location.href = 'diary.html';
            break;
        default:
            // Stay on dashboard for other tabs
            // Update active tab
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
                // Handle home icon switching
                const homeActiveIcon = tab.querySelector('.home-icon-active');
                const homeInactiveIcon = tab.querySelector('.home-icon-inactive');
                if (homeActiveIcon && homeInactiveIcon) {
                    homeActiveIcon.style.display = 'none';
                    homeInactiveIcon.style.display = 'block';
                }
            });
            
            // Hide all content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected content
            const content = document.getElementById(tabName + '-content');
            if (content) {
                content.classList.add('active');
            }
            
            // Update active tab button
            const tabButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
            if (tabButton) {
                tabButton.classList.add('active');
                // Handle home icon switching for active tab
                const homeActiveIcon = tabButton.querySelector('.home-icon-active');
                const homeInactiveIcon = tabButton.querySelector('.home-icon-inactive');
                if (homeActiveIcon && homeInactiveIcon) {
                    homeActiveIcon.style.display = 'block';
                    homeInactiveIcon.style.display = 'none';
                }
            }
            
            currentTab = tabName;
            currentSection = tabName;
    }
}

function goToProfile() {
    window.location.href = 'profile.html';
}

function showMessage(message, type) {
    // Remove existing message
    const existingMessage = document.querySelector('.toast-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `toast-message toast-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 12px 24px;
        border-radius: 20px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 500;
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(messageDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideUp 0.3s ease forwards';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    
    @keyframes slideUp {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    
    @keyframes shake {
        0%, 20%, 50%, 80%, 100% { transform: translateX(0); }
        10%, 30%, 70%, 90% { transform: translateX(-5px); }
        40%, 60% { transform: translateX(5px); }
    }
    
    .shake {
        animation: shake 0.5s;
    }
`;
document.head.appendChild(style);
