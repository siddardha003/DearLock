// Todo List Application JavaScript
class TodoApp {
  constructor() {
    this.todos = [];
    this.currentTheme = 'default';
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.isEditing = false;
    this.editingId = null;
    
    // Initialize the app
    this.init();
  }

  init() {
    this.loadTodos();
    this.bindEvents();
    this.renderTodos();
    this.updateCounts();
  }

  // Event Binding
  bindEvents() {
    // Profile dropdown toggle
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    if (profileBtn && profileDropdown) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
      });

      document.addEventListener('click', () => {
        profileDropdown.classList.remove('active');
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to sign out?')) {
          localStorage.removeItem('isLoggedIn');
          window.location.href = 'login.html';
        }
      });
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.renderTodos();
      });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.renderTodos();
      });
    });

    // View toggle
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle) {
      viewToggle.addEventListener('click', () => {
        const todoGrid = document.querySelector('.todo-grid');
        todoGrid.classList.toggle('list-view');
      });
    }

    // Floating add button
    const addTodoBtn = document.getElementById('addTodoBtn');
    if (addTodoBtn) {
      addTodoBtn.addEventListener('click', () => {
        this.openModal();
      });
    }

    // Modal events
    this.bindModalEvents();
  }

  bindModalEvents() {
    const modalOverlay = document.getElementById('todo-modal');
    const todoForm = document.getElementById('todoForm');

    // Close modal on overlay click
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeModal();
        }
      });
    }

    // Form submission
    if (todoForm) {
      todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveTodo();
      });
    }
  }

  // Modal Management
  openModal(todoId = null) {
    const modalOverlay = document.getElementById('todo-modal');
    const modalTitle = document.querySelector('#todo-modal h3');
    
    console.log('Opening modal...', { modalOverlay, modalTitle }); // Debug log
    
    if (!modalOverlay) {
      console.error('Modal overlay not found!');
      return;
    }
    
    if (todoId) {
      this.isEditing = true;
      this.editingId = todoId;
      if (modalTitle) {
        modalTitle.textContent = 'Edit To-Do List';
      }
      this.populateModalWithTodo(todoId);
    } else {
      this.isEditing = false;
      this.editingId = null;
      if (modalTitle) {
        modalTitle.textContent = 'Add New Todo';
      }
      this.resetModal();
    }

    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus on title input
    setTimeout(() => {
      const titleInput = document.getElementById('todoTitle');
      if (titleInput) titleInput.focus();
    }, 100);
  }

  closeModal() {
    const modalOverlay = document.getElementById('todo-modal');
    if (modalOverlay) modalOverlay.classList.remove('show');
    document.body.style.overflow = 'auto';
    this.resetModal();
  }

  resetModal() {
    // Reset form fields that actually exist in the HTML
    const titleInput = document.getElementById('todoTitle');
    const prioritySelect = document.getElementById('todoPriority');
    
    if (titleInput) titleInput.value = '';
    if (prioritySelect) prioritySelect.value = 'medium';
    
    // Reset the form completely
    const form = document.getElementById('todoForm');
    if (form) form.reset();
  }

  populateModalWithTodo(todoId) {
    const todo = this.todos.find(t => t.id === todoId);
    if (!todo) return;

    document.getElementById('todoTitle').value = todo.title;
    document.getElementById('todoDescription').value = todo.description || '';
    document.getElementById('dueDate').value = todo.dueDate || '';

    // Set theme
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-theme="${todo.theme}"]`).classList.add('active');
    this.currentTheme = todo.theme;

    // Populate tasks
    this.resetTasks();
    todo.tasks.forEach((task, index) => {
      if (index === 0) {
        document.querySelector('.task-input').value = task.text;
      } else {
        this.addTaskInput(task.text);
      }
    });
  }

  resetTasks() {
    const tasksContainer = document.getElementById('tasksContainer');
    tasksContainer.innerHTML = `
      <div class="task-input-item">
        <input type="text" placeholder="Enter task..." class="task-input">
        <button type="button" class="remove-task-btn" style="display: none;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    `;
  }

  addTaskInput(taskText = '') {
    const tasksContainer = document.getElementById('tasksContainer');
    const taskItem = document.createElement('div');
    taskItem.className = 'task-input-item';
    taskItem.innerHTML = `
      <input type="text" placeholder="Enter task..." class="task-input" value="${taskText}">
      <button type="button" class="remove-task-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    `;

    const removeBtn = taskItem.querySelector('.remove-task-btn');
    removeBtn.addEventListener('click', () => {
      taskItem.remove();
      this.updateRemoveButtons();
    });

    tasksContainer.appendChild(taskItem);
    this.updateRemoveButtons();

    // Focus on the new input
    if (!taskText) {
      taskItem.querySelector('.task-input').focus();
    }
  }

  updateRemoveButtons() {
    const taskItems = document.querySelectorAll('.task-input-item');
    taskItems.forEach((item, index) => {
      const removeBtn = item.querySelector('.remove-task-btn');
      removeBtn.style.display = taskItems.length > 1 ? 'flex' : 'none';
    });
  }

  // Todo Management
  saveTodo() {
    const title = document.getElementById('todoTitle').value.trim();
    const description = document.getElementById('todoDescription').value.trim();
    const dueDate = document.getElementById('dueDate').value;

    if (!title) {
      alert('Please enter a title for your to-do list.');
      return;
    }

    // Collect tasks
    const taskInputs = document.querySelectorAll('.task-input');
    const tasks = Array.from(taskInputs)
      .map(input => input.value.trim())
      .filter(text => text)
      .map(text => ({
        id: Date.now() + Math.random(),
        text,
        completed: false
      }));

    if (tasks.length === 0) {
      alert('Please add at least one task.');
      return;
    }

    const todoData = {
      id: this.isEditing ? this.editingId : Date.now(),
      title,
      description,
      dueDate,
      theme: this.currentTheme,
      tasks,
      createdAt: this.isEditing ? this.todos.find(t => t.id === this.editingId).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.isEditing) {
      const index = this.todos.findIndex(t => t.id === this.editingId);
      this.todos[index] = todoData;
    } else {
      this.todos.unshift(todoData);
    }

    this.saveTodos();
    this.renderTodos();
    this.updateCounts();
    this.closeModal();
    
    // Show success message
    this.showNotification(this.isEditing ? 'To-do list updated!' : 'To-do list created!', 'success');
  }

  deleteTodo(todoId) {
    if (confirm('Are you sure you want to delete this to-do list? This action cannot be undone.')) {
      this.todos = this.todos.filter(todo => todo.id !== todoId);
      this.saveTodos();
      this.renderTodos();
      this.updateCounts();
      this.showNotification('To-do list deleted!', 'success');
    }
  }

  duplicateTodo(todoId) {
    const todo = this.todos.find(t => t.id === todoId);
    if (!todo) return;

    const duplicatedTodo = {
      ...todo,
      id: Date.now(),
      title: `${todo.title} (Copy)`,
      tasks: todo.tasks.map(task => ({
        ...task,
        id: Date.now() + Math.random(),
        completed: false
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.todos.unshift(duplicatedTodo);
    this.saveTodos();
    this.renderTodos();
    this.updateCounts();
    this.showNotification('To-do list duplicated!', 'success');
  }

  toggleTask(todoId, taskId) {
    console.log('toggleTask called with:', { todoId, taskId });
    
    const todo = this.todos.find(t => t.id === todoId);
    if (!todo) {
      console.error('Todo not found:', todoId);
      return;
    }

    const task = todo.tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId, 'Available tasks:', todo.tasks.map(t => ({ id: t.id, text: t.text })));
      return;
    }

    console.log('Toggling task:', task.text, 'from', task.completed, 'to', !task.completed);
    task.completed = !task.completed;
    todo.updatedAt = new Date().toISOString();

    this.saveTodos();
    this.renderTodos();
    this.updateCounts();
  }

  // Rendering
  renderTodos() {
    const filteredTodos = this.getFilteredTodos();
    const activeTodos = filteredTodos.filter(todo => !this.isCompletedTodo(todo));
    const completedTodos = filteredTodos.filter(todo => this.isCompletedTodo(todo));

    this.renderTodoSection('activeTodos', activeTodos);
    this.renderTodoSection('completedTodos', completedTodos);

    // Show/hide completed section
    const completedSection = document.getElementById('completedSection');
    if (completedSection) {
      completedSection.style.display = completedTodos.length > 0 ? 'block' : 'none';
    }
  }

  renderTodoSection(containerId, todos) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (todos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M10,17L5,12L6.41,10.58L10,14.17L17.59,6.58L19,8M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z"/>
          </svg>
          <h3>No ${containerId === 'activeTodos' ? 'active' : 'completed'} to-do lists</h3>
          <p>${containerId === 'activeTodos' ? 'Create your first to-do list to get started!' : 'Complete some tasks to see them here.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = todos.map(todo => this.createTodoCard(todo)).join('');

    // Bind card events
    this.bindCardEvents(container);
  }

  createTodoCard(todo) {
    const progress = this.calculateProgress(todo);
    const isOverdue = this.isTodoOverdue(todo);
    const completedTasks = todo.tasks.filter(t => t.completed).length;
    const totalTasks = todo.tasks.length;
    const dueDateDisplay = todo.dueDate ? this.formatDueDate(todo.dueDate) : null;

    return `
      <div class="todo-card theme-${todo.theme}" data-id="${todo.id}">
        <div class="todo-card-header">
          <h3 class="todo-title">${this.escapeHtml(todo.title)}</h3>
          <div class="todo-actions">
            <button class="action-btn edit-btn" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button class="action-btn duplicate-btn" title="Duplicate">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            </button>
            <button class="action-btn delete-btn" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        </div>

        ${todo.description ? `<p class="todo-description">${this.escapeHtml(todo.description)}</p>` : ''}

        <div class="todo-progress">
          <div class="progress-info">
            <span class="progress-text">${completedTasks}/${totalTasks} tasks completed</span>
            <span class="progress-percentage">${progress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>

        ${dueDateDisplay ? `
          <div class="todo-due-date ${isOverdue ? 'overdue' : ''}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
            </svg>
            ${dueDateDisplay}
          </div>
        ` : ''}

        <div class="task-preview">
          ${todo.tasks.slice(0, 3).map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
              <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}"></div>
              <span class="task-text">${this.escapeHtml(task.text)}</span>
            </div>
          `).join('')}
          ${todo.tasks.length > 3 ? `
            <div class="task-item">
              <span class="task-text" style="font-style: italic; opacity: 0.7;">
                +${todo.tasks.length - 3} more tasks...
              </span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  bindCardEvents(container) {
    // Edit buttons
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const todoId = parseInt(btn.closest('.todo-card').dataset.id);
        this.openModal(todoId);
      });
    });

    // Delete buttons
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const todoId = parseInt(btn.closest('.todo-card').dataset.id);
        this.deleteTodo(todoId);
      });
    });

    // Duplicate buttons
    container.querySelectorAll('.duplicate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const todoId = parseInt(btn.closest('.todo-card').dataset.id);
        this.duplicateTodo(todoId);
      });
    });

    // Task checkboxes
    container.querySelectorAll('.task-checkbox').forEach(checkbox => {
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        const todoId = parseInt(checkbox.closest('.todo-card').dataset.id);
        const taskId = parseFloat(checkbox.dataset.taskId);
        
        // Debug logging
        console.log('Checkbox clicked - todoId:', todoId, 'taskId:', taskId);
        
        this.toggleTask(todoId, taskId);
      });
    });

    // Card click to edit
    container.querySelectorAll('.todo-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.todo-actions') && !e.target.closest('.task-checkbox')) {
          const todoId = parseInt(card.dataset.id);
          this.openModal(todoId);
        }
      });
    });
  }

  // Utility Functions
  getFilteredTodos() {
    let filtered = this.todos;

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(todo => 
        todo.title.toLowerCase().includes(this.searchTerm) ||
        todo.description.toLowerCase().includes(this.searchTerm) ||
        todo.tasks.some(task => task.text.toLowerCase().includes(this.searchTerm))
      );
    }

    // Apply status filter
    switch (this.currentFilter) {
      case 'in-progress':
        filtered = filtered.filter(todo => !this.isCompletedTodo(todo) && this.calculateProgress(todo) > 0);
        break;
      case 'completed':
        filtered = filtered.filter(todo => this.isCompletedTodo(todo));
        break;
      case 'overdue':
        filtered = filtered.filter(todo => this.isTodoOverdue(todo) && !this.isCompletedTodo(todo));
        break;
      // 'all' shows everything
    }

    return filtered;
  }

  calculateProgress(todo) {
    if (todo.tasks.length === 0) return 0;
    const completedTasks = todo.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / todo.tasks.length) * 100);
  }

  isCompletedTodo(todo) {
    return todo.tasks.length > 0 && todo.tasks.every(task => task.completed);
  }

  isTodoOverdue(todo) {
    if (!todo.dueDate) return false;
    const dueDate = new Date(todo.dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return dueDate < now;
  }

  formatDueDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  updateCounts() {
    const activeCount = document.getElementById('activeCount');
    const completedCount = document.getElementById('completedCount');

    if (activeCount) {
      const activeTodos = this.todos.filter(todo => !this.isCompletedTodo(todo));
      activeCount.textContent = activeTodos.length;
    }

    if (completedCount) {
      const completedTodos = this.todos.filter(todo => this.isCompletedTodo(todo));
      completedCount.textContent = completedTodos.length;
    }
  }

  // Data Management
  loadTodos() {
    try {
      const saved = localStorage.getItem('dearLockTodos');
      this.todos = saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading todos:', error);
      this.todos = [];
    }
  }

  saveTodos() {
    try {
      localStorage.setItem('dearLockTodos', JSON.stringify(this.todos));
    } catch (error) {
      console.error('Error saving todos:', error);
      this.showNotification('Error saving data. Please try again.', 'error');
    }
  }

  // Utility Functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'error' ? 'var(--bittersweet-shimmer)' : 'var(--vegas-gold)',
      color: 'var(--eerie-black-1)',
      padding: '1rem 1.5rem',
      borderRadius: 'var(--radius-10)',
      boxShadow: 'var(--shadow-2)',
      zIndex: '10000',
      fontSize: 'var(--fs-5)',
      fontWeight: 'var(--fw-500)',
      maxWidth: '300px',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease'
    });

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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Todo App
  window.todoApp = new TodoApp();
});

// Global functions for HTML onclick handlers
function closeTodoModal() {
  if (window.todoApp) {
    window.todoApp.closeModal();
  }
}

// Handle page visibility change to update overdue status
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.todoApp) {
    window.todoApp.renderTodos();
    window.todoApp.updateCounts();
  }
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TodoApp;
}
