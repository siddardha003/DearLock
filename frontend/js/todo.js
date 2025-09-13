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
    this.checkAuthentication();
    this.bindEvents();
  }

  async checkAuthentication() {
    console.log('Checking authentication...');
    try {
      const response = await fetch('../backend/api/auth/me.php', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Not authenticated - redirecting to login');
          this.showNotification('Please log in first');
          setTimeout(() => window.location.href = 'login.html', 1500);
          return false;
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      const result = await response.json();
      if (result.success) {
        console.log('User authenticated:', result.data.username);
        await this.loadTodos();
        this.renderTodos();
        this.updateCounts();
        return true;
      } else {
        this.showNotification('Authentication failed');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return false;
      }
    } catch (error) {
      console.error('Authentication check error:', error);
      this.showNotification('Error checking authentication');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return false;
    }
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
    document.getElementById('todoPriority').value = todo.priority || 'medium';
    document.getElementById('todoDueDate').value = todo.due_date || '';
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
  async saveTodo() {
    const title = document.getElementById('todoTitle').value.trim();
    const priority = document.getElementById('todoPriority')?.value || 'medium';
    const dueDate = document.getElementById('todoDueDate')?.value || null;

    if (!title) {
      alert('Please enter a title for your todo.');
      return;
    }

    const todoData = {
      title,
      priority,
      due_date: dueDate
    };

    try {
      let response;
      if (this.isEditing) {
        // Update existing todo
        todoData.id = this.editingId;
        response = await fetch('../backend/api/todos.php', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(todoData)
        });
      } else {
        // Create new todo
        response = await fetch('../backend/api/todos.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(todoData)
        });
      }

      const result = await response.json();
      
      if (result.success) {
        this.showNotification(this.isEditing ? 'Todo updated!' : 'Todo created!', 'success');
        await this.loadTodos(); // Reload from backend
        this.renderTodos();
        this.updateCounts();
        this.closeModal();
      } else {
        this.showNotification('Error: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error saving todo:', error);
      this.showNotification('Error saving todo', 'error');
    }
  }

  async deleteTodo(todoId) {
    if (confirm('Are you sure you want to delete this todo? This action cannot be undone.')) {
      try {
        const response = await fetch('../backend/api/todos.php', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ id: todoId })
        });

        const result = await response.json();
        
        if (result.success) {
          this.showNotification('Todo deleted!', 'success');
          await this.loadTodos(); // Reload from backend
          this.renderTodos();
          this.updateCounts();
        } else {
          this.showNotification('Error: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('Error deleting todo:', error);
        this.showNotification('Error deleting todo', 'error');
      }
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

  async toggleTodoCompletion(todoId) {
    const todo = this.todos.find(t => t.id == todoId);
    if (!todo) {
      console.error('Todo not found:', todoId);
      return;
    }

    const newCompletionStatus = !todo.is_completed;
    
    try {
      const response = await fetch('../backend/api/todos.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          id: todoId, 
          is_completed: newCompletionStatus
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await this.loadTodos(); // Reload from backend
        this.renderTodos();
        this.updateCounts();
      } else {
        this.showNotification('Error: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error toggling todo completion:', error);
      this.showNotification('Error updating todo', 'error');
    }
  }

  // Legacy method - keeping for compatibility but updated logic
  toggleTask(todoId, taskId) {
    // For backwards compatibility, we'll just toggle the todo completion
    this.toggleTodoCompletion(todoId);
  }

  // Rendering
  renderTodos() {
    console.log('Rendering todos. Total todos:', this.todos.length);
    const filteredTodos = this.getFilteredTodos();
    console.log('Filtered todos:', filteredTodos.length);
    const activeTodos = filteredTodos.filter(todo => !this.isCompletedTodo(todo));
    const completedTodos = filteredTodos.filter(todo => this.isCompletedTodo(todo));
    console.log('Active todos:', activeTodos.length, 'Completed todos:', completedTodos.length);

    // Render active todos
    const activeContainer = document.getElementById('active-todos-container');
    if (activeContainer) {
      if (activeTodos.length === 0) {
        activeContainer.innerHTML = `
          <div class="empty-state" style="text-align: center; padding: 40px;">
            <h3>No active tasks</h3>
            <p>Click the + button to create your first todo!</p>
          </div>
        `;
      } else {
        const activeCards = activeTodos.map(todo => this.createTodoCard(todo, false));
        activeContainer.innerHTML = activeCards.join('');
      }
    }

    // Render completed todos
    const completedContainer = document.getElementById('completed-todos-container');
    const completedSection = document.querySelector('.completed-section');
    if (completedContainer && completedSection) {
      if (completedTodos.length === 0) {
        completedSection.style.display = 'none';
      } else {
        completedSection.style.display = 'block';
        const completedCards = completedTodos.map(todo => this.createTodoCard(todo, true));
        completedContainer.innerHTML = completedCards.join('');
      }
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

  createTodoCard(todo, isCompleted = false) {
    const dueDate = todo.due_date ? this.formatDueDate(todo.due_date) : null;
    const dueDateClass = this.getDueDateClass(todo.due_date);
    
    return `
      <div class="todo-item ${isCompleted ? 'completed' : ''}" data-id="${todo.id}">
        <div class="todo-left">
          <div class="todo-checkbox ${isCompleted ? 'checked' : ''}" onclick="window.todoApp.toggleTodoCompletion(${todo.id})">
            ${isCompleted ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.41 1.41L9 19 21 7l-1.41-1.41z"/></svg>' : ''}
          </div>
          <h3 class="todo-title">${this.escapeHtml(todo.title)}</h3>
        </div>
        
        <div class="todo-right">
          <div class="todo-info">
            ${!isCompleted && dueDate ? `<span class="todo-due-date ${dueDateClass}">${dueDate}</span>` : ''}
            ${!isCompleted ? `<span class="todo-priority ${todo.priority || 'medium'}">${(todo.priority || 'medium').toUpperCase()}</span>` : ''}
          </div>
          <button class="delete-btn" onclick="window.todoApp.deleteTodo(${todo.id})" title="Delete todo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }
  
  formatDueDate(dateString) {
    if (!dateString) return null;
    
    // Try different date parsing approaches to avoid timezone issues
    let date;
    if (dateString.includes('T')) {
      // ISO format with time
      date = new Date(dateString);
    } else {
      // Date only format (YYYY-MM-DD) - avoid timezone issues
      const parts = dateString.split('-');
      if (parts.length === 3) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        date = new Date(dateString);
      }
    }
    
    const now = new Date();
    
    // Normalize dates to compare only the date part, not time
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = dateOnly - nowOnly;
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
        day: 'numeric'
      });
    }
  }
  
  getDueDateClass(dateString) {
    if (!dateString) return '';
    
    // Try different date parsing approaches (same as formatDueDate)
    let date;
    if (dateString.includes('T')) {
      // ISO format with time
      date = new Date(dateString);
    } else {
      // Date only format (YYYY-MM-DD) - avoid timezone issues
      const parts = dateString.split('-');
      if (parts.length === 3) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        date = new Date(dateString);
      }
    }
    
    const now = new Date();
    
    // Normalize dates to compare only the date part, not time
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = dateOnly - nowOnly;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'due-today';
    return '';
  }

  getPriorityColor(priority) {
    switch(priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#999';
    }
  }

  // Remove the old renderTodoSection function since we're using a single container now

  bindCardEvents(container) {
    // Delete buttons
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const todoId = parseInt(btn.closest('.todo-item').dataset.id);
        this.deleteTodo(todoId);
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
        (todo.priority && todo.priority.toLowerCase().includes(this.searchTerm))
      );
    }

    // Apply status filter
    switch (this.currentFilter) {
      case 'in-progress':
        filtered = filtered.filter(todo => !this.isCompletedTodo(todo));
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

  isCompletedTodo(todo) {
    return todo.is_completed === 1 || todo.is_completed === true;
  }

  isTodoOverdue(todo) {
    // Since we removed due_date field, return false for now
    // This method can be removed or modified based on future requirements
    return false;
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
  async loadTodos() {
    console.log('Loading todos from backend...');
    try {
      const response = await fetch('../backend/api/todos.php', {
        method: 'GET',
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('API result:', result);
      
      if (result.success) {
        this.todos = result.data || [];
        console.log('Loaded todos:', this.todos);
      } else {
        console.error('Failed to load todos:', result.message);
        this.showNotification('Failed to load todos: ' + result.message, 'error');
        this.todos = [];
      }
    } catch (error) {
      console.error('Error loading todos:', error);
      this.showNotification('Network error loading todos', 'error');
      this.todos = [];
    }
  }

  saveTodos() {
    // This method is now deprecated since we use backend API
    // Keeping for compatibility but it does nothing
    console.log('saveTodos called - now using backend API instead');
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
