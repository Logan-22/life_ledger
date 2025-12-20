// API Base URL
const API_BASE = window.location.origin;
let authToken = null;
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// ==================== Authentication ====================

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authMessage').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authMessage').style.display = 'none';
}

async function register() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    
    if (!username || !email || !password) {
        showMessage('authMessage', 'All fields are required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showApp();
        } else {
            showMessage('authMessage', data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('authMessage', 'Network error: ' + error.message, 'error');
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showMessage('authMessage', 'Username and password are required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showApp();
        } else {
            showMessage('authMessage', data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('authMessage', 'Network error: ' + error.message, 'error');
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    showLogin();
}

function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showApp();
    } else {
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }
}

function showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    
    // Update user info
    document.getElementById('sidebarUsername').textContent = currentUser.username;
    document.getElementById('sidebarEmail').textContent = currentUser.email;
    document.getElementById('welcomeUsername').textContent = currentUser.username;
    
    // Load dashboard data
    loadDashboard();
    
    // Load initial calendar data (since habits tab is active by default)
    loadHabits();
    loadHabitCalendar();
    
    // Load user profile (calorie goal)
    loadUserProfile();
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `message ${type}`;
    el.style.display = 'block';
    
    setTimeout(() => {
        el.style.display = 'none';
    }, 4000);
}

// ==================== Navigation ====================

function navigateTo(view) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    // Update views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    const viewElement = document.getElementById(`${view}View`);
    viewElement.classList.add('active');
    viewElement.style.display = 'block';
    
    // Update title
    const titles = {
        'dashboard': 'Dashboard',
        'personal': 'Personal Tracking',
        'finance': 'Finance'
    };
    document.getElementById('pageTitle').textContent = titles[view];
    
    // Load data for view
    if (view === 'dashboard') {
        loadDashboard();
    } else if (view === 'personal') {
        loadHabits();
        loadDietEntries();
        getDietSummary();
    } else if (view === 'finance') {
        loadFinanceView();
    }
}

