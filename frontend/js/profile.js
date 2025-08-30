// Profile Page JavaScript - Dear Lock
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page loading...');
    console.log('Login status:', localStorage.getItem('isLoggedIn'));
    
    // For testing - temporarily bypass authentication
    // Comment out this line after testing
    localStorage.setItem('isLoggedIn', 'true');
    
    // Check authentication - more lenient check
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        console.log('Not logged in, redirecting to login page');
        alert('Please log in first. Use demo@dearlock.com / demo123');
        window.location.href = 'login.html';
        return;
    }

    console.log('User is logged in, initializing profile page...');
    
    try {
        // Initialize profile page
        initializeProfile();
        loadProfileData();
        loadAnalytics();
        loadActivity();
        loadAchievements();
        bindEventListeners();
        setupBottomNavigation();
        console.log('Profile page initialized successfully');
    } catch (error) {
        console.error('Error initializing profile page:', error);
        // Show user-friendly error
        showNotification('Error loading profile. Please refresh the page.', 'error');
    }
});

// Global variables
let currentAvatarSelection = null;
let achievementsData = [];
let activityData = [];

// Initialize profile page
function initializeProfile() {
    // Generate default avatars if not exist
    if (!localStorage.getItem('availableAvatars')) {
        generateDefaultAvatars();
    }
    
    // Set default profile data if not exist
    if (!localStorage.getItem('profileData')) {
        const defaultProfile = {
            name: 'John Doe',
            description: 'Productivity enthusiast and goal achiever',
            email: 'john.doe@example.com',
            phone: '',
            location: '',
            bio: 'Welcome to my productivity journey!',
            avatar: './images/avatar1.jpg',
            joinDate: new Date().toISOString(),
            preferences: {
                notifications: true,
                darkMode: true,
                reminders: true,
                analytics: true,
                achievements: true
            }
        };
        localStorage.setItem('profileData', JSON.stringify(defaultProfile));
    }
}

// Generate default avatar options
function generateDefaultAvatars() {
    const avatars = {
        general: [
            './images/avatar1.jpg',
            './images/avatar2.jpg',
            './images/avatar3.jpg',
            './images/avatar4.jpg',
            './images/avatar5.jpg',
            './images/avatar6.jpg'
        ],
        animals: [
            './images/cat-avatar.jpg',
            './images/dog-avatar.jpg',
            './images/lion-avatar.jpg',
            './images/panda-avatar.jpg'
        ],
        abstract: [
            './images/abstract1.jpg',
            './images/abstract2.jpg',
            './images/abstract3.jpg',
            './images/gradient1.jpg'
        ]
    };
    localStorage.setItem('availableAvatars', JSON.stringify(avatars));
}

