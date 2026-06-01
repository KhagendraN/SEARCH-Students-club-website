/**
 * Profile Admin Module
 * Handles profile management operations
 */

import { supabase } from '../../js/supabase-config.js';
import { showToast } from './ui-utils.js';

/**
 * Load profile data
 */
export async function loadProfile() {
    const { data: profile, error } = await supabase
        .from('profile')
        .select('*')
        .single();

    if (error) {
        console.error('Error loading profile:', error);
        return;
    }

    if (profile) {
        // Hero section
        const heroImageInput = document.getElementById('profile-hero-image');
        if (heroImageInput) {
            heroImageInput.value = profile.hero_image_url || '';
        }

        if (profile.hero_image_url) {
            const previewImg = document.getElementById('profile-hero-preview-img');
            if (previewImg) {
                previewImg.src = profile.hero_image_url;
                previewImg.style.display = 'block';
            }
        }

        // About section
        const aboutFields = [
            { id: 'profile-about-image', value: profile.about_image_url || '' },
            { id: 'profile-about-subtitle', value: profile.about_subtitle || '' },
            { id: 'profile-about-text', value: profile.about_text || '' }
        ];

        aboutFields.forEach(field => {
            const el = document.getElementById(field.id);
            if (el) el.value = field.value;
        });

        if (profile.about_image_url) {
            const aboutPreviewImg = document.getElementById('profile-about-preview-img');
            if (aboutPreviewImg) {
                aboutPreviewImg.src = profile.about_image_url;
                aboutPreviewImg.style.display = 'block';
            }
        }

        // CV section
        const cvInput = document.getElementById('profile-cv');
        if (cvInput) {
            cvInput.value = profile.cv_url || '';
        }

        if (profile.cv_url) {
            const cvStatus = document.getElementById('profile-cv-status');
            if (cvStatus) {
                cvStatus.textContent = 'Current CV uploaded';
            }
        }
    }
}

/**
 * Save profile data
 */
export async function saveProfile() {
    const saveBtn = document.getElementById('profile-save-btn');
    const statusSpan = document.getElementById('profile-save-status');

    if (saveBtn) saveBtn.disabled = true;
    if (statusSpan) statusSpan.textContent = 'Saving...';

    const profileData = {
        hero_image_url: document.getElementById('profile-hero-image').value,
        about_image_url: document.getElementById('profile-about-image').value,
        about_subtitle: document.getElementById('profile-about-subtitle').value,
        about_text: document.getElementById('profile-about-text').value,
        cv_url: document.getElementById('profile-cv').value,
        updated_at: new Date().toISOString()
    };

    // Check if profile exists
    const { data: existing } = await supabase
        .from('profile')
        .select('id')
        .single();

    let error;
    if (existing) {
        const result = await supabase
            .from('profile')
            .update(profileData)
            .eq('id', existing.id);
        error = result.error;
    } else {
        const result = await supabase
            .from('profile')
            .insert(profileData);
        error = result.error;
    }

    if (saveBtn) saveBtn.disabled = false;
    if (statusSpan) statusSpan.textContent = '';

    if (error) {
        showToast('Error saving profile: ' + error.message, 'error');
        console.error(error);
    } else {
        showToast('Profile saved successfully!', 'success');
    }
}

/**
 * Upload file to Supabase storage
 */
export async function uploadFile(file, bucket = 'portfolio-assets') {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

    if (error) {
        showToast('Error uploading file: ' + error.message, 'error');
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return publicUrl;
}

/**
 * Setup profile editor event listeners
 */
export function setupProfileEditorListeners() {
    const saveBtn = document.getElementById('profile-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
    }

    // Optional: Add image preview on URL change
    const heroImageInput = document.getElementById('profile-hero-image');
    if (heroImageInput) {
        heroImageInput.addEventListener('input', (e) => {
            const previewImg = document.getElementById('profile-hero-preview-img');
            if (previewImg && e.target.value) {
                previewImg.src = e.target.value;
                previewImg.style.display = 'block';
            }
        });
    }

    const aboutImageInput = document.getElementById('profile-about-image');
    if (aboutImageInput) {
        aboutImageInput.addEventListener('input', (e) => {
            const previewImg = document.getElementById('profile-about-preview-img');
            if (previewImg && e.target.value) {
                previewImg.src = e.target.value;
                previewImg.style.display = 'block';
            }
        });
    }
}