function switchTab(tab) {
    // Update tab buttons (but not for detail pages)
    if (tab !== 'habitDetails') {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (event && event.target) {
            event.target.classList.add('active');
        }
    }
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Map tab names to element IDs (handle kebab-case to camelCase)
    const tabIdMap = {
        'habits': 'habitsTab',
        'diet': 'dietTab',
        'manageHabits': 'manageHabitsTab',
        'habitDetails': 'habitDetailsTab'
    };
    
    const tabElement = document.getElementById(tabIdMap[tab] || `${tab}Tab`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Load tab data
    if (tab === 'habits') {
        loadHabits();
        loadHabitCalendar();
    } else if (tab === 'diet') {
        initializeDietDate();
        loadUserProfile();
        loadDietForDate();
    } else if (tab === 'analytics') {
        loadCalorieAnalytics();
    } else if (tab === 'manageHabits') {
        loadManageHabits();
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// ==================== Diet Date Management ====================

function initializeDietDate() {
    const dateInput = document.getElementById('dietDate');
    if (!dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function setDietDateToday() {
    document.getElementById('dietDate').value = new Date().toISOString().split('T')[0];
    loadDietForDate();
}

function changeDietDate(days) {
    const dateInput = document.getElementById('dietDate');
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() + days);
    dateInput.value = currentDate.toISOString().split('T')[0];
    loadDietForDate();
}

function loadDietForDate() {
    loadDietEntries();
    getDietSummary();
}

// ==================== Dashboard ====================

async function loadDashboard() {
    try {
        // Load habits
        const habitsRes = await fetch(`${API_BASE}/api/personal/habits`, {
            headers: getAuthHeaders()
        });
        const habits = await habitsRes.json();
        
        document.getElementById('totalHabits').textContent = habits.length;
        
        // Calculate longest streak
        let longestStreak = 0;
        for (const habit of habits) {
            const detailRes = await fetch(`${API_BASE}/api/personal/habits/${habit.id}`, {
                headers: getAuthHeaders()
            });
            const detail = await detailRes.json();
            if (detail.streak && detail.streak.longest_streak > longestStreak) {
                longestStreak = detail.streak.longest_streak;
            }
        }
        document.getElementById('longestStreak').textContent = longestStreak;
        
        // Load today's diet
        const today = new Date().toISOString().split('T')[0];
        const dietRes = await fetch(`${API_BASE}/api/personal/diet?date=${today}`, {
            headers: getAuthHeaders()
        });
        const dietEntries = await dietRes.json();
        
        document.getElementById('todayMeals').textContent = dietEntries.length;
        
        const totalCals = dietEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
        document.getElementById('todayCalories').textContent = totalCals;
        
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// ==================== Habits ====================

function generateAcronym() {
    const name = document.getElementById('habitName').value.trim();
    const acronymInput = document.getElementById('habitAcronym');
    
    if (!name || acronymInput.value) return; // Don't override if user already typed
    
    const words = name.split(/\s+/);
    let acronym = '';
    
    if (words.length === 1) {
        acronym = name.substring(0, 2).toUpperCase();
    } else {
        acronym = words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
    }
    
    acronymInput.value = acronym;
}

async function createHabit() {
    const name = document.getElementById('habitName').value.trim();
    const acronym = document.getElementById('habitAcronym').value.trim().toUpperCase();
    const description = document.getElementById('habitDesc').value.trim();
    const frequency = document.getElementById('habitFreq').value;
    
    if (!name) {
        alert('Habit name is required');
        return;
    }
    
    if (!acronym) {
        alert('Acronym is required (2-3 characters)');
        return;
    }
    
    if (acronym.length < 2 || acronym.length > 3) {
        alert('Acronym must be 2-3 characters');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/personal/habits`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, acronym, description, frequency, target_count: 1 })
        });
        
        if (response.ok) {
            document.getElementById('habitName').value = '';
            document.getElementById('habitAcronym').value = '';
            document.getElementById('habitDesc').value = '';
            loadHabits();
            loadHabitCalendar();
            loadDashboard();
        } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'Failed to create habit'));
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}

async function loadHabits() {
    try {
        const response = await fetch(`${API_BASE}/api/personal/habits`, {
            headers: getAuthHeaders()
        });
        const habits = await response.json();
        
        const list = document.getElementById('habitsList');
        
        if (habits.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No habits yet. Create your first habit!</p>
                </div>
            `;
        } else {
            list.innerHTML = habits.map(h => `
                <div class="list-item">
                    <div>
                        <div class="item-header">
                            <div class="item-title">${h.name}</div>
                            <div class="item-actions">
                                <button class="btn-small btn-success" onclick="logHabitWithStatus(${h.id}, 'completed')" title="Mark as completed">
                                    <i class="fas fa-check"></i> Complete
                                </button>
                                <button class="btn-small btn-danger" onclick="logHabitWithStatus(${h.id}, 'failed')" title="Mark as failed">
                                    <i class="fas fa-times"></i> Failed
                                </button>
                                <button class="btn-small btn-info" onclick="viewHabitDetails(${h.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        <div class="item-meta">
                            ${h.description || 'No description'} • ${h.frequency}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load habits error:', error);
        document.getElementById('habitsList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading habits</p>
            </div>
        `;
    }
}

async function logHabitCompletion(habitId) {
    // Legacy function - defaults to completed
    await logHabitWithStatus(habitId, 'completed');
}

async function logHabitWithStatus(habitId, status) {
    const notes = prompt(`Add notes (optional):`);
    
    try {
        const response = await fetch(`${API_BASE}/api/personal/habits/${habitId}/log`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                notes: notes || '',
                status: status
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const emoji = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
            const message = status === 'completed' ? 
                `${emoji} Logged as completed! Current streak: ${data.streak.current_streak} days 🔥` :
                status === 'failed' ?
                `${emoji} Logged as failed. Keep trying! 💪` :
                `${emoji} Logged as skipped.`;
            alert(message);
            loadHabits();
            loadHabitCalendar();
            loadDashboard();
        } else {
            alert('Error: ' + (data.error || 'Failed to log habit'));
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}

async function viewHabitDetails(habitId) {
    try {
        const response = await fetch(`${API_BASE}/api/personal/habits/${habitId}`, {
            headers: getAuthHeaders()
        });
        const habit = await response.json();
        
        // Navigate to details page
        switchTab('habitDetails');
        renderHabitDetailsPage(habit);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function renderHabitDetailsPage(habit) {
    const content = document.getElementById('habitDetailsContent');
    
    content.innerHTML = `
        <div class="card">
            <h2 style="margin-bottom: 20px;">
                <i class="fas fa-check-circle" style="color: var(--primary);"></i> 
                ${habit.name}
                <span style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 6px; font-size: 14px; margin-left: 10px; font-weight: 700;">${habit.acronym || 'N/A'}</span>
            </h2>
            
            <div class="detail-section">
                <h4><i class="fas fa-tag"></i> Acronym</h4>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="editAcronym" value="${habit.acronym || ''}" maxlength="3" style="width: 80px; text-transform: uppercase; padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-main); color: var(--text);">
                    <button onclick="updateHabitAcronym(${habit.id})" class="btn-secondary" style="padding: 8px 16px;">
                        <i class="fas fa-save"></i> Update
                    </button>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> Description</h4>
                <p>${habit.description || 'No description provided'}</p>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-calendar-check"></i> Frequency</h4>
                <p>${habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}</p>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-clock"></i> Created</h4>
                <p>${new Date(habit.created_at).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</p>
            </div>
        </div>
        
        <div class="card">
            <h3><i class="fas fa-fire"></i> Streak Statistics</h3>
            
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                <div class="stat-card purple">
                    <i class="fas fa-fire"></i>
                    <div>
                        <h3>${habit.streak.current_streak}</h3>
                        <p>Current Streak</p>
                    </div>
                </div>
                
                <div class="stat-card orange">
                    <i class="fas fa-trophy"></i>
                    <div>
                        <h3>${habit.streak.longest_streak}</h3>
                        <p>Longest Streak</p>
                    </div>
                </div>
                
                <div class="stat-card blue">
                    <i class="fas fa-check"></i>
                    <div>
                        <h3>${habit.total_completions || 0}</h3>
                        <p>Total Logs</p>
                    </div>
                </div>
            </div>
            
            <div class="detail-section" style="margin-top: 20px;">
                <h4><i class="fas fa-calendar-day"></i> Last Completed</h4>
                <p>${habit.streak.last_completed ? 
                    new Date(habit.streak.last_completed).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    }) : 'Never'}</p>
            </div>
        </div>
        
        <div class="card wide">
            <h3><i class="fas fa-history"></i> Recent Activity</h3>
            ${habit.recent_logs && habit.recent_logs.length > 0 ? `
                <div class="activity-list">
                    ${habit.recent_logs.map(log => {
                        const status = log.status || 'completed';
                        const statusConfig = {
                            'completed': { icon: 'fa-check-circle', color: 'var(--green)', label: 'Completed' },
                            'failed': { icon: 'fa-times-circle', color: 'var(--red)', label: 'Failed' },
                            'skipped': { icon: 'fa-forward', color: 'var(--text-secondary)', label: 'Skipped' }
                        };
                        const config = statusConfig[status] || statusConfig['completed'];
                        return `
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fas ${config.icon}" style="color: ${config.color};"></i>
                            </div>
                            <div class="activity-content">
                                <div class="activity-title">${config.label}</div>
                                <div class="activity-time">
                                    ${new Date(log.completed_at).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                ${log.notes ? `<div class="activity-notes">${log.notes}</div>` : ''}
                            </div>
                        </div>
                    `;
                    }).join('')}
                </div>
            ` : '<p style="color: var(--text-secondary);">No activity yet</p>'}
        </div>
        
        <div class="card full-width">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <button onclick="logHabitWithStatus(${habit.id}, 'completed')" class="btn-primary" style="width: 100%;">
                    <i class="fas fa-check"></i> Log as Completed
                </button>
                <button onclick="logHabitWithStatus(${habit.id}, 'failed')" class="btn-danger" style="width: 100%;">
                    <i class="fas fa-times"></i> Log as Failed
                </button>
            </div>
        </div>
    `;
}

async function loadManageHabits() {
    try {
        const response = await fetch(`${API_BASE}/api/personal/habits`, {
            headers: getAuthHeaders()
        });
        const habits = await response.json();
        
        const list = document.getElementById('manageHabitsList');
        
        if (habits.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No habits yet. Go to Habits tab to create one!</p>
                </div>
            `;
        } else {
            list.innerHTML = habits.map(h => `
                <div class="list-item manage-item">
                    <div style="flex: 1;">
                        <div class="item-header">
                            <div class="item-title">${h.name}</div>
                        </div>
                        <div class="item-meta">
                            ${h.description || 'No description'} • ${h.frequency}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn-small btn-info" onclick="viewHabitDetails(${h.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn-small btn-danger" onclick="deleteHabit(${h.id}, '${h.name.replace(/'/g, "\\'")}'})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load manage habits error:', error);
        document.getElementById('manageHabitsList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading habits</p>
            </div>
        `;
    }
}

async function updateHabitAcronym(habitId) {
    const acronym = document.getElementById('editAcronym').value.trim().toUpperCase();
    
    if (!acronym) {
        alert('Acronym is required');
        return;
    }
    
    if (acronym.length < 2 || acronym.length > 3) {
        alert('Acronym must be 2-3 characters');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/personal/habits/${habitId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ acronym })
        });
        
        if (response.ok) {
            alert('✅ Acronym updated successfully!');
            viewHabitDetails(habitId); // Reload the page
            loadHabits();
            loadHabitCalendar();
        } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'Failed to update acronym'));
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}

async function deleteHabit(habitId, habitName) {
    if (!confirm(`Are you sure you want to delete "${habitName}"? This will also delete all logs for this habit.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/personal/habits/${habitId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            alert('✅ Habit deleted successfully!');
            loadManageHabits();
            loadHabits();
            loadHabitCalendar();
            loadDashboard();
        } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'Failed to delete habit'));
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}

// ==================== Habit Calendar ====================

let currentCalendarDate = new Date();
let allHabits = [];
let visibleHabitIds = new Set();
const habitColors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#feca57', '#48dbfb'];

async function loadHabitCalendar() {
    try {
        // Fetch all habits
        const response = await fetch(`${API_BASE}/api/personal/habits`, {
            headers: getAuthHeaders()
        });
        allHabits = await response.json();
        
        // Initialize visible habits (all checked by default)
        if (visibleHabitIds.size === 0) {
            allHabits.forEach(habit => visibleHabitIds.add(habit.id));
        }
        
        // Render habit filters
        renderHabitFilters();
        
        // Render calendar
        await renderCalendar();
        
        // Calculate combined streak
        await calculateCombinedStreak();
    } catch (error) {
        console.error('Calendar load error:', error);
    }
}

function renderHabitFilters() {
    const filtersContainer = document.getElementById('habitFilters');
    
    if (allHabits.length === 0) {
        filtersContainer.innerHTML = '<p style="color: var(--text-secondary); margin: 0;">No habits yet. Create one to start tracking!</p>';
        return;
    }
    
    filtersContainer.innerHTML = allHabits.map((habit, index) => {
        const color = habitColors[index % habitColors.length];
        const isChecked = visibleHabitIds.has(habit.id);
        
        return `
            <div class="habit-filter-item">
                <input type="checkbox" 
                       id="habit-filter-${habit.id}" 
                       ${isChecked ? 'checked' : ''}
                       onchange="toggleHabitVisibility(${habit.id})">
                <span class="habit-color-dot" style="background: ${color};"></span>
                <label for="habit-filter-${habit.id}">${habit.name}</label>
            </div>
        `;
    }).join('');
}

function toggleHabitVisibility(habitId) {
    if (visibleHabitIds.has(habitId)) {
        visibleHabitIds.delete(habitId);
    } else {
        visibleHabitIds.add(habitId);
    }
    renderCalendar();
    calculateCombinedStreak();
}

async function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();
    
    // Fetch all habit logs for the month
    const habitLogs = await fetchMonthHabitLogs(year, month);
    
    // Build calendar HTML
    let calendarHTML = '';
    
    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        calendarHTML += `<div class="calendar-day other-month">
            <div class="calendar-date">${prevMonthLastDay - i}</div>
        </div>`;
    }
    
    // Current month days
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    for (let day = 1; day <= daysInMonth; day++) {
        // Create date string directly to avoid timezone issues
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        
        const dayHabits = habitLogs[dateStr] || {};
        const visibleHabits = allHabits.filter(h => visibleHabitIds.has(h.id));
        
        let habitsHTML = '';
        const completedCount = visibleHabits.filter(h => dayHabits[h.id] === 'completed').length;
        const failedCount = visibleHabits.filter(h => dayHabits[h.id] === 'failed').length;
        
        visibleHabits.forEach((habit, index) => {
            const color = habitColors[index % habitColors.length];
            const status = dayHabits[habit.id];
            const acronym = habit.acronym || habit.name.substring(0, 2).toUpperCase();
            
            if (status === 'completed') {
                habitsHTML += `<div class="calendar-habit-badge" 
                                   style="background: ${color}; box-shadow: 0 2px 6px ${color}40;"
                                   title="${habit.name} ✓">
                    ${acronym}
                </div>`;
            } else if (status === 'failed') {
                habitsHTML += `<div class="calendar-habit-badge failed" 
                                   style="background: #ef4444; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4); text-decoration: line-through;"
                                   title="${habit.name} ✗ Failed">
                    ${acronym}
                </div>`;
            } else if (status === 'skipped') {
                habitsHTML += `<div class="calendar-habit-badge skipped" 
                                   style="background: #6b7280; box-shadow: 0 2px 6px rgba(107, 114, 128, 0.3);"
                                   title="${habit.name} ⊘ Skipped">
                    ${acronym}
                </div>`;
            }
        });
        
        // Show incomplete habits (no log entry) as outline badges
        visibleHabits.forEach((habit, index) => {
            const color = habitColors[index % habitColors.length];
            const status = dayHabits[habit.id];
            const acronym = habit.acronym || habit.name.substring(0, 2).toUpperCase();
            
            if (!status) {
                habitsHTML += `<div class="calendar-habit-badge outline" 
                                   style="border-color: ${color}; color: ${color};"
                                   title="${habit.name}">
                    ${acronym}
                </div>`;
            }
        });
        
        // Calculate completion percentage
        const completionPercentage = visibleHabits.length > 0 ? 
            (completedCount / visibleHabits.length) * 100 : 0;
        
        // Determine background color based on completion percentage
        let bgColor = '';
        let bgGradient = '';
        
        if (completionPercentage === 100) {
            // All completed - Gold/Achievement color
            bgGradient = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
            bgColor = 'rgba(255, 215, 0, 0.15)';
        } else if (completionPercentage >= 75) {
            // 75-99% - Bright Green
            bgGradient = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
            bgColor = 'rgba(16, 185, 129, 0.12)';
        } else if (completionPercentage >= 50) {
            // 50-74% - Light Green
            bgGradient = 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)';
            bgColor = 'rgba(59, 130, 246, 0.1)';
        } else if (completionPercentage >= 25) {
            // 25-49% - Orange/Yellow
            bgGradient = 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)';
            bgColor = 'rgba(245, 158, 11, 0.08)';
        } else if (completionPercentage > 0) {
            // 1-24% - Light Red/Pink
            bgGradient = 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
            bgColor = 'rgba(239, 68, 68, 0.08)';
        } else {
            // 0% - Very subtle gray
            bgGradient = 'none';
            bgColor = 'transparent';
        }
        
        // Show completion indicator with gradient
        const completionIndicator = completedCount > 0 ? 
            `<div class="calendar-completion" style="background: ${bgGradient};">
                ${completedCount}/${visibleHabits.length}
            </div>` : '';
        
        calendarHTML += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="openDayLog('${dateStr}')" oncontextmenu="event.preventDefault(); openEditLogsModal('${dateStr}'); return false;" style="cursor: pointer; background: ${bgColor};" title="Click to log | Right-click to edit | ${Math.round(completionPercentage)}% complete">
            <div class="calendar-date">${day}</div>
            ${completionIndicator}
            <div class="calendar-habits">${habitsHTML}</div>
        </div>`;
    }
    
    // Next month days
    const remainingDays = 42 - (startDay + daysInMonth); // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
        calendarHTML += `<div class="calendar-day other-month">
            <div class="calendar-date">${day}</div>
        </div>`;
    }
    
    document.getElementById('habitCalendar').innerHTML = calendarHTML;
}

async function fetchMonthHabitLogs(year, month) {
    const logs = {};
    
    try {
        for (const habit of allHabits) {
            if (!visibleHabitIds.has(habit.id)) continue;
            
            const response = await fetch(`${API_BASE}/api/personal/habits/${habit.id}`, {
                headers: getAuthHeaders()
            });
            const habitData = await response.json();
            
            // Process recent logs - store status information
            habitData.recent_logs.forEach(log => {
                const logDate = new Date(log.completed_at);
                if (logDate.getFullYear() === year && logDate.getMonth() === month) {
                    const dateStr = logDate.toISOString().split('T')[0];
                    if (!logs[dateStr]) logs[dateStr] = {};
                    // Store status: completed, failed, or skipped
                    logs[dateStr][habit.id] = log.status || 'completed';
                }
            });
        }
    } catch (error) {
        console.error('Error fetching habit logs:', error);
    }
    
    return logs;
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
    calculateCombinedStreak();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
    calculateCombinedStreak();
}

async function openDayLog(dateStr) {
    if (allHabits.length === 0) {
        alert('No habits found. Create a habit first!');
        return;
    }
    
    // Parse date string to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    // Show modal
    openHabitLogModal(dateStr, formattedDate);
}

async function openHabitLogModal(dateStr, formattedDate) {
    document.getElementById('logDate').value = formattedDate;
    document.getElementById('logDate').dataset.dateStr = dateStr;
    document.getElementById('logNotes').value = '';
    
    // Fetch existing logs for this date to pre-check habits
    const loggedHabits = {}; // { habitId: { status: 'completed'/'failed', logId: X } }
    try {
        const logs = await Promise.all(
            allHabits.map(async habit => {
                const response = await fetch(`${API_BASE}/api/personal/habits/${habit.id}`, {
                    headers: getAuthHeaders()
                });
                const data = await response.json();
                
                // Check if habit was logged on this date
                const log = data.recent_logs.find(log => {
                    const logDate = new Date(log.completed_at).toISOString().split('T')[0];
                    return logDate === dateStr;
                });
                
                if (log) {
                    loggedHabits[habit.id] = { status: log.status || 'completed', logId: log.id };
                }
                return log ? habit.id : null;
            })
        );
    } catch (error) {
        console.error('Error fetching existing logs:', error);
    }
    
    // Store initially logged habits for comparison later
    document.getElementById('habitLogModal').dataset.initiallyLogged = JSON.stringify(loggedHabits);
    
    // Populate habit items with status buttons
    const checkboxList = document.getElementById('habitCheckboxList');
    checkboxList.innerHTML = allHabits.map((habit) => {
        const log = loggedHabits[habit.id];
        const isLogged = !!log;
        const status = log?.status || 'completed';
        
        return `
            <div class="habit-log-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 10px; background: var(--bg-primary);">
                <div style="flex: 1;">
                    <label style="font-weight: 500; color: var(--text-primary);">${habit.name}</label>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button type="button" class="habit-status-btn ${isLogged && status === 'completed' ? 'active' : ''}" 
                            onclick="selectHabitStatus('${habit.id}', 'completed')" 
                            data-habit-id="${habit.id}" 
                            data-status="completed"
                            style="padding: 8px 12px; border-radius: 6px; border: 2px solid var(--green); background: ${isLogged && status === 'completed' ? 'var(--green)' : 'transparent'}; color: ${isLogged && status === 'completed' ? 'white' : 'var(--green)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                        <i class="fas fa-check"></i> Complete
                    </button>
                    <button type="button" class="habit-status-btn ${isLogged && status === 'failed' ? 'active' : ''}" 
                            onclick="selectHabitStatus('${habit.id}', 'failed')" 
                            data-habit-id="${habit.id}" 
                            data-status="failed"
                            style="padding: 8px 12px; border-radius: 6px; border: 2px solid var(--red); background: ${isLogged && status === 'failed' ? 'var(--red)' : 'transparent'}; color: ${isLogged && status === 'failed' ? 'white' : 'var(--red)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                        <i class="fas fa-times"></i> Failed
                    </button>
                    <button type="button" class="habit-status-btn ${isLogged ? '' : 'active'}" 
                            onclick="selectHabitStatus('${habit.id}', 'none')" 
                            data-habit-id="${habit.id}" 
                            data-status="none"
                            style="padding: 8px 12px; border-radius: 6px; border: 2px solid var(--text-secondary); background: ${!isLogged ? 'var(--text-secondary)' : 'transparent'}; color: ${!isLogged ? 'white' : 'var(--text-secondary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                        <i class="fas fa-ban"></i> None
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('habitLogModal').classList.add('active');
}

function closeHabitLogModal() {
    document.getElementById('habitLogModal').classList.remove('active');
}

function selectHabitStatus(habitId, status) {
    // Store the selected status for this habit
    if (!window.habitStatusMap) {
        window.habitStatusMap = {};
    }
    window.habitStatusMap[habitId] = status;
    
    // Update button styles
    const buttons = document.querySelectorAll(`[data-habit-id="${habitId}"]`);
    buttons.forEach(btn => {
        btn.style.background = 'transparent';
        btn.style.color = btn.dataset.status === 'completed' ? 'var(--green)' : 
                          btn.dataset.status === 'failed' ? 'var(--red)' : 'var(--text-secondary)';
    });
    
    // Highlight selected button
    if (status !== 'none') {
        const selectedBtn = document.querySelector(`[data-habit-id="${habitId}"][data-status="${status}"]`);
        if (selectedBtn) {
            selectedBtn.style.background = status === 'completed' ? 'var(--green)' : 
                                          status === 'failed' ? 'var(--red)' : 'transparent';
            selectedBtn.style.color = status === 'completed' || status === 'failed' ? 'white' : 'var(--text-secondary)';
        }
    }
}

async function submitHabitLog() {
    const dateStr = document.getElementById('logDate').dataset.dateStr;
    const notes = document.getElementById('logNotes').value.trim();
    
    // Get initially logged habits
    const initiallyLogged = JSON.parse(document.getElementById('habitLogModal').dataset.initiallyLogged || '{}');
    
    // Get currently selected statuses from the status map
    const habitStatusMap = window.habitStatusMap || {};
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each habit
    for (const habit of allHabits) {
        const currentStatus = habitStatusMap[habit.id];
        const previousLog = initiallyLogged[habit.id];
        
        // If status is 'none', delete any existing log
        if (currentStatus === 'none' || currentStatus === undefined) {
            if (previousLog) {
                try {
                    const deleteResponse = await fetch(`${API_BASE}/api/personal/habits/logs/${previousLog.logId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                    
                    if (deleteResponse.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error(`Error removing habit ${habit.id}:`, error);
                    errorCount++;
                }
            }
        } else if (currentStatus === 'completed' || currentStatus === 'failed') {
            // If there's an existing log with a different status, delete it first
            if (previousLog && previousLog.status !== currentStatus) {
                try {
                    await fetch(`${API_BASE}/api/personal/habits/logs/${previousLog.logId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                } catch (error) {
                    console.error(`Error removing old log for habit ${habit.id}:`, error);
                }
            }
            
            // If no existing log or status changed, create a new one
            if (!previousLog || previousLog.status !== currentStatus) {
                try {
                    const response = await fetch(`${API_BASE}/api/personal/habits/${habit.id}/log`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ 
                            completed_at: `${dateStr}T12:00:00`,
                            notes: notes || '',
                            status: currentStatus
                        })
                    });
                    
                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error(`Error logging habit ${habit.id}:`, error);
                    errorCount++;
                }
            } else {
                // Already has the correct status, just update notes if needed
                successCount++;
            }
        }
    }
    
    // Clear the status map for next use
    window.habitStatusMap = {};
    
    // Show result message
    if (successCount > 0 || errorCount > 0) {
        closeHabitLogModal();
        await renderCalendar();
        await calculateCombinedStreak();
        loadHabits();
        loadDashboard();
        
        showMotivationModal(`Updated ${successCount} habit(s) for this date`);
    }
}

async function showMotivationModal(message) {
    document.getElementById('motivationMessage').textContent = message;
    
    // Fallback quotes (use immediately)
    const fallbackQuotes = [
        { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { content: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { content: "The future depends on what you do today.", author: "Mahatma Gandhi" },
        { content: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
        { content: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
        { content: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
        { content: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
        { content: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" }
    ];
    
    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    document.getElementById('quoteText').textContent = randomQuote.content;
    document.getElementById('quoteAuthor').textContent = randomQuote.author;
    
    // Show modal
    document.getElementById('motivationModal').classList.add('active');
    
    // Try to fetch from API in background (optional enhancement)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
        
        const response = await fetch('https://api.quotable.io/random?tags=inspirational|motivational|success', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('quoteText').textContent = data.content;
            document.getElementById('quoteAuthor').textContent = data.author;
        }
    } catch (error) {
        // Silently fail and keep the fallback quote - no error logging needed
    }
}

function closeMotivationModal() {
    document.getElementById('motivationModal').classList.remove('active');
}

async function openEditLogsModal(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    document.getElementById('editLogDate').value = formattedDate;
    
    // Fetch logs for this date
    try {
        const logs = await Promise.all(
            allHabits.map(async habit => {
                const response = await fetch(`${API_BASE}/api/personal/habits/${habit.id}`, {
                    headers: getAuthHeaders()
                });
                const data = await response.json();
                
                // Filter logs for this specific date
                const dateLogs = data.recent_logs.filter(log => {
                    const logDate = new Date(log.completed_at).toISOString().split('T')[0];
                    return logDate === dateStr;
                });
                
                return dateLogs.map(log => ({ ...log, habitName: habit.name, habitId: habit.id }));
            })
        );
        
        const allLogs = logs.flat();
        
        const logsList = document.getElementById('existingLogsList');
        
        if (allLogs.length === 0) {
            logsList.innerHTML = `
                <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                    <i class="fas fa-info-circle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>No logs for this date</p>
                    <p style="font-size: 14px; margin-top: 8px;">Click on a date to add new logs</p>
                </div>
            `;
        } else {
            logsList.innerHTML = allLogs.map(log => `
                <div class="log-item">
                    <div class="log-item-content">
                        <div class="log-item-title">
                            <i class="fas fa-check-circle" style="color: var(--green);"></i> 
                            ${log.habitName}
                        </div>
                        ${log.notes ? `<div class="log-item-notes">📝 ${log.notes}</div>` : ''}
                    </div>
                    <div class="log-item-actions">
                        <button class="btn-small btn-danger" onclick="deleteHabitLog(${log.id}, '${log.habitName.replace(/'/g, "\\'")}'})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        document.getElementById('editLogsModal').classList.add('active');
    } catch (error) {
        console.error('Error loading logs:', error);
        alert('Failed to load logs');
    }
}

function closeEditLogsModal() {
    document.getElementById('editLogsModal').classList.remove('active');
}

async function deleteHabitLog(logId, habitName) {
    if (!confirm(`Delete log for "${habitName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/personal/habits/logs/${logId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            alert('✅ Log deleted successfully');
            closeEditLogsModal();
            await renderCalendar();
            await calculateCombinedStreak();
            loadHabits();
            loadDashboard();
        } else {
            alert('❌ Failed to delete log');
        }
    } catch (error) {
        console.error('Error deleting log:', error);
        alert('Network error');
    }
}

async function calculateCombinedStreak() {
    if (visibleHabitIds.size === 0) {
        document.getElementById('combinedStreakDisplay').innerHTML = 
            '<p style="color: var(--text-secondary); text-align: center; margin: 0;">Select habits to see combined streak</p>';
        return;
    }
    
    try {
        // Fetch all habit data for visible habits
        const habitDataPromises = Array.from(visibleHabitIds).map(async habitId => {
            const response = await fetch(`${API_BASE}/api/personal/habits/${habitId}`, {
                headers: getAuthHeaders()
            });
            return response.json();
        });
        
        const habitsData = await Promise.all(habitDataPromises);
        
        // Build a map of dates to habit IDs that were COMPLETED on each date
        const dateToHabitsMap = {};
        habitsData.forEach(habit => {
            habit.recent_logs.forEach(log => {
                // Only count logs with 'completed' status (ignore failed/skipped)
                if (log.status !== 'completed' && log.status !== undefined) {
                    return; // Skip non-completed statuses
                }
                const dateStr = new Date(log.completed_at).toISOString().split('T')[0];
                if (!dateToHabitsMap[dateStr]) {
                    dateToHabitsMap[dateStr] = new Set();
                }
                dateToHabitsMap[dateStr].add(habit.id);
            });
        });
        
        // Filter to only include dates where ALL selected habits were completed
        const strictCompletionDates = [];
        const selectedHabitCount = visibleHabitIds.size;
        
        for (const [dateStr, completedHabitIds] of Object.entries(dateToHabitsMap)) {
            // Check if all selected habits were completed on this date
            let allCompleted = true;
            for (const habitId of visibleHabitIds) {
                if (!completedHabitIds.has(habitId)) {
                    allCompleted = false;
                    break;
                }
            }
            if (allCompleted) {
                strictCompletionDates.push(dateStr);
            }
        }
        
        // Sort dates in descending order (most recent first)
        const sortedDates = strictCompletionDates.sort().reverse();
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        if (sortedDates.length > 0) {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            
            // Check if streak is still active (all habits completed today or yesterday)
            if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
                currentStreak = 1;
                let checkDate = new Date(sortedDates[0] + 'T12:00:00');
                
                for (let i = 1; i < sortedDates.length; i++) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    const expectedDate = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                    
                    if (sortedDates[i] === expectedDate) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
            
            // Calculate longest streak
            tempStreak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const prevDate = new Date(sortedDates[i - 1] + 'T12:00:00');
                const currDate = new Date(sortedDates[i] + 'T12:00:00');
                const dayDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
                
                if (dayDiff === 1) {
                    tempStreak++;
                    longestStreak = Math.max(longestStreak, tempStreak);
                } else {
                    tempStreak = 1;
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak);
        }
        
        const totalDaysAllCompleted = strictCompletionDates.length;
        
        // Display combined streak
        const selectedHabitNames = habitsData.map(h => h.name).join(', ');
        const streakMode = visibleHabitIds.size > 1 ? 'ALL habits completed' : 'Habit completed';
        
        document.getElementById('combinedStreakDisplay').innerHTML = `
            <div style="display: flex; justify-content: space-around; align-items: center; padding: 15px; background: var(--bg-secondary); border-radius: 12px;">
                <div style="text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: var(--primary);">${currentStreak} 🔥</div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-top: 5px;">Current Streak</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: var(--secondary);">${longestStreak} 🏆</div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-top: 5px;">Longest Streak</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${totalDaysAllCompleted}</div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-top: 5px;">Total Days</div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 10px; font-size: 12px; color: var(--text-secondary);">
                <strong>Tracking:</strong> ${selectedHabitNames}<br>
                <em>Strict Mode: Counting days where ${streakMode}</em>
            </div>
        `;
    } catch (error) {
        console.error('Error calculating combined streak:', error);
    }
}

// ==================== Diet ====================

// Store search results globally
let foodSearchResults = [];

async function lookupNutrition() {
    const foodName = document.getElementById('foodItem').value.trim();
    
    if (!foodName) {
        showMessage('nutritionMessage', 'Food name is required', 'error');
        return;
    }
    
    showMessage('nutritionMessage', 'Searching for food...', 'success');
    
    // Hide results container
    document.getElementById('foodResultsContainer').style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/api/personal/diet/lookup`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ food_name: foodName })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success && data.results && data.results.length > 0) {
            // Store results
            foodSearchResults = data.results;
            
            // Populate dropdown
            const dropdown = document.getElementById('foodResults');
            dropdown.innerHTML = '';
            
            data.results.forEach((item, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${item.food_name} (${item.serving_size}${item.serving_type}) - ${item.calories} cal`;
                dropdown.appendChild(option);
            });
            
            // Show results container
            document.getElementById('foodResultsContainer').style.display = 'block';
            document.getElementById('foodResultsInfo').textContent = 
                `Found ${data.total_results} results. Select one to fill nutrition data.`;
            showMessage('nutritionMessage', 
                `✅ Found ${data.results.length} matching items! Select one below.`, 'success');
                
            // Auto-select first item
            selectFoodItem();
        } else {
            showMessage('nutritionMessage', 
                '⚠️ No results found. Please try a different search term or enter values manually.', 'error');
        }
    } catch (error) {
        showMessage('nutritionMessage', 'Network error: ' + error.message, 'error');
    }
}

function selectFoodItem() {
    const dropdown = document.getElementById('foodResults');
    const selectedIndex = dropdown.value;
    
    if (selectedIndex === '' || !foodSearchResults[selectedIndex]) return;
    
    const item = foodSearchResults[selectedIndex];
    const quantity = parseFloat(document.getElementById('quantity').value) || 1;
    
    // Calculate nutrition based on quantity (API returns per serving)
    const multiplier = quantity;
    
    // Fill in the form with selected item data
    document.getElementById('foodItem').value = item.food_name;
    document.getElementById('calories').value = Math.round(item.calories * multiplier);
    document.getElementById('protein').value = (item.protein * multiplier).toFixed(2);
    document.getElementById('carbs').value = (item.carbs * multiplier).toFixed(2);
    document.getElementById('fats').value = (item.fats * multiplier).toFixed(2);
    document.getElementById('sugar').value = (item.sugar * multiplier).toFixed(2);
    document.getElementById('fiber').value = (item.fiber * multiplier).toFixed(2);
    document.getElementById('saturatedFat').value = (item.saturated_fat * multiplier).toFixed(2);
    document.getElementById('unsaturatedFat').value = (item.unsaturated_fat * multiplier).toFixed(2);
    document.getElementById('calcium').value = (item.calcium * multiplier).toFixed(2);
    document.getElementById('iron').value = (item.iron * multiplier).toFixed(2);
    document.getElementById('magnesium').value = (item.magnesium * multiplier).toFixed(2);
    document.getElementById('sodium').value = (item.sodium * multiplier).toFixed(2);
    document.getElementById('potassium').value = (item.potassium * multiplier).toFixed(2);
    
    // Update unit to match serving type
    document.getElementById('unit').value = item.serving_type || 'serving';
    
    showMessage('nutritionMessage', 
        `✅ Selected: ${item.food_name} (Source: ${item.source})`, 'success');
}

async function createDietEntry() {
    const foodItem = document.getElementById('foodItem').value.trim();
    const quantity = parseFloat(document.getElementById('quantity').value) || null;
    const unit = document.getElementById('unit').value;
    const mealType = document.getElementById('mealType').value;
    const calories = parseInt(document.getElementById('calories').value) || null;
    const protein = parseFloat(document.getElementById('protein').value) || null;
    const carbs = parseFloat(document.getElementById('carbs').value) || null;
    const fats = parseFloat(document.getElementById('fats').value) || null;
    const sugar = parseFloat(document.getElementById('sugar').value) || null;
    const fiber = parseFloat(document.getElementById('fiber').value) || null;
    const saturatedFat = parseFloat(document.getElementById('saturatedFat').value) || null;
    const unsaturatedFat = parseFloat(document.getElementById('unsaturatedFat').value) || null;
    const calcium = parseFloat(document.getElementById('calcium').value) || null;
    const iron = parseFloat(document.getElementById('iron').value) || null;
    const magnesium = parseFloat(document.getElementById('magnesium').value) || null;
    const sodium = parseFloat(document.getElementById('sodium').value) || null;
    const potassium = parseFloat(document.getElementById('potassium').value) || null;
    
    if (!foodItem) {
        showMessage('nutritionMessage', 'Food item is required', 'error');
        return;
    }
    
    try {
        const dateInput = document.getElementById('dietDate');
        const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
        
        const response = await fetch(`${API_BASE}/api/personal/diet`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                food_item: foodItem, 
                quantity, 
                unit,
                meal_type: mealType, 
                calories, 
                protein, 
                carbs, 
                fats,
                sugar,
                fiber,
                saturated_fat: saturatedFat,
                unsaturated_fat: unsaturatedFat,
                calcium,
                iron,
                magnesium,
                sodium,
                potassium,
                date: selectedDate
            })
        });
        
        if (response.ok) {
            // Clear form
            document.getElementById('foodItem').value = '';
            document.getElementById('quantity').value = '100';
            document.getElementById('calories').value = '';
            document.getElementById('protein').value = '';
            document.getElementById('carbs').value = '';
            document.getElementById('fats').value = '';
            document.getElementById('sugar').value = '';
            document.getElementById('fiber').value = '';
            document.getElementById('saturatedFat').value = '';
            document.getElementById('unsaturatedFat').value = '';
            document.getElementById('calcium').value = '';
            document.getElementById('iron').value = '';
            document.getElementById('magnesium').value = '';
            document.getElementById('sodium').value = '';
            document.getElementById('potassium').value = '';
            
            showMessage('nutritionMessage', 'Food logged successfully!', 'success');
            loadDietEntries();
            getDietSummary();
            loadDashboard();
        } else {
            const data = await response.json();
            showMessage('nutritionMessage', data.error || 'Failed to log food', 'error');
        }
    } catch (error) {
        showMessage('nutritionMessage', 'Network error: ' + error.message, 'error');
    }
}

async function loadDietEntries() {
    try {
        const dateInput = document.getElementById('dietDate');
        const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_BASE}/api/personal/diet?date=${selectedDate}`, {
            headers: getAuthHeaders()
        });
        const entries = await response.json();
        
        const list = document.getElementById('dietList');
        
        if (entries.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <p>No food logged today</p>
                </div>
            `;
        } else {
            list.innerHTML = '<h4 style="margin: 20px 0 12px 0;">Today\'s Meals</h4>' +
                entries.map(e => `
                <div class="list-item">
                    <div>
                        <div class="item-header">
                            <div class="item-title">${e.food_item}</div>
                            <span class="streak-badge">${e.meal_type}</span>
                        </div>
                        <div class="item-meta">
                            ${e.quantity ? e.quantity + ' ' + (e.unit || 'g') : ''} • 
                            ${e.calories || 0} cal • 
                            ${e.protein || 0}g protein • 
                            ${e.carbs || 0}g carbs • 
                            ${e.fats || 0}g fats
                        </div>
                    </div>
                    <button class="btn-danger" onclick="deleteDietEntry(${e.id})" style="padding: 8px 12px; font-size: 14px;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load diet error:', error);
    }
}

async function getDietSummary() {
    try {
        const dateInput = document.getElementById('dietDate');
        const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_BASE}/api/personal/diet/summary?date=${selectedDate}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        console.log('Diet Summary Data:', data);
        console.log('Selected Date:', selectedDate);
        
        const calorieGoal = data.calorie_goal || 2000;
        const caloriePercentage = data.calorie_percentage || 0;
        const totalCalories = data.total_calories || 0;
        
        // Update calorie progress bar
        const progressSection = document.getElementById('calorieProgressSection');
        const progressBar = document.getElementById('calorieProgressBar');
        const progressText = document.getElementById('calorieProgressText');
        
        progressSection.style.display = 'block';
        progressText.textContent = `${totalCalories} / ${calorieGoal} cal (${caloriePercentage}%)`;
        
        const progressWidth = Math.min(caloriePercentage, 100);
        progressBar.style.width = `${progressWidth}%`;
        
        // Change color if over goal
        if (caloriePercentage > 100) {
            progressBar.setAttribute('data-over', 'true');
        } else {
            progressBar.removeAttribute('data-over');
        }
        
        const stats = document.getElementById('nutritionStats');
        stats.innerHTML = `
            <div class="nutrition-stat">
                <div class="value">${totalCalories}</div>
                <div class="label">Calories</div>
            </div>
            <div class="nutrition-stat">
                <div class="value">${data.total_protein || 0}g</div>
                <div class="label">Protein</div>
            </div>
            <div class="nutrition-stat">
                <div class="value">${data.total_carbs || 0}g</div>
                <div class="label">Carbs</div>
            </div>
            <div class="nutrition-stat">
                <div class="value">${data.total_fats || 0}g</div>
                <div class="label">Fats</div>
            </div>
            <div class="nutrition-stat">
                <div class="value">${data.total_entries || 0}</div>
                <div class="label">Entries</div>
            </div>
        `;
        
        // Update detailed nutrients
        document.getElementById('todaySugar').textContent = `${data.total_sugar || 0}g`;
        document.getElementById('todayFiber').textContent = `${data.total_fiber || 0}g`;
        document.getElementById('todaySaturatedFat').textContent = `${data.total_saturated_fat || 0}g`;
        document.getElementById('todayUnsaturatedFat').textContent = `${data.total_unsaturated_fat || 0}g`;
        document.getElementById('todayCalcium').textContent = `${data.total_calcium || 0}mg`;
        document.getElementById('todayIron').textContent = `${data.total_iron || 0}mg`;
        document.getElementById('todayMagnesium').textContent = `${data.total_magnesium || 0}mg`;
        document.getElementById('todaySodium').textContent = `${data.total_sodium || 0}mg`;
        document.getElementById('todayPotassium').textContent = `${data.total_potassium || 0}mg`;
    } catch (error) {
        console.error('Diet summary error:', error);
    }
}

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/api/personal/profile`, {
            headers: getAuthHeaders()
        });
        const profile = await response.json();
        
        // Set calorie goal in modal input
        const modalInput = document.getElementById('calorieGoalModalInput');
        if (modalInput) {
            modalInput.value = profile.calorie_goal || 2000;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function openCalorieGoalModal() {
    // Load current value
    loadUserProfile();
    document.getElementById('calorieGoalModal').style.display = 'flex';
}

function closeCalorieGoalModal() {
    document.getElementById('calorieGoalModal').style.display = 'none';
}

async function saveCalorieGoal() {
    const calorieGoal = parseInt(document.getElementById('calorieGoalModalInput').value);
    
    if (!calorieGoal || calorieGoal < 500 || calorieGoal > 10000) {
        alert('Please enter a valid calorie goal between 500 and 10000');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/personal/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ calorie_goal: calorieGoal })
        });
        
        if (response.ok) {
            closeCalorieGoalModal();
            showMessage('nutritionMessage', 'Calorie goal updated successfully!', 'success');
            await getDietSummary(); // Refresh to show new goal
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to update calorie goal');
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}

function toggleDetailedNutrients() {
    const content = document.getElementById('detailedNutrientsContent');
    const toggle = document.getElementById('detailedNutrientsToggle');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Detailed Nutrients';
        toggle.classList.add('expanded');
    } else {
        content.style.display = 'none';
        toggle.innerHTML = '<i class="fas fa-chevron-down"></i> Show Detailed Nutrients';
        toggle.classList.remove('expanded');
    }
}

async function deleteDietEntry(entryId) {
    if (!confirm('Are you sure you want to delete this food entry?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/personal/diet/${entryId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showMessage('nutritionMessage', 'Entry deleted successfully!', 'success');
            loadDietEntries();
            getDietSummary();
            loadDashboard();
        } else {
            const data = await response.json();
            showMessage('nutritionMessage', data.error || 'Failed to delete entry', 'error');
        }
    } catch (error) {
        showMessage('nutritionMessage', 'Network error: ' + error.message, 'error');
    }
}


// ==================== Analytics ====================

let calorieChart = null;

async function loadCalorieAnalytics() {
    try {
        const days = document.getElementById('analyticsRange').value;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days) + 1);
        
        // Get user profile for calorie goal
        const profileResponse = await fetch(`${API_BASE}/api/personal/profile`, {
            headers: getAuthHeaders()
        });
        const profile = await profileResponse.json();
        const calorieGoal = profile.calorie_goal || 2000;
        
        // Fetch diet data for date range
        const dateData = [];
        const promises = [];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            promises.push(
                fetch(`${API_BASE}/api/personal/diet/summary?date=${dateStr}`, {
                    headers: getAuthHeaders()
                }).then(res => res.json()).then(data => ({
                    date: dateStr,
                    calories: data.total_calories || 0
                }))
            );
        }
        
        const results = await Promise.all(promises);
        results.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate statistics
        const totalCalories = results.reduce((sum, day) => sum + day.calories, 0);
        const avgCalories = Math.round(totalCalories / results.length);
        const daysWithData = results.filter(day => day.calories > 0).length;
        const daysOnTarget = results.filter(day => day.calories > 0 && day.calories <= calorieGoal).length;
        const daysOverTarget = results.filter(day => day.calories > calorieGoal).length;
        
        // Calculate current streak (consecutive days on target)
        let currentStreak = 0;
        for (let i = results.length - 1; i >= 0; i--) {
            if (results[i].calories > 0 && results[i].calories <= calorieGoal) {
                currentStreak++;
            } else if (results[i].calories > 0) {
                break;
            }
        }
        
        // Update statistics
        document.getElementById('avgCalories').textContent = avgCalories + ' cal';
        document.getElementById('daysOnTarget').textContent = `${daysOnTarget} / ${daysWithData} days`;
        document.getElementById('daysOverTarget').textContent = `${daysOverTarget} days`;
        document.getElementById('calorieStreak').textContent = `${currentStreak} days`;
        
        // Prepare chart data
        const labels = results.map(r => {
            const date = new Date(r.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const calories = results.map(r => r.calories);
        
        // Destroy existing chart if it exists
        if (calorieChart) {
            calorieChart.destroy();
        }
        
        // Create chart
        const ctx = document.getElementById('calorieChart').getContext('2d');
        calorieChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Calories Consumed',
                        data: calories,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#1e3a8a',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Calorie Goal',
                        data: Array(labels.length).fill(calorieGoal),
                        borderColor: '#fbbf24',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#e5e7eb',
                            font: {
                                size: 12,
                                family: "'Inter', sans-serif"
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#e5e7eb',
                        bodyColor: '#e5e7eb',
                        borderColor: '#374151',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += Math.round(context.parsed.y) + ' cal';
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                return value + ' cal';
                            }
                        },
                        grid: {
                            color: 'rgba(75, 85, 99, 0.3)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 11
                            },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            color: 'rgba(75, 85, 99, 0.3)',
                            drawBorder: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        
    } catch (error) {
        console.error('Analytics error:', error);
    }
}

// ==================== Finance Module ====================

let allocationChart = null;

async function loadFinanceView() {
    await loadPortfolioSummary();
    await loadInvestments();
}

async function loadPortfolioSummary() {
    try {
        const response = await fetch('/api/finance/portfolio/summary', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch portfolio summary');
        
        const data = await response.json();
        
        // Update stats
        document.getElementById('totalInvested').textContent = `₹${data.total_invested.toLocaleString()}`;
        document.getElementById('currentValue').textContent = `₹${data.current_value.toLocaleString()}`;
        
        const returnsColor = data.total_returns >= 0 ? '#10b981' : '#ef4444';
        document.getElementById('totalReturns').innerHTML = `<span style="color: ${returnsColor}">₹${data.total_returns.toLocaleString()}</span>`;
        
        const percentColor = data.returns_percent >= 0 ? '#10b981' : '#ef4444';
        document.getElementById('returnsPercent').innerHTML = `<span style="color: ${percentColor}">${data.returns_percent >= 0 ? '+' : ''}${data.returns_percent}%</span>`;
        
        // Draw allocation chart
        if (data.allocation && data.allocation.length > 0) {
            drawAllocationChart(data.allocation);
        }
        
    } catch (error) {
        console.error('Portfolio summary error:', error);
    }
}

function drawAllocationChart(allocation) {
    const ctx = document.getElementById('allocationChart');
    if (!ctx) return;
    
    // Destroy previous chart
    if (allocationChart) {
        allocationChart.destroy();
    }
    
    const labels = allocation.map(a => {
        const name = a.instrument_type.replace('_', ' ').toUpperCase();
        return `${name} (${a.percentage}%)`;
    });
    const values = allocation.map(a => a.current_value);
    
    const colors = [
        'rgba(59, 130, 246, 0.8)',  // Blue
        'rgba(16, 185, 129, 0.8)',  // Green
        'rgba(245, 158, 11, 0.8)',  // Orange
        'rgba(139, 92, 246, 0.8)',  // Purple
        'rgba(236, 72, 153, 0.8)',  // Pink
        'rgba(14, 165, 233, 0.8)',  // Sky
        'rgba(251, 146, 60, 0.8)',  // Amber
        'rgba(168, 85, 247, 0.8)'   // Violet
    ];
    
    allocationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, allocation.length),
                borderColor: '#1f2937',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#d1d5db',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#d1d5db',
                    borderColor: '#4b5563',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `₹${context.parsed.toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
}

async function loadInvestments() {
    try {
        const response = await fetch('/api/finance/investments', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch investments');
        
        const investments = await response.json();
        const container = document.getElementById('investmentsList');
        
        // Show/hide hero section based on investments
        const heroSection = document.querySelector('.finance-hero');
        if (heroSection) {
            heroSection.style.display = investments.length === 0 ? 'block' : 'none';
        }
        
        if (investments.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px; font-size: 15px;">No investments yet. Get started by adding your first investment above!</p>';
            return;
        }
        
        container.innerHTML = investments.map(inv => {
            const returnsSign = inv.returns >= 0 ? '+' : '';
            
            return `
                <div class="investment-card" style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 16px; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                                <h4 style="margin: 0; font-size: 18px; font-weight: 600; font-family: 'Inter', sans-serif;">${inv.instrument_name}</h4>
                                <span style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${inv.instrument_type.replace('_', ' ')}</span>
                                ${inv.symbol ? `<span style="color: var(--text-secondary); font-size: 13px; font-weight: 500;">${inv.symbol}</span>` : ''}
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 20px;">
                                <div>
                                    <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Buy Date</div>
                                    <div style="font-weight: 600; font-size: 15px; font-family: 'Inter', sans-serif;">${new Date(inv.buy_date).toLocaleDateString('en-IN')}</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Quantity</div>
                                    <div style="font-weight: 600; font-size: 15px; font-family: 'Inter', sans-serif;">${inv.quantity}</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Avg Price</div>
                                    <div style="font-weight: 600; font-size: 15px; font-family: 'Inter', sans-serif;">₹${inv.buy_price.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Invested</div>
                                    <div style="font-weight: 600; font-size: 15px; font-family: 'Inter', sans-serif;">₹${inv.total_invested.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Current Value</div>
                                    <div style="font-weight: 600; font-size: 15px; font-family: 'Inter', sans-serif;">₹${(inv.current_value || inv.total_invested).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Returns</div>
                                    <div style="font-weight: 700; font-size: 15px; color: ${inv.returns >= 0 ? '#10b981' : '#ef4444'}; font-family: 'Inter', sans-serif;">
                                        ${returnsSign}₹${inv.returns.toLocaleString()} (${returnsSign}${inv.returns_percent}%)
                                    </div>
                                </div>
                            </div>
                            ${inv.notes ? `<div style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; color: var(--text-secondary); border-left: 3px solid var(--primary);">${inv.notes}</div>` : ''}
                        </div>
                        <div style="display: flex; gap: 8px; margin-left: 20px;">
                            <button onclick="updateInvestmentValue(${inv.id})" class="btn-secondary" style="padding: 10px 14px; font-size: 14px; border-radius: 8px;" title="Update current value">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button onclick="deleteInvestment(${inv.id})" class="btn-danger" style="padding: 10px 14px; font-size: 14px; border-radius: 8px; background: #ef4444; border: none; color: white;" title="Delete investment">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Load investments error:', error);
    }
}

function openAddInvestmentModal() {
    // Set default date to today
    document.getElementById('investmentBuyDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('addInvestmentModal').style.display = 'flex';
    
    // Reset form
    document.getElementById('investmentType').value = 'stock'; // Default to stock
    document.getElementById('investmentSymbol').value = '';
    document.getElementById('investmentName').value = '';
    document.getElementById('investmentQuantity').value = '';
    document.getElementById('investmentBuyPrice').value = '';
    document.getElementById('investmentCurrentPrice').value = '';
    document.getElementById('investmentNotes').value = '';
    document.getElementById('priceStatus').style.display = 'none';
}

function closeAddInvestmentModal() {
    document.getElementById('addInvestmentModal').style.display = 'none';
}

async function fetchStockPrice() {
    let symbol = document.getElementById('investmentSymbol').value.trim().toUpperCase();
    const buyDate = document.getElementById('investmentBuyDate').value;
    const instrumentType = document.getElementById('investmentType').value;
    
    if (!symbol) {
        alert('⚠️ Please enter a stock symbol');
        return;
    }
    
    if (!buyDate) {
        alert('⚠️ Please select a purchase date first');
        return;
    }
    
    // Auto-add suffix based on instrument type if not already present
    if (instrumentType === 'stock' && !symbol.includes('.')) {
        symbol = symbol + '.NS';
        document.getElementById('investmentSymbol').value = symbol;
    } else if (instrumentType === 'mutual_fund' && !symbol.includes('.')) {
        symbol = symbol + '.BO';
        document.getElementById('investmentSymbol').value = symbol;
    }
    
    showPriceStatus('Fetching stock prices from Yahoo Finance...', 'loading');
    document.getElementById('buyPriceLoader').style.display = 'inline';
    document.getElementById('currentPriceLoader').style.display = 'inline';
    
    try {
        const response = await fetch('/api/finance/stock/price', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                symbol: symbol,
                buy_date: buyDate
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('investmentName').value = result.name;
            document.getElementById('investmentBuyPrice').value = result.buy_price;
            document.getElementById('investmentCurrentPrice').value = result.current_price;
            showPriceStatus(`✓ Prices fetched successfully for ${result.name}`, 'success');
        } else {
            // Enable manual entry
            document.getElementById('investmentName').value = symbol;
            document.getElementById('investmentBuyPrice').removeAttribute('readonly');
            document.getElementById('investmentBuyPrice').style.background = 'var(--bg-secondary)';
            document.getElementById('investmentBuyPrice').style.cursor = 'text';
            document.getElementById('investmentCurrentPrice').removeAttribute('readonly');
            document.getElementById('investmentCurrentPrice').style.background = 'var(--bg-secondary)';
            document.getElementById('investmentCurrentPrice').style.cursor = 'text';
            
            // Show appropriate error message
            const errorMsg = result.error || 'Stock not found. Please enter prices manually.';
            if (response.status === 429) {
                showPriceStatus(`⏳ ${errorMsg}`, 'warning');
            } else {
                showPriceStatus(`⚠️ ${errorMsg}`, 'warning');
            }
        }
        
    } catch (error) {
        console.error('Error fetching stock price:', error);
        // Enable manual entry on error
        document.getElementById('investmentBuyPrice').removeAttribute('readonly');
        document.getElementById('investmentBuyPrice').style.background = 'var(--bg-secondary)';
        document.getElementById('investmentBuyPrice').style.cursor = 'text';
        document.getElementById('investmentCurrentPrice').removeAttribute('readonly');
        document.getElementById('investmentCurrentPrice').style.background = 'var(--bg-secondary)';
        document.getElementById('investmentCurrentPrice').style.cursor = 'text';
        showPriceStatus('⚠️ Network error. Please enter prices manually.', 'error');
        document.getElementById('investmentName').value = symbol;
        document.getElementById('investmentBuyPrice').removeAttribute('readonly');
        document.getElementById('investmentBuyPrice').style.background = 'var(--bg-secondary)';
        document.getElementById('investmentBuyPrice').style.cursor = 'text';
        document.getElementById('investmentCurrentPrice').removeAttribute('readonly');
        document.getElementById('investmentCurrentPrice').style.background = 'var(--bg-secondary)';
        document.getElementById('investmentCurrentPrice').style.cursor = 'text';
    } finally {
        document.getElementById('buyPriceLoader').style.display = 'none';
        document.getElementById('currentPriceLoader').style.display = 'none';
    }
}

async function fetchHistoricalPrice() {
    const symbol = document.getElementById('investmentSymbol').value.trim().toUpperCase();
    const buyDate = document.getElementById('investmentBuyDate').value;
    
    if (!symbol || !buyDate) return;
    
    // This would fetch historical price for the buy date
    // For now, it triggers the main fetch function
    await fetchStockPrice();
}

function showPriceStatus(message, type) {
    const statusDiv = document.getElementById('priceStatus');
    const statusText = document.getElementById('priceStatusText');
    
    statusDiv.style.display = 'block';
    statusText.textContent = message;
    
    // Update icon and color based on type
    const icon = statusDiv.querySelector('i');
    icon.className = 'fas ';
    
    if (type === 'success') {
        icon.className += 'fa-check-circle';
        icon.style.color = '#10b981';
    } else if (type === 'error') {
        icon.className += 'fa-exclamation-circle';
        icon.style.color = '#ef4444';
    } else if (type === 'warning') {
        icon.className += 'fa-exclamation-triangle';
        icon.style.color = '#f59e0b';
    } else {
        icon.className += 'fa-spinner fa-spin';
        icon.style.color = 'var(--primary)';
    }
}

async function saveInvestment() {
    const type = document.getElementById('investmentType').value;
    const symbol = document.getElementById('investmentSymbol').value.trim();
    const name = document.getElementById('investmentName').value.trim() || symbol;
    const buyDate = document.getElementById('investmentBuyDate').value;
    const quantity = document.getElementById('investmentQuantity').value;
    const buyPrice = document.getElementById('investmentBuyPrice').value;
    const currentPrice = document.getElementById('investmentCurrentPrice').value;
    const notes = document.getElementById('investmentNotes').value;
    
    // Validation
    if (!type || !symbol || !buyDate || !quantity || !buyPrice) {
        alert('⚠️ Please fill all required fields and fetch prices');
        return;
    }
    
    try {
        const investmentData = {
            instrument_type: type,
            instrument_name: name,
            symbol: symbol,
            buy_date: buyDate,
            quantity: parseFloat(quantity),
            buy_price: parseFloat(buyPrice),
            notes: notes
        };
        
        if (currentPrice) {
            investmentData.current_price = parseFloat(currentPrice);
            investmentData.current_value = parseFloat(quantity) * parseFloat(currentPrice);
        }
        
        const response = await fetch('/api/finance/investments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(investmentData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add investment');
        }
        
        alert('✅ Investment added successfully!');
        closeAddInvestmentModal();
        loadFinanceView();
        
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
        console.error('Add investment error:', error);
    }
}

async function updateInvestmentValue(investmentId) {
    const currentPrice = prompt('Enter current price per unit (₹):');
    
    if (!currentPrice || isNaN(currentPrice)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/finance/investments/${investmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ current_price: parseFloat(currentPrice) })
        });
        
        if (!response.ok) throw new Error('Failed to update investment');
        
        alert('✅ Investment updated!');
        loadFinanceView();
        
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
        console.error('Update investment error:', error);
    }
}

async function deleteInvestment(investmentId) {
    if (!confirm('Are you sure you want to delete this investment?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/finance/investments/${investmentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete investment');
        
        alert('✅ Investment deleted!');
        loadFinanceView();
        
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
        console.error('Delete investment error:', error);
    }
}

