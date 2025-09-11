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
        document.getElementById('userGreeting').textContent = `Hello, ${userData.name}!`;
    } catch (e) {
        console.error('Error parsing user data:', e);
    }
}

function loadUserData() {
    // This would typically fetch from API
    const user = localStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        document.getElementById('userGreeting').textContent = `Hello, ${userData.name}!`;
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
                document.getElementById('todosCount').textContent = `${todosResult.data.length} tasks`;
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
            // For diary, we might need to check PIN first, but for now redirect
            window.location.href = 'diary.html'; // We'll need to create this
            break;
        default:
            // Stay on dashboard for other tabs
            // Update active tab
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
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
            }
            
            currentTab = tabName;
            currentSection = tabName;
    }
}

// PIN Functions
async function checkDiaryAccess() {
    try {
        // Check if user has a diary PIN set
        const response = await fetch('../backend/api/auth/me.php');
        const result = await response.json();
        
        if (result.success && result.data.has_diary_pin) {
            // User has PIN set, show PIN entry screen
            showDiaryPin();
        } else {
            // First time user, show PIN setup
            showPinSetup();
        }
    } catch (error) {
        console.error('Error checking diary access:', error);
        showPinSetup(); // Default to setup if error
    }
}

function showPinSetup() {
    const pinScreen = document.getElementById('diaryPinScreen');
    pinScreen.innerHTML = `
        <h2 class="pin-title">Set Diary PIN</h2>
        <p class="pin-subtitle">Create a 4-digit PIN to protect your diary</p>
        
        <div class="pin-display">
            <div class="pin-dot" id="pin-dot-1"></div>
            <div class="pin-dot" id="pin-dot-2"></div>
            <div class="pin-dot" id="pin-dot-3"></div>
            <div class="pin-dot" id="pin-dot-4"></div>
        </div>
        
        <div class="pin-keypad">
            <button class="pin-key" onclick="enterPin('1')">1</button>
            <button class="pin-key" onclick="enterPin('2')">2</button>
            <button class="pin-key" onclick="enterPin('3')">3</button>
            <button class="pin-key" onclick="enterPin('4')">4</button>
            <button class="pin-key" onclick="enterPin('5')">5</button>
            <button class="pin-key" onclick="enterPin('6')">6</button>
            <button class="pin-key" onclick="enterPin('7')">7</button>
            <button class="pin-key" onclick="enterPin('8')">8</button>
            <button class="pin-key" onclick="enterPin('9')">9</button>
            <button class="pin-key" onclick="clearPin()">×</button>
            <button class="pin-key" onclick="enterPin('0')">0</button>
            <button class="pin-key" onclick="deletePin()">⌫</button>
        </div>
        
        <div id="pinSetupMessage" style="margin-top: 20px; text-align: center; color: #666; font-size: 14px;">
            Enter your desired 4-digit PIN
        </div>
    `;
    
    pinScreen.style.display = 'block';
    document.getElementById('diaryEntries').style.display = 'none';
    currentPin = '';
    window.isSettingUpPin = true;
    updatePinDisplay();
}
function enterPin(digit) {
    if (currentPin.length < 4) {
        currentPin += digit;
        updatePinDisplay();
        
        if (currentPin.length === 4) {
            if (window.isSettingUpPin) {
                if (window.firstPin) {
                    // This is confirmation PIN
                    if (currentPin === window.firstPin) {
                        setDiaryPin(currentPin);
                    } else {
                        // PINs don't match
                        document.getElementById('pinSetupMessage').innerHTML = 
                            '<span style="color: #dc3545;">PINs do not match. Try again.</span>';
                        setTimeout(() => {
                            showPinSetup();
                        }, 1500);
                    }
                } else {
                    // This is first PIN entry
                    window.firstPin = currentPin;
                    document.getElementById('pinSetupMessage').innerHTML = 
                        '<span style="color: #E8B4B8;">Re-enter PIN to confirm</span>';
                    currentPin = '';
                    updatePinDisplay();
                }
            } else {
                // This is PIN verification
                verifyDiaryPin();
            }
        }
    }
}

function deletePin() {
    if (currentPin.length > 0) {
        currentPin = currentPin.slice(0, -1);
        updatePinDisplay();
    }
}

function clearPin() {
    currentPin = '';
    updatePinDisplay();
}

