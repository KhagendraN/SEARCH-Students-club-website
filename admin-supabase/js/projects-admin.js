/**
 * Projects Admin Module
 * Handles project CRUD operations
 */

import { supabase } from '../../js/supabase-config.js';
import { showToast, showScreen, showSpinner, confirmDialog } from './ui-utils.js';
import { getCurrentUser } from './auth.js';

// State
let currentProjectId = null;

/**
 * Get current project ID
 */
export function getCurrentProjectId() {
    return currentProjectId;
}

/**
 * Set current project ID
 */
export function setCurrentProjectId(id) {
    currentProjectId = id;
}

/**
 * Load all projects
 */
export async function loadProjects() {
    const list = document.getElementById('projects-list');
    if (!list) return;

    showSpinner('projects-list');

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="error-msg">Error loading projects: ${error.message}</div>`;
        return;
    }

    if (projects.length === 0) {
        list.innerHTML = '<div class="no-posts">No articles found. Create one!</div>';
        return;
    }

    list.innerHTML = projects.map(p => `
        <div class="post-item">
            <div class="post-info">
                <h3>${p.title}</h3>
                <div class="post-meta">
                    <span class="status-badge ${p.is_pinned ? 'status-published' : 'status-draft'}">
                        ${p.is_pinned ? 'Pinned' : 'Normal'}
                    </span>
                    <span>${(p.tech_stack || []).join(', ')}</span>
                </div>
            </div>
            <div class="post-actions">
                <button class="btn-icon edit-project-btn" data-id="${p.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete delete-project-btn" data-id="${p.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    setupProjectEventListeners();
}

/**
 * Setup event listeners for project list
 */
function setupProjectEventListeners() {
    document.querySelectorAll('.edit-project-btn').forEach(btn => {
        btn.addEventListener('click', () => editProject(btn.dataset.id));
    });

    document.querySelectorAll('.delete-project-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteProject(btn.dataset.id));
    });
}

/**
 * Edit a project
 */
export async function editProject(id) {
    currentProjectId = id;
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        showToast('Error loading project', 'error');
        return;
    }

    fillProjectEditor(project);
    showScreen('projectEditor');
    const editorTitle = document.getElementById('project-editor-title');
    if (editorTitle) {
        editorTitle.textContent = 'Edit Article';
    }
}

/**
 * Fill project editor with data
 */
export function fillProjectEditor(p) {
    const fields = [
        { id: 'project-title', value: p.title || '' },
        { id: 'project-desc', value: p.description || '' },
        { id: 'project-image', value: p.image_url || '' },
        { id: 'project-github', value: p.github_url || '' },
        { id: 'project-demo', value: p.demo_url || '' },
        { id: 'project-tech', value: (p.tech_stack || []).join(', ') }
    ];

    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) el.value = field.value;
    });

    const pinnedCheckbox = document.getElementById('project-pinned');
    if (pinnedCheckbox) {
        pinnedCheckbox.checked = p.is_pinned || false;
    }
}

/**
 * Save project
 */
export async function saveProject() {
    const saveBtn = document.getElementById('project-save-btn');
    const statusSpan = document.getElementById('project-save-status');

    if (saveBtn) saveBtn.disabled = true;
    if (statusSpan) statusSpan.textContent = 'Saving...';

    const techStack = document.getElementById('project-tech').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

    const projectData = {
        title: document.getElementById('project-title').value,
        description: document.getElementById('project-desc').value,
        image_url: document.getElementById('project-image').value,
        github_url: document.getElementById('project-github').value,
        demo_url: document.getElementById('project-demo').value,
        tech_stack: techStack,
        is_pinned: document.getElementById('project-pinned').checked,
        author_id: getCurrentUser()?.id
    };

    let error;
    if (currentProjectId) {
        const result = await supabase
            .from('projects')
            .update(projectData)
            .eq('id', currentProjectId);
        error = result.error;
    } else {
        const result = await supabase
            .from('projects')
            .insert(projectData);
        error = result.error;
    }

    if (saveBtn) saveBtn.disabled = false;
    if (statusSpan) statusSpan.textContent = '';

    if (error) {
        showToast('Error saving article: ' + error.message, 'error');
        console.error(error);
    } else {
        showToast('Article saved successfully!', 'success');
        if (!currentProjectId) {
            showScreen('dashboard');
            loadProjects();
        }
    }
}

/**
 * Delete project
 */
export async function deleteProject(id) {
    if (!confirmDialog('Are you sure you want to delete this newsletter?')) return;

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) {
        showToast('Error deleting article: ' + error.message, 'error');
    } else {
        showToast('Article deleted', 'success');
        loadProjects();
    }
}

/**
 * Create new project
 */
export function createNewProject() {
    currentProjectId = null;
    fillProjectEditor({});
    showScreen('projectEditor');
    const editorTitle = document.getElementById('project-editor-title');
    if (editorTitle) {
        editorTitle.textContent = 'New Article';
    }
}

/**
 * Setup project editor event listeners
 */
export function setupProjectEditorListeners() {
    const backBtn = document.getElementById('project-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showScreen('dashboard');
            loadProjects();
        });
    }

    const saveBtn = document.getElementById('project-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProject);
    }
}
