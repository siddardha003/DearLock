// Notes Page JavaScript - Dear Lock

// DOM Elements
let notesGrid = null;
let pinnedGrid = null;
let searchInput = null;
let filterButtons = null;
let viewToggle = null;
let labelsContainer = null;
let modalOverlay = null;
let noteModal = null;
let addNoteBtn = null;
let noteTitleInput = null;
let noteTextInput = null;
let backgroundOptions = null;
let imageUploadBtn = null;
let uploadedImagesContainer = null;
let labelInput = null;
let addLabelBtn = null;
let selectedLabelsContainer = null;

// Data
let notes = [];
let filteredNotes = [];
let currentFilter = 'all';
let currentView = 'grid';
let selectedBackground = 'default';
let selectedLabels = [];
let uploadedImages = [];
let editingNoteId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    initializeElements();
    await checkAuthentication();
    attachEventListeners();
});

async function checkAuthentication() {
    console.log('Checking authentication...');
    try {
        const response = await fetch('../backend/api/auth/me.php', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log('Not authenticated - redirecting to login');
                showNotification('Please log in first');
                setTimeout(() => window.location.href = 'login.html', 1500);
                return false;
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        
        const result = await response.json();
        if (result.success) {
            console.log('User authenticated:', result.data.username);
            await loadNotesFromBackend();
            return true;
        } else {
            showNotification('Authentication failed');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return false;
        }
    } catch (error) {
        console.error('Authentication check error:', error);
        showNotification('Error checking authentication');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return false;
    }
}

function initializeElements() {
    notesGrid = document.getElementById('notes-container');
    pinnedGrid = document.getElementById('pinnedNotesGrid');
    searchInput = document.getElementById('searchInput');
    filterButtons = document.querySelectorAll('.filter-btn');
    viewToggle = document.getElementById('viewToggle');
    labelsContainer = document.getElementById('labelsContainer');
    modalOverlay = document.getElementById('notes-modal');
    noteModal = document.getElementById('notes-modal');
    addNoteBtn = document.querySelector('.fab'); // Update to use the FAB button
    noteTitleInput = document.getElementById('noteTitle');
    noteTextInput = document.getElementById('noteContent');
    backgroundOptions = document.querySelectorAll('.bg-option');
    imageUploadBtn = document.getElementById('imageUploadBtn');
    uploadedImagesContainer = document.getElementById('uploadedImages');
    labelInput = document.getElementById('labelInput');
    addLabelBtn = document.getElementById('addLabelBtn');
    selectedLabelsContainer = document.getElementById('selectedLabels');
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
    addNoteBtn?.addEventListener('click', openAddNoteModal);
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    
    // Background selection
    backgroundOptions.forEach(option => {
        option.addEventListener('click', (e) => selectBackground(e.target.dataset.bg));
    });
    
    // Image upload
    imageUploadBtn?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = handleImageUpload;
        input.click();
    });
    
    // Labels
    addLabelBtn?.addEventListener('click', addLabel);
    labelInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addLabel();
        }
    });
    
    // Save note
    document.getElementById('saveNoteBtn')?.addEventListener('click', saveNote);
    document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
    
    // Form submission
    const notesForm = document.getElementById('notesForm');
    if (notesForm) {
        notesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveNote();
        });
    }
    
    // Back button
    document.getElementById('backBtn')?.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
}

function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (query === '') {
        filteredNotes = notes;
    } else {
        filteredNotes = notes.filter(note => 
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query) ||
            note.labels.some(label => label.toLowerCase().includes(query))
        );
    }
    
    renderNotes();
}

function handleFilter(filter) {
    currentFilter = filter;
    
    // Update active state
    filterButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
    
    applyFilter();
    renderNotes();
}

function applyFilter() {
    switch (currentFilter) {
        case 'all':
            filteredNotes = notes;
            break;
        case 'today':
            const today = new Date().toDateString();
            filteredNotes = notes.filter(note => 
                new Date(note.created_at).toDateString() === today
            );
            break;
        case 'images':
            filteredNotes = notes.filter(note => note.images && note.images.length > 0);
            break;
        default:
            filteredNotes = notes;
    }
    
    if (searchInput.value.trim()) {
        handleSearch();
    }
}

