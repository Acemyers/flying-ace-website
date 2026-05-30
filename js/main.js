/* ============================================================
   FLYING ACE'S PHOTOGRAPHY & DRONE SERVICES
   Main JavaScript
   ============================================================ */

const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Navbar: add "scrolled" class after user scrolls 60px ---- */
const navbar = document.getElementById('navbar');
if (navbar) {
    function updateNavbarState() {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
    }
    updateNavbarState();
    window.addEventListener('scroll', updateNavbarState, { passive: true });
}

/* ---- Mobile nav toggle ---- */
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

if (navToggle && navMenu) {
    function closeMobileNav() {
        navToggle.classList.remove('active');
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    }

    navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = navMenu.classList.toggle('open');
        navToggle.classList.toggle('active', open);
        navToggle.setAttribute('aria-expanded', String(open));
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            closeMobileNav();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileNav();
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

/* ---- Homepage listing launch animation ---- */
(function () {
    const launchKit = document.querySelector('.launch-kit');
    if (!launchKit) return;

    launchKit.classList.add('launch-ready');

    if (prefersReducedMotion) {
        launchKit.classList.add('is-visible');
        return;
    }

    const launchObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            launchKit.classList.toggle('is-visible', entry.isIntersecting);
        });
    }, { threshold: 0.28 });

    launchObserver.observe(launchKit);
})();

/* ---- Homepage portfolio preview image rotators ---- */
(function () {
    const cards = document.querySelectorAll('[data-preview-rotator]');
    if (!cards.length) return;

    cards.forEach((card, cardIndex) => {
        const images = Array.from(card.querySelectorAll('.portfolio-preview-media img'));
        if (images.length < 2) return;

        let activeIndex = images.findIndex(img => img.classList.contains('is-active'));
        if (activeIndex < 0) activeIndex = 0;

        images.forEach((img, index) => {
            img.classList.toggle('is-active', index === activeIndex);
        });

        if (prefersReducedMotion) return;

        let timer = null;
        let hasQuickAdvanced = false;
        let inView = !('IntersectionObserver' in window);
        const firstDelay = 700 + (cardIndex * 120);
        const interval = 3400 + (cardIndex * 180);

        function advance() {
            images[activeIndex].classList.remove('is-active');
            activeIndex = (activeIndex + 1) % images.length;
            images[activeIndex].classList.add('is-active');
        }

        function start() {
            if (!inView || timer || document.hidden) return;
            timer = window.setTimeout(function cycle() {
                advance();
                hasQuickAdvanced = true;
                timer = window.setTimeout(cycle, interval);
            }, hasQuickAdvanced ? interval : firstDelay);
        }

        function stop() {
            if (!timer) return;
            window.clearTimeout(timer);
            timer = null;
        }

        if ('IntersectionObserver' in window) {
            const previewObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    inView = entry.isIntersecting;
                    if (inView) start();
                    else stop();
                });
            }, { threshold: 0.22 });

            previewObserver.observe(card);
        } else {
            window.setTimeout(start, cardIndex * 450);
        }

        card.addEventListener('mouseenter', stop);
        card.addEventListener('mouseleave', start);
        card.addEventListener('focusin', stop);
        card.addEventListener('focusout', start);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stop();
            else start();
        });
    });
})();

/* ---- Mobile sticky home/book/call actions ---- */
(function () {
    const path = window.location.pathname.toLowerCase();
    if (path.indexOf('/agents/') !== -1 || path.indexOf('/listings/') !== -1 || path.endsWith('/prep-guide-print.html')) {
        return;
    }

    const bar = document.createElement('nav');
    bar.className = 'mobile-action-bar';
    bar.setAttribute('aria-label', 'Quick actions');
    bar.innerHTML = `
        <a href="index.html"><span aria-hidden="true">&#8962;</span>Home</a>
        <a href="book.html" class="mobile-action-book"><span aria-hidden="true">&#10003;</span>Book</a>
        <a href="tel:3862924315"><span aria-hidden="true">&#9742;</span>Call/Text</a>
    `;
    document.body.appendChild(bar);
    document.body.classList.add('has-mobile-actions');

    function updateMobileActions() {
        const shouldShow = window.innerWidth <= 768 && window.scrollY > 220;
        bar.classList.toggle('is-visible', shouldShow);
    }

    window.addEventListener('scroll', updateMobileActions, { passive: true });
    window.addEventListener('resize', updateMobileActions);
    updateMobileActions();
})();

/* ============================================================
   BEFORE / AFTER IMAGE SLIDERS
   Each .ba-slider contains:
     .ba-before  - bottom layer (full width)
     .ba-after   - top layer (clip-path controlled)
     .ba-handle  - the visual divider with circle
     .ba-range   - invisible range input driving everything
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

    if (prefersReducedMotion) return;

    /* Intro sweep: 50 -> 25 -> 75 -> 50 when slider scrolls into view */
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

    if (!videoId) {
        /* No video ID set yet - scroll to contact instead */
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
   CONTACT FORM - AJAX submit + success popup
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
        const originalText = btn ? btn.textContent : '';
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Sending...';
        }

        try {
            const formData = new FormData(contactForm);
            const response = await fetch(contactForm.getAttribute('action') || window.location.pathname || '/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            });
            if (!response.ok) {
                throw new Error('Form submission failed: ' + response.status);
            }
            contactForm.reset();
            showSuccess();
        } catch (err) {
            console.error('Form submission failed. Falling back to native submit.', err);
            contactForm.dataset.nativeFallback = 'true';
            contactForm.submit();
            return;
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = originalText || 'Send Request';
            }
        }
    });
}

