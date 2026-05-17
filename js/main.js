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
    '.service-card, .addon-item, .ba-slider-card'
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
document.querySelectorAll('.services-grid, .addons-grid').forEach(grid => {
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
   CONTACT FORM — AJAX submit + success popup
   Submits to Netlify without a page redirect, then shows popup.
============================================================ */
const contactForm    = document.getElementById('contactForm');
const successOverlay = document.getElementById('successOverlay');
const successClose   = document.getElementById('successClose');

function showSuccess() {
    if (!successOverlay) return;
    successOverlay.classList.add('open');
    successOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function hideSuccess() {
    if (!successOverlay) return;
    successOverlay.classList.remove('open');
    successOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

if (successClose)   successClose.addEventListener('click', hideSuccess);
if (successOverlay) successOverlay.addEventListener('click', (e) => {
    if (e.target === successOverlay) hideSuccess();
});

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Sending...';

        try {
            const formData = new FormData(contactForm);
            await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            });
            contactForm.reset();
            showSuccess();
        } catch (err) {
            alert('Something went wrong. Please try again or call us directly.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Send Request';
        }
    });
}

/* ============================================================
   PAGE TRANSITIONS — PAGE SPECIFIC
   iris : portfolio pages + homepage
   warm : about page (gold both ways)
   none : everything else (instant nav, no overlay)
============================================================ */
(function () {
    function ptType(url) {
        var u = (url || window.location.href).toLowerCase();
        if (u.indexOf('portfolio')  !== -1) return 'iris';
        if (u.indexOf('about.html') !== -1) return 'warm';
        if (u.indexOf('index.html') !== -1) return 'iris';
        // Root URL — ends with / or domain only
        try {
            var path = new URL(u, window.location.href).pathname;
            if (path === '/' || path === '') return 'iris';
        } catch(e) {}
        return 'none';
    }

    // Enter animation for the current page
    var enterType = ptType();
    if (enterType !== 'none') {
        var enterOverlay = document.createElement('div');
        enterOverlay.className = 'pt-overlay ' + enterType;
        document.body.appendChild(enterOverlay);
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                enterOverlay.classList.add('pt-open');
            });
        });
    }

    var navigating = false;

    document.addEventListener('click', function(e) {
        var link = e.target.closest('a[href]');
        if (!link || navigating) return;
        var href = link.getAttribute('href');
        if (!href) return;
        if (href.charAt(0) === '#') return;
        if (href.indexOf('tel:') === 0 || href.indexOf('mailto:') === 0) return;
        if (link.target === '_blank') return;
        if (href.indexOf('http') === 0 && href.indexOf('flyingacesmedia.com') === -1) return;

        var destType = ptType(href);
        if (destType === 'none') return; // instant nav, no animation

        e.preventDefault();
        navigating = true;

        var exitOverlay = document.createElement('div');
        exitOverlay.className = 'pt-overlay ' + destType;
        document.body.appendChild(exitOverlay);
        exitOverlay.getBoundingClientRect();
        exitOverlay.classList.add('pt-close');

        setTimeout(function() { window.location.href = href; }, 600);
    });
})();

/* ============================================================
   SCROLL REVEAL — CLASS SETUP
   Classes applied here; GSAP ScrollTrigger handles animation.
============================================================ */
(function () {
    document.querySelectorAll('.section-title, .about-section-heading, .section-eyebrow').forEach(el => {
        el.classList.add('reveal-left');
    });
    document.querySelectorAll('.why-card').forEach((el, i) => {
        el.classList.add(i % 2 === 0 ? 'reveal-left' : 'reveal-right');
        el.style.transitionDelay = `${i * 0.07}s`;
    });
    document.querySelectorAll('.package-card').forEach((el, i) => {
        el.classList.add('reveal-scale');
        el.style.transitionDelay = `${i * 0.09}s`;
    });
    document.querySelectorAll('.standard-pillar').forEach((el, i) => {
        el.classList.add(i % 2 === 0 ? 'reveal-left' : 'reveal-right');
        el.style.transitionDelay = `${i * 0.1}s`;
    });
    document.querySelectorAll('.referral-inner, .about-cta').forEach(el => {
        el.classList.add('reveal-up');
    });
    document.querySelectorAll('.faq-item').forEach((el, i) => {
        el.classList.add('reveal-up');
        el.style.transitionDelay = `${i * 0.06}s`;
    });
    document.querySelectorAll('.portfolio-cat').forEach((el, i) => {
        el.classList.add('reveal-scale');
        el.style.transitionDelay = `${i * 0.08}s`;
    });
})();

