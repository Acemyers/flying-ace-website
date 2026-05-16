/* ============================================================
   LIGHTBOX — click to open, arrows to navigate, swipe on mobile
============================================================ */
(function () {
    const overlay  = document.getElementById('lightbox');
    const img      = document.getElementById('lightboxImg');
    const counter  = document.getElementById('lightboxCounter');
    const btnClose = document.getElementById('lightboxClose');
    const btnPrev  = document.getElementById('lightboxPrev');
    const btnNext  = document.getElementById('lightboxNext');

    if (!overlay) return;

    const images = Array.from(document.querySelectorAll('.port-item img'));
    let current  = 0;

    function show(index) {
        current = (index + images.length) % images.length;
        img.classList.add('fading');
        setTimeout(() => {
            img.src = images[current].src;
            img.alt = images[current].alt;
            img.classList.remove('fading');
        }, 180);
        counter.textContent = (current + 1) + ' / ' + images.length;
    }

    function open(index) {
        show(index);
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    images.forEach((el, i) => el.addEventListener('click', () => open(i)));

    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', () => show(current - 1));
    btnNext.addEventListener('click', () => show(current + 1));

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
        if (!overlay.classList.contains('open')) return;
        if (e.key === 'ArrowLeft')  show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
        if (e.key === 'Escape')     close();
    });

    /* Touch swipe support */
    let touchStartX = 0;
    overlay.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    overlay.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? show(current + 1) : show(current - 1);
        }
    }, { passive: true });
})();
