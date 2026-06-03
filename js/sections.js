/**
 * Sections Module
 * Handles initialization of all page sections with dynamic content
 */

import { fetchProjects } from './projects-api.js';
import { fetchEvents } from './events-api.js';
import { fetchGalleryItems } from './gallery-api.js';
import { fetchTeamMembers } from './team-api.js';
import { fetchProfile } from './profile-api.js';
import { getTechIconHTML } from './utils.js';

/**
 * Initialize Skills Accordion
 */
export function initSkillsAccordion() {
    const skillGroups = document.querySelectorAll('.skills__group');
    if (skillGroups.length === 0) return;

    skillGroups.forEach(group => {
        const category = group.querySelector('.skills__category');

        category.addEventListener('click', () => {
            // Close all other groups
            skillGroups.forEach(otherGroup => {
                if (otherGroup !== group) {
                    otherGroup.classList.remove('active');
                }
            });

            // Toggle current group
            group.classList.toggle('active');
        });
    });
}

/**
 * Initialize Projects Section
 */
export async function initProjects() {
    const container = document.getElementById('projects-container');
    const controls = document.getElementById('projects-controls');
    const moreBtn = document.getElementById('projects-more-btn');
    const lessBtn = document.getElementById('projects-less-btn');

    if (!container) return;

    try {
        const projects = await fetchProjects();
        container.innerHTML = '';

        if (projects.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">No articles published yet.</div>';
            return;
        }

        // Separate pinned and others
        const pinned = projects.filter(p => p.is_pinned);
        const others = projects.filter(p => !p.is_pinned);

        // Render function
        const createCard = (p, hidden = false) => {
            const card = document.createElement('div');
            card.className = 'project__card';
            if (hidden) {
                card.classList.add('project--hidden');
                card.style.display = 'none';
            }

            // Tech icons
            const techStack = p.tech_stack || [];
            const iconsHtml = techStack.map(t => `<span title="${t}">${getTechIconHTML(t)}</span>`).join(' ');

            card.innerHTML = `
                <img src="${p.image_url || 'assets/img/themeimage.jpeg'}" alt="${p.title}" class="project__img" loading="lazy">
                <div class="project__info">
                    <h3 class="project__title">${p.title}</h3>
                    <div class="project__tech-icons">${iconsHtml}</div>
                    ${p.github_url ? `<a href="${p.github_url}" class="project__link" target="_blank" rel="noopener"><i class="fas fa-file-pdf"></i> Article PDF</a>` : ''}
                    <button class="project__details-btn" type="button">Read Summary</button>
                </div>
            `;

            // Attach click event for modal
            const btn = card.querySelector('.project__details-btn');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openProjectModal(p);
            });

            return card;
        };

        // Append Pinned
        pinned.forEach(p => container.appendChild(createCard(p)));

        // Append Others (Hidden)
        others.forEach(p => container.appendChild(createCard(p, true)));

        // Show/Hide Controls
        if (others.length > 0 && controls && moreBtn && lessBtn) {
            controls.style.display = 'block';

            moreBtn.addEventListener('click', () => {
                document.querySelectorAll('.project--hidden').forEach(el => {
                    el.style.display = 'block';
                    el.style.animation = 'fadeIn 0.5s ease';
                });
                moreBtn.style.display = 'none';
                lessBtn.style.display = 'inline-block';
            });

            lessBtn.addEventListener('click', () => {
                document.querySelectorAll('.project--hidden').forEach(el => {
                    el.style.display = 'none';
                });
                moreBtn.style.display = 'inline-block';
                lessBtn.style.display = 'none';
                document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
            });
        }

    } catch (err) {
        console.error('Error loading articles:', err);
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: red;">Error loading articles.</div>';
    }
}

/**
 * Open Project Modal
 */
