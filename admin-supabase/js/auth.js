/**
 * Authentication Module
 * Handles login, logout, and session management
 */

import { supabase } from '../../js/supabase-config.js';
import { showScreen, showToast } from './ui-utils.js';

// State
let currentUser = null;

/**
 * Get current user
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Set current user
 */
export function setCurrentUser(user) {
    currentUser = user;
}

/**
 * Check authentication status
 */
export async function checkAuth(onAuthenticated, onUnauthenticated) {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
        currentUser = session.user;
        showScreen('dashboard');
        const userEmailEl = document.getElementById('user-email');
        if (userEmailEl) userEmailEl.textContent = currentUser.email;
        if (onAuthenticated) onAuthenticated();
    } else {
        currentUser = null;
        showScreen('login');
        if (onUnauthenticated) onUnauthenticated();
    }

    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') return;

        if (session?.user) {
            currentUser = session.user;
            showScreen('dashboard');
            const userEmailEl = document.getElementById('user-email');
            if (userEmailEl) {
                userEmailEl.textContent = currentUser.email;
            }
            if (onAuthenticated) onAuthenticated();
        } else {
            currentUser = null;
            showScreen('login');
            if (onUnauthenticated) onUnauthenticated();
        }
    });
}

/**
 * Login with email and password
 */
export async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
            errorEl.textContent = error.message;
        }
        return false;
    }

    return true;
}

/**
 * Logout
 */
export async function logout() {
    await supabase.auth.signOut();
    showToast('Logged out successfully', 'success');
}

/**
 * Setup login form event listener
 */
export function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await login(email, password);
        });
    }
}

/**
 * Setup logout button event listener
 */
export function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}
