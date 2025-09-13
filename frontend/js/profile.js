// DearLock - Profile JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadProfileData();
    loadProfileIcon();
    
    // Set up form handlers
    document.getElementById('editProfileForm').addEventListener('submit', handleEditProfile);
    document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
    document.getElementById('changeDiaryPinForm').addEventListener('submit', handleChangeDiaryPin);
    document.getElementById('otpVerificationForm').addEventListener('submit', handleOtpVerification);
});

async function loadProfileData() {
    try {
        // Get user data from localStorage first
        const user = localStorage.getItem('user');
        if (user) {
            const userData = JSON.parse(user);
            document.getElementById('profileName').textContent = userData.full_name || userData.name || 'User';
            document.getElementById('profileEmail').textContent = userData.email || '';
        }
        
        // Then fetch updated data from API
        const response = await fetch('../backend/api/auth/me.php', {
            credentials: 'include'
        });
        
        console.log('Profile data response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Not authenticated, redirect to login
                console.log('Not authenticated, redirecting to login');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const userData = result.data;
            document.getElementById('profileName').textContent = userData.full_name || userData.name || 'User';
            document.getElementById('profileEmail').textContent = userData.email || '';
            
            // Update localStorage
            localStorage.setItem('user', JSON.stringify(userData));
        } else {
            console.error('API Error:', result.message);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        // Show fallback data
        document.getElementById('profileName').textContent = 'User';
        document.getElementById('profileEmail').textContent = '';
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
    // Create icon grid
    const iconGrid = document.getElementById('iconGrid');
    const availableIcons = [
        '👤', '😊', '😎', '🤓', '😍', '🥳', '😇', '🤔',
        '🧑‍💻', '👩‍💼', '👨‍💼', '🧑‍🎓', '👩‍🎓', '👨‍🎓', '🧑‍🏫', '👩‍🏫',
        '🧑‍⚕️', '👩‍⚕️', '👨‍⚕️', '🧑‍🎨', '👩‍🎨', '👨‍🎨', '🧑‍🚀', '👩‍🚀',
        '🐱', '🐶', '🐻', '🐨', '🐼', '🦊', '🦁', '🐸'
    ];
    
    const currentIcon = localStorage.getItem('profileIcon') || '👤';
    
    iconGrid.innerHTML = '';
    availableIcons.forEach(icon => {
        const iconElement = document.createElement('div');
        iconElement.className = 'icon-option';
        iconElement.textContent = icon;
        
        if (icon === currentIcon) {
            iconElement.classList.add('selected');
        }
        
        iconElement.addEventListener('click', () => {
            // Remove selected class from all icons
            document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
            // Add selected class to clicked icon
            iconElement.classList.add('selected');
            
            // Save to localStorage
            localStorage.setItem('profileIcon', icon);
            
            // Update profile display
            updateProfileIcon(icon);
            
            // Close modal after short delay
            setTimeout(() => {
                closeModal('iconSelectionModal');
                showMessage('Profile icon updated!', 'success');
            }, 300);
        });
        
        iconGrid.appendChild(iconElement);
    });
    
    // Show modal
    document.getElementById('iconSelectionModal').style.display = 'flex';
}

function updateProfileIcon(icon) {
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        profileAvatar.innerHTML = `<div class="profile-icon-display">${icon}</div>`;
    }
}

function loadProfileIcon() {
    const savedIcon = localStorage.getItem('profileIcon');
    if (savedIcon) {
        updateProfileIcon(savedIcon);
    }
}

function selectFont() {
    alert('Font selection feature coming soon!');
}

function changeDiaryPin() {
    document.getElementById('changeDiaryPinModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Reset forms
    if (modalId === 'editProfileModal') {
        document.getElementById('editProfileForm').reset();
    } else if (modalId === 'changePasswordModal') {
        document.getElementById('changePasswordForm').reset();
    } else if (modalId === 'changeDiaryPinModal') {
        document.getElementById('changeDiaryPinForm').reset();
    } else if (modalId === 'otpVerificationModal') {
        document.getElementById('otpVerificationForm').reset();
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
            credentials: 'include',
            body: JSON.stringify({
                full_name: name,
                email: email
            })
        });
        
        if (!response.ok) {
            // Try to get the error response
            let errorText;
            try {
                const responseText = await response.text();
                // Try to parse as JSON first
                try {
                    const errorResult = JSON.parse(responseText);
                    errorText = errorResult.message || `HTTP ${response.status}`;
                } catch (jsonError) {
                    // If it's not JSON, it might be an HTML error page
                    if (responseText.includes('<br />') || responseText.includes('<b>')) {
                        errorText = 'Server error occurred. Please try again.';
                    } else {
                        errorText = responseText || `HTTP ${response.status}`;
                    }
                }
            } catch (e) {
                errorText = `HTTP ${response.status}`;
            }
            throw new Error(errorText);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Update display
            document.getElementById('profileName').textContent = name;
            document.getElementById('profileEmail').textContent = email;
            
            // Update localStorage
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            userData.full_name = name;
            userData.name = name; // Keep both for compatibility
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
        console.log('Attempting password change...');
        
        const response = await fetch('../backend/api/auth/password.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            // Try to get the error response
            let errorText;
            try {
                const responseText = await response.text();
                // Try to parse as JSON first
                try {
                    const errorResult = JSON.parse(responseText);
                    errorText = errorResult.message || `HTTP ${response.status}`;
                } catch (jsonError) {
                    // If it's not JSON, it might be an HTML error page
                    if (responseText.includes('<br />') || responseText.includes('<b>')) {
                        errorText = 'Server error occurred. Please try again.';
                    } else {
                        errorText = responseText || `HTTP ${response.status}`;
                    }
                }
            } catch (e) {
                errorText = `HTTP ${response.status}`;
            }
            throw new Error(errorText);
        }
        
        const result = await response.json();
        console.log('Success response:', result);
        
        if (result.success) {
            closeModal('changePasswordModal');
            showMessage('Password updated successfully!', 'success');
        } else {
            showMessage(result.message || 'Failed to update password.', 'error');
        }
    } catch (error) {
        console.error('Error updating password:', error);
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            if (error.message.toLowerCase().includes('current password is incorrect')) {
                showMessage('Current password is incorrect.', 'error');
            } else {
                showMessage('Session expired. Please log in again.', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } else {
            showMessage(error.message || 'Connection error. Please try again.', 'error');
        }
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

async function handleChangeDiaryPin(e) {
    e.preventDefault();
    
    const currentPin = document.getElementById('currentPin').value;
    const newPin = document.getElementById('newPin').value;
    const confirmPin = document.getElementById('confirmPin').value;
    
    if (newPin !== confirmPin) {
        showMessage('New PINs do not match.', 'error');
        return;
    }
    
    if (!/^\d{4}$/.test(newPin)) {
        showMessage('PIN must be exactly 4 digits.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Updating...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('../backend/api/auth/change-diary-pin.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                current_pin: currentPin,
                new_pin: newPin,
                confirm_pin: confirmPin
            })
        });
        
        if (!response.ok) {
            let errorText;
            try {
                const responseText = await response.text();
                try {
                    const errorResult = JSON.parse(responseText);
                    errorText = errorResult.message || `HTTP ${response.status}`;
                } catch (jsonError) {
                    if (responseText.includes('<br />') || responseText.includes('<b>')) {
                        errorText = 'Server error occurred. Please try again.';
                    } else {
                        errorText = responseText || `HTTP ${response.status}`;
                    }
                }
            } catch (e) {
                errorText = `HTTP ${response.status}`;
            }
            throw new Error(errorText);
        }
        
        const result = await response.json();
        
        if (result.success) {
            closeModal('changeDiaryPinModal');
            showMessage('Diary PIN updated successfully!', 'success');
        } else {
            showMessage(result.message || 'Failed to update diary PIN.', 'error');
        }
    } catch (error) {
        console.error('Error updating diary PIN:', error);
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            if (error.message.toLowerCase().includes('current pin is incorrect')) {
                showMessage('Current PIN is incorrect.', 'error');
            } else {
                showMessage('Session expired. Please log in again.', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } else {
            showMessage(error.message || 'Connection error. Please try again.', 'error');
        }
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function forgotDiaryPin() {
    // Close current modal
    closeModal('changeDiaryPinModal');
    
    // Show loading message
    showMessage('Sending OTP to your email...', 'success');
    
    try {
        const response = await fetch('../backend/api/auth/send-diary-pin-otp.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            let errorText;
            try {
                const responseText = await response.text();
                try {
                    const errorResult = JSON.parse(responseText);
                    errorText = errorResult.message || `HTTP ${response.status}`;
                } catch (jsonError) {
                    if (responseText.includes('<br />') || responseText.includes('<b>')) {
                        errorText = 'Server error occurred. Please try again.';
                    } else {
                        errorText = responseText || `HTTP ${response.status}`;
                    }
                }
            } catch (e) {
                errorText = `HTTP ${response.status}`;
            }
            throw new Error(errorText);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('OTP sent to your email address!', 'success');
            // Show OTP verification modal
            document.getElementById('otpVerificationModal').style.display = 'flex';
        } else {
            showMessage(result.message || 'Failed to send OTP.', 'error');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        showMessage(error.message || 'Connection error. Please try again.', 'error');
    }
}

async function handleOtpVerification(e) {
    e.preventDefault();
    
    const otpCode = document.getElementById('otpCode').value;
    const newPin = document.getElementById('newPinOtp').value;
    const confirmPin = document.getElementById('confirmPinOtp').value;
    
    if (newPin !== confirmPin) {
        showMessage('New PINs do not match.', 'error');
        return;
    }
    
    if (!/^\d{4}$/.test(newPin)) {
        showMessage('PIN must be exactly 4 digits.', 'error');
        return;
    }
    
    if (!/^\d{6}$/.test(otpCode)) {
        showMessage('OTP must be exactly 6 digits.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Verifying...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('../backend/api/auth/verify-diary-pin-otp.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                otp: otpCode,
                new_pin: newPin,
                confirm_pin: confirmPin
            })
        });
        
        if (!response.ok) {
            let errorText;
            try {
                const responseText = await response.text();
                try {
                    const errorResult = JSON.parse(responseText);
                    errorText = errorResult.message || `HTTP ${response.status}`;
                } catch (jsonError) {
                    if (responseText.includes('<br />') || responseText.includes('<b>')) {
                        errorText = 'Server error occurred. Please try again.';
                    } else {
                        errorText = responseText || `HTTP ${response.status}`;
                    }
                }
            } catch (e) {
                errorText = `HTTP ${response.status}`;
            }
            throw new Error(errorText);
        }
        
        const result = await response.json();
        
        if (result.success) {
            closeModal('otpVerificationModal');
            showMessage('Diary PIN reset successfully!', 'success');
        } else {
            showMessage(result.message || 'Failed to reset diary PIN.', 'error');
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        showMessage(error.message || 'Connection error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function resendOtp() {
    showMessage('Resending OTP...', 'success');
    
    try {
        const response = await fetch('../backend/api/auth/send-diary-pin-otp.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('New OTP sent to your email!', 'success');
        } else {
            showMessage(result.message || 'Failed to resend OTP.', 'error');
        }
    } catch (error) {
        console.error('Error resending OTP:', error);
        showMessage('Connection error. Please try again.', 'error');
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