/* ============================================================
   PAGE TRANSITIONS - PAGE SPECIFIC
   iris : portfolio pages
   warm : about page (gold both ways)
   none : everything else (instant nav, no overlay)
============================================================ */
(function () {
    if (prefersReducedMotion) return;

    function ptType(url) {
        var u = (url || window.location.href).toLowerCase();
        if (u.indexOf('portfolio')  !== -1) return 'iris';
        if (u.indexOf('about.html') !== -1) return 'warm';
        return 'none';
    }

    // Enter animation for the current page
    var enterType = ptType();
    if (enterType !== 'none') {
        var enterOverlay = document.createElement('div');
        enterOverlay.className = 'pt-overlay ' + enterType;
        document.body.appendChild(enterOverlay);
        enterOverlay.addEventListener('animationend', function() {
            enterOverlay.remove();
        }, { once: true });
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                enterOverlay.classList.add('pt-open');
            });
        });
    }

    var navigating = false;

    window.addEventListener('pagehide', function() {
        document.querySelectorAll('.pt-overlay.pt-close').forEach(function(overlay) {
            overlay.remove();
        });
        navigating = false;
    });

    window.addEventListener('pageshow', function(e) {
        if (!e.persisted) return;
        document.querySelectorAll('.pt-overlay').forEach(function(overlay) {
            overlay.remove();
        });
        navigating = false;
    });

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
   SCROLL REVEAL: CLASS SETUP
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
   SERVICES FAN: CLASS SETUP
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
   LOCAL SCROLL REVEALS
   Avoids loading third-party animation libraries on every page.
============================================================ */
(function () {
    const revealEls = document.querySelectorAll('.reveal-left,.reveal-right,.reveal-up,.reveal-scale');
    const fanEls = document.querySelectorAll('.services-full-grid .service-card');

    function showAll() {
        revealEls.forEach(el => el.classList.add('revealed'));
        fanEls.forEach(el => el.classList.add('fan-visible'));
    }

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        showAll();
        return;
    }

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(el => revealObserver.observe(el));

    const fanObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('fan-visible');
            fanObserver.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    fanEls.forEach(el => fanObserver.observe(el));
})();

/* ============================================================
   CLOUDFLARE STREAM PREVIEWS
============================================================ */
(function () {
    const previews = document.querySelectorAll('[data-ai-stream]');
    if (!previews.length) return;

    function hideSoundHint(preview) {
        if (preview) preview.classList.add('is-sound-hint-hidden');
    }

    function loadPreview(preview) {
        if (preview.dataset.loaded === 'true') return;
        const frame = preview.querySelector('.ai-stream-frame');
        const src = preview.getAttribute('data-stream-src');
        if (!frame || !src) return;

        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = 'AI Cinematic Property Walkthrough video';
        iframe.loading = 'lazy';
        iframe.allow = 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;';
        iframe.addEventListener('focus', () => hideSoundHint(preview));
        frame.appendChild(iframe);
        preview.dataset.loaded = 'true';
        preview.classList.add('is-loaded');
        frame.setAttribute('aria-hidden', 'false');
    }

    function unloadPreview(preview) {
        const iframe = preview.querySelector('iframe');
        const frame = preview.querySelector('.ai-stream-frame');
        if (iframe) iframe.remove();
        preview.dataset.loaded = 'false';
        preview.classList.remove('is-loaded');
        if (frame) frame.setAttribute('aria-hidden', 'true');
    }

    window.addEventListener('blur', () => {
        window.setTimeout(() => {
            const active = document.activeElement;
            if (!active || active.tagName !== 'IFRAME') return;
            hideSoundHint(active.closest('[data-ai-stream]'));
        }, 0);
    });

    if ('IntersectionObserver' in window) {
        const loadRatio = 0.45;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && entry.intersectionRatio >= loadRatio) {
                    loadPreview(entry.target);
                } else if (!entry.isIntersecting || entry.intersectionRatio <= 0.05) {
                    unloadPreview(entry.target);
                }
            });
        }, { threshold: [0, 0.05, loadRatio], rootMargin: '0px 0px -8% 0px' });

        previews.forEach(preview => observer.observe(preview));
    } else {
        const loadVisiblePreviews = () => {
            previews.forEach((preview) => {
                const rect = preview.getBoundingClientRect();
                const shouldLoad = rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
                if (shouldLoad) loadPreview(preview);
                else unloadPreview(preview);
            });
        };
        window.addEventListener('scroll', loadVisiblePreviews, { passive: true });
        window.addEventListener('resize', loadVisiblePreviews);
        loadVisiblePreviews();
    }
})();

/* ============================================================
   SERVICE DETAIL BACK BUTTONS
============================================================ */
(function () {
    document.querySelectorAll('[data-service-back]').forEach((button) => {
        button.addEventListener('click', () => {
            const fallback = button.getAttribute('data-fallback') || 'packages.html#services-overview';

            try {
                const current = new URL(window.location.href);
                const referrer = document.referrer ? new URL(document.referrer) : null;
                if (referrer && referrer.origin === current.origin && window.history.length > 1) {
                    window.history.back();
                    return;
                }
            } catch (error) {
                // Fall through to the default service overview destination.
            }

            window.location.href = fallback;
        });
    });
})();
