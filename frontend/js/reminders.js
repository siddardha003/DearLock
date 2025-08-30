// Reminders Page JavaScript - Dear Lock

// DOM Elements
let remindersGrid = null;
let todayReminders = null;
let upcomingReminders = null;
let completedReminders = null;
let searchInput = null;
let filterButtons = null;
let viewToggle = null;
let modalOverlay = null;
let reminderModal = null;
let addReminderBtn = null;
let reminderTitleInput = null;
let reminderDateInput = null;
let reminderTimeInput = null;
let reminderDescriptionInput = null;
let priorityButtons = null;
let enableNotificationCheckbox = null;

// Data
let reminders = [];
let filteredReminders = [];
let currentFilter = 'all';
let currentView = 'grid';
let selectedPriority = 'medium';
let editingReminderId = null;
let notificationInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    requestNotificationPermission();
    loadRemindersFromStorage();
    renderReminders();
    attachEventListeners();
    updateCounts();
    startNotificationCheck();
    setDefaultDateTime();
});

function initializeElements() {
    todayReminders = document.getElementById('todayReminders');
    upcomingReminders = document.getElementById('upcomingReminders');
    completedReminders = document.getElementById('completedReminders');
    searchInput = document.getElementById('searchInput');
    filterButtons = document.querySelectorAll('.filter-btn');
    viewToggle = document.getElementById('viewToggle');
    modalOverlay = document.getElementById('modalOverlay');
    reminderModal = document.getElementById('reminderModal');
    addReminderBtn = document.getElementById('addReminderBtn');
    reminderTitleInput = document.getElementById('reminderTitle');
    reminderDateInput = document.getElementById('reminderDate');
    reminderTimeInput = document.getElementById('reminderTime');
    reminderDescriptionInput = document.getElementById('reminderDescription');
    priorityButtons = document.querySelectorAll('.priority-btn');
    enableNotificationCheckbox = document.getElementById('enableNotification');
}

function attachEventListeners() {
    // Search functionality
    searchInput?.addEventListener('input', handleSearch);
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => handleFilter(e.target.dataset.filter));
    });
    
    // View toggle
    viewToggle?.addEventListener('click', toggleView);
    
    // Modal controls
    addReminderBtn?.addEventListener('click', openAddReminderModal);
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    
    // Priority selection
    priorityButtons.forEach(btn => {
        btn.addEventListener('click', (e) => selectPriority(e.target.dataset.priority));
    });
    
    // Save reminder
    document.getElementById('saveReminderBtn')?.addEventListener('click', saveReminder);
    document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
    
    // Back button
    document.querySelector('.back-btn')?.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showNotification('Notifications enabled!', 'You will receive desktop notifications for your reminders.');
                }
            });
        }
    }
}

function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (query === '') {
        filteredReminders = reminders;
    } else {
        filteredReminders = reminders.filter(reminder => 
            reminder.title.toLowerCase().includes(query) ||
            (reminder.description && reminder.description.toLowerCase().includes(query))
        );
    }
    
    renderReminders();
}

function handleFilter(filter) {
    currentFilter = filter;
    
    // Update active state
    filterButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
    
    applyFilter();
    renderReminders();
}

function applyFilter() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    switch (currentFilter) {
        case 'all':
            filteredReminders = reminders;
            break;
        case 'today':
            filteredReminders = reminders.filter(reminder => {
                const reminderDate = new Date(reminder.datetime);
                return reminderDate >= todayStart && reminderDate < todayEnd && !reminder.completed;
            });
            break;
        case 'upcoming':
            filteredReminders = reminders.filter(reminder => {
                const reminderDate = new Date(reminder.datetime);
                return reminderDate >= todayEnd && !reminder.completed;
            });
            break;
        case 'completed':
            filteredReminders = reminders.filter(reminder => reminder.completed);
            break;
        default:
            filteredReminders = reminders;
    }
    
    if (searchInput.value.trim()) {
        handleSearch();
    }
}

function toggleView() {
    currentView = currentView === 'grid' ? 'list' : 'grid';
    
    const icon = viewToggle.querySelector('svg path');
    if (currentView === 'list') {
        icon.setAttribute('d', 'M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm15 0h3v3h-3v-3zm0 5h3v3h-3v-3z');
        document.querySelectorAll('.reminders-grid').forEach(grid => {
            grid.classList.add('list-view');
        });
    } else {
        icon.setAttribute('d', 'M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm15 0h3v3h-3v-3zm0 5h3v3h-3v-3z');
        document.querySelectorAll('.reminders-grid').forEach(grid => {
            grid.classList.remove('list-view');
        });
    }
}

