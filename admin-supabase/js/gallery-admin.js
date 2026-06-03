/**
 * Gallery Admin Module
 * Handles gallery item CRUD operations and media uploads
 */

import { supabase } from '../../js/supabase-config.js';
import { showToast, showScreen, showSpinner, confirmDialog } from './ui-utils.js';
import { getCurrentUser } from './auth.js';

const IMAGE_MAX_BYTES = 500 * 1024;
const VIDEO_MAX_BYTES = 150 * 1024 * 1024;

let currentGalleryItemId = null;

function escapeHtml(text) {
    if (text == null || text === '') return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function humanFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
}

function getSelectedMediaType() {
    const mediaTypeEl = document.getElementById('gallery-media-type');
    return mediaTypeEl?.value || 'image';
}

function sanitizeFileName(name) {
    return String(name || 'file')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '');
}

function syncMediaPreview() {
    const mediaType = getSelectedMediaType();
    const url = document.getElementById('gallery-media-url')?.value?.trim() || '';
    const preview = document.getElementById('gallery-media-preview');
    if (!preview) return;

    preview.innerHTML = '';
    if (!url) return;

    if (mediaType === 'video') {
        const v = document.createElement('video');
        v.src = url;
        v.controls = true;
        v.preload = 'metadata';
        v.style.width = '100%';
        v.style.maxWidth = '260px';
        v.style.borderRadius = '0.75rem';
        preview.appendChild(v);
    } else {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Gallery preview';
        img.style.width = '100%';
        img.style.maxWidth = '260px';
        img.style.borderRadius = '0.75rem';
        img.style.border = '1px solid rgba(15, 23, 42, 0.1)';
        preview.appendChild(img);
    }
}

