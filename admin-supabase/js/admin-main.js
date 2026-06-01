/**
 * Admin Main Module
 * Main initialization and orchestration for admin panel
 */

import { supabase } from '../../js/supabase-config.js';
import { initScreens, createToastContainer, switchTab } from './ui-utils.js';
import { checkAuth, setupLoginForm, setupLogoutButton } from './auth.js';
import { loadPosts, setupBlogEditorListeners, createNewPost, updatePreview } from './blog-admin.js';
import { loadProjects, setupProjectEditorListeners, createNewProject } from './projects-admin.js';
import { loadTeamMembers, setupTeamMemberEditorListeners, createNewTeamMember } from './team-admin.js';
import { loadEvents, setupEventEditorListeners, createNewEvent } from './events-admin.js';
import { loadProfile, setupProfileEditorListeners, uploadFile } from './profile-admin.js';

// State
let activeTab = 'posts'; // 'posts', 'projects', 'experiences', 'achievements', 'profile'

/**
 * Load data based on active tab
 */
function loadData() {
    if (activeTab === 'posts') {
        loadPosts();
    } else if (activeTab === 'projects') {
        loadProjects();
    } else if (activeTab === 'experiences') {
        loadTeamMembers();
    } else if (activeTab === 'achievements') {
        loadEvents();
    } else if (activeTab === 'profile') {
        loadProfile();
    }
}

/**
 * Load dashboard statistics
 */
async function loadStats() {
    const { count: postsCount } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true });
    const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    const { count: experiencesCount } = await supabase.from('team_members').select('*', { count: 'exact', head: true });
    const { count: achievementsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });

    const statPosts = document.getElementById('stat-posts');
    const statProjects = document.getElementById('stat-projects');
    const statExperiences = document.getElementById('stat-experiences');
    const statAchievements = document.getElementById('stat-achievements');

    if (statPosts) statPosts.textContent = postsCount || 0;
    if (statProjects) statProjects.textContent = projectsCount || 0;
    if (statExperiences) statExperiences.textContent = experiencesCount || 0;
    if (statAchievements) statAchievements.textContent = achievementsCount || 0;
}

/**
 * Setup tab switching event listeners
 */
function setupTabListeners() {
    const tabs = ['posts', 'projects', 'experiences', 'achievements', 'profile'];

    tabs.forEach(tab => {
        const tabBtn = document.getElementById(`tab-${tab}`);
        if (tabBtn) {
            tabBtn.addEventListener('click', () => {
                activeTab = tab;
                switchTab(tab, loadData);
            });
        }
    });
}

/**
 * Setup New button event listener
 */
function setupNewButtonListener() {
    const newBtn = document.getElementById('new-btn');
    if (newBtn) {
        newBtn.addEventListener('click', () => {
            if (activeTab === 'posts') {
                createNewPost();
            } else if (activeTab === 'projects') {
                createNewProject();
            } else if (activeTab === 'experiences') {
                createNewTeamMember();
            } else if (activeTab === 'achievements') {
                createNewEvent();
            }
        });
    }
}

/**
 * Setup search event listener
 */
function setupSearchListener() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.post-item');
            items.forEach(item => {
                const title = item.querySelector('h3');
                if (title) {
                    item.style.display = title.textContent.toLowerCase().includes(term) ? 'flex' : 'none';
                }
            });
        });
    }
}

/**
 * Setup image upload listeners
 */