function toggleView() {
    currentView = currentView === 'grid' ? 'list' : 'grid';
    
    const icon = viewToggle.querySelector('svg use');
    if (currentView === 'list') {
        icon.setAttribute('href', '#grid-icon');
        notesGrid.classList.add('list-view');
        pinnedGrid.classList.add('list-view');
    } else {
        icon.setAttribute('href', '#list-icon');
        notesGrid.classList.remove('list-view');
        pinnedGrid.classList.remove('list-view');
    }
}

function openAddNoteModal() {
    editingNoteId = null;
    resetModal();
    modalOverlay.classList.add('show');
    noteTitleInput.focus();
}

function openEditNoteModal(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    editingNoteId = noteId;
    resetModal();
    
    // Fill modal with note data
    noteTitleInput.value = note.title;
    noteTextInput.value = note.content;
    selectedBackground = note.background || 'default';
    selectedLabels = [...note.labels];
    uploadedImages = [...(note.images || [])];
    
    // Update UI
    updateBackgroundSelection();
    renderSelectedLabels();
    renderUploadedImages();
    
    modalOverlay.classList.add('active');
    document.querySelector('.modal-header h3').textContent = 'Edit Note';
    noteTitleInput.focus();
}

function closeModal() {
    modalOverlay.classList.remove('show');
    resetModal();
}

function closeNotesModal() {
    closeModal();
}

function resetModal() {
    // Only reset the form elements that actually exist in the HTML
    if (noteTitleInput) noteTitleInput.value = '';
    if (noteTextInput) noteTextInput.value = '';
    
    // Clear the form if it exists
    const form = document.getElementById('notesForm');
    if (form) form.reset();
}

function selectBackground(bg) {
    selectedBackground = bg;
    updateBackgroundSelection();
}

function updateBackgroundSelection() {
    backgroundOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.bg === selectedBackground);
    });
}

function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImages.push({
                    id: Date.now() + Math.random(),
                    data: e.target.result,
                    name: file.name
                });
                renderUploadedImages();
            };
            reader.readAsDataURL(file);
        }
    });
}

function renderUploadedImages() {
    if (!uploadedImagesContainer) return;
    
    uploadedImagesContainer.innerHTML = uploadedImages.map(image => `
        <div class="uploaded-image">
            <img src="${image.data}" alt="${image.name}">
            <button class="remove-image" onclick="removeImage('${image.id}')">×</button>
        </div>
    `).join('');
}

function removeImage(imageId) {
    uploadedImages = uploadedImages.filter(img => img.id !== imageId);
    renderUploadedImages();
}

function addLabel() {
    const labelText = labelInput.value.trim();
    if (labelText && !selectedLabels.includes(labelText)) {
        selectedLabels.push(labelText);
        labelInput.value = '';
        renderSelectedLabels();
    }
}

function renderSelectedLabels() {
    if (!selectedLabelsContainer) return;
    
    selectedLabelsContainer.innerHTML = selectedLabels.map(label => `
        <div class="selected-label">
            <span>${label}</span>
            <button class="remove-label" onclick="removeLabel('${label}')">×</button>
        </div>
    `).join('');
}

function removeLabel(label) {
    selectedLabels = selectedLabels.filter(l => l !== label);
    renderSelectedLabels();
}

