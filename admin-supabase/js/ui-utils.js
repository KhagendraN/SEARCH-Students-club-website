/**
 * UI Utilities Module
 * Handles toast notifications, modals, and screen navigation
 */

// State
export const screens = {
    login: null,
    dashboard: null,
    editor: null,
    projectEditor: null,
    teamMemberEditor: null,
    eventEditor: null
};

/**
 * Initialize screens object with DOM elements
 */
export function initScreens() {
    screens.login = document.getElementById('login-screen');
    screens.dashboard = document.getElementById('dashboard-screen');
    screens.editor = document.getElementById('editor-screen');
    screens.projectEditor = document.getElementById('project-editor-screen');
    screens.teamMemberEditor = document.getElementById('team_member-editor-screen');
    screens.eventEditor = document.getElementById('event-editor-screen');
}

/**
 * Toast Notifications
 */
export function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
}

export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        createToastContainer();
        return showToast(message, type);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success'
        ? '<i class="fas fa-check-circle toast-icon"></i>'
        : '<i class="fas fa-exclamation-circle toast-icon"></i>';

    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/**
 * Screen Navigation
 */
export function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.add('hidden');
    });
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
    }
}

/**
 * Tab Switching
 */
export function switchTab(tab, loadDataCallback) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const tabBtn = document.getElementById(`tab-${tab}`);
    if (tabBtn) tabBtn.classList.add('active');

    // Hide all views
    const views = ['posts', 'projects', 'experiences', 'achievements', 'profile'];
    views.forEach(view => {
        const viewEl = document.getElementById(`${view}-view`);
        if (viewEl) viewEl.classList.add('hidden');
    });

    // Show selected view
    const selectedView = document.getElementById(`${tab}-view`);
    if (selectedView) selectedView.classList.remove('hidden');

    // Hide/show New button based on tab
    const newBtn = document.getElementById('new-btn');
    if (newBtn) {
        newBtn.style.display = tab === 'profile' ? 'none' : 'inline-block';
    }

    // Load data for this tab
    if (loadDataCallback) {
        loadDataCallback(tab);
    }
}

/**
 * Loading Spinner
 */
export function showSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="spinner"></div>';
    }
}

/**
 * Confirm Dialog
 */
export function confirmDialog(message) {
    return window.confirm(message);
}