function updatePinDisplay() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`pin-dot-${i}`);
        if (i <= currentPin.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    }
}

async function setDiaryPin(pin) {
    try {
        const response = await fetch('../backend/api/auth/set-diary-pin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pin: pin,
                confirm_pin: pin
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // PIN set successfully
            window.isSettingUpPin = false;
            window.firstPin = null;
            diaryUnlocked = true;
            
            document.getElementById('diaryPinScreen').style.display = 'none';
            document.getElementById('diaryEntries').style.display = 'block';
            loadDiaryEntries();
            
            // Show success message
            showMessage('Diary PIN set successfully! 🔒✨', 'success');
        } else {
            document.getElementById('pinSetupMessage').innerHTML = 
                `<span style="color: #dc3545;">${result.message}</span>`;
            setTimeout(() => {
                showPinSetup();
            }, 2000);
        }
    } catch (error) {
        console.error('Error setting PIN:', error);
        document.getElementById('pinSetupMessage').innerHTML = 
            '<span style="color: #dc3545;">Connection error. Please try again.</span>';
        setTimeout(() => {
            showPinSetup();
        }, 2000);
    }
}

async function verifyDiaryPin() {
    try {
        const response = await fetch('../backend/api/auth/verify-diary-pin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pin: currentPin
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            diaryUnlocked = true;
            document.getElementById('diaryPinScreen').style.display = 'none';
            document.getElementById('diaryEntries').style.display = 'block';
            loadDiaryEntries();
        } else {
            // Wrong PIN - shake animation and clear
            const pinContainer = document.querySelector('.pin-container');
            pinContainer.style.animation = 'shake 0.5s';
            setTimeout(() => {
                pinContainer.style.animation = '';
                clearPin();
            }, 500);
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        clearPin();
    }
}

function showDiaryPin() {
    const pinScreen = document.getElementById('diaryPinScreen');
    pinScreen.innerHTML = `
        <h2 class="pin-title">Enter PIN</h2>
        <p class="pin-subtitle">Enter your 4-digit PIN to access diary</p>
        
        <div class="pin-display">
            <div class="pin-dot" id="pin-dot-1"></div>
            <div class="pin-dot" id="pin-dot-2"></div>
            <div class="pin-dot" id="pin-dot-3"></div>
            <div class="pin-dot" id="pin-dot-4"></div>
        </div>
        
        <div class="pin-keypad">
            <button class="pin-key" onclick="enterPin('1')">1</button>
            <button class="pin-key" onclick="enterPin('2')">2</button>
            <button class="pin-key" onclick="enterPin('3')">3</button>
            <button class="pin-key" onclick="enterPin('4')">4</button>
            <button class="pin-key" onclick="enterPin('5')">5</button>
            <button class="pin-key" onclick="enterPin('6')">6</button>
            <button class="pin-key" onclick="enterPin('7')">7</button>
            <button class="pin-key" onclick="enterPin('8')">8</button>
            <button class="pin-key" onclick="enterPin('9')">9</button>
            <button class="pin-key" onclick="clearPin()">×</button>
            <button class="pin-key" onclick="enterPin('0')">0</button>
            <button class="pin-key" onclick="deletePin()">⌫</button>
        </div>
    `;
    
    pinScreen.style.display = 'block';
    document.getElementById('diaryEntries').style.display = 'none';
    currentPin = '';
    window.isSettingUpPin = false;
    window.firstPin = null;
    updatePinDisplay();
}

// Content Loading Functions
async function loadNotes() {
    try {
        const response = await fetch('../backend/api/notes.php');
        const result = await response.json();
        
        if (result.success) {
            displayNotes(result.data);
        }
    } catch (error) {
        console.error('Error loading notes:', error);
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
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'toast-message';
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${type === 'error' ? '#dc3545' : '#9CAF88'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        animation: slideDown 0.3s ease-out;
    `;
    messageDiv.textContent = message;
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Add CSS for toast animations
if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideDown {
            from {
                transform: translateX(-50%) translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }
        @keyframes slideUp {
            from {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
            to {
                transform: translateX(-50%) translateY(-100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

async function loadTodos() {
    try {
        const response = await fetch('../backend/api/todos.php');
        const result = await response.json();
        
        if (result.success) {
            displayTodos(result.data);
        }
    } catch (error) {
        console.error('Error loading todos:', error);
    }
}

async function loadDiaryEntries() {
    try {
        const response = await fetch('../backend/api/diary.php');
        const result = await response.json();
        
        if (result.success) {
            displayDiaryEntries(result.data);
        }
    } catch (error) {
        console.error('Error loading diary entries:', error);
    }
}

function displayNotes(notes) {
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
        notesList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 40px;">No notes yet. Create your first note!</p>';
        return;
    }
    
    notes.forEach(note => {
        const noteDiv = document.createElement('div');
        noteDiv.className = `note-card ${note.is_pinned ? 'pinned' : ''}`;
        noteDiv.innerHTML = `
            <div class="note-title">${note.title}</div>
            <div class="note-content">${note.content}</div>
            ${note.is_pinned ? '<svg class="pin-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1z"/><path d="m15 20-3-3-3 3v-5h6v5z"/></svg>' : ''}
        `;
        noteDiv.onclick = () => editNote(note.id);
        notesList.appendChild(noteDiv);
    });
}

function displayTodos(todos) {
    const todosList = document.getElementById('todosList');
    todosList.innerHTML = '';
    
    if (todos.length === 0) {
        todosList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 40px;">No tasks yet. Add your first task!</p>';
        return;
    }
    
    todos.forEach(todo => {
        const progress = todo.total_steps > 0 ? (todo.completed_steps / todo.total_steps) * 100 : 0;
        const todoDiv = document.createElement('div');
        todoDiv.className = 'todo-item';
        todoDiv.innerHTML = `
            <div class="todo-checkbox ${todo.completed_steps === todo.total_steps ? 'checked' : ''}">
                ${todo.completed_steps === todo.total_steps ? '✓' : ''}
            </div>
            <div class="todo-content">
                <div class="todo-title">${todo.title}</div>
                <div class="todo-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">${todo.completed_steps}/${todo.total_steps}</div>
                </div>
            </div>
        `;
        todoDiv.onclick = () => editTodo(todo.id);
        todosList.appendChild(todoDiv);
    });
}

function displayDiaryEntries(entries) {
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = '';
    
    if (entries.length === 0) {
        entriesList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 40px;">No diary entries yet. Write your first entry!</p>';
        return;
    }
    
    entries.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'note-card';
        entryDiv.innerHTML = `
            <div class="note-title">${new Date(entry.created_at).toLocaleDateString()}</div>
            <div class="note-content">${entry.content}</div>
        `;
        entryDiv.onclick = () => editDiaryEntry(entry.id);
        entriesList.appendChild(entryDiv);
    });
}
// Real implementation functions for content creation

async function addNewNote() {
    const title = prompt('Enter note title:');
    if (!title) return;
    
    const content = prompt('Enter note content:');
    if (!content) return;

    try {
        const response = await fetch('../backend/api/notes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                content: content,
                note_type: 'text',
                color_theme: 'default'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('Note created successfully!', 'success');
            // Refresh notes if on notes page
            if (currentSection === 'notes') {
                loadNotes();
            }
        } else {
            showMessage(result.message || 'Failed to create note', 'error');
        }
    } catch (error) {
        console.error('Error creating note:', error);
        showMessage('Error creating note', 'error');
    }
}

async function addNewTodo() {
    const title = prompt('Enter todo title:');
    if (!title) return;
    
    const description = prompt('Enter todo description (optional):');
    const priority = prompt('Enter priority (low, medium, high):', 'medium');
    const dueDate = prompt('Enter due date (YYYY-MM-DD) - optional:');

    try {
        const todoData = {
            title: title,
            priority: priority || 'medium'
        };
        
        if (description) todoData.description = description;
        if (dueDate) todoData.due_date = dueDate;

        const response = await fetch('../backend/api/todos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(todoData)
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('Todo created successfully!', 'success');
            // Refresh todos if on todos page
            if (currentSection === 'todos') {
                loadTodos();
            }
        } else {
            showMessage(result.message || 'Failed to create todo', 'error');
        }
    } catch (error) {
        console.error('Error creating todo:', error);
        showMessage('Error creating todo', 'error');
    }
}

async function addNewEntry() {
    const title = prompt('Enter diary entry title:');
    if (!title) return;
    
    const content = prompt('Enter your diary entry:');
    if (!content) return;

    const mood = prompt('How are you feeling? (happy, sad, excited, calm, anxious, etc.):');
    const weather = prompt('What\'s the weather like? (optional):');
    
    try {
        const entryData = {
            title: title,
            content: content,
            entry_date: new Date().toISOString().split('T')[0] // Today's date
        };
        
        if (mood) entryData.mood = mood;
        if (weather) entryData.weather = weather;

        const response = await fetch('../backend/api/diary.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entryData)
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('Diary entry created successfully!', 'success');
            // Refresh diary if on diary page
            if (currentSection === 'diary') {
                loadDiary();
            }
        } else {
            showMessage(result.message || 'Failed to create diary entry', 'error');
        }
    } catch (error) {
        console.error('Error creating diary entry:', error);
        showMessage('Error creating diary entry', 'error');
    }
}

async function editNote(id) {
    try {
        // First get the current note data
        const response = await fetch(`../backend/api/notes.php`);
        const result = await response.json();
        
        if (!result.success) {
            showMessage('Failed to load note', 'error');
            return;
        }
        
        const note = result.data.find(n => n.id == id);
        if (!note) {
            showMessage('Note not found', 'error');
            return;
        }
        
        const newTitle = prompt('Edit note title:', note.title);
        if (newTitle === null) return; // User cancelled
        
        const newContent = prompt('Edit note content:', note.content);
        if (newContent === null) return; // User cancelled

        const updateResponse = await fetch(`../backend/api/notes.php/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: newTitle,
                content: newContent
            })
        });

        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
            showMessage('Note updated successfully!', 'success');
            if (currentSection === 'notes') {
                loadNotes();
            }
        } else {
            showMessage(updateResult.message || 'Failed to update note', 'error');
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showMessage('Error updating note', 'error');
    }
}

