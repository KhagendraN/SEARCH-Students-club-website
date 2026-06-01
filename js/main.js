/*===== PROJECT MODAL TECH ICONS (inlined so main.js has no import graph failures) =====*/
function getTechIconHTML(tech) {
    const map = {
        'Python': '<i class="fab fa-python"></i>',
        'Networking': '<i class="fas fa-network-wired"></i>',
        'AI': '<i class="fas fa-brain"></i>',
        'C': '<i class="fas fa-code"></i>',
        'Linux': '<i class="fab fa-linux"></i>',
        'Sockets': '<i class="fas fa-plug"></i>',
        'Java': '<i class="fab fa-java"></i>',
        'HTML': '<i class="fab fa-html5"></i>',
        'CSS': '<i class="fab fa-css3-alt"></i>',
        'React': '<i class="fab fa-react"></i>',
        'Bash Script': '<i class="fas fa-terminal"></i>',
        'Microcontroller': '<i class="fa-brands fa-raspberry-pi"></i>'
    }
    return map[tech] || '<i class="fas fa-code"></i>'
}

function getTechIconSpan(tech) {
    const trimmed = tech.trim()
    const iconHTML = getTechIconHTML(trimmed)
    return `<span class="project__modal-tech-icon" data-tech="${trimmed}" title="${trimmed}">${iconHTML}</span>`
}

/*===== MOBILE MENU, "OTHERS" DROPDOWN, THEME (after DOM; avoids races with parser / other scripts) =====*/
function initHeaderAndTheme() {
    const showMenu = (toggleId, navId) => {
        const toggle = document.getElementById(toggleId)
        const nav = document.getElementById(navId)
        if (toggle && nav) {
            toggle.addEventListener('click', () => {
                nav.classList.toggle('show')
            })
        }
    }
    showMenu('nav-toggle', 'nav-menu')

    const dropdown = document.getElementById('nav-dropdown-others')
    const othersToggle = document.getElementById('nav-others-toggle')
    if (dropdown && othersToggle) {
        othersToggle.addEventListener('click', (e) => {
            e.stopPropagation()
            const willOpen = !dropdown.classList.contains('is-open')
            document.querySelectorAll('.nav__dropdown.is-open').forEach(d => {
                d.classList.remove('is-open')
                d.querySelector('[aria-expanded]')?.setAttribute('aria-expanded', 'false')
            })
            if (willOpen) {
                dropdown.classList.add('is-open')
                othersToggle.setAttribute('aria-expanded', 'true')
            }
        })

        document.addEventListener('click', (e) => {
            if (dropdown.contains(e.target)) return
            window.setTimeout(() => {
                dropdown.classList.remove('is-open')
                othersToggle.setAttribute('aria-expanded', 'false')
            }, 0)
        })

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdown.classList.remove('is-open')
                othersToggle.setAttribute('aria-expanded', 'false')
            }
        })
    }

    function linkAction() {
        const navMenu = document.getElementById('nav-menu')
        if (navMenu) navMenu.classList.remove('show')
        document.querySelectorAll('.nav__dropdown.is-open').forEach(d => {
            d.classList.remove('is-open')
            const btn = d.querySelector('[aria-expanded]')
            if (btn) btn.setAttribute('aria-expanded', 'false')
        })
    }
    document.querySelectorAll('.nav__link').forEach(n => n.addEventListener('click', linkAction))

    const toggleBtn = document.getElementById('theme-toggle')
    if (!toggleBtn) return
    const icon = toggleBtn.querySelector('i')
    const root = document.documentElement
    const darkClass = 'dark-mode'
    function setTheme(dark) {
        if (dark) {
            root.classList.add(darkClass)
            if (icon) {
                icon.classList.remove('fa-moon')
                icon.classList.add('fa-sun')
            }
            toggleBtn.setAttribute('aria-label', 'Switch to light mode')
        } else {
            root.classList.remove(darkClass)
            if (icon) {
                icon.classList.remove('fa-sun')
                icon.classList.add('fa-moon')
            }
            toggleBtn.setAttribute('aria-label', 'Switch to dark mode')
        }
    }
    let dark = false
    if (localStorage.getItem('theme') === 'dark') {
        dark = true
    } else if (localStorage.getItem('theme') === 'light') {
        dark = false
    } else {
        dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    setTheme(dark)
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        dark = !root.classList.contains(darkClass)
        setTheme(dark)
        localStorage.setItem('theme', dark ? 'dark' : 'light')
    })
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderAndTheme, { once: true })
} else {
    initHeaderAndTheme()
}

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
/*==================== SCROLL SECTIONS ACTIVE LINK (IntersectionObserver) ====================*/
const sections = document.querySelectorAll('section[id]');
const DROPDOWN_SECTION_IDS = ['what-we-do', 'domains', 'objectives', 'benefits']

const activeLinkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            document.querySelectorAll('.nav__menu a').forEach(link => {
                link.classList.remove('active-link');
            });
            const activeLink = document.querySelector(`.nav__menu a[href="#${id}"]`)
            if (activeLink) activeLink.classList.add('active-link')
            const dropdown = document.getElementById('nav-dropdown-others')
            if (dropdown) {
                dropdown.classList.toggle('nav__dropdown--current', DROPDOWN_SECTION_IDS.includes(id))
            }
        }
    });
}, { threshold: 0.5 });

sections.forEach(section => activeLinkObserver.observe(section));

/*===== NAVBAR STICKY/FADE EFFECT ON SCROLL =====*/
/*===== NAVBAR STICKY (IntersectionObserver) =====*/
const header = document.querySelector('.l-header');
const topSentinel = document.createElement('div');
topSentinel.style.position = 'absolute';
topSentinel.style.top = '0';
topSentinel.style.height = '1px';
topSentinel.style.width = '100%';
topSentinel.style.zIndex = '-1';
if (document.body) document.body.prepend(topSentinel);

const navObserver = new IntersectionObserver((entries) => {
    if (!header) return;
    if (!entries[0].isIntersecting) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});
navObserver.observe(topSentinel);

/*===== SCROLL REVEAL ANIMATION =====*/
if (typeof ScrollReveal !== 'undefined') {
    const sr = ScrollReveal({
        origin: 'top',
        distance: '60px',
        duration: 2000,
        delay: 200,
        //     reset: true
    });

    sr.reveal('.home__data, .about__img, .skills__subtitle, .skills__text', {});
    sr.reveal('.home__img, .about__subtitle, .about__text, .skills__img', { delay: 400 });
    sr.reveal('.home__social-icon', { interval: 200 });
    sr.reveal('.skills__data, .work__img, .contact__input, .achievement__card, .ios-pillar-card, .ios-domain-card, .ios-panel', { interval: 200 });
} else {
    console.warn('ScrollReveal is not defined. Content will be visible by default.');
    // Ensure content is visible if ScrollReveal fails
    document.querySelectorAll('.home__data, .about__img, .skills__subtitle, .skills__text, .home__img, .about__subtitle, .about__text, .skills__img, .home__social-icon, .skills__data, .work__img, .contact__input').forEach(el => {
        el.style.visibility = 'visible';
        el.style.opacity = '1';
    });
}

/*===== SKILL BAR ANIMATION ON HOVER/FOCUS =====*/
/*===== SKILL BAR ANIMATION ON HOVER/FOCUS =====*/
document.querySelectorAll('.skills__data').forEach(skill => {
    const bar = skill.querySelector('.skills__bar');
    const percent = skill.querySelector('.skills__percentage');
    if (bar && percent) {
        const width = percent.textContent.trim();
        bar.style.transition = 'width 1s cubic-bezier(.77,0,.18,1)';
        skill.addEventListener('mouseenter', () => {
            bar.style.width = width;
        });
        skill.addEventListener('focus', () => {
            bar.style.width = width;
        });
        skill.addEventListener('mouseleave', () => {
            bar.style.width = '0';
        });
        skill.addEventListener('blur', () => {
            bar.style.width = '0';
        });
    }
});