async function uploadGalleryMedia(file) {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
        showToast('Only image/video files are allowed for gallery.', 'error');
        return null;
    }

    if (isImage && file.size > IMAGE_MAX_BYTES) {
        showToast('Image exceeds 500 KB limit.', 'error');
        return null;
    }

    if (isVideo && file.size > VIDEO_MAX_BYTES) {
        showToast('Video exceeds 150 MB limit.', 'error');
        return null;
    }

    const mediaType = isVideo ? 'video' : 'image';
    const mediaTypeEl = document.getElementById('gallery-media-type');
    if (mediaTypeEl) mediaTypeEl.value = mediaType;

    const filePath = `gallery/${mediaType}s/${Date.now()}_${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage
        .from('portfolio-assets')
        .upload(filePath, file);

    if (error) {
        showToast('Upload failed: ' + error.message, 'error');
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('portfolio-assets')
        .getPublicUrl(filePath);

    return {
        url: publicUrl,
        size: file.size,
        mimeType: file.type,
        mediaType
    };
}

async function uploadGalleryThumbnail(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Thumbnail must be an image file.', 'error');
        return null;
    }

    if (file.size > IMAGE_MAX_BYTES) {
        showToast('Thumbnail exceeds 500 KB limit.', 'error');
        return null;
    }

    const filePath = `gallery/thumbnails/${Date.now()}_${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage
        .from('portfolio-assets')
        .upload(filePath, file);

    if (error) {
        showToast('Upload failed: ' + error.message, 'error');
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('portfolio-assets')
        .getPublicUrl(filePath);

    return publicUrl;
}

export async function loadGalleryItems() {
    const list = document.getElementById('gallery-list');
    if (!list) return;

    showSpinner('gallery-list');

    const { data: items, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<div class="error-msg">Error loading gallery: ${escapeHtml(error.message)}</div>`;
        return;
    }

    if (!items || items.length === 0) {
        list.innerHTML = '<div class="no-posts">No gallery items found. Create one!</div>';
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
                    <span>${item.media_type === 'video' ? 'Video' : 'Image'}</span>
                    <span>${humanFileSize(item.file_size_bytes)}</span>
                    <span>Order: ${item.display_order ?? 0}</span>
                </div>
            </div>
            <div class="post-actions">
                <button type="button" class="btn-icon edit-gallery-btn" data-id="${item.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn-icon btn-delete delete-gallery-btn" data-id="${item.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.edit-gallery-btn').forEach(btn => {
        btn.addEventListener('click', () => editGalleryItem(btn.dataset.id));
    });

    document.querySelectorAll('.delete-gallery-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteGalleryItem(btn.dataset.id));
    });
}

export async function editGalleryItem(id) {
    currentGalleryItemId = id;

    const { data: item, error } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        showToast('Error loading gallery item', 'error');
        return;
    }

    fillGalleryEditor(item);
    showScreen('galleryEditor');

    const title = document.getElementById('gallery-editor-title');
    if (title) title.textContent = 'Edit Gallery Item';
}

function fillGalleryEditor(item = {}) {
    const fields = [
        { id: 'gallery-title', value: item.title || '' },
        { id: 'gallery-caption', value: item.caption || '' },
        { id: 'gallery-media-type', value: item.media_type || 'image' },
        { id: 'gallery-media-url', value: item.media_url || '' },
        { id: 'gallery-thumbnail-url', value: item.thumbnail_url || '' },
        { id: 'gallery-display-order', value: item.display_order ?? 0 },
        { id: 'gallery-file-size', value: item.file_size_bytes ?? '' },
        { id: 'gallery-mime-type', value: item.mime_type || '' }
    ];

    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) el.value = field.value;
    });

    const pinned = document.getElementById('gallery-pinned');
    if (pinned) pinned.checked = !!item.is_pinned;

    syncMediaPreview();
}

export async function saveGalleryItem() {
    const saveBtn = document.getElementById('gallery-save-btn');
    const status = document.getElementById('gallery-save-status');
    const form = document.getElementById('gallery-form');

    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (saveBtn) saveBtn.disabled = true;
    if (status) status.textContent = 'Saving...';

    const mediaType = getSelectedMediaType();
    const fileSizeRaw = document.getElementById('gallery-file-size')?.value;
    const fileSize = fileSizeRaw ? parseInt(fileSizeRaw, 10) : null;

    if (mediaType === 'image' && fileSize && fileSize > IMAGE_MAX_BYTES) {
        showToast('Image exceeds 500 KB limit.', 'error');
        if (saveBtn) saveBtn.disabled = false;
        if (status) status.textContent = '';
        return;
    }

    if (mediaType === 'video' && fileSize && fileSize > VIDEO_MAX_BYTES) {
        showToast('Video exceeds 150 MB limit.', 'error');
        if (saveBtn) saveBtn.disabled = false;
        if (status) status.textContent = '';
        return;
    }

    const payload = {
        title: document.getElementById('gallery-title')?.value?.trim() || 'Untitled',
        caption: document.getElementById('gallery-caption')?.value?.trim() || null,
        media_type: mediaType,
        media_url: document.getElementById('gallery-media-url')?.value?.trim(),
        thumbnail_url: document.getElementById('gallery-thumbnail-url')?.value?.trim() || null,
        mime_type: document.getElementById('gallery-mime-type')?.value?.trim() || null,
        file_size_bytes: fileSize,
        is_pinned: !!document.getElementById('gallery-pinned')?.checked,
        display_order: parseInt(document.getElementById('gallery-display-order')?.value || '0', 10) || 0,
        author_id: getCurrentUser()?.id
    };

    let error;
    if (currentGalleryItemId) {
        const result = await supabase
            .from('gallery_items')
            .update(payload)
            .eq('id', currentGalleryItemId);
        error = result.error;
    } else {
        const result = await supabase
            .from('gallery_items')
            .insert(payload);
        error = result.error;
    }

    if (saveBtn) saveBtn.disabled = false;
    if (status) status.textContent = '';

    if (error) {
        showToast('Error saving gallery item: ' + error.message, 'error');
        return;
    }

    showToast('Gallery item saved successfully!', 'success');
    showScreen('dashboard');
    loadGalleryItems();
}

export async function deleteGalleryItem(id) {
    if (!confirmDialog('Are you sure you want to delete this gallery item?')) return;

    const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', id);

    if (error) {
        showToast('Error deleting gallery item: ' + error.message, 'error');
        return;
    }

    showToast('Gallery item deleted', 'success');
    loadGalleryItems();
}

export function createNewGalleryItem() {
    currentGalleryItemId = null;
    fillGalleryEditor({ media_type: 'image' });
    showScreen('galleryEditor');

    const title = document.getElementById('gallery-editor-title');
    if (title) title.textContent = 'New Gallery Item';
}

export function setupGalleryEditorListeners() {
    const backBtn = document.getElementById('gallery-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showScreen('dashboard');
            loadGalleryItems();
        });
    }

    const saveBtn = document.getElementById('gallery-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveGalleryItem);

    const mediaTypeEl = document.getElementById('gallery-media-type');
    if (mediaTypeEl) mediaTypeEl.addEventListener('change', syncMediaPreview);

    const mediaUrlEl = document.getElementById('gallery-media-url');
    if (mediaUrlEl) mediaUrlEl.addEventListener('input', syncMediaPreview);

    const mediaUploadBtn = document.getElementById('gallery-media-upload-btn');
    const mediaUploadInput = document.getElementById('gallery-media-upload');
    if (mediaUploadBtn && mediaUploadInput) {
        mediaUploadBtn.addEventListener('click', () => mediaUploadInput.click());
        mediaUploadInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            mediaUploadBtn.disabled = true;
            mediaUploadBtn.textContent = 'Uploading...';

            const uploaded = await uploadGalleryMedia(file);
            if (uploaded) {
                const mediaUrl = document.getElementById('gallery-media-url');
                const fileSize = document.getElementById('gallery-file-size');
                const mimeType = document.getElementById('gallery-mime-type');
                if (mediaUrl) mediaUrl.value = uploaded.url;
                if (fileSize) fileSize.value = String(uploaded.size);
                if (mimeType) mimeType.value = uploaded.mimeType;
                syncMediaPreview();
            }

            mediaUploadBtn.disabled = false;
            mediaUploadBtn.textContent = 'Upload';
            mediaUploadInput.value = '';
        });
    }

    const thumbUploadBtn = document.getElementById('gallery-thumbnail-upload-btn');
    const thumbUploadInput = document.getElementById('gallery-thumbnail-upload');
    if (thumbUploadBtn && thumbUploadInput) {
        thumbUploadBtn.addEventListener('click', () => thumbUploadInput.click());
        thumbUploadInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            thumbUploadBtn.disabled = true;
            thumbUploadBtn.textContent = 'Uploading...';

            const uploadedUrl = await uploadGalleryThumbnail(file);
            if (uploadedUrl) {
                const thumbUrl = document.getElementById('gallery-thumbnail-url');
                if (thumbUrl) thumbUrl.value = uploadedUrl;
            }

            thumbUploadBtn.disabled = false;
            thumbUploadBtn.textContent = 'Upload';
            thumbUploadInput.value = '';
        });
    }
}
