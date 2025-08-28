// Dear Lock - Login JavaScript
document.addEventListener('DOMContentLoaded', function() {
  initializeLoginForm();
});

function initializeLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const socialButtons = document.querySelectorAll('.social-btn');
  
  // Form validation
  loginForm.addEventListener('submit', handleLoginSubmit);
  
  // Real-time validation
  emailInput.addEventListener('blur', validateEmail);
  passwordInput.addEventListener('blur', validatePassword);
  
  // Input focus effects
  addInputFocusEffects();
  
  // Social login handlers
  socialButtons.forEach(button => {
    button.addEventListener('click', handleSocialLogin);
  });
  
  // Forgot password handler
  forgotPasswordLink.addEventListener('click', handleForgotPassword);
}

function handleLoginSubmit(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  // Clear previous errors
  clearErrors();
  
  // Validate inputs
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  
  if (!isEmailValid || !isPasswordValid) {
    return;
  }
  
  // Show loading state
  const submitButton = e.target.querySelector('.auth-button');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Signing In...';
  submitButton.disabled = true;
  
  // Simulate login process (replace with actual API call)
  setTimeout(() => {
    // Mock authentication
    if (email === 'demo@dearlock.com' && password === 'demo123') {
      // Set login state in localStorage
      localStorage.setItem('isLoggedIn', 'true');

      showSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        // Redirect to dashboard (will be created later)
        window.location.href = 'dashboard.html';
      }, 1500);
    } else {
      showError('passwordError', 'Invalid email or password. Try demo@dearlock.com / demo123');
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }, 1500);
}

function validateEmail() {
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('emailError');
  const email = emailInput.value.trim();
  
  if (!email) {
    showError('emailError', 'Email is required');
    emailInput.classList.add('error');
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('emailError', 'Please enter a valid email address');
    emailInput.classList.add('error');
    return false;
  }
  
  clearError('emailError');
  emailInput.classList.remove('error');
  return true;
}

function validatePassword() {
  const passwordInput = document.getElementById('password');
  const passwordError = document.getElementById('passwordError');
  const password = passwordInput.value;
  
  if (!password) {
    showError('passwordError', 'Password is required');
    passwordInput.classList.add('error');
    return false;
  }
  
  if (password.length < 6) {
    showError('passwordError', 'Password must be at least 6 characters');
    passwordInput.classList.add('error');
    return false;
  }
  
  clearError('passwordError');
  passwordInput.classList.remove('error');
  return true;
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
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
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

function handleSocialLogin(e) {
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
  
  // Simulate social login (replace with actual OAuth implementation)
  setTimeout(() => {
    alert(`${provider} login will be implemented with backend integration`);
    e.currentTarget.innerHTML = originalContent;
  }, 2000);
}

function handleForgotPassword(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  if (!email) {
    alert('Please enter your email address first');
    document.getElementById('email').focus();
    return;
  }
  
  // Show confirmation
  if (confirm(`Send password reset link to ${email}?`)) {
    alert('Password reset functionality will be implemented with backend integration');
  }
}

// Add Enter key support for form submission
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.activeElement.classList.contains('form-input')) {
    const form = document.getElementById('loginForm');
    form.dispatchEvent(new Event('submit'));
  }
});

// Auto-focus on email input when page loads
window.addEventListener('load', function() {
  setTimeout(() => {
    document.getElementById('email').focus();
  }, 500);
});
