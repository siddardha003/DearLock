// Dashboard JavaScript - Dear Lock
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // Profile dropdown functionality
    setupProfileDropdown();
    
    // Secret lock functionality
    setupSecretLock();
    
    // Bottom navigation
    setupBottomNavigation();
    
    // Quick actions
    setupQuickActions();
    
    // Card interactions
    setupCardInteractions();
    
    // Load user data
    loadUserData();
}

function setupProfileDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Toggle dropdown
    profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        profileDropdown.classList.remove('active');
    });
    
    // Prevent dropdown from closing when clicking inside
    profileDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Logout functionality
    logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to sign out?')) {
            // Clear user session (implement with backend)
            localStorage.removeItem('userSession'); // Example
            window.location.href = 'login.html';
        }
    });
}

function setupSecretLock() {
    const secretLock = document.getElementById('secretLock');
    
    secretLock.addEventListener('click', function() {
        // Add a subtle animation
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
        
        // Placeholder for secret area navigation
        showComingSoonNotification('Secret area coming soon...');
        // Later: window.location.href = 'secret.html';
    });
}

function setupBottomNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Handle navigation
            const tab = this.dataset.tab;
            navigateToSection(tab);
        });
    });
}

function setupQuickActions() {
    const quickBtns = document.querySelectorAll('.quick-btn');
    
    quickBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            // Add click animation
            this.style.transform = 'translateY(-4px) scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'translateY(-2px) scale(1)';
            }, 150);
            
            // Handle quick action
            handleQuickAction(tab);
        });
    });
}

function setupCardInteractions() {
    const recentCards = document.querySelectorAll('.recent-card');
    
    recentCards.forEach(card => {
        card.addEventListener('click', function() {
            const cardType = this.classList.contains('notes-card') ? 'notes' :
                           this.classList.contains('todo-card') ? 'todo' :
                           this.classList.contains('reminders-card') ? 'reminders' : 'notes';
            
            navigateToSection(cardType);
        });
        
        // Add hover sound effect (optional)
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

function navigateToSection(section) {
    // For now, show coming soon notification
    // Later, implement actual navigation to different pages
    
    const sectionNames = {
        notes: 'Notes',
        reminders: 'Reminders', 
        todo: 'To-Do Lists'
    };
    
    showComingSoonNotification(`${sectionNames[section]} page coming soon...`);
    
    // Future implementation:
    // window.location.href = `${section}.html`;
}

function handleQuickAction(action) {
    const actions = {
        notes: () => showComingSoonNotification('Quick note creation coming soon...'),
        reminders: () => showComingSoonNotification('Quick reminder setup coming soon...'),
        todo: () => showComingSoonNotification('Quick task creation coming soon...')
    };
    
    if (actions[action]) {
        actions[action]();
    }
}

function loadUserData() {
    // This would normally fetch data from your backend
    // For now, using mock data
    
    const userData = {
        name: 'Sarah',
        recentNotes: [
            { title: 'Morning thoughts', time: '2 hours ago' },
            { title: 'Project ideas', time: 'Yesterday' },
            { title: 'Weekend plans', time: '2 days ago' }
        ],
        recentTodos: [
            { title: 'Buy groceries', time: 'Due today', completed: false },
            { title: 'Call dentist', time: 'Completed', completed: true },
            { title: 'Review presentation', time: 'Due tomorrow', completed: false }
        ],
        recentReminders: [
            { title: 'Team meeting', time: 'In 30 minutes' },
            { title: "Mom's birthday", time: 'Tomorrow' }
        ]
    };
    
    // Update user name in welcome message
    const userNameSpan = document.querySelector('.user-name');
    if (userNameSpan) {
        userNameSpan.textContent = userData.name;
    }
    
    // Update counts
    updateCardCount('.notes-card', userData.recentNotes.length);
    updateCardCount('.todo-card', userData.recentTodos.filter(t => !t.completed).length);
    updateCardCount('.reminders-card', userData.recentReminders.length);
}

function updateCardCount(cardSelector, count) {
    const card = document.querySelector(cardSelector);
    const countElement = card?.querySelector('.card-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

function showComingSoonNotification(message) {
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'coming-soon-notification';
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '2rem',
        background: 'var(--bg-gradient-yellow-1)',
        color: 'var(--eerie-black-1)',
        padding: '1rem 1.5rem',
        borderRadius: 'var(--radius-12)',
        boxShadow: 'var(--shadow-2)',
        zIndex: '1100',
        fontSize: 'var(--fs-9)',
        fontWeight: 'var(--fw-500)',
        animation: 'slideInRight 0.3s ease-out',
        maxWidth: '280px'
    });
    
    // Add animation styles
    if (!document.querySelector('#notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add some interactive enhancements
function addInteractiveEnhancements() {
    // Add ripple effect to buttons
    const interactiveElements = document.querySelectorAll('.quick-btn, .nav-item');
    
    interactiveElements.forEach(element => {
        element.addEventListener('click', function(e) {
            createRippleEffect(e, this);
        });
    });
}

function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    Object.assign(ripple.style, {
        position: 'absolute',
        width: size + 'px',
        height: size + 'px',
        left: x + 'px',
        top: y + 'px',
        background: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '50%',
        transform: 'scale(0)',
        animation: 'ripple 0.6s ease-out',
        pointerEvents: 'none'
    });
    
    // Add ripple keyframes if not already added
    if (!document.querySelector('#ripple-animations')) {
        const style = document.createElement('style');
        style.id = 'ripple-animations';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// Initialize interactive enhancements
setTimeout(addInteractiveEnhancements, 100);

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Alt + 1,2,3 for navigation
    if (e.altKey) {
        switch(e.code) {
            case 'Digit1':
                e.preventDefault();
                document.getElementById('notesTab').click();
                break;
            case 'Digit2':
                e.preventDefault();
                document.getElementById('remindersTab').click();
                break;
            case 'Digit3':
                e.preventDefault();
                document.getElementById('todoTab').click();
                break;
        }
    }
});

// Welcome user with a subtle animation
setTimeout(() => {
    const welcomeSection = document.querySelector('.welcome-section');
    if (welcomeSection) {
        welcomeSection.style.animation = 'fadeInUp 0.6s ease-out';
    }
    
    // Stagger card animations
    const cards = document.querySelectorAll('.recent-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s both`;
        }, index * 100);
    });
    
    // Add fadeInUp animation if not exists
    if (!document.querySelector('#welcome-animations')) {
        const style = document.createElement('style');
        style.id = 'welcome-animations';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}, 200);
