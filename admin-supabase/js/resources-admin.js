import { supabase } from '../../js/supabase-config.js';
import { showToast, showScreen, showSpinner, confirmDialog } from './ui-utils.js';
import { getCurrentUser } from './auth.js';

let currentResourceId = null;

function escapeHtml(text) {
    if (text == null || text === '') return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

export async function loadResources() {
    const list = document.getElementById('resources-list');
    if (!list) return;

    showSpinner('resources-list');

    const { data: items, error } = await supabase
        .from('resources')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="error-msg">Error loading resources: ${escapeHtml(error.message)}</div>`;
        return;
    }

    if (!items || items.length === 0) {
        list.innerHTML = '<div class="no-posts">No resources found. Create one!</div>';
        return;
    }

    list.innerHTML = items.map(item => `
        <div class="post-item">
            <div class="post-info">
                <h3>${escapeHtml(item.title || 'Untitled')}</h3>
                <div class="post-meta">
                    <span class="status-badge ${item.is_pinned ? 'status-published' : 'status-draft'}">
                        ${item.is_pinned ? 'Pinned' : 'Normal'}
                    </span>
                    <span>Order: ${item.display_order ?? 0}</span>
                    ${item.drive_url ? '<span><i class="fas fa-external-link-alt"></i> Drive link</span>' : ''}
                </div>
            </div>
            <div class="post-actions">
                <button type="button" class="btn-icon edit-resource-btn" data-id="${item.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn-icon btn-delete delete-resource-btn" data-id="${item.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.edit-resource-btn').forEach(btn => {
        btn.addEventListener('click', () => editResource(btn.dataset.id));
    });

    document.querySelectorAll('.delete-resource-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteResource(btn.dataset.id));
    });
}

export async function editResource(id) {
    currentResourceId = id;

    const { data: item, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        showToast('Error loading resource', 'error');
        return;
    }

    fillResourceEditor(item);
    showScreen('resourceEditor');

    const title = document.getElementById('resources-editor-title');
    if (title) title.textContent = 'Edit Resource';
}

function fillResourceEditor(item = {}) {
    const fields = [
        { id: 'resources-title', value: item.title || '' },
        { id: 'resources-description', value: item.description || '' },
        { id: 'resources-drive-url', value: item.drive_url || '' },
        { id: 'resources-display-order', value: item.display_order ?? 0 }
    ];

    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) el.value = field.value;
    });

    const pinned = document.getElementById('resources-pinned');
    if (pinned) pinned.checked = !!item.is_pinned;
}

export async function saveResource() {
    const saveBtn = document.getElementById('resources-save-btn');
    const status = document.getElementById('resources-save-status');
    const form = document.getElementById('resources-form');

    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (saveBtn) saveBtn.disabled = true;
    if (status) status.textContent = 'Saving...';

    const payload = {
        title: document.getElementById('resources-title')?.value?.trim() || 'Untitled',
        description: document.getElementById('resources-description')?.value?.trim() || null,
        drive_url: document.getElementById('resources-drive-url')?.value?.trim(),
        is_pinned: !!document.getElementById('resources-pinned')?.checked,
        display_order: parseInt(document.getElementById('resources-display-order')?.value || '0', 10) || 0,
        author_id: getCurrentUser()?.id
    };

    let error;
    if (currentResourceId) {
        const result = await supabase
            .from('resources')
            .update(payload)
            .eq('id', currentResourceId);
        error = result.error;
    } else {
        const result = await supabase
            .from('resources')
            .insert(payload);
        error = result.error;
    }

    if (saveBtn) saveBtn.disabled = false;
    if (status) status.textContent = '';

    if (error) {
        showToast('Error saving resource: ' + error.message, 'error');
        return;
    }

    showToast('Resource saved successfully!', 'success');
    showScreen('dashboard');
    loadResources();
}

export async function deleteResource(id) {
    if (!confirmDialog('Are you sure you want to delete this resource?')) return;

    const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

    if (error) {
        showToast('Error deleting resource: ' + error.message, 'error');
        return;
    }

    showToast('Resource deleted', 'success');
    loadResources();
}

export function createNewResource() {
    currentResourceId = null;
    fillResourceEditor();
    showScreen('resourceEditor');

    const title = document.getElementById('resources-editor-title');
    if (title) title.textContent = 'New Resource';
}

export function setupResourceEditorListeners() {
    const backBtn = document.getElementById('resources-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showScreen('dashboard');
            loadResources();
        });
    }

    const saveBtn = document.getElementById('resources-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveResource);
}
