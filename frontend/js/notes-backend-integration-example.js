// Notes API Integration Example - Full Working Implementation

// API configuration
const API_BASE = '/DearLock/backend/api';

// Load notes from backend on page load
async function loadNotesFromBackend() {
    try {
        const response = await fetch(`${API_BASE}/notes.php`, {
            method: 'GET',
            credentials: 'include' // Include session cookies
        });
        
        const result = await response.json();
        
        if (result.success) {
            notes = result.data || [];
            renderNotes();
        } else {
            console.error('Failed to load notes:', result.message);
            showNotification('Failed to load notes', 'error');
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        showNotification('Network error loading notes', 'error');
    }
}

// Save note to backend
async function saveNoteToBackend(noteData) {
    try {
        const response = await fetch(`${API_BASE}/notes.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(noteData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Add the new note to local array
            notes.unshift(result.data);
            renderNotes();
            showNotification('Note saved successfully', 'success');
            closeModal();
        } else {
            console.error('Failed to save note:', result.message);
            showNotification('Failed to save note: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving note:', error);
        showNotification('Network error saving note', 'error');
    }
}

// Updated saveNote function to use backend
function saveNote() {
    const title = noteTitleInput?.value?.trim();
    const content = noteTextInput?.value?.trim();
    
    if (!title || !content) {
        showNotification('Please fill in both title and content', 'error');
        return;
    }
    
    const noteData = {
        title: title,
        content: content
    };
    
    // Save to backend instead of localStorage
    saveNoteToBackend(noteData);
}

// Delete note from backend
async function deleteNoteFromBackend(noteId) {
    try {
        const response = await fetch(`${API_BASE}/notes.php/${noteId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Remove from local array
            notes = notes.filter(note => note.id !== noteId);
            renderNotes();
            showNotification('Note deleted successfully', 'success');
        } else {
            console.error('Failed to delete note:', result.message);
            showNotification('Failed to delete note', 'error');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showNotification('Network error deleting note', 'error');
    }
}

// Update existing deleteNote function
function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        deleteNoteFromBackend(noteId);
    }
}

// Initialize notes on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    loadNotesFromBackend(); // Load from backend instead of localStorage
});

// Helper function for notifications
function showNotification(message, type = 'info') {
    // You can implement a toast notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
}