function setupImageUploadListeners() {
    // Blog image upload
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('image-upload');
    const urlInput = document.getElementById('post-image');

    if (uploadBtn && fileInput && urlInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                uploadBtn.textContent = 'Uploading...';
                uploadBtn.disabled = true;
                const url = await uploadImage(e.target.files[0]);
                if (url) urlInput.value = url;
                uploadBtn.textContent = 'Upload';
                uploadBtn.disabled = false;
                fileInput.value = '';
            }
        });
    }

    // Project image upload
    const pUploadBtn = document.getElementById('project-upload-btn');
    const pFileInput = document.getElementById('project-image-upload');
    const pUrlInput = document.getElementById('project-image');

    if (pUploadBtn && pFileInput && pUrlInput) {
        pUploadBtn.addEventListener('click', () => pFileInput.click());
        pFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                pUploadBtn.textContent = 'Uploading...';
                pUploadBtn.disabled = true;
                const url = await uploadImage(e.target.files[0]);
                if (url) pUrlInput.value = url;
                pUploadBtn.textContent = 'Upload';
                pUploadBtn.disabled = false;
                pFileInput.value = '';
            }
        });
    }

    // Achievement image upload
    const achievementUploadBtn = document.getElementById('achievement-upload-btn');
    const achievementFileInput = document.getElementById('achievement-image-upload');
    const achievementUrlInput = document.getElementById('achievement-image');

    if (achievementUploadBtn && achievementFileInput && achievementUrlInput) {
        achievementUploadBtn.addEventListener('click', () => achievementFileInput.click());
        achievementFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                achievementUploadBtn.textContent = 'Uploading...';
                achievementUploadBtn.disabled = true;
                const url = await uploadFile(e.target.files[0]);
                if (url) achievementUrlInput.value = url;
                achievementUploadBtn.textContent = 'Upload';
                achievementUploadBtn.disabled = false;
                achievementFileInput.value = '';
            }
        });
    }

    // Team member photo upload (portfolio-assets bucket, same as profile/events)
    const teamPhotoUploadBtn = document.getElementById('team_member-photo-upload-btn');
    const teamPhotoFileInput = document.getElementById('team_member-photo-upload');
    const teamPhotoUrlInput = document.getElementById('team_member-photo');
    const teamPhotoPreview = document.getElementById('team_member-photo-preview');

    if (teamPhotoUploadBtn && teamPhotoFileInput && teamPhotoUrlInput) {
        teamPhotoUploadBtn.addEventListener('click', () => teamPhotoFileInput.click());
        teamPhotoFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                teamPhotoUploadBtn.textContent = 'Uploading...';
                teamPhotoUploadBtn.disabled = true;
                const url = await uploadFile(e.target.files[0]);
                if (url) {
                    teamPhotoUrlInput.value = url;
                    if (teamPhotoPreview) {
                        teamPhotoPreview.src = url;
                        teamPhotoPreview.style.display = 'block';
                    }
                }
                teamPhotoUploadBtn.textContent = 'Upload';
                teamPhotoUploadBtn.disabled = false;
                teamPhotoFileInput.value = '';
            }
        });
    }

    // Profile hero image upload
    const heroUploadBtn = document.getElementById('profile-hero-upload-btn');
    const heroFileInput = document.getElementById('profile-hero-upload');
    const heroUrlInput = document.getElementById('profile-hero-image');
    const heroPreviewImg = document.getElementById('profile-hero-preview-img');

    if (heroUploadBtn && heroFileInput && heroUrlInput) {
        heroUploadBtn.addEventListener('click', () => heroFileInput.click());
        heroFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                heroUploadBtn.textContent = 'Uploading...';
                heroUploadBtn.disabled = true;
                const url = await uploadFile(e.target.files[0]);
                if (url) {
                    heroUrlInput.value = url;
                    if (heroPreviewImg) {
                        heroPreviewImg.src = url;
                        heroPreviewImg.style.display = 'block';
                    }
                }
                heroUploadBtn.textContent = 'Upload';
                heroUploadBtn.disabled = false;
                heroFileInput.value = '';
            }
        });
    }

    // Profile about image upload
    const aboutUploadBtn = document.getElementById('profile-about-upload-btn');
    const aboutFileInput = document.getElementById('profile-about-upload');
    const aboutUrlInput = document.getElementById('profile-about-image');
    const aboutPreviewImg = document.getElementById('profile-about-preview-img');

    if (aboutUploadBtn && aboutFileInput && aboutUrlInput) {
        aboutUploadBtn.addEventListener('click', () => aboutFileInput.click());
        aboutFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                aboutUploadBtn.textContent = 'Uploading...';
                aboutUploadBtn.disabled = true;
                const url = await uploadFile(e.target.files[0]);
                if (url) {
                    aboutUrlInput.value = url;
                    if (aboutPreviewImg) {
                        aboutPreviewImg.src = url;
                        aboutPreviewImg.style.display = 'block';
                    }
                }
                aboutUploadBtn.textContent = 'Upload';
                aboutUploadBtn.disabled = false;
                aboutFileInput.value = '';
            }
        });
    }

    // Profile CV upload
    const cvUploadBtn = document.getElementById('profile-cv-upload-btn');
    const cvFileInput = document.getElementById('profile-cv-upload');
    const cvUrlInput = document.getElementById('profile-cv');
    const cvStatus = document.getElementById('profile-cv-status');

    if (cvUploadBtn && cvFileInput && cvUrlInput) {
        cvUploadBtn.addEventListener('click', () => cvFileInput.click());
        cvFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                cvUploadBtn.textContent = 'Uploading...';
                cvUploadBtn.disabled = true;
                const url = await uploadFile(e.target.files[0]);
                if (url) {
                    cvUrlInput.value = url;
                    if (cvStatus) {
                        cvStatus.textContent = 'CV uploaded successfully!';
                        cvStatus.style.color = 'green';
                    }
                }
                cvUploadBtn.textContent = 'Upload';
                cvUploadBtn.disabled = false;
                cvFileInput.value = '';
            }
        });
    }
}

/**
 * Upload image to Supabase storage (for blog/project images)
 */
async function uploadImage(file) {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file);

    if (error) {
        console.error('Error uploading image:', error);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

    return publicUrl;
}

/**
 * Setup auto-generate slug listener
 */
function setupSlugGenerator() {
    const postTitle = document.getElementById('post-title');
    const postSlug = document.getElementById('post-slug');

    if (postTitle && postSlug) {
        postTitle.addEventListener('blur', (e) => {
            if (!postSlug.value) {
                postSlug.value = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '');
            }
        });
    }
}

/**
 * Setup all event listeners
 */
function setupAllEventListeners() {
    setupLoginForm();
    setupLogoutButton();
    setupTabListeners();
    setupNewButtonListener();
    setupSearchListener();
    setupBlogEditorListeners();
    setupProjectEditorListeners();
    setupTeamMemberEditorListeners();
    setupEventEditorListeners();
    setupProfileEditorListeners();
    setupImageUploadListeners();
    setupSlugGenerator();
}

/**
 * Callback when user is authenticated
 */
function onAuthenticated() {
    loadData();
    loadStats();
}

/**
 * Callback when user is not authenticated
 */
function onUnauthenticated() {
    // Nothing to do on login screen
}

/**
 * Initialize the admin panel
 */
document.addEventListener('DOMContentLoaded', async () => {
    initScreens();
    createToastContainer();
    setupAllEventListeners();
    await checkAuth(onAuthenticated, onUnauthenticated);
});
