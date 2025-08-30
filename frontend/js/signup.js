// Dear Lock - Signup JavaScript
document.addEventListener('DOMContentLoaded', function() {
  initializeSignupForm();
});

function initializeSignupForm() {
  const signupForm = document.getElementById('signupForm');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const socialButtons = document.querySelectorAll('.social-btn');
  
  // Form validation
  signupForm.addEventListener('submit', handleSignupSubmit);
  
  // Real-time validation
  document.getElementById('firstName').addEventListener('blur', validateFirstName);
  document.getElementById('lastName').addEventListener('blur', validateLastName);
  document.getElementById('email').addEventListener('blur', validateEmail);
  passwordInput.addEventListener('input', validatePassword);
  confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
  
  // Password strength indicator
  passwordInput.addEventListener('input', updatePasswordStrength);
  
  // Input focus effects
  addInputFocusEffects();
  
  // Social signup handlers
  socialButtons.forEach(button => {
    button.addEventListener('click', handleSocialSignup);
  });
  
  // Terms and privacy links
  document.getElementById('termsLink').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Terms of Service will be displayed here');
  });
  
  document.getElementById('privacyLink').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Privacy Policy will be displayed here');
  });
}

function handleSignupSubmit(e) {
  e.preventDefault();
  
  // Clear previous errors
  clearErrors();
  
  // Validate all inputs
  const validations = [
    validateFirstName(),
    validateLastName(),
    validateEmail(),
    validatePassword(),
    validateConfirmPassword(),
    validateTerms()
  ];
  
  const isFormValid = validations.every(validation => validation);
  
  if (!isFormValid) {
    return;
  }
  
  // Show loading state
  const submitButton = e.target.querySelector('.auth-button');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Creating Account...';
  submitButton.disabled = true;
  
  // Simulate signup process (replace with actual API call)
  setTimeout(() => {
    const formData = getFormData();
    
    // Mock successful registration
    showSuccess('Account created successfully! Welcome to Dear Lock!');
    
    setTimeout(() => {
      // Redirect to login or dashboard
      window.location.href = 'login.html';
    }, 2000);
  }, 2000);
}

function getFormData() {
  return {
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
    newsletter: document.getElementById('newsletter').checked
  };
}

function validateFirstName() {
  const input = document.getElementById('firstName');
  const error = document.getElementById('firstNameError');
  const value = input.value.trim();
  
  if (!value) {
    showError('firstNameError', 'First name is required');
    input.classList.add('error');
    return false;
  }
  
  if (value.length < 2) {
    showError('firstNameError', 'First name must be at least 2 characters');
    input.classList.add('error');
    return false;
  }
  
  clearError('firstNameError');
  input.classList.remove('error');
  return true;
}

function validateLastName() {
  const input = document.getElementById('lastName');
  const error = document.getElementById('lastNameError');
  const value = input.value.trim();
  
  if (!value) {
    showError('lastNameError', 'Last name is required');
    input.classList.add('error');
    return false;
  }
  
  if (value.length < 2) {
    showError('lastNameError', 'Last name must be at least 2 characters');
    input.classList.add('error');
    return false;
  }
  
  clearError('lastNameError');
  input.classList.remove('error');
  return true;
}

function validateEmail() {
  const input = document.getElementById('email');
  const error = document.getElementById('emailError');
  const value = input.value.trim();
  
  if (!value) {
    showError('emailError', 'Email is required');
    input.classList.add('error');
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    showError('emailError', 'Please enter a valid email address');
    input.classList.add('error');
    return false;
  }
  
  clearError('emailError');
  input.classList.remove('error');
  return true;
}

function validatePassword() {
  const input = document.getElementById('password');
  const error = document.getElementById('passwordError');
  const value = input.value;
  
  if (!value) {
    showError('passwordError', 'Password is required');
    input.classList.add('error');
    return false;
  }
  
  if (value.length < 8) {
    showError('passwordError', 'Password must be at least 8 characters');
    input.classList.add('error');
    return false;
  }
  
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumbers = /\d/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    showError('passwordError', 'Password must contain uppercase, lowercase, and numbers');
    input.classList.add('error');
    return false;
  }
  
  clearError('passwordError');
  input.classList.remove('error');
  return true;
}

