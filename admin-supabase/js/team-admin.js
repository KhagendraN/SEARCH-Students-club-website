/**
 * TeamMember Admin Module
 * Handles team_member CRUD operations
 */

import { supabase } from '../../js/supabase-config.js';
import { showToast, showScreen, showSpinner, confirmDialog } from './ui-utils.js';
import { getCurrentUser } from './auth.js';

function escapeHtml(text) {
    if (text == null || text === '') return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function escapeAttr(text) {
    if (text == null || text === '') return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;');
}

/** Admin list title: full_name + role; legacy rows only had role in `role` column */
function teamMemberListHeading(e) {
    const fullName = typeof e.full_name === 'string' ? e.full_name.trim() : '';
    const roleTitle = typeof e.role === 'string' ? e.role.trim() : '';

    if (fullName && roleTitle) return `${escapeHtml(fullName)}, ${escapeHtml(roleTitle)}`;
    if (fullName) return escapeHtml(fullName);
    if (roleTitle) return escapeHtml(roleTitle);

    const d = typeof e.description === 'string' ? e.description.trim() : '';
    if (d) {
        const shortened = d.length > 72 ? `${d.slice(0, 69)}…` : d;
        return `<span class="team_member-title-fallback">${escapeHtml(shortened)}</span>`;
    }
    return '<span class="team_member-title-fallback">Team member</span>';
}

// State
let currentTeamMemberId = null;

/**
 * Get current team_member ID
 */
export function getCurrentTeamMemberId() {
    return currentTeamMemberId;
}

/**
 * Set current team_member ID
 */
export function setCurrentTeamMemberId(id) {
    currentTeamMemberId = id;
}

/**
 * Load all team_members
 */
export async function loadTeamMembers() {
    const list = document.getElementById('team_members-list');
    if (!list) return;

    showSpinner('team_members-list');

    const { data: team_members, error } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="error-msg">Error loading team_members: ${error.message}</div>`;
        return;
    }

    if (team_members.length === 0) {
        list.innerHTML = '<div class="no-posts">No team_members found. Create one!</div>';
        return;
    }

    list.innerHTML = team_members.map(e => {
        const thumb = e.image_url
            ? `<img src="${escapeAttr(e.image_url)}" alt="" class="team_member-list-thumb">`
            : '';
        return `
        <div class="post-item">
            <div class="post-info">
                ${thumb}
                <h3>${teamMemberListHeading(e)}</h3>
                <div class="post-meta">
                    <span class="status-badge ${e.member_group === 'education' ? 'status-published' : 'status-draft'}">
                        ${e.member_group === 'education' ? 'Education' : 'TeamMember'}
                    </span>
                    <span>${escapeHtml(e.tenure)}</span>
                    <span>Order: ${e.display_order}</span>
                </div>
            </div>
            <div class="post-actions">
                <button class="btn-icon edit-team_member-btn" data-id="${e.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete delete-team_member-btn" data-id="${e.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    }).join('');

    // Add event listeners
    setupTeamMemberEventListeners();
}

/**
 * Setup event listeners for team_member list
 */
function setupTeamMemberEventListeners() {
    document.querySelectorAll('.edit-team_member-btn').forEach(btn => {
        btn.addEventListener('click', () => editTeamMember(btn.dataset.id));
    });

    document.querySelectorAll('.delete-team_member-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteTeamMember(btn.dataset.id));
    });
}

/**
 * Edit an team_member
 */
export async function editTeamMember(id) {
    currentTeamMemberId = id;
    const { data: team_member, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        showToast('Error loading team_member', 'error');
        return;
    }

    fillTeamMemberEditor(team_member);
    showScreen('teamMemberEditor');
    const editorTitle = document.getElementById('team_member-editor-title');
    if (editorTitle) {
        editorTitle.textContent = 'Edit TeamMember';
    }
}

/**
 * Fill team_member editor with data
 */