function openProjectModal(p) {
    const modalTemplate = document.querySelector('.project__modal-template');
    if (!modalTemplate) return;

    const modal = document.createElement('div');
    modal.className = 'project__modal active';
    const content = modalTemplate.querySelector('.project__modal-content').cloneNode(true);

    content.querySelector('.project__modal-img').src = p.image_url || 'assets/img/themeimage.jpeg';
    content.querySelector('.project__modal-title').textContent = p.title;
    content.querySelector('.project__modal-desc').textContent = p.description;

    // Tech icons
    const techStack = p.tech_stack || [];
    content.querySelector('.project__modal-tech-icons').innerHTML = techStack.map(t =>
        `<span class="tech-tag">${getTechIconHTML(t)} ${t}</span>`
    ).join('');

    // Links
    let links = '';
    if (p.github_url) links += `<a href="${p.github_url}" target="_blank"><i class="fas fa-file-pdf"></i> Article PDF</a>`;
    if (p.demo_url) links += `<a href="${p.demo_url}" target="_blank"><i class="fas fa-external-link-alt"></i> Full Text</a>`;
    content.querySelector('.project__modal-links').innerHTML = links;

    modal.appendChild(content);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const closeBtn = content.querySelector('.project__modal-close');
    const closeModal = () => {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

/**
 * Normalize event description for display: CMS newlines, plus breaks before common
 * metadata labels when the blurp was saved as a single line (spaces only).
 */
function formatEventDescriptionDisplay(raw) {
    if (typeof raw !== 'string') return '';
    let s = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!s) return '';
    // "…students. Time :" → line break before label (spaces after punctuation only)
    s = s.replace(/([.!?])([ \t]+)((?:Time|Days|Duration|Date|Location|When|Where)\s*:)/gi, '$1\n$3');
    // "…2 Hours Days :" → second line still on one row
    s = s.replace(/([Hh]ours)( +)([Dd]ays\s*:)/gi, '$1\n$3');
    return s;
}

function setEventDescription(el, raw) {
    el.replaceChildren();
    const s = formatEventDescriptionDisplay(raw);
    if (!s) return;
    const lines = s.split('\n');
    lines.forEach((part, i) => {
        el.appendChild(document.createTextNode(part));
        if (i < lines.length - 1) el.appendChild(document.createElement('br'));
    });
}

/**
 * Initialize Events section (achievement-style cards; image + registration link from admin)
 */
export async function initEvents() {
    const container = document.getElementById('events-container');
    if (!container) return;

    try {
        const events = await fetchEvents();
        container.innerHTML = '';

        if (events.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">No events found.</div>';
            return;
        }

        events.forEach(a => {
            const card = document.createElement('div');
            card.className = 'achievement__card';

            const imageUrl = typeof a.image_url === 'string' ? a.image_url.trim() : '';
            const linkUrl = typeof a.link_url === 'string' ? a.link_url.trim() : '';
            const title = typeof a.title === 'string' ? a.title : '';
            const dateStr = a.event_date
                ? new Date(a.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '';
            const loc = typeof a.location === 'string' ? a.location.trim() : '';

            let leftColumn;
            if (linkUrl && imageUrl) {
                const anchor = document.createElement('a');
                anchor.className = 'achievement__icon-link';
                anchor.href = linkUrl;
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
                anchor.setAttribute('aria-label', `${title || 'Event'} — open registration link`);
                const img = document.createElement('img');
                img.className = 'achievement__image';
                img.src = imageUrl;
                img.alt = title || 'Event image';
                img.loading = 'lazy';
                img.decoding = 'async';
                const fallback = document.createElement('i');
                fallback.className = 'fas fa-calendar-alt achievement__fallback-icon';
                fallback.setAttribute('aria-hidden', 'true');
                fallback.style.display = 'none';
                img.addEventListener('error', () => {
                    img.style.display = 'none';
                    fallback.style.display = 'flex';
                });
                anchor.appendChild(img);
                anchor.appendChild(fallback);
                leftColumn = anchor;
            } else if (imageUrl) {
                const wrap = document.createElement('div');
                wrap.className = 'achievement__icon';
                const img = document.createElement('img');
                img.className = 'achievement__image';
                img.src = imageUrl;
                img.alt = title || 'Event image';
                img.loading = 'lazy';
                img.decoding = 'async';
                const fallback = document.createElement('i');
                fallback.className = 'fas fa-calendar-alt achievement__fallback-icon';
                fallback.setAttribute('aria-hidden', 'true');
                fallback.style.display = 'none';
                img.addEventListener('error', () => {
                    img.style.display = 'none';
                    fallback.style.display = 'flex';
                });
                wrap.appendChild(img);
                wrap.appendChild(fallback);
                leftColumn = wrap;
            } else if (linkUrl) {
                const anchor = document.createElement('a');
                anchor.className = 'achievement__icon-link';
                anchor.href = linkUrl;
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
                anchor.setAttribute('aria-label', 'Open registration link');
                const icon = document.createElement('i');
                icon.className = 'fas fa-link';
                icon.setAttribute('aria-hidden', 'true');
                anchor.appendChild(icon);
                leftColumn = anchor;
            } else {
                const wrap = document.createElement('div');
                wrap.className = 'achievement__icon';
                const icon = document.createElement('i');
                icon.className = 'fas fa-calendar-alt';
                icon.setAttribute('aria-hidden', 'true');
                wrap.appendChild(icon);
                leftColumn = wrap;
            }

            const content = document.createElement('div');
            content.className = 'achievement__content';

            const h3 = document.createElement('h3');
            h3.className = 'achievement__title';
            h3.textContent = title;

            const issuer = document.createElement('p');
            issuer.className = 'achievement__issuer';
            issuer.textContent = [loc, dateStr].filter(Boolean).join(' • ');

            const desc = document.createElement('p');
            desc.className = 'achievement__desc';
            setEventDescription(desc, a.description);

            content.appendChild(h3);
            content.appendChild(issuer);
            content.appendChild(desc);

            if (linkUrl) {
                const reg = document.createElement('a');
                reg.href = linkUrl;
                reg.className = 'achievement__link';
                reg.target = '_blank';
                reg.rel = 'noopener noreferrer';
                reg.appendChild(document.createTextNode('Register / details '));
                const ext = document.createElement('i');
                ext.className = 'fas fa-external-link-alt';
                ext.setAttribute('aria-hidden', 'true');
                reg.appendChild(ext);
                content.appendChild(reg);
            }

            card.appendChild(leftColumn);
            card.appendChild(content);
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading events:', err);
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: red;">Error loading events.</div>';
    }
}

/**
 * Initialize Gallery section (mixed photos + videos)
 */
export async function initGallery() {
    const container = document.getElementById('gallery-container');
    if (!container) return;

    try {
        const items = await fetchGalleryItems();
        container.innerHTML = '';

        if (!items.length) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">No gallery items found.</div>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('article');
            card.className = 'gallery__card';

            const mediaWrap = document.createElement('div');
            mediaWrap.className = 'gallery__media-wrap';

            const title = typeof item.title === 'string' ? item.title : 'Gallery item';
            const mediaUrl = typeof item.media_url === 'string' ? item.media_url.trim() : '';
            const thumbUrl = typeof item.thumbnail_url === 'string' ? item.thumbnail_url.trim() : '';

            if (item.media_type === 'video') {
                const video = document.createElement('video');
                video.className = 'gallery__media';
                video.controls = true;
                video.preload = 'metadata';
                video.playsInline = true;
                if (thumbUrl) video.poster = thumbUrl;
                if (mediaUrl) video.src = mediaUrl;
                video.setAttribute('aria-label', title);
                mediaWrap.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.className = 'gallery__media';
                img.loading = 'lazy';
                img.decoding = 'async';
                img.alt = title;
                img.src = mediaUrl;
                mediaWrap.appendChild(img);
            }

            const body = document.createElement('div');
            body.className = 'gallery__body';

            const heading = document.createElement('h3');
            heading.className = 'gallery__title';
            heading.textContent = title;

            body.appendChild(heading);

            if (item.caption) {
                const caption = document.createElement('p');
                caption.className = 'gallery__caption';
                caption.textContent = item.caption;
                body.appendChild(caption);
            }

            card.appendChild(mediaWrap);
            card.appendChild(body);
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading gallery:', err);
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: red;">Error loading gallery.</div>';
    }
}

/**
 * Initialize Experience/Timeline Section
 */
export async function initTeam() {
    const container = document.getElementById('team-container');
    const controls = document.getElementById('team-controls');
    const moreBtn = document.getElementById('team-more-btn');
    const lessBtn = document.getElementById('team-less-btn');
    if (!container) return;

    try {
        const team = await fetchTeamMembers();
        container.innerHTML = '';

        if (team.length === 0) {
            container.innerHTML = '<div style="text-align: center;">No team members found.</div>';
            return;
        }

        team.forEach((exp, index) => {
            const item = document.createElement('div');
            item.className = 'team__card';
            if (index >= 3) {
                item.classList.add('team--hidden');
                item.style.display = 'none';
            }
            const fullNameText = typeof exp.full_name === 'string' ? exp.full_name.trim() : '';
            const roleTitleText = typeof exp.role === 'string' ? exp.role.trim() : '';
            const displayName = fullNameText || roleTitleText;
            const subtitleRole = fullNameText && roleTitleText ? roleTitleText : '';

            if (exp.image_url) {
                const wrap = document.createElement('div');
                wrap.className = 'team__photo-wrap';
                const img = document.createElement('img');
                img.className = 'team__photo';
                img.src = exp.image_url;
                img.alt = displayName ? `${displayName} photo` : 'Team member';
                img.loading = 'lazy';
                img.decoding = 'async';
                wrap.appendChild(img);
                item.appendChild(wrap);
            }

            const header = document.createElement('div');
            header.className = 'team__header';
            if (displayName) {
                const h3 = document.createElement('h3');
                h3.className = 'team__name';
                h3.textContent = displayName;
                header.appendChild(h3);
            }
            if (subtitleRole) {
                const sub = document.createElement('div');
                sub.className = 'team__title-role';
                sub.textContent = subtitleRole;
                header.appendChild(sub);
            }
            const dateEl = document.createElement('div');
            dateEl.className = 'team__date';
            dateEl.textContent = exp.tenure || '';
            header.appendChild(dateEl);

            const content = document.createElement('div');
            content.className = 'team__content';
            const p = document.createElement('p');
            p.className = 'team__desc';
            p.textContent = exp.description || '';

            content.appendChild(p);
            item.appendChild(header);
            item.appendChild(content);

            container.appendChild(item);
        });

        if (team.length > 3 && controls && moreBtn && lessBtn) {
            controls.style.display = 'block';

            moreBtn.addEventListener('click', () => {
                container.querySelectorAll('.team--hidden').forEach(el => {
                    el.style.display = 'block';
                    el.style.animation = 'fadeIn 0.5s ease';
                });
                moreBtn.style.display = 'none';
                lessBtn.style.display = 'inline-block';
            });

            lessBtn.addEventListener('click', () => {
                container.querySelectorAll('.team--hidden').forEach(el => {
                    el.style.display = 'none';
                });
                moreBtn.style.display = 'inline-block';
                lessBtn.style.display = 'none';
                document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' });
            });
        } else if (controls) {
            controls.style.display = 'none';
        }

    } catch (err) {
        console.error('Error loading experiences:', err);
        container.innerHTML = '<div style="text-align: center; color: red;">Error loading team.</div>';
    }
}

/**
 * Initialize Profile Data
 */
export async function initProfile() {
    try {
        const profile = await fetchProfile();
        if (!profile) return;

        // Update hero image
        if (profile.hero_image_url) {
            const heroImg = document.querySelector('.hero__img');
            if (heroImg) {
                heroImg.src = profile.hero_image_url;
            }
        }

        // Update About section
        if (profile.about_image_url) {
            const aboutImg = document.querySelector('.about__img');
            if (aboutImg) {
                aboutImg.src = profile.about_image_url;
            }
        }
        if (profile.about_subtitle) {
            const aboutSubtitle = document.querySelector('.about__subtitle');
            if (aboutSubtitle) {
                aboutSubtitle.textContent = profile.about_subtitle;
            }
        }
        if (profile.about_text) {
            const aboutText = document.querySelector('.about__text');
            if (aboutText) {
                aboutText.textContent = profile.about_text;
            }
        }

    } catch (err) {
        console.error('Error loading profile:', err);
    }
}

/**
 * Initialize Footer Year
 */
export function initFooterYear() {
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }
}

/**
 * Initialize Scroll to Top Button
 */
export function initScrollToTop() {
    const scrollTopBtn = document.querySelector('.footer__top');
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

/**
 * Initialize All Sections
 */
export function initAllSections() {
    document.addEventListener('DOMContentLoaded', async () => {
        // Initialize all sections
        initSkillsAccordion();
        initFooterYear();
        initScrollToTop();

        // Initialize async sections
        await Promise.all([
            initProjects(),
            initEvents(),
            initGallery(),
            initTeam(),
            initProfile()
        ]);
    });
}

// Auto-initialize when module is imported
initAllSections();
