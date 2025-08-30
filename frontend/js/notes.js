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
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    loadNotesFromStorage();
    renderNotes();
    attachEventListeners();
    updateNotesCount();
});

function initializeElements() {
    notesGrid = document.getElementById('notesGrid');
    pinnedGrid = document.getElementById('pinnedNotesGrid');
    searchInput = document.getElementById('searchInput');
    filterButtons = document.querySelectorAll('.filter-btn');
    viewToggle = document.getElementById('viewToggle');
    labelsContainer = document.getElementById('labelsContainer');
    modalOverlay = document.getElementById('modalOverlay');
    noteModal = document.getElementById('noteModal');
    addNoteBtn = document.getElementById('addNoteBtn');
    noteTitleInput = document.getElementById('noteTitle');
    noteTextInput = document.getElementById('noteText');
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
                new Date(note.createdAt).toDateString() === today
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
    modalOverlay.classList.add('active');
    document.querySelector('.modal-header h3').textContent = 'Add New Note';
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
    modalOverlay.classList.remove('active');
    resetModal();
}

function resetModal() {
    noteTitleInput.value = '';
    noteTextInput.value = '';
    selectedBackground = 'default';
    selectedLabels = [];
    uploadedImages = [];
    labelInput.value = '';
    
    updateBackgroundSelection();
    renderSelectedLabels();
    renderUploadedImages();
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

function saveNote() {
    const title = noteTitleInput.value.trim() || 'Untitled';
    const content = noteTextInput.value.trim();
    
    if (!title && !content) {
        alert('Please enter a title or content for your note.');
        return;
    }
    
    const noteData = {
        title,
        content,
        background: selectedBackground,
        labels: [...selectedLabels],
        images: [...uploadedImages],
        createdAt: editingNoteId ? 
            notes.find(n => n.id === editingNoteId).createdAt : 
            new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: editingNoteId ? 
            notes.find(n => n.id === editingNoteId).pinned : 
            false
    };
    
    if (editingNoteId) {
        // Update existing note
        const index = notes.findIndex(n => n.id === editingNoteId);
        notes[index] = { ...noteData, id: editingNoteId };
    } else {
        // Add new note
        noteData.id = Date.now().toString();
        notes.unshift(noteData);
    }
    
    saveNotesToStorage();
    applyFilter();
    renderNotes();
    updateNotesCount();
    updateLabelsContainer();
    closeModal();
    
    // Show success message
    showNotification(editingNoteId ? 'Note updated successfully!' : 'Note created successfully!');
}

function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(note => note.id !== noteId);
        saveNotesToStorage();
        applyFilter();
        renderNotes();
        updateNotesCount();
        updateLabelsContainer();
        showNotification('Note deleted successfully!');
    }
}

function togglePin(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        note.pinned = !note.pinned;
        note.updatedAt = new Date().toISOString();
        saveNotesToStorage();
        renderNotes();
        showNotification(note.pinned ? 'Note pinned!' : 'Note unpinned!');
    }
}

function renderNotes() {
    const pinnedNotes = filteredNotes.filter(note => note.pinned);
    const regularNotes = filteredNotes.filter(note => !note.pinned);
    
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
            notesGrid.innerHTML = regularNotes.map(note => createNoteCard(note)).join('');
        }
    }
}

function createNoteCard(note) {
    const formattedDate = formatDate(note.updatedAt || note.createdAt);
    const backgroundAttr = note.background !== 'default' ? `data-bg="${note.background}"` : '';
    
    return `
        <div class="note-card ${note.pinned ? 'pinned' : ''}" ${backgroundAttr} onclick="openEditNoteModal('${note.id}')">
            <button class="pin-btn" onclick="event.stopPropagation(); togglePin('${note.id}')" title="${note.pinned ? 'Unpin note' : 'Pin note'}">
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

function loadNotesFromStorage() {
    const savedNotes = localStorage.getItem('dearlock_notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    }
    filteredNotes = [...notes];
}

function saveNotesToStorage() {
    localStorage.setItem('dearlock_notes', JSON.stringify(notes));
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