function validateConfirmPassword() {
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');
  const error = document.getElementById('confirmPasswordError');
  
  const password = passwordInput.value;
  const confirmPassword = confirmInput.value;
  
  if (!confirmPassword) {
    showError('confirmPasswordError', 'Please confirm your password');
    confirmInput.classList.add('error');
    return false;
  }
  
  if (password !== confirmPassword) {
    showError('confirmPasswordError', 'Passwords do not match');
    confirmInput.classList.add('error');
    return false;
  }
  
  clearError('confirmPasswordError');
  confirmInput.classList.remove('error');
  return true;
}

function validateTerms() {
  const termsCheckbox = document.getElementById('terms');
  
  if (!termsCheckbox.checked) {
    alert('Please accept the Terms of Service and Privacy Policy to continue');
    termsCheckbox.focus();
    return false;
  }
  
  return true;
}

function updatePasswordStrength() {
  const password = document.getElementById('password').value;
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');
  
  let strength = 0;
  let strengthLabel = '';
  
  if (password.length === 0) {
    strength = 0;
    strengthLabel = 'Password strength';
  } else if (password.length < 6) {
    strength = 1;
    strengthLabel = 'Weak';
  } else {
    strength = 2; // Fair by default for 6+ characters
    strengthLabel = 'Fair';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length;
    
    if (password.length >= 8 && criteriaCount >= 3) {
      strength = 3;
      strengthLabel = 'Good';
    }
    
    if (password.length >= 12 && criteriaCount === 4) {
      strength = 4;
      strengthLabel = 'Strong';
    }
  }
  
  // Update strength indicator
  const strengthClasses = ['', 'weak', 'fair', 'good', 'strong'];
  
  strengthFill.className = 'strength-fill';
  strengthText.className = 'strength-text';
  
  if (strength > 0) {
    strengthFill.classList.add(strengthClasses[strength]);
    strengthText.classList.add(strengthClasses[strength]);
  }
  
  strengthText.textContent = strengthLabel;
}

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.opacity = '1';
  }
}

function clearError(elementId) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.opacity = '0';
  }
}

function clearErrors() {
  const errorElements = document.querySelectorAll('.error-message');
  const inputElements = document.querySelectorAll('.form-input');
  
  errorElements.forEach(element => {
    element.textContent = '';
    element.style.opacity = '0';
  });
  
  inputElements.forEach(element => {
    element.classList.remove('error');
  });
}

function showSuccess(message) {
  // Create success notification
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: var(--bg-gradient-yellow-1);
    color: var(--eerie-black-1);
    padding: 1rem 2rem;
    border-radius: var(--radius-16);
    box-shadow: var(--shadow-2);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    font-weight: 600;
    max-width: 300px;
  `;
  
  // Add animation styles if not already added
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Remove notification after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

function addInputFocusEffects() {
  const inputs = document.querySelectorAll('.form-input');
  
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.style.transform = 'translateY(-2px)';
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.style.transform = 'translateY(0)';
    });
  });
}

function handleSocialSignup(e) {
  e.preventDefault();
  const provider = e.currentTarget.id.includes('google') ? 'Google' : 'GitHub';
  
  // Show loading state
  const originalContent = e.currentTarget.innerHTML;
  e.currentTarget.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite;">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    </svg>
    Connecting...
  `;
  
  // Add spin animation
  if (!document.querySelector('#spin-styles')) {
    const style = document.createElement('style');
    style.id = 'spin-styles';
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Simulate social signup (replace with actual OAuth implementation)
  setTimeout(() => {
    alert(`${provider} signup will be implemented with backend integration`);
    e.currentTarget.innerHTML = originalContent;
  }, 2000);
}

// Auto-focus on first name input when page loads
window.addEventListener('load', function() {
  setTimeout(() => {
    document.getElementById('firstName').focus();
  }, 500);
});
