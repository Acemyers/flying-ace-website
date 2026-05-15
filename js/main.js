/* ============================================================
   FLYING ACE'S PHOTOGRAPHY & DRONE SERVICES
   Main JavaScript
   ============================================================ */

/* ---- Navbar: add "scrolled" class after user scrolls 60px ---- */
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
}

/* ---- Mobile nav toggle ---- */
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('open');
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('open');
        });
    });
}

/* ---- Active nav link highlighting on scroll ---- */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-menu a:not(.nav-cta)');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - 130) {
            current = section.id;
        }
    });
    navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + current) {
            link.style.color = 'var(--gold)';
        }
    });
}, { passive: true });

/* ---- Fade-in on scroll (Intersection Observer) ---- */
const fadeTargets = document.querySelectorAll(
    '.service-card, .package-card, .addon-item, .why-card, .portfolio-cat, .ba-slider-card, .referral-inner'
);
fadeTargets.forEach(el => el.classList.add('fade-item'));

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.08 });

fadeTargets.forEach(el => fadeObserver.observe(el));

/* ---- Stagger fade-in for grid children ---- */
document.querySelectorAll('.services-grid, .why-grid, .addons-grid').forEach(grid => {
    grid.querySelectorAll('.fade-item').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.06}s`;
    });
});

/* ============================================================
   BEFORE / AFTER IMAGE SLIDERS
   Each .ba-slider contains:
     .ba-before  — bottom layer (full width)
     .ba-after   — top layer (clip-path controlled)
     .ba-handle  — the visual divider with circle
     .ba-range   — invisible range input driving everything
============================================================ */
document.querySelectorAll('[data-slider]').forEach(slider => {
    const range   = slider.querySelector('.ba-range');
    const after   = slider.querySelector('.ba-after');
    const handle  = slider.querySelector('.ba-handle');

    if (!range || !after || !handle) return;

    function updateSlider(val) {
        const pct = parseFloat(val);
        after.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        handle.style.left    = pct + '%';
    }

    updateSlider(50);

    range.addEventListener('input', () => updateSlider(range.value));

    /* Mark active while dragging so pulse + hint hide */
    range.addEventListener('pointerdown', () => slider.classList.add('ba-active'));
    range.addEventListener('pointerup',   () => slider.classList.remove('ba-active'));
    range.addEventListener('touchstart',  () => {}, { passive: true });

    /* Intro sweep: 50 → 25 → 75 → 50 when slider scrolls into view */
    let swept = false;
    const sweepObserver = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting || swept) return;
        swept = true;
        sweepObserver.disconnect();

        const DURATION = 1800;
        let start = null;

        setTimeout(() => {
            requestAnimationFrame(function sweep(ts) {
                if (!start) start = ts;
                const t = Math.min((ts - start) / DURATION, 1);
                let pct;
                if (t < 0.33) {
                    pct = 50 - 25 * (t / 0.33);
                } else if (t < 0.66) {
                    pct = 25 + 50 * ((t - 0.33) / 0.33);
                } else {
                    pct = 75 - 25 * ((t - 0.66) / 0.34);
                }
                updateSlider(pct);
                range.value = pct;
                if (t < 1) requestAnimationFrame(sweep);
            });
        }, 300);
    }, { threshold: 0.6 });

    sweepObserver.observe(slider);
});

/* ============================================================
   VIDEO MODAL
   Opens when a .play-btn inside a .video-service-card is clicked.
   The card's data-video-id attribute sets the YouTube embed src.
============================================================ */
const videoModal   = document.getElementById('videoModal');
const videoFrame   = document.getElementById('videoModalFrame');
const modalClose   = document.getElementById('videoModalClose');
const modalBackdrop = document.getElementById('videoModalBackdrop');

function openVideoModal(videoId) {
    if (!videoModal || !videoFrame) return;

    if (!videoId || videoId === 'YOUR_VIDEO_ID') {
        /* No video ID set yet — scroll to contact instead */
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    videoModal.classList.add('open');
    videoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    if (!videoModal || !videoFrame) return;
    videoFrame.src = '';
    videoModal.classList.remove('open');
    videoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

/* Attach play button listeners */
document.querySelectorAll('.video-service-card').forEach(card => {
    const btn     = card.querySelector('.play-btn');
    const videoId = card.dataset.videoId || '';
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openVideoModal(videoId);
        });
    }
});

if (modalClose)   modalClose.addEventListener('click', closeVideoModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', closeVideoModal);

/* ESC key closes modal */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideoModal();
});

/* ---- Photo strip play buttons ---- */
document.querySelectorAll('.strip-has-play').forEach(item => {
    const btn     = item.querySelector('.strip-play');
    const videoId = item.dataset.videoId || '';
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openVideoModal(videoId);
        });
    }
});

/* ---- Service area popup toggle ---- */
const areaBtn   = document.getElementById('areaBtn');
const areaPopup = document.getElementById('areaPopup');

if (areaBtn && areaPopup) {
    areaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = areaPopup.classList.toggle('open');
        areaBtn.setAttribute('aria-expanded', open);
        areaPopup.setAttribute('aria-hidden', !open);
    });
    document.addEventListener('click', () => {
        areaPopup.classList.remove('open');
        areaBtn.setAttribute('aria-expanded', 'false');
        areaPopup.setAttribute('aria-hidden', 'true');
    });
}

/* ============================================================
   CONTACT FORM — local preview confirmation
   (Netlify handles the real POST when deployed)
============================================================ */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        if (
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === 'localhost' ||
            window.location.protocol === 'file:'
        ) {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const original = btn.textContent;
            btn.textContent = 'Request Sent! ✓';
            btn.style.background   = '#2a7a55';
            btn.style.borderColor  = '#2a7a55';
            btn.disabled = true;
            setTimeout(() => {
                btn.textContent      = original;
                btn.style.background  = '';
                btn.style.borderColor = '';
                btn.disabled = false;
                contactForm.reset();
            }, 4000);
        }
    });
}