function openAddReminderModal() {
    editingReminderId = null;
    resetModal();
    modalOverlay.classList.add('active');
    document.getElementById('modalTitle').textContent = 'Create New Reminder';
    reminderTitleInput.focus();
}

function openEditReminderModal(reminderId) {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;
    
    editingReminderId = reminderId;
    resetModal();
    
    // Fill modal with reminder data
    reminderTitleInput.value = reminder.title;
    
    const reminderDate = new Date(reminder.datetime);
    reminderDateInput.value = reminderDate.toISOString().split('T')[0];
    reminderTimeInput.value = reminderDate.toTimeString().slice(0, 5);
    
    reminderDescriptionInput.value = reminder.description || '';
    selectedPriority = reminder.priority;
    enableNotificationCheckbox.checked = reminder.enableNotification !== false;
    
    // Update UI
    updatePrioritySelection();
    
    modalOverlay.classList.add('active');
    document.getElementById('modalTitle').textContent = 'Edit Reminder';
    reminderTitleInput.focus();
}

function closeModal() {
    modalOverlay.classList.remove('active');
    resetModal();
}

function resetModal() {
    reminderTitleInput.value = '';
    reminderDateInput.value = '';
    reminderTimeInput.value = '';
    reminderDescriptionInput.value = '';
    selectedPriority = 'medium';
    enableNotificationCheckbox.checked = true;
    
    updatePrioritySelection();
    setDefaultDateTime();
}

function selectPriority(priority) {
    selectedPriority = priority;
    updatePrioritySelection();
}

function updatePrioritySelection() {
    priorityButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.priority === selectedPriority);
    });
}

function setDefaultDateTime() {
    if (!reminderDateInput.value) {
        const today = new Date();
        reminderDateInput.value = today.toISOString().split('T')[0];
    }
    
    if (!reminderTimeInput.value) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30); // Default to 30 minutes from now
        reminderTimeInput.value = now.toTimeString().slice(0, 5);
    }
}

function saveReminder() {
    const title = reminderTitleInput.value.trim();
    const date = reminderDateInput.value;
    const time = reminderTimeInput.value;
    const description = reminderDescriptionInput.value.trim();
    
    if (!title) {
        alert('Please enter a reminder title.');
        return;
    }
    
    if (!date || !time) {
        alert('Please select both date and time.');
        return;
    }
    
    const datetime = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (datetime <= now) {
        if (!confirm('The selected time is in the past. Do you want to continue?')) {
            return;
        }
    }
    
    const reminderData = {
        title,
        datetime: datetime.toISOString(),
        description,
        priority: selectedPriority,
        enableNotification: enableNotificationCheckbox.checked,
        completed: false,
        createdAt: editingReminderId ? 
            reminders.find(r => r.id === editingReminderId).createdAt : 
            new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (editingReminderId) {
        // Update existing reminder
        const index = reminders.findIndex(r => r.id === editingReminderId);
        reminders[index] = { ...reminderData, id: editingReminderId };
    } else {
        // Add new reminder
        reminderData.id = Date.now().toString();
        reminders.unshift(reminderData);
    }
    
    saveRemindersToStorage();
    applyFilter();
    renderReminders();
    updateCounts();
    closeModal();
    
    // Show success message
    showToastNotification(editingReminderId ? 'Reminder updated successfully!' : 'Reminder created successfully!');
}

function deleteReminder(reminderId) {
    if (confirm('Are you sure you want to delete this reminder?')) {
        reminders = reminders.filter(reminder => reminder.id !== reminderId);
        saveRemindersToStorage();
        applyFilter();
        renderReminders();
        updateCounts();
        showToastNotification('Reminder deleted successfully!');
    }
}

function toggleComplete(reminderId) {
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
        reminder.completed = !reminder.completed;
        reminder.updatedAt = new Date().toISOString();
        if (reminder.completed) {
            reminder.completedAt = new Date().toISOString();
        } else {
            delete reminder.completedAt;
        }
        
        saveRemindersToStorage();
        applyFilter();
        renderReminders();
        updateCounts();
        showToastNotification(reminder.completed ? 'Reminder completed!' : 'Reminder marked as pending!');
    }
}

