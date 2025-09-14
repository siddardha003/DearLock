// DearLock Main JavaScript File
// Handles navigation and general functionality

/**
 * Navigate to login page
 */
function goToLogin() {
    window.location.href = 'login.html';
}

/**
 * Navigate to signup page
 */
function goToSignup() {
    window.location.href = 'signup.html';
}

/**
 * Load and apply user's font preference
 */
function loadUserFontPreference() {
    try {
        const user = localStorage.getItem('user');
        if (user) {
            const userData = JSON.parse(user);
            const fontFamily = userData.font_family || 'inter';
            applyFont(fontFamily);
        }
    } catch (error) {
        console.error('Error loading font preference:', error);
        // Apply default font if error
        applyFont('inter');
    }
}

/**
 * Apply font to the entire page
 */
function applyFont(fontFamily) {
    // Remove all existing font classes
    document.body.classList.remove('font-inter', 'font-handwritten', 'font-calligraphy');
    
    // Apply the selected font class
    switch(fontFamily) {
        case 'inter':
            document.body.classList.add('font-inter');
            break;
        case 'handwritten':
            document.body.classList.add('font-handwritten');
            break;
        case 'calligraphy':
            document.body.classList.add('font-calligraphy');
            break;
        default:
            document.body.classList.add('font-inter');
    }
}

/**
 * Initialize main page functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Load user font preference on every page
    loadUserFontPreference();
    
    console.log('DearLock main page initialized');
});