async function saveNote() {
    const title = noteTitleInput.value.trim() || 'Untitled';
    const content = noteTextInput.value.trim();
    
    if (!title && !content) {
        alert('Please enter a title or content for your note.');
        return;
    }
    
    const noteData = {
        title: title,
        content: content
    };
    
    try {
        if (editingNoteId) {
            // Update existing note
            const response = await fetch(`/DearLock/backend/api/notes.php/${editingNoteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(noteData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update local notes array
                const index = notes.findIndex(n => n.id == editingNoteId);
                if (index !== -1) {
                    notes[index] = result.data;
                }
                showNotification('Note updated successfully!');
            } else {
                showNotification('Failed to update note: ' + result.message);
                return;
            }
        } else {
            // Create new note
            const response = await fetch('/DearLock/backend/api/notes.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(noteData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Add new note to local array
                notes.unshift(result.data);
                showNotification('Note created successfully!');
            } else {
                showNotification('Failed to create note: ' + result.message);
                return;
            }
        }
        
        renderNotes();
        updateNotesCount();
        closeModal();
        
    } catch (error) {
        console.error('Error saving note:', error);
        showNotification('Network error. Please try again.');
    }
}

async function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        try {
            const response = await fetch(`/DearLock/backend/api/notes.php/${noteId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Remove from local array
                notes = notes.filter(note => note.id != noteId);
                renderNotes();
                updateNotesCount();
                showNotification('Note deleted successfully!');
            } else {
                showNotification('Failed to delete note: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            showNotification('Network error. Please try again.');
        }
    }
}

async function togglePin(noteId) {
    const note = notes.find(n => n.id == noteId);
    if (note) {
        const newPinnedState = !note.is_pinned;
        
        try {
            const response = await fetch(`/DearLock/backend/api/notes.php/${noteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ is_pinned: newPinnedState })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update local note
                note.is_pinned = newPinnedState;
                renderNotes();
                showNotification(newPinnedState ? 'Note pinned!' : 'Note unpinned!');
            } else {
                showNotification('Failed to update note: ' + result.message);
            }
        } catch (error) {
            console.error('Error toggling pin:', error);
            showNotification('Network error. Please try again.');
        }
    }
}

function renderNotes() {
    console.log('Rendering notes. Filtered notes:', filteredNotes);
    const pinnedNotes = filteredNotes.filter(note => note.is_pinned);
    const regularNotes = filteredNotes.filter(note => !note.is_pinned);
    console.log('Pinned notes:', pinnedNotes.length, 'Regular notes:', regularNotes.length);
    
    // Show/hide pinned section
    const pinnedSection = document.querySelector('.pinned-section');
    if (pinnedSection) {
        pinnedSection.style.display = pinnedNotes.length > 0 ? 'block' : 'none';
    }
    
    // Render pinned notes
    if (pinnedGrid) {
        pinnedGrid.innerHTML = pinnedNotes.map(note => createNoteCard(note)).join('');
    }
    
    // Render regular notes
    if (notesGrid) {
        if (regularNotes.length === 0) {
            console.log('No regular notes, showing empty message');
            notesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--light-gray-70);">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style="margin-bottom: 1rem;">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <h3 style="color: var(--light-gray); margin-bottom: 0.5rem;">No notes found</h3>
                    <p>Start creating your first note by clicking the + button</p>
                </div>
            `;
        } else {
            console.log('Rendering', regularNotes.length, 'regular notes');
            const noteCards = regularNotes.map(note => createNoteCard(note));
            console.log('Generated note cards:', noteCards);
            const joinedHtml = noteCards.join('');
            console.log('Final HTML length:', joinedHtml.length);
            console.log('Setting innerHTML...');
            notesGrid.innerHTML = joinedHtml;
            console.log('innerHTML set. Grid content length:', notesGrid.innerHTML.length);
        }
    } else {
        console.log('notesGrid element not found!');
    }
}

function createNoteCard(note) {
    console.log('Creating note card for:', note);
    const formattedDate = formatDate(note.updated_at || note.created_at);
    const backgroundAttr = note.background_image ? `data-bg="${note.background_image}"` : '';
    
    const cardHtml = `
        <div class="note-card ${note.is_pinned ? 'pinned' : ''}" ${backgroundAttr} onclick="openEditNoteModal('${note.id}')">
            <button class="pin-btn" onclick="event.stopPropagation(); togglePin('${note.id}')" title="${note.is_pinned ? 'Unpin note' : 'Pin note'}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/>
                </svg>
            </button>
            
            <h3 class="note-title">${escapeHtml(note.title)}</h3>
            
            ${note.content ? `<p class="note-text">${escapeHtml(note.content)}</p>` : ''}
            
            ${note.images && note.images.length > 0 ? `
                <div class="note-images">
                    ${note.images.slice(0, 3).map(img => `
                        <img src="${img.data}" alt="${img.name}" class="note-image">
                    `).join('')}
                    ${note.images.length > 3 ? `<div class="more-images">+${note.images.length - 3}</div>` : ''}
                </div>
            ` : ''}
            
            ${note.labels && note.labels.length > 0 ? `
                <div class="note-labels">
                    ${note.labels.slice(0, 3).map(label => `
                        <span class="note-label">${escapeHtml(label)}</span>
                    `).join('')}
                    ${note.labels.length > 3 ? `<span class="note-label">+${note.labels.length - 3}</span>` : ''}
                </div>
            ` : ''}
            
            <div class="note-footer">
                <span class="note-date">${formattedDate}</span>
                <div class="note-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); shareNote('${note.id}')" title="Share">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
                            <circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
                            <circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" stroke-width="2"/>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    <button class="action-btn" onclick="event.stopPropagation(); deleteNote('${note.id}')" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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
    
    console.log('Generated card HTML:', cardHtml);
    return cardHtml;
}

function updateLabelsContainer() {
    if (!labelsContainer) return;
    
    // Get all unique labels from notes
    const allLabels = [...new Set(notes.flatMap(note => note.labels))];
    
    if (allLabels.length === 0) {
        labelsContainer.style.display = 'none';
        return;
    }
    
    labelsContainer.style.display = 'flex';
    labelsContainer.innerHTML = allLabels.map(label => `
        <div class="label-chip" onclick="filterByLabel('${escapeHtml(label)}')">${escapeHtml(label)}</div>
    `).join('');
}

function filterByLabel(label) {
    searchInput.value = label;
    handleSearch();
    
    // Update label chip active state
    document.querySelectorAll('.label-chip').forEach(chip => {
        chip.classList.toggle('active', chip.textContent === label);
    });
}

function shareNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const shareText = `${note.title}\n\n${note.content}`;
    
    if (navigator.share) {
        navigator.share({
            title: note.title,
            text: shareText
        }).catch(console.error);
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Note copied to clipboard!');
        }).catch(() => {
            // Further fallback
            const textarea = document.createElement('textarea');
            textarea.value = shareText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification('Note copied to clipboard!');
        });
    }
}

function updateNotesCount() {
    const countElement = document.querySelector('.notes-count');
    if (countElement) {
        const totalNotes = notes.length;
        countElement.textContent = `${totalNotes} ${totalNotes === 1 ? 'note' : 'notes'}`;
    }
}

async function loadNotesFromBackend() {
    console.log('Loading notes from backend...');
    try {
        const response = await fetch('/DearLock/backend/api/notes.php', {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('API result:', result);
        console.log('Result data type:', typeof result.data);
        console.log('Result data length:', result.data ? result.data.length : 'no data');
        console.log('Result data content:', JSON.stringify(result.data, null, 2));
        
        if (result.success) {
            notes = result.data || [];
            console.log('Assigned notes:', notes);
            console.log('Notes length:', notes.length);
            filteredNotes = [...notes];
            renderNotes();
            updateNotesCount();
        } else {
            console.error('Failed to load notes:', result.message);
            showNotification('Failed to load notes: ' + result.message);
            // Fallback to empty array
            notes = [];
            filteredNotes = [];
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        showNotification('Network error loading notes');
        // Fallback to empty array
        notes = [];
        filteredNotes = [];
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Today';
    } else if (diffDays === 2) {
        return 'Yesterday';
    } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
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
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N to add new note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !modalOverlay.classList.contains('active')) {
        e.preventDefault();
        openAddNoteModal();
    }
    
    // Escape to close modal
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
    
    // Ctrl/Cmd + S to save note when modal is open
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && modalOverlay.classList.contains('active')) {
        e.preventDefault();
        saveNote();
    }
});