function renderReminders() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const todayRems = reminders.filter(r => {
        const rDate = new Date(r.datetime);
        return rDate >= todayStart && rDate < todayEnd && !r.completed;
    });
    
    const upcomingRems = reminders.filter(r => {
        const rDate = new Date(r.datetime);
        return rDate >= todayEnd && !r.completed;
    });
    
    const completedRems = reminders.filter(r => r.completed);
    
    // Render sections
    renderReminderSection(todayReminders, todayRems, 'today');
    renderReminderSection(upcomingReminders, upcomingRems, 'upcoming');
    renderReminderSection(completedReminders, completedRems, 'completed');
    
    // Show/hide sections based on filter
    toggleSectionVisibility();
}

function renderReminderSection(container, remindersList, sectionType) {
    if (!container) return;
    
    if (remindersList.length === 0) {
        container.innerHTML = createEmptyState(sectionType);
        return;
    }
    
    container.innerHTML = remindersList.map(reminder => createReminderCard(reminder)).join('');
}

function createReminderCard(reminder) {
    const reminderDate = new Date(reminder.datetime);
    const now = new Date();
    const isOverdue = reminderDate < now && !reminder.completed;
    const isUpcoming = reminderDate > now;
    
    let cardClass = 'reminder-card';
    if (reminder.completed) cardClass += ' completed';
    else if (isOverdue) cardClass += ' overdue';
    else if (isUpcoming) cardClass += ' upcoming';
    
    const formattedDate = formatDate(reminderDate);
    const formattedTime = formatTime(reminderDate);
    
    let statusText = 'Pending';
    let statusClass = 'pending';
    
    if (reminder.completed) {
        statusText = 'Completed';
        statusClass = 'completed';
    } else if (isOverdue) {
        statusText = 'Overdue';
        statusClass = 'overdue';
    }
    
    return `
        <div class="${cardClass}" onclick="openEditReminderModal('${reminder.id}')">
            <div class="card-header">
                <h3 class="reminder-title">${escapeHtml(reminder.title)}</h3>
                <div class="priority-indicator ${reminder.priority}"></div>
            </div>
            
            <div class="datetime-display">
                <div class="date-info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H6V1H8V3H16V1H18V3H19M19,19V8H5V19H19M7,10H9V12H7V10M15,10H17V12H15V10M11,10H13V12H11V10M7,14H9V16H7V14M15,14H17V16H15V14M11,14H13V16H11V14Z"/>
                    </svg>
                    <span>${formattedDate}</span>
                </div>
                
                <div class="time-info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                    </svg>
                    <span>${formattedTime}</span>
                </div>
            </div>
            
            ${reminder.description ? `<p class="reminder-description">${escapeHtml(reminder.description)}</p>` : ''}
            
            <div class="card-footer">
                <span class="status-badge ${statusClass}">${statusText}</span>
                <div class="card-actions">
                    <button class="action-btn complete" onclick="event.stopPropagation(); toggleComplete('${reminder.id}')" title="${reminder.completed ? 'Mark as pending' : 'Mark as completed'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="${reminder.completed ? 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z' : 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z'}"/>
                        </svg>
                    </button>
                    <button class="action-btn" onclick="event.stopPropagation(); deleteReminder('${reminder.id}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createEmptyState(sectionType) {
    let message = '';
    let icon = '';
    
    switch (sectionType) {
        case 'today':
            message = 'No reminders for today';
            icon = 'M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,4A5,5 0 0,0 7,9C7,10.68 7.79,12.14 9,13H15C16.21,12.14 17,10.68 17,9A5,5 0 0,0 12,4Z';
            break;
        case 'upcoming':
            message = 'No upcoming reminders';
            icon = 'M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H6V1H8V3H16V1H18V3H19M19,19V8H5V19H19M7,10H9V12H7V10M15,10H17V12H15V10M11,10H13V12H11V10M7,14H9V16H7V14M15,14H17V16H15V14M11,14H13V16H11V14Z';
            break;
        case 'completed':
            message = 'No completed reminders';
            icon = 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z';
            break;
    }
    
    return `
        <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="${icon}"/>
            </svg>
            <h3>${message}</h3>
            <p>Create a new reminder by clicking the + button</p>
        </div>
    `;
}

function toggleSectionVisibility() {
    const todaySection = document.getElementById('todaySection');
    const upcomingSection = document.getElementById('upcomingSection');
    const completedSection = document.getElementById('completedSection');
    
    if (currentFilter === 'all') {
        todaySection.style.display = 'block';
        upcomingSection.style.display = 'block';
        completedSection.style.display = 'block';
    } else if (currentFilter === 'today') {
        todaySection.style.display = 'block';
        upcomingSection.style.display = 'none';
        completedSection.style.display = 'none';
    } else if (currentFilter === 'upcoming') {
        todaySection.style.display = 'none';
        upcomingSection.style.display = 'block';
        completedSection.style.display = 'none';
    } else if (currentFilter === 'completed') {
        todaySection.style.display = 'none';
        upcomingSection.style.display = 'none';
        completedSection.style.display = 'block';
    }
}

function updateCounts() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const todayCount = reminders.filter(r => {
        const rDate = new Date(r.datetime);
        return rDate >= todayStart && rDate < todayEnd && !r.completed;
    }).length;
    
    const upcomingCount = reminders.filter(r => {
        const rDate = new Date(r.datetime);
        return rDate >= todayEnd && !r.completed;
    }).length;
    
    const completedCount = reminders.filter(r => r.completed).length;
    
    document.getElementById('todayCount').textContent = todayCount;
    document.getElementById('upcomingCount').textContent = upcomingCount;
    document.getElementById('completedCount').textContent = completedCount;
}

function startNotificationCheck() {
    // Check every minute for reminders
    notificationInterval = setInterval(() => {
        checkForNotifications();
    }, 60000); // 60 seconds
    
    // Initial check
    checkForNotifications();
}

function checkForNotifications() {
    const now = new Date();
    const currentTime = now.getTime();
    
    reminders.forEach(reminder => {
        if (reminder.completed || !reminder.enableNotification) return;
        
        const reminderTime = new Date(reminder.datetime).getTime();
        const timeDiff = reminderTime - currentTime;
        
        // Show notification if reminder time is within 1 minute (60000ms)
        if (timeDiff > 0 && timeDiff <= 60000 && !reminder.notificationShown) {
            showDesktopNotification(reminder);
            reminder.notificationShown = true;
            saveRemindersToStorage();
        }
        
        // Show overdue notification for reminders that are past due
        if (timeDiff < 0 && timeDiff >= -60000 && !reminder.overdueNotificationShown) {
            showOverdueNotification(reminder);
            reminder.overdueNotificationShown = true;
            saveRemindersToStorage();
        }
    });
}

function showDesktopNotification(reminder) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(`Reminder: ${reminder.title}`, {
            body: reminder.description || 'Your reminder is due now!',
            icon: '/DearLock/images/icon.png', // You can add an icon
            badge: '/DearLock/images/badge.png',
            requireInteraction: true,
            actions: [
                { action: 'complete', title: 'Mark Complete' },
                { action: 'snooze', title: 'Snooze 10min' }
            ]
        });
        
        notification.onclick = function() {
            window.focus();
            window.location.href = 'reminders.html';
            notification.close();
        };
        
        // Auto close after 10 seconds
        setTimeout(() => {
            notification.close();
        }, 10000);
    }
}

function showOverdueNotification(reminder) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(`Overdue: ${reminder.title}`, {
            body: 'This reminder is now overdue!',
            icon: '/DearLock/images/icon.png',
            requireInteraction: true
        });
        
        notification.onclick = function() {
            window.focus();
            window.location.href = 'reminders.html';
            notification.close();
        };
    }
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N to add new reminder
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !modalOverlay.classList.contains('active')) {
        e.preventDefault();
        openAddReminderModal();
    }
    
    // Escape to close modal
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
    
    // Ctrl/Cmd + S to save reminder when modal is open
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && modalOverlay.classList.contains('active')) {
        e.preventDefault();
        saveReminder();
    }
}

function loadRemindersFromStorage() {
    const savedReminders = localStorage.getItem('dearlock_reminders');
    if (savedReminders) {
        reminders = JSON.parse(savedReminders);
    }
    filteredReminders = [...reminders];
}

function saveRemindersToStorage() {
    localStorage.setItem('dearlock_reminders', JSON.stringify(reminders));
}

function formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const reminderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (reminderDate.getTime() === today.getTime()) {
        return 'Today';
    } else if (reminderDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToastNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-gradient-yellow-1);
        color: var(--eerie-black-1);
        padding: 1rem 1.5rem;
        border-radius: var(--radius-12);
        box-shadow: var(--shadow-3);
        z-index: 10000;
        font-size: var(--fs-9);
        font-weight: var(--fw-500);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Clean up interval when page unloads
window.addEventListener('beforeunload', () => {
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
});
