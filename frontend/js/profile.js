// DearLock - Profile JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadProfileData();
    
    // Set up form handlers
    document.getElementById('editProfileForm').addEventListener('submit', handleEditProfile);
    document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
});

async function loadProfileData() {
    try {
        // Get user data from localStorage first
        const user = localStorage.getItem('user');
        if (user) {
            const userData = JSON.parse(user);
            document.getElementById('profileName').textContent = userData.name;
            document.getElementById('profileEmail').textContent = userData.email;
        }
        
        // Then fetch updated data from API
        const response = await fetch('../backend/api/auth/me.php');
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('profileName').textContent = result.user.name;
            document.getElementById('profileEmail').textContent = result.user.email;
            
            // Update localStorage
            localStorage.setItem('user', JSON.stringify(result.user));
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function goBack() {
    window.location.href = 'dashboard.html';
}

function editProfile() {
    // Populate form with current data
    document.getElementById('editName').value = document.getElementById('profileName').textContent;
    document.getElementById('editEmail').value = document.getElementById('profileEmail').textContent;
    
    // Show modal
    document.getElementById('editProfileModal').style.display = 'flex';
}

function changePassword() {
    document.getElementById('changePasswordModal').style.display = 'flex';
}

function selectIcon() {
    alert('Icon selection feature coming soon!');
}

function selectFont() {
    alert('Font selection feature coming soon!');
}

function changeDiaryPin() {
    alert('Change diary PIN feature coming soon!');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Reset forms
    if (modalId === 'editProfileModal') {
        document.getElementById('editProfileForm').reset();
    } else if (modalId === 'changePasswordModal') {
        document.getElementById('changePasswordForm').reset();
    }
}

async function handleEditProfile(e) {
    e.preventDefault();
    
    const name = document.getElementById('editName').value;
    const email = document.getElementById('editEmail').value;
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('../backend/api/auth/me.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                full_name: name,
                email: email
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update display
            document.getElementById('profileName').textContent = name;
            document.getElementById('profileEmail').textContent = email;
            
            // Update localStorage
            const userData = JSON.parse(localStorage.getItem('user'));
            userData.name = name;
            userData.email = email;
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Close modal
            closeModal('editProfileModal');
            showMessage('Profile updated successfully!', 'success');
        } else {
            showMessage(result.message || 'Failed to update profile.', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Connection error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Updating...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('../backend/api/auth/password.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeModal('changePasswordModal');
            showMessage('Password updated successfully!', 'success');
        } else {
            showMessage(result.message || 'Failed to update password.', 'error');
        }
    } catch (error) {
        console.error('Error updating password:', error);
        showMessage('Connection error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        try {
            // Call logout API
            await fetch('../backend/api/auth/logout.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        // Clear local storage
        localStorage.removeItem('user');
        
        // Redirect to home
        window.location.href = 'index.html';
    }
}

function showMessage(message, type) {
    // Remove existing message
    const existingMessage = document.querySelector('.error-message, .success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translateX(-50%)';
    messageDiv.style.zIndex = '1001';
    messageDiv.style.padding = '10px 20px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.backgroundColor = type === 'error' ? '#fee' : '#efe';
    messageDiv.style.border = `1px solid ${type === 'error' ? '#fcc' : '#cfc'}`;
    
    document.body.appendChild(messageDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
});