// Load profile data and populate elements
function loadProfileData() {
    try {
        console.log('Loading profile data...');
        const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
        console.log('Profile data:', profileData);
        
        // Update profile display with safe element access
        const profileAvatar = document.getElementById('profileAvatar');
        const profileName = document.getElementById('profileName');
        const profileDescription = document.getElementById('profileDescription');
        
        if (profileAvatar) {
            profileAvatar.src = profileData.avatar || './images/bg.png';
            console.log('Avatar set to:', profileAvatar.src);
        }
        
        if (profileName) {
            profileName.textContent = profileData.name || 'John Doe';
            console.log('Name set to:', profileName.textContent);
        }
        
        if (profileDescription) {
            profileDescription.textContent = profileData.description || 'Productivity enthusiast';
            console.log('Description set to:', profileDescription.textContent);
        }
        
        // Update form fields if they exist
        const editName = document.getElementById('editName');
        if (editName) {
            editName.value = profileData.name || '';
            document.getElementById('editEmail').value = profileData.email || '';
            document.getElementById('editPhone').value = profileData.phone || '';
            document.getElementById('editLocation').value = profileData.location || '';
            document.getElementById('editBio').value = profileData.bio || '';
            
            // Update preferences
            const preferences = profileData.preferences || {};
            Object.keys(preferences).forEach(key => {
                const toggle = document.getElementById(key + 'Toggle');
                if (toggle) {
                    toggle.checked = preferences[key] || false;
                }
            });
        }
        console.log('Profile data loaded successfully');
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

// Load and calculate analytics
function loadAnalytics() {
    try {
        console.log('Loading analytics...');
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const todos = JSON.parse(localStorage.getItem('todos') || '[]');
        
        console.log('Data loaded - Notes:', notes.length, 'Reminders:', reminders.length, 'Todos:', todos.length);
        
        // Calculate stats
        const totalNotes = notes.length;
        const totalReminders = reminders.length;
        const totalTodos = todos.length;
        const completedTodos = todos.filter(todo => todo.completed).length;
        const totalTasks = totalNotes + totalReminders + totalTodos;
        
        console.log('Stats calculated - Total:', totalTasks, 'Completed:', completedTodos);
        
        // Update profile stats with safe access
        const statNumbers = document.querySelectorAll('.stat-number');
        console.log('Found stat elements:', statNumbers.length);
        
        if (statNumbers.length >= 3) {
            statNumbers[0].textContent = totalTasks;
            statNumbers[1].textContent = completedTodos;
            statNumbers[2].textContent = Math.round((completedTodos / Math.max(totalTodos, 1)) * 100) + '%';
            console.log('Stats updated in DOM');
        }
        
        // Update task breakdown
        updateTaskBreakdown(totalNotes, totalReminders, totalTodos);
        
        // Calculate and update progress
        updateProgressStats(todos, totalTasks, completedTodos);
        
        console.log('Analytics loaded successfully');
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Update task breakdown display
function updateTaskBreakdown(notes, reminders, todos) {
    try {
        console.log('Updating task breakdown...');
        const breakdown = document.querySelectorAll('.breakdown-number');
        console.log('Found breakdown elements:', breakdown.length);
        
        if (breakdown.length >= 3) {
            breakdown[0].textContent = notes;
            breakdown[1].textContent = reminders;
            breakdown[2].textContent = todos;
            console.log('Task breakdown updated');
        } else {
            console.log('Task breakdown elements not found, skipping...');
        }
    } catch (error) {
        console.error('Error updating task breakdown:', error);
    }
}

// Update progress statistics
function updateProgressStats(todos, totalTasks, completedTodos) {
    const overallProgress = totalTasks > 0 ? (completedTodos / totalTasks) * 100 : 0;
    const weeklyProgress = calculateWeeklyProgress(todos);
    
    // Update progress bars
    const overallBar = document.querySelector('.progress-item.overall .progress-bar-fill');
    const weeklyBar = document.querySelector('.progress-item.week .progress-bar-fill');
    
    if (overallBar) {
        overallBar.style.width = overallProgress + '%';
        overallBar.parentElement.parentElement.querySelector('.progress-stats').textContent = 
            `${completedTodos} of ${totalTasks} tasks completed`;
    }
    
    if (weeklyBar) {
        weeklyBar.style.width = weeklyProgress + '%';
        const weeklyCompleted = calculateWeeklyCompletedTasks(todos);
        weeklyBar.parentElement.parentElement.querySelector('.progress-stats').textContent = 
            `${weeklyCompleted} tasks this week`;
    }
}

// Calculate weekly progress
function calculateWeeklyProgress(todos) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyTodos = todos.filter(todo => {
        const todoDate = new Date(todo.createdAt || Date.now());
        return todoDate >= oneWeekAgo;
    });
    
    const weeklyCompleted = weeklyTodos.filter(todo => todo.completed).length;
    return weeklyTodos.length > 0 ? (weeklyCompleted / weeklyTodos.length) * 100 : 0;
}

// Calculate weekly completed tasks
function calculateWeeklyCompletedTasks(todos) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return todos.filter(todo => {
        const todoDate = new Date(todo.completedAt || todo.createdAt || Date.now());
        return todo.completed && todoDate >= oneWeekAgo;
    }).length;
}

// Load recent activity
function loadActivity() {
    try {
        console.log('Loading activity...');
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const todos = JSON.parse(localStorage.getItem('todos') || '[]');
        
        console.log('Activity data loaded - Notes:', notes.length, 'Reminders:', reminders.length, 'Todos:', todos.length);
        
        // Create sample data if none exists
        if (notes.length === 0 && reminders.length === 0 && todos.length === 0) {
            console.log('No data found, creating sample data...');
            // Add sample data for testing
            const sampleData = {
                notes: [
                    { title: 'Welcome Note', createdAt: Date.now() - 86400000 }, // 1 day ago
                    { title: 'Sample Note 2', createdAt: Date.now() - 172800000 } // 2 days ago
                ],
                reminders: [
                    { title: 'Sample Reminder', createdAt: Date.now() - 3600000 } // 1 hour ago
                ],
                todos: [
                    { text: 'Sample Todo', completed: true, createdAt: Date.now() - 7200000, completedAt: Date.now() - 3600000 },
                    { text: 'Another Todo', completed: false, createdAt: Date.now() - 1800000 }
                ]
            };
            
            localStorage.setItem('notes', JSON.stringify(sampleData.notes));
            localStorage.setItem('reminders', JSON.stringify(sampleData.reminders));
            localStorage.setItem('todos', JSON.stringify(sampleData.todos));
            
            // Reload with sample data
            return loadActivity();
        }
        
        // Combine all activities
        const activities = [];
        
        // Add notes activities
        notes.forEach(note => {
            activities.push({
                type: 'note',
                text: `Created note: "${note.title || 'Untitled'}"`,
                time: new Date(note.createdAt || Date.now()),
                icon: '📝'
            });
        });
        
        // Add reminder activities
        reminders.forEach(reminder => {
            activities.push({
                type: 'reminder',
                text: `Set reminder: "${reminder.title || 'Untitled'}"`,
                time: new Date(reminder.createdAt || Date.now()),
                icon: '⏰'
            });
        });
        
        // Add todo activities
        todos.forEach(todo => {
            activities.push({
                type: 'todo',
                text: todo.completed 
                    ? `Completed task: "${todo.text || 'Untitled'}"` 
                    : `Created task: "${todo.text || 'Untitled'}"`,
                time: new Date(todo.completedAt || todo.createdAt || Date.now()),
                icon: todo.completed ? '✅' : '📋'
            });
        });
        
        // Sort by time (most recent first)
        activities.sort((a, b) => b.time - a.time);
        
        // Take only recent activities (last 10)
        activityData = activities.slice(0, 10);
        
        console.log('Activity processed, rendering...', activityData.length, 'items');
        renderActivity();
        
        console.log('Activity loaded successfully');
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// Render activity feed
function renderActivity() {
    try {
        console.log('Rendering activity feed...');
        const activityFeed = document.querySelector('.activity-feed');
        if (!activityFeed) {
            console.log('Activity feed element not found');
            return;
        }
        
        if (activityData.length === 0) {
            console.log('No activity data to display');
            activityFeed.innerHTML = `
                <div class="empty-activity">
                    <p>No recent activity to show.</p>
                    <p>Start creating notes, reminders, or todos to see your activity here!</p>
                </div>
            `;
            return;
        }
        
        console.log('Rendering', activityData.length, 'activity items');
        const activitiesHTML = activityData.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <span>${activity.icon}</span>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${formatActivityTime(activity.time)}</div>
                </div>
            </div>
        `).join('');
        
        activityFeed.innerHTML = activitiesHTML;
        console.log('Activity feed rendered successfully');
    } catch (error) {
        console.error('Error rendering activity:', error);
    }
}

// Format activity time
function formatActivityTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

// Load achievements data
function loadAchievements() {
    try {
        console.log('Loading achievements...');
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const todos = JSON.parse(localStorage.getItem('todos') || '[]');
        const completedTodos = todos.filter(todo => todo.completed).length;
        
        console.log('Achievement data - Notes:', notes.length, 'Reminders:', reminders.length, 'Todos:', todos.length, 'Completed:', completedTodos);
        
        achievementsData = [
            {
                id: 'first-note',
                title: 'First Note',
                description: 'Created your first note',
                icon: '📝',
                unlocked: notes.length > 0
            },
            {
                id: 'note-master',
                title: 'Note Master',
                description: 'Created 10 notes',
                icon: '📚',
                unlocked: notes.length >= 10
            },
            {
                id: 'reminder-pro',
                title: 'Reminder Pro',
                description: 'Set 5 reminders',
                icon: '⏰',
                unlocked: reminders.length >= 5
            },
            {
                id: 'task-starter',
                title: 'Task Starter',
                description: 'Created your first todo',
                icon: '📋',
                unlocked: todos.length > 0
            },
            {
                id: 'completionist',
                title: 'Completionist',
                description: 'Completed 5 tasks',
                icon: '✅',
                unlocked: completedTodos >= 5
            },
            {
                id: 'productivity-guru',
                title: 'Productivity Guru',
                description: 'Completed 25 tasks',
                icon: '🏆',
                unlocked: completedTodos >= 25
            },
            {
                id: 'consistency-king',
                title: 'Consistency King',
                description: 'Used the app for 7 days',
                icon: '👑',
                unlocked: checkConsistencyAchievement()
            },
            {
                id: 'organization-expert',
                title: 'Organization Expert',
                description: 'Have 5 notes, 3 reminders, and 5 todos',
                icon: '🎯',
                unlocked: notes.length >= 5 && reminders.length >= 3 && todos.length >= 5
            }
        ];
        
        console.log('Achievements loaded, rendering...');
        renderAchievements();
        updateAchievementCount();
        console.log('Achievements loaded successfully');
    } catch (error) {
        console.error('Error loading achievements:', error);
    }
}

// Check consistency achievement
function checkConsistencyAchievement() {
    const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
    const joinDate = new Date(profileData.joinDate || Date.now());
    const daysDiff = Math.floor((Date.now() - joinDate) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7;
}

// Render achievements
function renderAchievements() {
    const achievementsGrid = document.querySelector('.achievements-grid');
    if (!achievementsGrid) return;
    
    const achievementsHTML = achievementsData.map(achievement => `
        <div class="achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}" 
             data-achievement-id="${achievement.id}"
             title="${achievement.description}">
            <div class="achievement-icon">
                <span>${achievement.icon}</span>
            </div>
            <div class="achievement-title">${achievement.title}</div>
        </div>
    `).join('');
    
    achievementsGrid.innerHTML = achievementsHTML;
}

// Update achievement count
function updateAchievementCount() {
    const unlockedCount = achievementsData.filter(a => a.unlocked).length;
    const totalCount = achievementsData.length;
    
    const achievementCount = document.querySelector('.achievement-count');
    if (achievementCount) {
        achievementCount.textContent = `${unlockedCount}/${totalCount}`;
    }
}

// Bind event listeners
function bindEventListeners() {
    try {
        console.log('Binding event listeners...');
        
        // Edit profile button
        const editBtn = document.querySelector('.edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', openEditProfileModal);
            console.log('Edit button listener bound');
        } else {
            console.log('Edit button not found');
        }
        
        // Change avatar button
        const changeAvatarBtn = document.querySelector('.change-avatar-btn');
        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', openAvatarModal);
            console.log('Change avatar button listener bound');
        } else {
            console.log('Change avatar button not found');
        }
        
        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-btn');
        console.log('Found close buttons:', closeButtons.length);
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeModals);
        });
        
        // Modal overlay click to close
        const modalOverlays = document.querySelectorAll('.modal-overlay');
        console.log('Found modal overlays:', modalOverlays.length);
        modalOverlays.forEach(overlay => {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModals();
                }
            });
        });
    
    // Save profile button
    const saveProfileBtn = document.getElementById('saveProfile');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }
    
    // Cancel buttons
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Avatar category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterAvatars(this.dataset.category);
        });
    });
    
    // Time filter
    const timeFilter = document.getElementById('timeFilter');
    if (timeFilter) {
        timeFilter.addEventListener('change', function() {
            // Reload analytics based on selected time period
            loadAnalytics();
        });
    }
    
    // Settings button
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            // Open preferences section in edit modal
            openEditProfileModal();
            // Scroll to preferences section
            setTimeout(() => {
                const preferencesSection = document.querySelector('.form-section:last-child');
                if (preferencesSection) {
                    preferencesSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        });
    }
    
        // Back button
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'dashboard.html';
            });
            console.log('Back button listener bound');
        } else {
            console.log('Back button not found');
        }
        
        console.log('Event listeners bound successfully');
    } catch (error) {
        console.error('Error binding event listeners:', error);
    }
}// Open edit profile modal
function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadProfileData(); // Refresh form data
    }
}

// Open avatar modal
function openAvatarModal() {
    const modal = document.getElementById('avatarModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadAvatarOptions();
    }
}

// Close all modals
function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
    currentAvatarSelection = null;
}

// Load avatar options
function loadAvatarOptions() {
    const avatars = JSON.parse(localStorage.getItem('availableAvatars') || '{}');
    const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
    const currentAvatar = profileData.avatar;
    
    // Show general category by default
    filterAvatars('general');
    
    // Mark current avatar as selected
    setTimeout(() => {
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(option => {
            if (option.src === currentAvatar) {
                option.classList.add('selected');
                currentAvatarSelection = option.src;
            }
        });
    }, 100);
}

// Filter avatars by category
function filterAvatars(category) {
    const avatars = JSON.parse(localStorage.getItem('availableAvatars') || '{}');
    const avatarGrid = document.querySelector('.avatar-selection-grid');
    
    if (!avatarGrid || !avatars[category]) return;
    
    const avatarsHTML = avatars[category].map(src => `
        <img class="avatar-option" src="${src}" alt="Avatar option" onclick="selectAvatar('${src}')">
    `).join('');
    
    avatarGrid.innerHTML = avatarsHTML;
    
    // Re-select current avatar if it's in this category
    const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
    const currentAvatar = profileData.avatar;
    
    setTimeout(() => {
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(option => {
            if (option.src === currentAvatar || option.src === currentAvatarSelection) {
                option.classList.add('selected');
            }
        });
    }, 50);
}

// Select avatar
function selectAvatar(src) {
    // Remove previous selection
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selection to clicked avatar
    event.target.classList.add('selected');
    currentAvatarSelection = src;
    
    // Save avatar immediately
    const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
    profileData.avatar = src;
    localStorage.setItem('profileData', JSON.stringify(profileData));
    
    // Update profile avatar display
    document.getElementById('profileAvatar').src = src;
    
    // Close modal after short delay
    setTimeout(() => {
        closeModals();
        showNotification('Avatar updated successfully!');
    }, 300);
}

// Save profile
function saveProfile() {
    const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
    
    // Update profile data
    profileData.name = document.getElementById('editName').value.trim() || profileData.name;
    profileData.email = document.getElementById('editEmail').value.trim() || profileData.email;
    profileData.phone = document.getElementById('editPhone').value.trim() || profileData.phone;
    profileData.location = document.getElementById('editLocation').value.trim() || profileData.location;
    profileData.bio = document.getElementById('editBio').value.trim() || profileData.bio;
    
    // Update preferences
    profileData.preferences = profileData.preferences || {};
    profileData.preferences.notifications = document.getElementById('notificationsToggle')?.checked || false;
    profileData.preferences.darkMode = document.getElementById('darkModeToggle')?.checked || false;
    profileData.preferences.reminders = document.getElementById('remindersToggle')?.checked || false;
    profileData.preferences.analytics = document.getElementById('analyticsToggle')?.checked || false;
    profileData.preferences.achievements = document.getElementById('achievementsToggle')?.checked || false;
    
    // Validate required fields
    if (!profileData.name) {
        showNotification('Please enter your name.', 'error');
        return;
    }
    
    if (!profileData.email) {
        showNotification('Please enter your email.', 'error');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('profileData', JSON.stringify(profileData));
    
    // Update profile display
    loadProfileData();
    
    // Close modal
    closeModals();
    
    // Show success notification
    showNotification('Profile updated successfully!');
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#e74c3c' : 'var(--orange-yellow-crayola)'};
        color: ${type === 'error' ? 'white' : 'var(--eerie-black-1)'};
        padding: 1rem 1.5rem;
        border-radius: var(--radius-12);
        font-weight: 600;
        z-index: 3000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        box-shadow: var(--shadow-3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Setup bottom navigation
function setupBottomNavigation() {
    try {
        console.log('Setting up bottom navigation...');
        
        // Highlight current page
        const profileNavItem = document.querySelector('.nav-item[onclick*="profile"]');
        if (profileNavItem) {
            profileNavItem.classList.add('active');
            console.log('Profile nav item highlighted');
        } else {
            console.log('Profile nav item not found');
        }
        
        // Add navigation event listeners
        const navItems = document.querySelectorAll('.nav-item');
        console.log('Found nav items:', navItems.length);
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const onclick = this.getAttribute('onclick');
                if (onclick) {
                    try {
                        eval(onclick);
                    } catch (error) {
                        console.error('Error executing navigation:', error);
                    }
                }
            });
        });
        
        console.log('Bottom navigation setup complete');
    } catch (error) {
        console.error('Error setting up bottom navigation:', error);
    }
}

// Navigation functions
function goToDashboard() {
    window.location.href = 'dashboard.html';
}

function goToNotes() {
    window.location.href = 'notes.html';
}

function goToReminders() {
    window.location.href = 'reminders.html';
}

function goToTodos() {
    window.location.href = 'todo.html';
}

function goToProfile() {
    // Already on profile page
    window.location.reload();
}

// Utility function to handle responsive design
function handleResponsiveDesign() {
    const profileMain = document.querySelector('.profile-main');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        profileMain?.classList.add('mobile');
    } else {
        profileMain?.classList.remove('mobile');
    }
}

// Listen for window resize
window.addEventListener('resize', handleResponsiveDesign);

// Call on initial load
handleResponsiveDesign();

// Export functions for global use
window.selectAvatar = selectAvatar;
window.goToDashboard = goToDashboard;
window.goToNotes = goToNotes;
window.goToReminders = goToReminders;
window.goToTodos = goToTodos;
window.goToProfile = goToProfile;