function syncTeamPhotoPreview(url) {
    const photoInput = document.getElementById('team_member-photo');
    const preview = document.getElementById('team_member-photo-preview');
    const trimmed = typeof url === 'string' ? url.trim() : '';
    if (photoInput) photoInput.value = trimmed;
    if (!preview) return;
    if (trimmed) {
        preview.src = trimmed;
        preview.style.display = 'block';
    } else {
        preview.removeAttribute('src');
        preview.style.display = 'none';
    }
}

export function fillTeamMemberEditor(e) {
    const fields = [
        { id: 'team_member-member_group', value: e.member_group || 'education' },
        { id: 'team_member-full-name', value: e.full_name || '' },
        { id: 'team_member-role-title', value: e.role || '' },
        { id: 'team_member-date', value: e.tenure || '' },
        { id: 'team_member-org', value: e.organization || '' },
        { id: 'team_member-desc', value: e.description || '' },
        { id: 'team_member-order', value: e.display_order ?? 0 }
    ];

    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) el.value = field.value;
    });

    syncTeamPhotoPreview(e.image_url || '');
}

/**
 * Save team_member
 */
export async function saveTeamMember() {
    const saveBtn = document.getElementById('team_member-save-btn');
    const statusSpan = document.getElementById('team_member-save-status');
    const form = document.getElementById('team_member-form');

    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (saveBtn) saveBtn.disabled = true;
    if (statusSpan) statusSpan.textContent = 'Saving...';

    const photoUrl = document.getElementById('team_member-photo')?.value?.trim() || null;
    const fullName = document.getElementById('team_member-full-name')?.value?.trim() || null;
    const roleTitle = document.getElementById('team_member-role-title')?.value?.trim() || null;

    const team_memberData = {
        member_group: document.getElementById('team_member-member_group').value,
        tenure: document.getElementById('team_member-date').value,
        full_name: fullName,
        role: roleTitle,
        organization: document.getElementById('team_member-org').value,
        description: document.getElementById('team_member-desc').value,
        display_order: parseInt(document.getElementById('team_member-order').value) || 0,
        author_id: getCurrentUser()?.id,
        image_url: photoUrl
    };

    let error;
    if (currentTeamMemberId) {
        const result = await supabase
            .from('team_members')
            .update(team_memberData)
            .eq('id', currentTeamMemberId);
        error = result.error;
    } else {
        const result = await supabase
            .from('team_members')
            .insert(team_memberData);
        error = result.error;
    }

    if (saveBtn) saveBtn.disabled = false;
    if (statusSpan) statusSpan.textContent = '';

    if (error) {
        showToast('Error saving team_member: ' + error.message, 'error');
        console.error(error);
    } else {
        showToast('TeamMember saved successfully!', 'success');
        if (!currentTeamMemberId) {
            showScreen('dashboard');
            loadTeamMembers();
        }
    }
}

/**
 * Delete team_member
 */
export async function deleteTeamMember(id) {
    if (!confirmDialog('Are you sure you want to delete this team_member?')) return;

    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

    if (error) {
        showToast('Error deleting team_member: ' + error.message, 'error');
    } else {
        showToast('TeamMember deleted', 'success');
        loadTeamMembers();
    }
}

/**
 * Create new team_member
 */
export function createNewTeamMember() {
    currentTeamMemberId = null;
    fillTeamMemberEditor({});
    showScreen('teamMemberEditor');
    const editorTitle = document.getElementById('team_member-editor-title');
    if (editorTitle) {
        editorTitle.textContent = 'New TeamMember';
    }
}

/**
 * Setup team_member editor event listeners
 */
export function setupTeamMemberEditorListeners() {
    const backBtn = document.getElementById('team_member-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showScreen('dashboard');
            loadTeamMembers();
        });
    }

    const saveBtn = document.getElementById('team_member-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveTeamMember);
    }

    const photoInput = document.getElementById('team_member-photo');
    if (photoInput) {
        photoInput.addEventListener('input', () => syncTeamPhotoPreview(photoInput.value));
    }
}
