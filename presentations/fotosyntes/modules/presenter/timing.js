/**
 * SlideForge Timing & Budget Utilities
 */
(function(exports) {
    'use strict';

    function formatDuration(ms) {
        const totalSec = Math.floor(ms / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function getBudgetStatus(elapsedMs, budgetMin) {
        if (!budgetMin || budgetMin <= 0) return { status: 'none', color: '#a78bfa' };
        const budgetMs = budgetMin * 60 * 1000;
        const ratio = elapsedMs / budgetMs;

        if (ratio <= 1.0) {
            return { status: 'ok', color: '#22c55e' }; // Grön
        } else if (ratio <= 1.2) {
            return { status: 'warning', color: '#eab308' }; // Gul
        } else {
            return { status: 'danger', color: '#ef4444' }; // Röd
        }
    }

    exports.formatDuration = formatDuration;
    exports.getBudgetStatus = getBudgetStatus;

})(typeof exports !== 'undefined' ? exports : (window.SlideForgeTiming = {}));
