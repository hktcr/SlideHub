/**
 * SlideForge Rehearsal Mode v1.0
 * Drop-in modul för tidsövning av presentationer.
 * Aktiveras via ?mode=rehearsal
 * Tangenter: R = resultatöversikt, Escape = stäng
 *
 * Monkey-patchar renderCurrentSlide() — noll ändringar i shell.html.
 * All CSS inlinad, noll externa beroenden.
 *
 * Användning: <script src="modules/rehearsal/rehearsal.js"></script>
 */
(function() {
    'use strict';

    // ─── Gate: only activate in rehearsal mode ───────────────────────
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') !== 'rehearsal') return;

    console.log('🎬 Rehearsal Mode active');

    // ─── State ──────────────────────────────────────────────────────
    const SESSION_KEY = 'rehearsal-log';
    const startTime = Date.now();
    let log = [];                  // Array of { slideIndex, slideId, enterTime }
    let lastSlideIndex = -1;
    let timerInterval = null;
    let modalVisible = false;

    // ─── Helpers ────────────────────────────────────────────────────

    /** Format milliseconds as MM:SS */
    function formatTime(ms) {
        const totalSec = Math.max(0, Math.floor(ms / 1000));
        const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const s = String(totalSec % 60).padStart(2, '0');
        return `${m}:${s}`;
    }

    /** Get current slide count (safe) */
    function totalSlides() {
        return (window.slidesData && window.slidesData.length) || 0;
    }

    /** Get current slide index (safe) */
    function currentIndex() {
        return typeof window.currentSlideIndex === 'number'
            ? window.currentSlideIndex : 0;
    }

    /** Get current slide object (safe) */
    function currentSlide() {
        return (window.slidesData && window.slidesData[currentIndex()]) || {};
    }

    // ─── Slide-change tracking ──────────────────────────────────────

    /** Record entering a new slide */
    function onSlideChange() {
        const idx = currentIndex();
        if (idx === lastSlideIndex) return;        // Duplicate call guard

        const now = Date.now();

        // Close previous entry
        if (log.length > 0) {
            log[log.length - 1].duration = now - log[log.length - 1].enterTime;
        }

        // Open new entry
        log.push({
            slideIndex: idx,
            slideId: currentSlide().id || `slide-${idx}`,
            enterTime: now,
            timestamp: new Date(now).toISOString(),
            duration: 0
        });

        lastSlideIndex = idx;
        persistLog();
        updateBar();
    }

    /** Save log to sessionStorage */
    function persistLog() {
        try {
            // Compute durations on live entry
            const snapshot = log.map(e => ({
                slideIndex: e.slideIndex,
                slideId: e.slideId,
                timestamp: e.timestamp,
                duration: e.duration || (Date.now() - e.enterTime)
            }));
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
        } catch (_) { /* quota exceeded — non-critical */ }
    }

    // ─── Monkey-patch renderCurrentSlide ─────────────────────────────

    function hookRender() {
        if (typeof window.renderCurrentSlide !== 'function') {
            console.warn('Rehearsal: renderCurrentSlide not found, retrying in 500 ms');
            setTimeout(hookRender, 500);
            return;
        }
        const original = window.renderCurrentSlide;
        window.renderCurrentSlide = function() {
            original.apply(this, arguments);
            onSlideChange();
        };
        // Capture initial slide
        onSlideChange();
    }

    // ─── Inject styles ──────────────────────────────────────────────

    function injectStyles() {
        const css = `
            /* ── Rehearsal bottom bar ─────────────────────────── */
            #rehearsal-bar {
                position: fixed;
                bottom: 0; left: 0; right: 0;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                background: rgba(0, 0, 0, 0.65);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 13px;
                color: rgba(255, 255, 255, 0.85);
                z-index: 9998;
                user-select: none;
                transition: opacity 0.3s ease;
            }
            #rehearsal-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(239, 68, 68, 0.25);
                border: 1px solid rgba(239, 68, 68, 0.5);
                border-radius: 4px;
                padding: 2px 8px;
                font-weight: 600;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #f87171;
                animation: rehearsal-pulse 2s ease-in-out infinite;
            }
            @keyframes rehearsal-pulse {
                0%, 100% { opacity: 1; }
                50%      { opacity: 0.5; }
            }
            #rehearsal-timer {
                font-variant-numeric: tabular-nums;
                font-weight: 500;
            }
            #rehearsal-slide-info {
                font-variant-numeric: tabular-nums;
                opacity: 0.7;
            }

            /* ── Results modal ────────────────────────────────── */
            #rehearsal-modal-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            #rehearsal-modal-backdrop.visible {
                opacity: 1;
                pointer-events: auto;
            }
            #rehearsal-modal {
                background: rgba(30, 30, 40, 0.92);
                backdrop-filter: blur(24px);
                -webkit-backdrop-filter: blur(24px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 16px;
                padding: 32px;
                width: min(90vw, 720px);
                max-height: 80vh;
                overflow-y: auto;
                transform: translateY(20px) scale(0.97);
                transition: transform 0.3s ease;
                box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
                font-family: system-ui, -apple-system, sans-serif;
                color: rgba(255, 255, 255, 0.9);
            }
            #rehearsal-modal-backdrop.visible #rehearsal-modal {
                transform: translateY(0) scale(1);
            }
            #rehearsal-modal h2 {
                margin: 0 0 4px;
                font-size: 20px;
                font-weight: 700;
                letter-spacing: -0.3px;
            }
            #rehearsal-modal .subtitle {
                margin: 0 0 20px;
                font-size: 13px;
                opacity: 0.5;
            }
            #rehearsal-modal table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
            }
            #rehearsal-modal th {
                text-align: left;
                padding: 8px 12px;
                font-weight: 600;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                opacity: 0.5;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            #rehearsal-modal td {
                padding: 8px 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                font-variant-numeric: tabular-nums;
            }
            #rehearsal-modal tr:last-child td {
                border-bottom: none;
            }
            #rehearsal-modal tr.total-row td {
                font-weight: 700;
                border-top: 2px solid rgba(255, 255, 255, 0.15);
                padding-top: 12px;
            }
            #rehearsal-modal .time-green  { color: #4ade80; }
            #rehearsal-modal .time-yellow { color: #facc15; }
            #rehearsal-modal .time-red    { color: #f87171; }
            #rehearsal-modal .time-neutral { opacity: 0.5; }

            /* ── Close button ─────────────────────────────────── */
            #rehearsal-close {
                position: absolute;
                top: 16px; right: 16px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                color: rgba(255, 255, 255, 0.7);
                font-size: 14px;
                padding: 4px 12px;
                cursor: pointer;
                transition: background 0.2s ease, color 0.2s ease;
            }
            #rehearsal-close:hover {
                background: rgba(255, 255, 255, 0.15);
                color: #fff;
            }

            /* ── Hint label ───────────────────────────────────── */
            #rehearsal-hint {
                opacity: 0.35;
                font-size: 11px;
                cursor: pointer;
            }
            #rehearsal-hint:hover { opacity: 0.7; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ─── Create bottom bar ──────────────────────────────────────────

    function createBar() {
        const bar = document.createElement('div');
        bar.id = 'rehearsal-bar';
        bar.innerHTML = `
            <span id="rehearsal-badge">🎬 Rehearsal</span>
            <span id="rehearsal-timer">00:00</span>
            <span id="rehearsal-slide-info">– / –</span>
            <span id="rehearsal-hint" title="Tryck R för resultat">R = resultat</span>
        `;
        document.body.appendChild(bar);

        // Hint click opens results
        document.getElementById('rehearsal-hint')
            .addEventListener('click', toggleModal);

        // Start clock
        timerInterval = setInterval(updateBar, 1000);
    }

    /** Refresh bar values */
    function updateBar() {
        const elapsed = Date.now() - startTime;
        const timerEl = document.getElementById('rehearsal-timer');
        const infoEl  = document.getElementById('rehearsal-slide-info');
        if (timerEl) timerEl.textContent = formatTime(elapsed);
        if (infoEl)  infoEl.textContent = `${currentIndex() + 1} / ${totalSlides() || '?'}`;
    }

    // ─── Create results modal ───────────────────────────────────────

    function createModal() {
        const backdrop = document.createElement('div');
        backdrop.id = 'rehearsal-modal-backdrop';
        backdrop.innerHTML = `
            <div id="rehearsal-modal" style="position:relative;">
                <button id="rehearsal-close">Stäng ✕</button>
                <h2>Rehearsal — Resultat</h2>
                <p class="subtitle">Tidsanalys per slide</p>
                <div id="rehearsal-results"></div>
            </div>
        `;
        document.body.appendChild(backdrop);

        // Close via button
        document.getElementById('rehearsal-close')
            .addEventListener('click', () => hideModal());

        // Close via backdrop click
        backdrop.addEventListener('click', function(e) {
            if (e.target === backdrop) hideModal();
        });
    }

    // ─── Modal show / hide ──────────────────────────────────────────

    function showModal() {
        // Finalize duration on current slide
        if (log.length > 0) {
            log[log.length - 1].duration = Date.now() - log[log.length - 1].enterTime;
        }
        persistLog();
        renderResults();
        const bd = document.getElementById('rehearsal-modal-backdrop');
        if (bd) bd.classList.add('visible');
        modalVisible = true;
    }

    function hideModal() {
        const bd = document.getElementById('rehearsal-modal-backdrop');
        if (bd) bd.classList.remove('visible');
        modalVisible = false;
    }

    function toggleModal() {
        modalVisible ? hideModal() : showModal();
    }

    // ─── Render results table ───────────────────────────────────────

    function renderResults() {
        const container = document.getElementById('rehearsal-results');
        if (!container) return;

        const totalElapsed = Date.now() - startTime;
        const slides = window.slidesData || [];

        // Build rows
        let rows = '';
        let totalDuration = 0;
        let totalBudget = 0;
        let hasBudget = false;

        log.forEach((entry, i) => {
            const dur = entry.duration || 0;
            totalDuration += dur;

            // Try to find budget (duration_min in minutes → convert to ms)
            const slideData = slides[entry.slideIndex] || {};
            const budgetMin = parseFloat(slideData.duration_min);
            const budgetMs  = isNaN(budgetMin) ? null : budgetMin * 60000;
            if (budgetMs !== null) {
                hasBudget = true;
                totalBudget += budgetMs;
            }

            // Diff
            let diffStr = '—';
            let diffClass = 'time-neutral';
            if (budgetMs !== null) {
                const diff = dur - budgetMs;
                const absDiff = Math.abs(diff);
                diffStr = (diff > 0 ? '+' : '−') + formatTime(absDiff);
                if (diff > budgetMs * 0.2) {
                    diffClass = 'time-red';
                } else if (diff > 0) {
                    diffClass = 'time-yellow';
                } else {
                    diffClass = 'time-green';
                }
            }

            rows += `<tr>
                <td>${i + 1}</td>
                <td>${escHtml(entry.slideId)}</td>
                <td>${formatTime(dur)}</td>
                <td>${budgetMs !== null ? formatTime(budgetMs) : '—'}</td>
                <td class="${diffClass}">${diffStr}</td>
            </tr>`;
        });

        // Total row
        let totalDiffStr = '—';
        let totalDiffClass = 'time-neutral';
        if (hasBudget && totalBudget > 0) {
            const diff = totalDuration - totalBudget;
            const absDiff = Math.abs(diff);
            totalDiffStr = (diff > 0 ? '+' : '−') + formatTime(absDiff);
            if (diff > totalBudget * 0.1) {
                totalDiffClass = 'time-red';
            } else if (diff > 0) {
                totalDiffClass = 'time-yellow';
            } else {
                totalDiffClass = 'time-green';
            }
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Slide</th>
                        <th>Tid</th>
                        <th>Budget</th>
                        <th>Diff</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr class="total-row">
                        <td></td>
                        <td>Totalt</td>
                        <td>${formatTime(totalDuration)}</td>
                        <td>${hasBudget ? formatTime(totalBudget) : '—'}</td>
                        <td class="${totalDiffClass}">${totalDiffStr}</td>
                    </tr>
                </tbody>
            </table>
            <p class="subtitle" style="margin-top:16px;">
                Total tid: ${formatTime(totalElapsed)} &nbsp;·&nbsp;
                ${log.length} slides besökta
            </p>
        `;
    }

    /** Minimal HTML escaping */
    function escHtml(str) {
        const d = document.createElement('span');
        d.textContent = str;
        return d.innerHTML;
    }

    // ─── Keyboard shortcuts ─────────────────────────────────────────

    function handleKeyboard(e) {
        // Ignore when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            e.stopPropagation();
            toggleModal();
        }
        if (e.key === 'Escape' && modalVisible) {
            e.preventDefault();
            e.stopPropagation();
            hideModal();
        }
    }

    // ─── Init ───────────────────────────────────────────────────────

    function init() {
        injectStyles();
        createBar();
        createModal();
        hookRender();
        document.addEventListener('keydown', handleKeyboard, true);

        // Secondary detection: hashchange (fallback for shells that
        // navigate via URL fragments without calling renderCurrentSlide)
        window.addEventListener('hashchange', function() {
            setTimeout(onSlideChange, 50);
        });

        console.log('🎬 Rehearsal Mode initialized — press R for results');
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