async function editTodo(id) {
    try {
        // Get current todo
        const response = await fetch('../backend/api/todos.php');
        const result = await response.json();
        
        if (!result.success) {
            showMessage('Failed to load todo', 'error');
            return;
        }
        
        const todo = result.data.find(t => t.id == id);
        if (!todo) {
            showMessage('Todo not found', 'error');
            return;
        }
        
        const newTitle = prompt('Edit todo title:', todo.title);
        if (newTitle === null) return;
        
        const newDescription = prompt('Edit description:', todo.description || '');
        const newPriority = prompt('Edit priority (low, medium, high):', todo.priority);
        
        const updateData = {
            title: newTitle,
            priority: newPriority || 'medium'
        };
        
        if (newDescription !== null) updateData.description = newDescription;

        const updateResponse = await fetch(`../backend/api/todos.php/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
            showMessage('Todo updated successfully!', 'success');
            if (currentSection === 'todos') {
                loadTodos();
            }
        } else {
            showMessage(updateResult.message || 'Failed to update todo', 'error');
        }
    } catch (error) {
        console.error('Error updating todo:', error);
        showMessage('Error updating todo', 'error');
    }
}

async function editDiaryEntry(id) {
    try {
        // Get current entry
        const response = await fetch('../backend/api/diary.php');
        const result = await response.json();
        
        if (!result.success) {
            showMessage('Failed to load diary entry', 'error');
            return;
        }
        
        const entry = result.data.find(e => e.id == id);
        if (!entry) {
            showMessage('Diary entry not found', 'error');
            return;
        }
        
        const newTitle = prompt('Edit entry title:', entry.title);
        if (newTitle === null) return;
        
        const newContent = prompt('Edit your diary entry:', entry.content);
        if (newContent === null) return;
        
        const newMood = prompt('Edit mood:', entry.mood || '');

        const updateResponse = await fetch(`../backend/api/diary.php/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: newTitle,
                content: newContent,
                mood: newMood || null
            })
        });

        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
            showMessage('Diary entry updated successfully!', 'success');
            if (currentSection === 'diary') {
                loadDiary();
            }
        } else {
            showMessage(updateResult.message || 'Failed to update entry', 'error');
        }
    } catch (error) {
        console.error('Error updating diary entry:', error);
        showMessage('Error updating diary entry', 'error');
    }
}

