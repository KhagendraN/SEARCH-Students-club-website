/**
 * Blog Admin Module
 * Handles blog post CRUD operations
 */

import { supabase } from '../../js/supabase-config.js';
import { showToast, showScreen, showSpinner, confirmDialog } from './ui-utils.js';
import { getCurrentUser } from './auth.js';

// State
let currentPostId = null;

function escapeHtml(str) {
    if (str == null || str === '') return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function configureMarked() {
    if (typeof marked === 'undefined') return;
    marked.setOptions({
        gfm: true,
        breaks: true
    });
}

configureMarked();

function insertRaw(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const v = textarea.value;
    textarea.value = `${v.slice(0, start)}${text}${v.slice(end)}`;
    const pos = start + text.length;
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
}

function wrapSelection(textarea, open, close, emptyPlaceholder) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const v = textarea.value;
    let sel = v.slice(start, end);
    const hadSelection = sel.length > 0;
    if (!hadSelection) sel = emptyPlaceholder;
    const inserted = `${open}${sel}${close}`;
    textarea.value = `${v.slice(0, start)}${inserted}${v.slice(end)}`;
    textarea.focus();
    const innerStart = start + open.length;
    const innerEnd = innerStart + sel.length;
    textarea.setSelectionRange(innerStart, innerEnd);
}

function insertPrefixedLine(textarea, lineText, selectSubstring) {
    const start = textarea.selectionStart;
    const v = textarea.value;
    const needsLeadingNl = start > 0 && v[start - 1] !== '\n';
    const insertion = `${needsLeadingNl ? '\n' : ''}${lineText}`;
    const newVal = `${v.slice(0, start)}${insertion}${v.slice(start)}`;
    textarea.value = newVal;
    textarea.focus();
    if (selectSubstring) {
        const idx = newVal.indexOf(selectSubstring, start);
        if (idx !== -1) {
            textarea.setSelectionRange(idx, idx + selectSubstring.length);
            return;
        }
    }
    const pos = start + insertion.length;
    textarea.setSelectionRange(pos, pos);
}

function applyMarkdownTool(action) {
    const textarea = document.getElementById('post-content');
    if (!textarea) return;

    switch (action) {
        case 'bold':
            wrapSelection(textarea, '**', '**', 'bold text');
            break;
        case 'italic':
            wrapSelection(textarea, '*', '*', 'italic text');
            break;
        case 'link':
            wrapSelection(textarea, '[', '](https://)', 'link text');
            break;
        case 'code':
            wrapSelection(textarea, '`', '`', 'code');
            break;
        case 'h2':
            insertPrefixedLine(textarea, '## Section title\n', 'Section title');
            break;
        case 'quote':
            insertPrefixedLine(textarea, '> ');
            break;
        case 'ul':
            insertPrefixedLine(textarea, '- ');
            break;
        case 'ol':
            insertPrefixedLine(textarea, '1. ');
            break;
        case 'fence':
            insertPrefixedLine(textarea, '```\ncode here\n```\n', 'code here');
            break;
        case 'hr':
            insertPrefixedLine(textarea, '\n---\n');
            break;
        default:
            return;
    }
    updatePreview();
}

/**
 * Get current post ID
 */
export function getCurrentPostId() {
    return currentPostId;
}

/**
 * Set current post ID
 */
export function setCurrentPostId(id) {
    currentPostId = id;
}

/**
 * Load all blog posts
 */