/* ============================================================
   SERVICES FAN — CLASS SETUP
   Direction classes applied here; GSAP handles triggering.
============================================================ */
(function () {
    document.querySelectorAll('.services-full-grid').forEach(grid => {
        const cols = window.innerWidth <= 540 ? 1 : window.innerWidth <= 860 ? 2 : 3;
        grid.querySelectorAll('.service-card').forEach((card, i) => {
            const col = i % cols;
            if (cols === 1)      card.classList.add('fan-center');
            else if (cols === 2) card.classList.add(col === 0 ? 'fan-left' : 'fan-right');
            else {
                if (col === 0)      card.classList.add('fan-left');
                else if (col === 1) card.classList.add('fan-center');
                else                card.classList.add('fan-right');
            }
            card.style.transitionDelay = `${i * 0.07}s`;
        });
    });
})();

/* ============================================================
   GSAP — SCROLL-REVERSIBLE REVEALS + HOMEPAGE HERO PIN
============================================================ */
(function () {
    const GSAP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    const ST_URL   = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';

    function loadScript(src, cb) {
        const s = document.createElement('script');
        s.src = src;
        s.onload = cb;
        s.onerror = function () {
            // CDN failed — fall back to simple one-way reveal
            document.querySelectorAll('.reveal-left,.reveal-right,.reveal-up,.reveal-scale,.fan-left,.fan-center,.fan-right').forEach(el => {
                el.classList.add('revealed');
                el.classList.add('fan-visible');
            });
        };
        document.head.appendChild(s);
    }

    loadScript(GSAP_URL, function () {
        loadScript(ST_URL, initGSAP);
    });

    function initGSAP() {
        gsap.registerPlugin(ScrollTrigger);

        var isMobile = window.innerWidth <= 768;

        // Scroll-reversible reveals (class-based CSS transitions)
        document.querySelectorAll('.reveal-left,.reveal-right,.reveal-up,.reveal-scale').forEach(el => {
            if (isMobile) {
                el.classList.add('revealed');
            } else {
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 90%',
                    onEnter:     () => el.classList.add('revealed'),
                    onLeaveBack: () => el.classList.remove('revealed'),
                    onEnterBack: () => el.classList.add('revealed'),
                });
            }
        });

        // Services fan — class toggling so cards are never permanently invisible
        document.querySelectorAll('.services-full-grid .service-card').forEach(function(card, i) {
            var delay = i * 0.07;
            if (isMobile) {
                card.classList.add('fan-visible');
            } else {
                ScrollTrigger.create({
                    trigger: card,
                    start: 'top 95%',
                    onEnter: function() {
                        card.style.transitionDelay = delay + 's';
                        card.classList.add('fan-visible');
                    },
                    onLeaveBack: function() {
                        card.style.transitionDelay = '0s';
                        card.classList.remove('fan-visible');
                    },
                    onEnterBack: function() {
                        card.style.transitionDelay = delay + 's';
                        card.classList.add('fan-visible');
                    },
                });
            }
        });

        // Homepage hero scroll effect — desktop only (pin breaks on mobile browsers)
        var isHome = window.location.href.toLowerCase().indexOf('index.html') !== -1
                  || window.location.pathname === '/'
                  || window.location.pathname === '';
        if (isHome && !isMobile) {
            var hero = document.querySelector('.hero');
            var heroContent = hero && hero.querySelector('.hero-content');
            if (hero && heroContent) {
                gsap.timeline({
                    scrollTrigger: {
                        trigger: hero,
                        start: 'top top',
                        end: '+=600',
                        scrub: 1,
                        pin: true,
                        anticipatePin: 1,
                    }
                })
                .to(heroContent, { y: -120, opacity: 0, ease: 'none' }, 0)
                .to('.hero-scroll-hint', { opacity: 0, ease: 'none' }, 0)
                .to('.hero-overlay', { opacity: 0, ease: 'none' }, 0);
            }
        }
    }
})();