// Load functions for different sections
async function loadNotes() {
    try {
        const response = await fetch('../backend/api/notes.php');
        const result = await response.json();
        
        if (result.success) {
            displayNotes(result.data);
        } else {
            showMessage('Failed to load notes', 'error');
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        showMessage('Error loading notes', 'error');
    }
}

async function loadTodos() {
    try {
        const response = await fetch('../backend/api/todos.php');
        const result = await response.json();
        
        if (result.success) {
            displayTodos(result.data);
        } else {
            showMessage('Failed to load todos', 'error');
        }
    } catch (error) {
        console.error('Error loading todos:', error);
        showMessage('Error loading todos', 'error');
    }
}

async function loadDiary() {
    try {
        const response = await fetch('../backend/api/diary.php');
        const result = await response.json();
        
        if (result.success) {
            displayDiary(result.data);
        } else {
            showMessage('Failed to load diary entries', 'error');
        }
    } catch (error) {
        console.error('Error loading diary:', error);
        showMessage('Error loading diary', 'error');
    }
}

// Display functions
function displayNotes(notes) {
    const contentArea = document.getElementById('content-area');
    if (!notes || notes.length === 0) {
        contentArea.innerHTML = `
            <div class="empty-state">
                <h3>No notes yet</h3>
                <p>Click the + button to create your first note!</p>
            </div>
        `;
        return;
    }
    
    const notesHTML = notes.map(note => `
        <div class="content-item note" onclick="editNote(${note.id})">
            <h4>${note.title}</h4>
            <p>${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
            <div class="item-meta">
                <span>${new Date(note.created_at).toLocaleDateString()}</span>
                ${note.is_pinned ? '<span class="pinned">📌</span>' : ''}
            </div>
        </div>
    `).join('');
    
    contentArea.innerHTML = notesHTML;
}

function displayTodos(todos) {
    const contentArea = document.getElementById('content-area');
    if (!todos || todos.length === 0) {
        contentArea.innerHTML = `
            <div class="empty-state">
                <h3>No todos yet</h3>
                <p>Click the + button to create your first todo!</p>
            </div>
        `;
        return;
    }
    
    const todosHTML = todos.map(todo => `
        <div class="content-item todo ${todo.status === 'completed' ? 'completed' : ''}" onclick="toggleTodo(${todo.id})">
            <div class="todo-header">
                <h4>${todo.title}</h4>
                <span class="priority priority-${todo.priority}">${todo.priority}</span>
            </div>
            ${todo.description ? `<p>${todo.description}</p>` : ''}
            <div class="item-meta">
                ${todo.due_date ? `<span>Due: ${new Date(todo.due_date).toLocaleDateString()}</span>` : ''}
                <span>${new Date(todo.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
    
    contentArea.innerHTML = todosHTML;
}

function displayDiary(entries) {
    const contentArea = document.getElementById('content-area');
    if (!entries || entries.length === 0) {
        contentArea.innerHTML = `
            <div class="empty-state">
                <h3>No diary entries yet</h3>
                <p>Click the + button to write your first entry!</p>
            </div>
        `;
        return;
    }
    
    const entriesHTML = entries.map(entry => `
        <div class="content-item diary-entry" onclick="editDiaryEntry(${entry.id})">
            <h4>${entry.title}</h4>
            <p>${entry.content.substring(0, 150)}${entry.content.length > 150 ? '...' : ''}</p>
            <div class="item-meta">
                <span>${new Date(entry.entry_date).toLocaleDateString()}</span>
                ${entry.mood ? `<span class="mood">😊 ${entry.mood}</span>` : ''}
                ${entry.weather ? `<span class="weather">🌤️ ${entry.weather}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    contentArea.innerHTML = entriesHTML;
}

async function toggleTodo(todoId) {
    try {
        // Get current todo status first
        const response = await fetch('../backend/api/todos.php');
        const result = await response.json();
        
        if (!result.success) {
            showMessage('Failed to load todo', 'error');
            return;
        }
        
        const todo = result.data.find(t => t.id == todoId);
        if (!todo) {
            showMessage('Todo not found', 'error');
            return;
        }
        
        const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
        
        const updateResponse = await fetch(`../backend/api/todos.php/${todoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
            showMessage(`Todo ${newStatus}!`, 'success');
            if (currentSection === 'todos') {
                loadTodos();
            }
        } else {
            showMessage(updateResult.message || 'Failed to update todo', 'error');
        }
    } catch (error) {
        console.error('Error toggling todo:', error);
        showMessage('Error updating todo', 'error');
    }
}

// Add shake animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 20%, 50%, 80%, 100% { transform: translateX(0); }
        10%, 30%, 70%, 90% { transform: translateX(-5px); }
        40%, 60% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);
