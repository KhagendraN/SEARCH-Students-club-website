/**
 * Events Admin Module
 * Handles event CRUD operations
 */

import { supabase } from '../../js/supabase-config.js';
import { showToast, showScreen, showSpinner, confirmDialog } from './ui-utils.js';
import { getCurrentUser } from './auth.js';

// State
let currentEventId = null;

/**
 * Get current event ID
 */
export function getCurrentEventId() {
    return currentEventId;
}

/**
 * Set current event ID
 */
export function setCurrentEventId(id) {
    currentEventId = id;
}

/**
 * Load all events
 */
export async function loadEvents() {
    const list = document.getElementById('events-list');
    if (!list) return;

    showSpinner('events-list');

    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="error-msg">Error loading events: ${error.message}</div>`;
        return;
    }

    if (events.length === 0) {
        list.innerHTML = '<div class="no-posts">No events found. Create one!</div>';
        return;
    }

    list.innerHTML = events.map(a => `
        <div class="post-item">
            <div class="post-info">
                <h3>${a.title}</h3>
                <div class="post-meta">
                    <span class="status-badge ${a.is_pinned ? 'status-published' : 'status-draft'}">
                        ${a.is_pinned ? 'Pinned' : 'Normal'}
                    </span>
                    <span>${a.location || 'No Issuer'}</span>
                    <span>${a.event_date ? new Date(a.event_date).toLocaleDateString() : ''}</span>
                </div>
            </div>
            <div class="post-actions">
                <button class="btn-icon edit-event-btn" data-id="${a.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete delete-event-btn" data-id="${a.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    setupEventEventListeners();
}

/**
 * Setup event listeners for event list
 */
function setupEventEventListeners() {
    document.querySelectorAll('.edit-event-btn').forEach(btn => {
        btn.addEventListener('click', () => editEvent(btn.dataset.id));
    });

    document.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteEvent(btn.dataset.id));
    });
}

/**
 * Edit an event
 */
export async function editEvent(id) {
    currentEventId = id;
    const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        showToast('Error loading event', 'error');
        return;
    }

    fillEventEditor(event);
    showScreen('eventEditor');
    const editorTitle = document.getElementById('event-editor-title');
    if (editorTitle) {
        editorTitle.textContent = 'Edit Event';
    }
}

/**
 * Fill event editor with data
 */
export function fillEventEditor(a) {
    const fields = [
        { id: 'event-title', value: a.title || '' },
        { id: 'event-desc', value: a.description || '' },
        { id: 'event-location', value: a.location || '' },
        { id: 'event-date', value: a.event_date || '' },
        { id: 'event-image', value: a.image_url || '' },
        { id: 'event-link', value: a.link_url || '' }
    ];

    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) el.value = field.value;
    });

    const pinnedCheckbox = document.getElementById('event-pinned');
    if (pinnedCheckbox) {
        pinnedCheckbox.checked = a.is_pinned || false;
    }
}

/**
 * Save event
 */
export async function saveEvent() {
    const saveBtn = document.getElementById('event-save-btn');
    const statusSpan = document.getElementById('event-save-status');

    if (saveBtn) saveBtn.disabled = true;
    if (statusSpan) statusSpan.textContent = 'Saving...';

    const imageRaw = document.getElementById('event-image')?.value?.trim() ?? '';
    const linkRaw = document.getElementById('event-link')?.value?.trim() ?? '';

    const eventData = {
        title: document.getElementById('event-title').value.trim(),
        description: (document.getElementById('event-desc').value || '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim(),
        location: document.getElementById('event-location').value.trim(),
        event_date: document.getElementById('event-date').value || null,
        image_url: imageRaw || null,
        link_url: linkRaw || null,
        is_pinned: document.getElementById('event-pinned').checked,
        author_id: getCurrentUser()?.id
    };

    let error;
    if (currentEventId) {
        const result = await supabase
            .from('events')
            .update(eventData)
            .eq('id', currentEventId);
        error = result.error;
    } else {
        const result = await supabase
            .from('events')
            .insert(eventData);
        error = result.error;
    }

    if (saveBtn) saveBtn.disabled = false;
    if (statusSpan) statusSpan.textContent = '';

    if (error) {
        showToast('Error saving event: ' + error.message, 'error');
        console.error(error);
    } else {
        showToast('Event saved successfully!', 'success');
        if (!currentEventId) {
            showScreen('dashboard');
            loadEvents();
        }
    }
}

/**
 * Delete event
 */
export async function deleteEvent(id) {
    if (!confirmDialog('Are you sure you want to delete this event?')) return;

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

    if (error) {
        showToast('Error deleting event: ' + error.message, 'error');
    } else {
        showToast('Event deleted', 'success');
        loadEvents();
    }
}

/**
 * Create new event
 */
export function createNewEvent() {
    currentEventId = null;
    fillEventEditor({});
    showScreen('eventEditor');
    const editorTitle = document.getElementById('event-editor-title');
    if (editorTitle) {
        editorTitle.textContent = 'New Event';
    }
}

/**
 * Setup event editor event listeners
 */
export function setupEventEditorListeners() {
    const backBtn = document.getElementById('event-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showScreen('dashboard');
            loadEvents();
        });
    }

    const saveBtn = document.getElementById('event-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveEvent);
    }
}