/*===== PROJECT CARD MODAL PREVIEW (RICHER, BUTTON ONLY) =====*/
document.querySelectorAll('.project__details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.project__card');
        const modalTemplate = document.querySelector('.project__modal-template');
        if (!modalTemplate) return;
        const modal = document.createElement('div');
        modal.className = 'project__modal active';
        // Clone modal content
        const content = modalTemplate.firstElementChild.cloneNode(true);
        // Fill modal content from card data attributes
        content.querySelector('.project__modal-title').textContent = card.getAttribute('data-title') || '';
        content.querySelector('.project__modal-desc').textContent = card.getAttribute('data-desc') || '';
        const img = content.querySelector('.project__modal-img');
        img.src = card.getAttribute('data-img') || '';
        img.alt = card.getAttribute('data-title') || 'Project preview';
        // Tech stack icons
        const techs = (card.getAttribute('data-tech') || '').split(',');
        let techIcons = '';
        techs.forEach(tech => { if (tech.trim()) techIcons += getTechIconSpan(tech); });
        content.querySelector('.project__modal-tech-icons').innerHTML = techIcons;
        // Links
        let links = '';
        const github = card.getAttribute('data-github');
        if (github) links += '<a href="' + github + '" target="_blank" rel="noopener"><i class="fab fa-github"></i> GitHub</a>';
        const demo = card.getAttribute('data-demo');
        if (demo) links += '<a href="' + demo + '" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Demo/README</a>';
        content.querySelector('.project__modal-links').innerHTML = links;
        modal.appendChild(content);
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        content.querySelector('.project__modal-close').focus();
        // Close modal on click X or outside
        function closeModal() {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        }
        content.querySelector('.project__modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (ev) => {
            if (ev.target === modal) closeModal();
        });
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', esc); }
        });
    });
});

/*===== HERO SCROLL INDICATOR SMOOTH SCROLL =====*/
// Removed: CSS scroll-behavior: smooth handles this natively.

/*===== TIMELINE FADE-IN ON SCROLL =====*/
/*===== TIMELINE FADE-IN (IntersectionObserver) =====*/
const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
        } else {
            // Toggle back to hidden if desired, or remove this else block to keep it visible once revealed
            entry.target.style.opacity = 0;
            entry.target.style.transform = 'translateY(40px)';
        }
    });
}, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });

document.addEventListener('DOMContentLoaded', () => {
    // Initialize timeline items
    document.querySelectorAll('.timeline__item').forEach(item => {
        item.style.transition = 'opacity 0.7s, transform 0.7s';
        item.style.opacity = 0;
        item.style.transform = 'translateY(40px)';
        timelineObserver.observe(item);
    });

    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    const formStatus = document.getElementById('form-status');
    if (formStatus) { formStatus.textContent = ''; }
});

/*===== VIEW MORE/LESS PROJECTS BUTTONS =====*/
(() => {
    const moreBtn = document.getElementById('projects-more-btn');
    const lessBtn = document.getElementById('projects-less-btn');
    const hiddenProjects = document.querySelectorAll('.project--hidden');
    const projectsSection = document.getElementById('projects');
    if (!moreBtn || !lessBtn) return;
    moreBtn.addEventListener('click', () => {
        hiddenProjects.forEach(card => {
            card.style.display = '';
        });
        moreBtn.style.display = 'none';
        lessBtn.style.display = '';
    });
    lessBtn.addEventListener('click', () => {
        hiddenProjects.forEach(card => {
            card.style.display = 'none';
        });
        lessBtn.style.display = 'none';
        moreBtn.style.display = '';
        if (projectsSection) {
            projectsSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
})();

(() => {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const status = document.getElementById('form-status');
    function setStatus(msg, isError) {
        if (!status) return;
        status.textContent = msg;
        status.className = isError ? 'form-status form-status--error' : 'form-status form-status--ok';
        status.setAttribute('aria-live', 'polite');
    }
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    form.addEventListener('submit', (e) => {
        const name = form.querySelector('input[name="name"]');
        const email = form.querySelector('input[name="email"]');
        const message = form.querySelector('textarea[name="message"]');
        setStatus('', false);
        [name, email, message].forEach(el => { if (el) el.classList.remove('input-error'); });
        if (!name.value.trim()) {
            name.classList.add('input-error');
            name.focus();
            setStatus('Please enter your name.', true);
            e.preventDefault();
            return;
        }
        if (!email.value.trim() || !isValidEmail(email.value.trim())) {
            email.classList.add('input-error');
            email.focus();
            setStatus('Please provide a valid email address.', true);
            e.preventDefault();
            return;
        }
        if (!message.value.trim()) {
            message.classList.add('input-error');
            message.focus();
            setStatus('Please enter a message.', true);
            e.preventDefault();
            return;
        }
        // Allow submit to proceed for Formspree
    });
})();
