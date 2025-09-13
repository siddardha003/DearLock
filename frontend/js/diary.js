// Diary Page JavaScript
let currentPin = '';
let setupPin = '';
let confirmPin = '';
let firstSetupPin = ''; // Store the first PIN for comparison
let setupStep = 'first'; // 'first' or 'confirm'
let diaryUnlocked = false;

document.addEventListener('DOMContentLoaded', function () {
    console.log('📱 Diary page initializing...');
    console.log('🔐 Initial diary unlock status:', diaryUnlocked);

    checkAuthStatus();
    console.log('✅ Auth status checked');

    checkDiaryAccess();
    console.log('✅ Diary access checked');

    // Setup entry form handler
    const entryForm = document.getElementById('entryForm');
    if (entryForm) {
        console.log('📝 Setting up entry form handler');
        entryForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const content = document.getElementById('entryContent').value.trim();

            if (!content) {
                showMessage('Please fill in content', 'error');
                return;
            }

            await submitDiaryEntry(content);
        });
    }
});

function checkAuthStatus() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
}

async function checkDiaryAccess() {
    console.log('🔍 Checking diary access...');
    try {
        // Check if user has a diary PIN set
        const response = await fetch('../backend/api/auth/me.php', {
            credentials: 'include' // Include cookies for session
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (!response.ok) {
            if (response.status === 401) {
                // Not authenticated - redirect to login
                console.log('❌ Not authenticated - redirecting to login');
                showMessage('Please log in first', 'error');
                setTimeout(() => window.location.href = 'login.html', 1500);
                return;
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }

        const result = await response.json();
        console.log('📋 Me result:', result);
        console.log('🔍 has_diary_pin value:', result.data?.has_diary_pin);
        console.log('🔍 has_diary_pin type:', typeof result.data?.has_diary_pin);

        if (result.success) {
            if (!result.data.has_diary_pin) {
                console.log('🆕 First time user - showing PIN setup');
                // First time - show PIN setup
                showPinSetup();
            } else {
                console.log('🔒 Returning user - showing PIN entry');
                // Has PIN - show PIN entry
                showPinEntry();
            }
        } else {
            showMessage(result.message || 'Error checking diary access', 'error');
        }
    } catch (error) {
        console.error('❌ Error checking diary access:', error);
        if (error.message.includes('Unexpected token')) {
            showMessage('Server error - please try logging in again', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } else {
            showMessage('Error checking diary access', 'error');
        }
    }
}

function showPinSetup() {
    console.log('🔧 Showing PIN setup modal');
    const modal = document.getElementById('pin-setup-modal');
    if (modal) {
        modal.classList.add('show');
        console.log('✅ PIN setup modal shown');
    } else {
        console.error('❌ Could not find pin-setup-modal element');
    }

    const diaryContent = document.getElementById('diary-content');
    if (diaryContent) {
        diaryContent.style.filter = 'blur(5px)';
        console.log('🌀 Diary content blurred for PIN setup');
    }
}

function showPinEntry() {
    console.log('🔐 Showing PIN entry modal');
    const modal = document.getElementById('pin-modal');
    if (modal) {
        modal.classList.add('show');
        console.log('✅ PIN entry modal shown');
    } else {
        console.error('❌ Could not find pin-modal element');
    }

    const diaryContent = document.getElementById('diary-content');
    if (diaryContent) {
        diaryContent.style.filter = 'blur(5px)';
        console.log('🌀 Diary content blurred for PIN entry');
    } else {
        console.error('❌ Could not find diary-content element to blur');
    }
}

function hidePinModals() {
    console.log('🔓 Hiding PIN modals and unlocking diary interface');

    const pinModal = document.getElementById('pin-modal');
    const setupModal = document.getElementById('pin-setup-modal');

    if (pinModal) {
        pinModal.classList.remove('show');
        console.log('✅ PIN entry modal hidden');
    }

    if (setupModal) {
        setupModal.classList.remove('show');
        console.log('✅ PIN setup modal hidden');
    }

    const diaryContent = document.getElementById('diary-content');
    if (diaryContent) {
        diaryContent.style.filter = 'none';
        console.log('✅ Diary content unblurred');
    } else {
        console.error('❌ Could not find diary-content element to unblur');
    }

    console.log('✅ PIN modals hidden, diary content unblurred');
}

// PIN Setup Functions
function enterSetupPin(digit) {
    if (setupStep === 'first') {
        if (setupPin.length < 4) {
            setupPin += digit;
            updateSetupPinDisplay();

            if (setupPin.length === 4) {
                setTimeout(() => {
                    setupStep = 'confirm';
                    firstSetupPin = setupPin; // Store the first PIN
                    setupPin = '';
                    updateSetupPinDisplay();
                    document.querySelector('#pin-setup-modal h3').textContent = 'Confirm your PIN';
                    document.querySelector('#pin-setup-modal p').textContent = 'Re-enter your PIN to confirm';
                }, 500);
            }
        }
    } else if (setupStep === 'confirm') {
        if (confirmPin.length < 4) {
            confirmPin += digit;
            updateSetupPinDisplay();

            if (confirmPin.length === 4) {
                setTimeout(() => {
                    console.log('🔍 PIN Comparison:', { firstSetupPin, confirmPin, match: firstSetupPin === confirmPin });
                    if (firstSetupPin === confirmPin) {
                        console.log('✅ PINs match! Setting diary PIN...');
                        setDiaryPin(confirmPin);
                    } else {
                        console.log('❌ PINs do not match');
                        showMessage('PINs do not match. Try again.', 'error');
                        resetPinSetup();
                    }
                }, 500);
            }
        }
    }
}

function clearSetupPin() {
    if (setupStep === 'first') {
        setupPin = setupPin.slice(0, -1);
    } else {
        confirmPin = confirmPin.slice(0, -1);
    }
    updateSetupPinDisplay();
}

function updateSetupPinDisplay() {
    const dots = document.querySelectorAll('#pin-setup-modal .pin-dot');
    const currentPin = setupStep === 'first' ? setupPin : confirmPin;

    dots.forEach((dot, index) => {
        if (index < currentPin.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

function resetPinSetup() {
    setupStep = 'first';
    setupPin = '';
    confirmPin = '';
    firstSetupPin = ''; // Clear the stored first PIN
    updateSetupPinDisplay();
    document.querySelector('#pin-setup-modal h3').textContent = 'Set up Diary PIN';
    document.querySelector('#pin-setup-modal p').textContent = 'Choose a 4-digit PIN to protect your diary';
}

async function setDiaryPin(pin) {
    try {
        const response = await fetch('../backend/api/auth/set-diary-pin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for session
            body: JSON.stringify({
                pin: pin,
                confirm_pin: pin
            })
        });

        const result = await response.json();

        if (result.success) {
            showMessage('Diary PIN set successfully!', 'success');
            diaryUnlocked = true;
            hidePinModals();
            loadDiaryEntries();
        } else {
            showMessage(result.message || 'Failed to set diary PIN', 'error');
            resetPinSetup();
        }
    } catch (error) {
        console.error('Error setting diary PIN:', error);
        showMessage('Error setting diary PIN', 'error');
        resetPinSetup();
    }
}

// PIN Entry Functions
function enterPin(digit) {
    if (currentPin.length < 4) {
        currentPin += digit;
        updatePinDisplay();

        if (currentPin.length === 4) {
            setTimeout(() => {
                verifyDiaryPin(currentPin);
            }, 300);
        }
    }
}

function clearPin() {
    currentPin = currentPin.slice(0, -1);
    updatePinDisplay();
}

function updatePinDisplay() {
    const dots = document.querySelectorAll('#pin-modal .pin-dot');
    dots.forEach((dot, index) => {
        if (index < currentPin.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

async function verifyDiaryPin(pin) {
    try {
        const response = await fetch('../backend/api/auth/verify-diary-pin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for session
            body: JSON.stringify({
                pin: pin
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ PIN verified successfully! Unlocking diary...');
            diaryUnlocked = true;
            console.log('🔓 Diary unlocked status set to:', diaryUnlocked);

            hidePinModals();
            loadDiaryEntries();
        } else {
            showMessage('Incorrect PIN. Please try again.', 'error');
            currentPin = '';
            updatePinDisplay();
            // Add shake animation
            document.querySelector('#pin-modal .pin-content').classList.add('shake');
            setTimeout(() => {
                document.querySelector('#pin-modal .pin-content').classList.remove('shake');
            }, 500);
        }
    } catch (error) {
        console.error('Error verifying diary PIN:', error);
        showMessage('Error verifying diary PIN', 'error');
        currentPin = '';
        updatePinDisplay();
    }
}

// Diary Content Functions
async function loadDiaryEntries() {
    console.log('📖 Loading diary entries... diaryUnlocked:', diaryUnlocked);

    if (!diaryUnlocked) {
        console.log('❌ Diary is locked, cannot load entries');
        return;
    }

    try {
        const response = await fetch('../backend/api/diary.php', {
            credentials: 'include' // Include cookies for session
        });

        console.log('📡 Load entries response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📋 Load entries result:', result);

        if (result.success) {
            console.log('✅ Entries loaded successfully:', result.data.length, 'entries');
            displayDiaryEntries(result.data);
        } else {
            showMessage('Failed to load diary entries', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading diary entries:', error);
        showMessage('Error loading diary entries', 'error');
    }
}

function displayDiaryEntries(entries) {
    console.log('🎨 Displaying diary entries:', entries);
    const container = document.getElementById('entries-container');

    if (!container) {
        console.error('❌ entries-container element not found!');
        return;
    }

    if (!entries || entries.length === 0) {
        console.log('📝 No entries to display, showing empty state');
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 16px;">📔</div>
                <h3 style="color: #333; margin-bottom: 8px;">No diary entries yet</h3>
                <p style="color: #666;">Click the + button to write your first entry!</p>
            </div>
        `;
        return;
    }

    console.log(`📚 Displaying ${entries.length} entries`);
    const entriesHTML = entries.map(entry => {
        const createdDate = new Date(entry.created_at);

        return `
            <div class="diary-entry" data-entry-id="${entry.id}" onclick="viewEntry(${entry.id})">
                <h4>${formatEntryDate(entry.entry_date)}</h4>
                <p>${entry.content.length > 150 ? entry.content.substring(0, 150) + '...' : entry.content}</p>
                <div class="entry-footer">
                    <span>Created: ${formatDate(createdDate)}</span>
                    <div class="entry-actions">
                        <button class="action-btn edit" onclick="event.stopPropagation(); openEditEntry(${entry.id})" title="Edit entry">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                        <button class="action-btn delete" onclick="event.stopPropagation(); deleteEntry(${entry.id})" title="Delete entry">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polyline points="3,6 5,6 21,6" fill="none" stroke="currentColor" stroke-width="2"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" fill="none" stroke="currentColor" stroke-width="2"/>
                        <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" stroke-width="2"/>
                        <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = entriesHTML;
}

async function addNewEntry() {
    if (!diaryUnlocked) {
        showMessage('Please unlock diary first', 'error');
        return;
    }

    // Show the entry modal instead of using prompts
    showEntryModal();
}

function showEntryModal() {
    console.log('📝 Opening entry modal...');
    const modal = document.getElementById('entry-modal');
    if (modal) {
        modal.classList.add('show');
        console.log('✅ Entry modal opened');
    } else {
        console.error('❌ Could not find entry-modal element');
    }

    const titleInput = document.getElementById('entryTitle');
    if (titleInput) {
        titleInput.focus();
    }
}

function closeEntryModal() {
    console.log('🔄 Closing entry modal...');

    const modal = document.getElementById('entry-modal');
    if (modal) {
        modal.classList.remove('show');
        console.log('✅ Modal display class removed');
    } else {
        console.error('❌ Could not find entry-modal element');
    }

    // Clear form - check both possible IDs
    let form = document.getElementById('entryForm');
    if (!form) {
        form = document.getElementById('entry-form');
        console.log('🔄 Trying entry-form ID instead of entryForm');
    }

    if (form) {
        form.reset();
        console.log('✅ Form cleared successfully');
    } else {
        console.error('❌ Could not find form element (tried both entryForm and entry-form)');
    }
}

// Make functions globally accessible
window.showEntryModal = showEntryModal;
window.closeEntryModal = closeEntryModal;
window.addNewEntry = addNewEntry;
window.enterPin = enterPin;
window.clearPin = clearPin;
window.enterSetupPin = enterSetupPin;
window.clearSetupPin = clearSetupPin;

// Variables for tracking current operations
let currentEntryId = null;
let currentEntryData = null;

// Date formatting functions
function formatEntryDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Search functionality
function searchEntries() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const entries = document.querySelectorAll('.diary-entry');

    entries.forEach(entry => {
        const content = entry.querySelector('p').textContent.toLowerCase();
        const date = entry.querySelector('h4').textContent.toLowerCase();

        if (content.includes(searchTerm) || date.includes(searchTerm)) {
            entry.style.display = 'block';
        } else {
            entry.style.display = 'none';
        }
    });
}

// View Entry Modal Functions
async function viewEntry(entryId) {
    try {
        const response = await fetch(`../backend/api/diary.php?id=${entryId}`, {
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success && result.data) {
            currentEntryData = result.data;
            showViewModal(result.data);
        } else {
            showMessage('Entry not found', 'error');
        }
    } catch (error) {
        console.error('Error fetching entry:', error);
        showMessage('Error loading entry', 'error');
    }
}

function showViewModal(entry) {
    const modal = document.getElementById('view-modal');
    const createdDate = new Date(entry.created_at);
    const updatedDate = new Date(entry.updated_at);
    const wasEdited = createdDate.getTime() !== updatedDate.getTime();

    document.getElementById('viewEntryTitle').textContent = formatEntryDate(entry.entry_date);
    document.getElementById('viewCreatedDate').textContent = formatDate(createdDate);
    document.getElementById('viewEntryContent').textContent = entry.content;

    const updatedInfo = document.getElementById('viewUpdatedInfo');
    if (wasEdited) {
        document.getElementById('viewUpdatedDate').textContent = formatDate(updatedDate);
        updatedInfo.style.display = 'block';
    } else {
        updatedInfo.style.display = 'none';
    }

    currentEntryId = entry.id;
    currentEntryData = entry;  // Set the current entry data
    modal.classList.add('show');
}

function closeViewModal() {
    document.getElementById('view-modal').classList.remove('show');
    currentEntryId = null;
    currentEntryData = null;
}

// Edit Entry Modal Functions
function editEntry() {
    if (currentEntryData) {
        const entryId = currentEntryData.id; // Store the ID before closing modal
        closeViewModal();
        openEditEntry(entryId);
    } else {
        showMessage('Error: Entry data not found', 'error');
    }
}

async function openEditEntry(entryId) {
    try {
        // Get entry data if not already available
        if (!currentEntryData || currentEntryData.id !== entryId) {
            const response = await fetch(`../backend/api/diary.php?id=${entryId}`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success && result.data) {
                currentEntryData = result.data;
            } else {
                showMessage('Entry not found', 'error');
                return;
            }
        }

        showEditModal(currentEntryData);
    } catch (error) {
        console.error('Error fetching entry for edit:', error);
        showMessage('Error loading entry for editing', 'error');
    }
}

function showEditModal(entry) {
    const modal = document.getElementById('edit-modal');
    const createdDate = new Date(entry.created_at);

    document.getElementById('editCreatedDate').textContent = formatDate(createdDate);
    document.getElementById('editEntryContent').value = entry.content;

    currentEntryId = entry.id;
    modal.classList.add('show');

    // Focus on textarea
    document.getElementById('editEntryContent').focus();
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('show');
    document.getElementById('editForm').reset();
    currentEntryId = null;
}

async function updateEntry(entryId, content) {
    try {
        const response = await fetch('../backend/api/diary.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                id: entryId,
                content: content
            })
        });

        const result = await response.json();

        if (result.success) {
            showMessage('Entry updated successfully!', 'success');
            closeEditModal();
            loadDiaryEntries(); // Reload entries
        } else {
            showMessage(result.message || 'Failed to update entry', 'error');
        }
    } catch (error) {
        console.error('Error updating entry:', error);
        showMessage('Error updating entry', 'error');
    }
}

// Delete Entry Functions
function deleteEntry(entryId) {
    currentEntryId = entryId;
    document.getElementById('confirm-modal').classList.add('show');
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.remove('show');
    currentEntryId = null;
}

async function confirmDelete() {
    if (!currentEntryId) return;

    try {
        const response = await fetch('../backend/api/diary.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                id: currentEntryId
            })
        });

        const result = await response.json();

        if (result.success) {
            showMessage('Entry deleted successfully', 'success');
            closeConfirmModal();
            loadDiaryEntries(); // Reload entries
        } else {
            showMessage(result.message || 'Failed to delete entry', 'error');
        }
    } catch (error) {
        console.error('Error deleting entry:', error);
        showMessage('Error deleting entry', 'error');
    }
}

// Helper function to get date from entry element
function getCurrentDateFromEntry(entryId) {
    const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
    if (entryElement) {
        // Extract date from the visible date text or use current date as fallback
        return new Date().toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
}

// Form event handlers
document.addEventListener('DOMContentLoaded', function () {
    // Edit form handler
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const content = document.getElementById('editEntryContent').value.trim();

            if (!content) {
                showMessage('Please enter some content', 'error');
                return;
            }

            if (currentEntryId) {
                await updateEntry(currentEntryId, content);
            }
        });
    }
});

// Add new global functions
window.viewEntry = viewEntry;
window.openEditEntry = openEditEntry;
window.editEntry = editEntry;
window.deleteEntry = deleteEntry;
window.closeViewModal = closeViewModal;
window.closeEditModal = closeEditModal;
window.closeConfirmModal = closeConfirmModal;
window.confirmDelete = confirmDelete;
window.searchEntries = searchEntries;

async function submitDiaryEntry(content) {
    try {
        const entryData = {
            content: content,
            entry_date: new Date().toISOString().split('T')[0]
        };

        // Note: title, mood and weather are not stored in simplified database schema
        console.log('📝 Creating entry:', { content, entry_date: entryData.entry_date });

        const response = await fetch('../backend/api/diary.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for session
            body: JSON.stringify(entryData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log('✅ Entry created successfully!', result);
            showMessage('Diary entry created successfully!', 'success');
            console.log('🔄 Calling closeEntryModal...');
            closeEntryModal();
            console.log('🔄 Calling loadDiaryEntries...');
            loadDiaryEntries(); // Reload entries
        } else {
            showMessage(result.message || 'Failed to create diary entry', 'error');
        }
    } catch (error) {
        console.error('Error creating diary entry:', error);
        if (error.message.includes('Unexpected token')) {
            showMessage('Server error - please check your connection', 'error');
        } else {
            showMessage('Error creating diary entry', 'error');
        }
    }
}

// Toast message function
function showMessage(message, type) {
    const existingMessage = document.querySelector('.toast-message');
    if (existingMessage) {
        existingMessage.remove();
    }

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
        10%, 30%, 70%, 90% { transform: translateX(-10px); }
        40%, 60% { transform: translateX(10px); }
    }
    
    .shake {
        animation: shake 0.5s;
    }
    
    .pin-dot {
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background: #ddd;
        margin: 0 5px;
        transition: background 0.2s;
    }
    
    .pin-dot.filled {
        background: #E8B4B8;
    }
    
    .pin-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .pin-content {
        background: white;
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        width: 90%;
        max-width: 300px;
    }
    
    .pin-display {
        display: flex;
        justify-content: center;
        margin: 20px 0;
    }
    
    .pin-keypad {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-top: 20px;
    }
    
    .pin-key {
        width: 60px;
        height: 60px;
        border: none;
        border-radius: 50%;
        background: #f5f5f5;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .pin-key:hover {
        background: #e0e0e0;
        transform: scale(1.05);
    }
    
    .pin-key.blank {
        background: transparent;
        cursor: default;
    }
    
    .pin-key.blank:hover {
        background: transparent;
        transform: none;
    }
`;
document.head.appendChild(style);
