/**
 * SlideForge Presenter Link — BroadcastChannel bridge for presenter view
 */
(function() {
    'use strict';

    if (!window.BroadcastChannel) return;

    const chan = new BroadcastChannel('slideforge-presenter');
    let presenterWindow = null;

    function publishPresenterState() {
        if (!window.slidesData || window.currentSlideIndex == null) return;
        const idx = window.currentSlideIndex;
        const s = window.slidesData[idx] || {};
        const next = window.slidesData[idx + 1] || null;
        const steps = window.SlideForge && window.SlideForge.steps ? window.SlideForge.steps : { current: 0, total: 0 };

        chan.postMessage({
            type: 'state',
            index: idx,
            total: window.slidesData.length,
            id: s.id || '',
            slideType: s.type || '',
            title: s.title || s.type || '',
            notes: s.notes || '',
            durationMin: s.duration_min || null,
            step: steps.current,
            stepTotal: steps.total,
            nextId: next ? next.id : null,
            nextTitle: next ? (next.title || next.type) : null
        });
    }

    window.publishPresenterState = publishPresenterState;

    chan.onmessage = function(e) {
        if (!e.data) return;
        if (e.data.type === 'request_state') {
            publishPresenterState();
        }
        if (e.data.type === 'cmd') {
            const cmd = e.data.cmd;
            if (cmd === 'next') {
                if (window.SlideForge && typeof window.SlideForge.nextStep === 'function' && window.SlideForge.nextStep()) {
                    publishPresenterState();
                    return;
                }
                if (typeof window.openSlide === 'function' && window.currentSlideIndex < window.slidesData.length - 1) {
                    window.openSlide(window.currentSlideIndex + 1);
                }
            } else if (cmd === 'prev') {
                if (window.SlideForge && typeof window.SlideForge.prevStep === 'function' && window.SlideForge.prevStep()) {
                    publishPresenterState();
                    return;
                }
                if (typeof window.openSlide === 'function' && window.currentSlideIndex > 0) {
                    window.openSlide(window.currentSlideIndex - 1);
                }
            } else if (cmd === 'goto' && e.data.id) {
                if (typeof window.openSlideById === 'function') {
                    window.openSlideById(e.data.id);
                }
            } else if (cmd === 'black') {
                document.body.classList.toggle('sf-blackout', !!e.data.on);
            }
        }
    };

    // Auto-patch openSlide to publish presenter state
    function hookOpenSlide() {
        if (typeof window.openSlide !== 'function') {
            setTimeout(hookOpenSlide, 300);
            return;
        }
        const originalOpenSlide = window.openSlide;
        window.openSlide = function(idx) {
            originalOpenSlide(idx);
            publishPresenterState();
        };
    }
    hookOpenSlide();

    // Add CSS for blackout
    const style = document.createElement('style');
    style.textContent = `
        body.sf-blackout { background: #000000 !important; }
        body.sf-blackout .slide-content, body.sf-blackout #slideContent { visibility: hidden !important; }
    `;
    document.head.appendChild(style);

    // Global helper to open presenter window
    window.openPresenterWindow = function() {
        const url = new URL('modules/presenter/presenter.html', window.location.href).href;
        presenterWindow = window.open(url, 'SlideForgePresenter', 'width=1100,height=750');
    };
})();