export async function loadPosts() {
    const postsList = document.getElementById('posts-list');
    if (!postsList) return;

    showSpinner('posts-list');

    const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        postsList.innerHTML = `<div class="error-msg">Error loading posts: ${error.message}</div>`;
        return;
    }

    if (posts.length === 0) {
        postsList.innerHTML = '<div class="no-posts">No posts found. Create one!</div>';
        return;
    }

    postsList.innerHTML = posts.map(post => `
        <div class="post-item">
            <div class="post-info">
                <h3>${post.title}</h3>
                <div class="post-meta">
                    <span class="status-badge ${post.is_published ? 'status-published' : 'status-draft'}">
                        ${post.is_published ? 'Published' : 'Draft'}
                    </span>
                    <span>${new Date(post.created_at).toLocaleDateString()}</span>
                    <span>${post.genre || 'Uncategorized'}</span>
                    ${post.author_name ? `<span>By ${escapeHtml(post.author_name)}</span>` : ''}
                </div>
            </div>
            <div class="post-actions">
                <button class="btn-icon edit-post-btn" data-id="${post.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete delete-post-btn" data-id="${post.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    setupPostEventListeners();
}

/**
 * Setup event listeners for post list
 */
function setupPostEventListeners() {
    document.querySelectorAll('.edit-post-btn').forEach(btn => {
        btn.addEventListener('click', () => editPost(btn.dataset.id));
    });

    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', () => deletePost(btn.dataset.id));
    });
}

/**
 * Edit a blog post
 */
export async function editPost(id) {
    currentPostId = id;
    const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        showToast('Error loading post', 'error');
        return;
    }

    fillEditor(post);
    showScreen('editor');
    const editorTitle = document.getElementById('editor-title');
    if (editorTitle) {
        editorTitle.textContent = 'Edit Post';
    }
}

/**
 * Fill editor with post data
 */
export function fillEditor(post) {
    const fields = [
        { id: 'post-title', value: post.title || '' },
        { id: 'post-author-name', value: post.author_name || '' },
        { id: 'post-slug', value: post.slug || '' },
        { id: 'post-genre', value: post.genre || 'tech' },
        { id: 'post-date', value: post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : '' },
        { id: 'post-readtime', value: post.read_time || '' },
        { id: 'post-image', value: post.image_url || '' },
        { id: 'post-excerpt', value: post.excerpt || '' },
        { id: 'post-content', value: post.content || '' }
    ];

    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) el.value = field.value;
    });

    const publishedCheckbox = document.getElementById('post-published');
    if (publishedCheckbox) {
        publishedCheckbox.checked = post.is_published || false;
    }

    updatePreview();
}

/**
 * Save blog post
 */
export async function savePost() {
    const saveBtn = document.getElementById('save-btn');
    const statusSpan = document.getElementById('save-status');

    if (saveBtn) saveBtn.disabled = true;
    if (statusSpan) statusSpan.textContent = 'Saving...';

    const authorRaw = document.getElementById('post-author-name')?.value?.trim() ?? '';

    const postData = {
        title: document.getElementById('post-title').value,
        author_name: authorRaw || null,
        slug: document.getElementById('post-slug').value,
        genre: document.getElementById('post-genre').value,
        published_at: document.getElementById('post-date').value
            ? new Date(document.getElementById('post-date').value).toISOString()
            : null,
        read_time: document.getElementById('post-readtime').value,
        image_url: document.getElementById('post-image').value,
        excerpt: document.getElementById('post-excerpt').value,
        is_published: document.getElementById('post-published').checked,
        content: document.getElementById('post-content').value,
        author_id: getCurrentUser()?.id
    };

    let error;
    if (currentPostId) {
        const result = await supabase
            .from('blog_posts')
            .update(postData)
            .eq('id', currentPostId);
        error = result.error;
    } else {
        const result = await supabase
            .from('blog_posts')
            .insert(postData);
        error = result.error;
    }

    if (saveBtn) saveBtn.disabled = false;
    if (statusSpan) statusSpan.textContent = '';

    if (error) {
        showToast('Error saving post: ' + error.message, 'error');
        console.error(error);
    } else {
        showToast('Post saved successfully!', 'success');
        if (!currentPostId) {
            showScreen('dashboard');
            loadPosts();
        }
    }
}

/**
 * Delete blog post
 */
export async function deletePost(id) {
    if (!confirmDialog('Are you sure you want to delete this post?')) return;

    const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

    if (error) {
        showToast('Error deleting post: ' + error.message, 'error');
    } else {
        showToast('Post deleted', 'success');
        loadPosts();
    }
}

/**
 * Update markdown preview
 */
export function updatePreview() {
    const content = document.getElementById('post-content')?.value || '';
    const preview = document.getElementById('markdown-preview');
    if (preview && typeof marked !== 'undefined') {
        preview.innerHTML = marked.parse(content || '*Nothing to preview yet.*');
    }
}

/**
 * Create new post
 */
export function createNewPost() {
    currentPostId = null;
    fillEditor({});
    showScreen('editor');
    const editorTitle = document.getElementById('editor-title');
    if (editorTitle) {
        editorTitle.textContent = 'New Post';
    }
}

/**
 * Setup blog editor event listeners
 */
export function setupBlogEditorListeners() {
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showScreen('dashboard');
            loadPosts();
        });
    }

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', savePost);
    }

    const contentTextarea = document.getElementById('post-content');
    if (contentTextarea) {
        contentTextarea.addEventListener('input', updatePreview);
        contentTextarea.addEventListener('keydown', e => {
            if (e.key !== 'Tab') return;
            e.preventDefault();
            insertRaw(contentTextarea, '  ');
            updatePreview();
        });
    }

    const toolbar = document.getElementById('markdown-toolbar');
    if (toolbar) {
        toolbar.querySelectorAll('[data-md]').forEach(btn => {
            btn.addEventListener('click', () => applyMarkdownTool(btn.getAttribute('data-md')));
        });
    }
}
