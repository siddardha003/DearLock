// DearLock - Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the application
  initApp();
});

function initApp() {
  // Add smooth animations on load
  animateElements();
  
  // Add interactive effects
  addInteractiveEffects();
  
  // Add floating animation variations
  enhanceFloatingElements();
}

// Navigation functions for index.html
function goToLogin() {
  window.location.href = 'login.html';
}

function goToSignup() {
  window.location.href = 'signup.html';
}

function animateElements() {
  const heroContent = document.querySelector('.hero-content');
  const floatingElements = document.querySelectorAll('.floating-element');
  
  // Stagger the hero content animation
  if (heroContent) {
    setTimeout(() => {
      heroContent.style.opacity = '1';
      heroContent.style.transform = 'translateY(0)';
    }, 300);
  }
  
  // Animate floating elements with random delays
  floatingElements.forEach((element, index) => {
    setTimeout(() => {
      element.style.opacity = '0.1';
      element.style.animation = `float ${6 + index}s ease-in-out infinite`;
    }, (index + 1) * 500);
  });
}

function addInteractiveEffects() {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    // Add ripple effect on click
    button.addEventListener('click', function(e) {
      createRippleEffect(e, this);
    });
    
    // Add hover sound effect (optional)
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-3px)';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
}

function createRippleEffect(event, element) {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.6s ease-out;
    pointer-events: none;
  `;
  
  // Add ripple animation keyframes if not already added
  if (!document.querySelector('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  // Remove ripple after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

function enhanceFloatingElements() {
  const floatingContainer = document.querySelector('.floating-elements');
  
  // Add more dynamic floating elements
  for (let i = 0; i < 3; i++) {
    const element = document.createElement('div');
    element.className = 'floating-element';
    element.style.cssText = `
      width: ${Math.random() * 60 + 40}px;
      height: ${Math.random() * 60 + 40}px;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 6}s;
      animation-duration: ${Math.random() * 4 + 4}s;
    `;
    floatingContainer.appendChild(element);
  }
}

// Add parallax effect on mouse move
document.addEventListener('mousemove', function(e) {
  const floatingElements = document.querySelectorAll('.floating-element');
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;
  
  floatingElements.forEach((element, index) => {
    const speed = (index + 1) * 0.02;
    const x = (mouseX - 0.5) * speed * 100;
    const y = (mouseY - 0.5) * speed * 100;
    
    element.style.transform = `translate(${x}px, ${y}px)`;
  });
});

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
  const buttons = document.querySelectorAll('.btn');
  const focusedElement = document.activeElement;
  const currentIndex = Array.from(buttons).indexOf(focusedElement);
  
  if (e.key === 'ArrowRight' && currentIndex >= 0 && currentIndex < buttons.length - 1) {
    e.preventDefault();
    buttons[currentIndex + 1].focus();
  } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
    e.preventDefault();
    buttons[currentIndex - 1].focus();
  } else if (e.key === 'Enter' && focusedElement.classList.contains('btn')) {
    e.preventDefault();
    focusedElement.click();
  }
});

// Performance optimization: Throttle mousemove events
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}
