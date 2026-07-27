/**
 * PulseCheck v1.0 — Inbyggd Realtids-Poll för SlideCraft
 * 
 * Lägger till slide-typen "pulse" i slideTypeRegistry.
 * Kräver SlideCast (slidecast-presenter.js) för realtidsröster.
 * Fungerar även utan SlideCast — då som lokal demonstration.
 *
 * Usage: <script src="modules/pulsecheck/pulsecheck.js"></script>
 * (ladda EFTER shell.html:s script-block)
 * 
 * slides.json-format:
 * {
 *   "id": "poll-1",
 *   "type": "pulse",
 *   "question": "Hur trygga känner ni er med AI i elevhälsoarbetet?",
 *   "options": ["Mycket trygga", "Ganska trygga", "Osäkra", "Otrygga"],
 *   "showResults": true,
 *   "timer": 30
 * }
 */

(function() {
    'use strict';

    // ===== POLL STATE =====
    const activePolls = {};
    let currentPollId = null;

    /**
     * Register the "pulse" slide type in the shell's renderer
     */
    function registerPulseType() {
        // Hook into the shell's renderCurrentSlide switch-case
        if (typeof window.renderCurrentSlide !== 'function') {
            console.warn('PulseCheck: renderCurrentSlide not found. Load after shell.html.');
            return;
        }

        const originalRender = window.renderCurrentSlide;
        window.renderCurrentSlide = function() {
            const slide = window.slidesData[window.currentSlideIndex];
            if (slide && slide.type === 'pulse') {
                // Render pulse slide directly
                const content = document.getElementById('slideContent');
                const slideView = document.getElementById('slideView');
                document.getElementById('slideIdDisplay').textContent = 
                    `${window.currentSlideIndex + 1}/${window.slidesData.length} • ${slide.id}`;
                
                slideView.style.backgroundImage = '';
                content.innerHTML = renderPulse(slide);
                
                // Start timer if configured
                if (slide.timer) startTimer(slide.id, slide.timer);
                
                // Broadcast poll to audience via SlideCast
                broadcastPoll(slide);

                // Update source button if it exists
                if (typeof window.updateSourceButton === 'function') {
                    window.updateSourceButton();
                }
                return;
            }
            originalRender.apply(this, arguments);
        };
    }

    /**
     * Render the pulse poll slide
     */
    function renderPulse(slide) {
        const pollId = slide.id || 'pulse-' + Date.now();
        currentPollId = pollId;
        
        if (!activePolls[pollId]) {
            activePolls[pollId] = {
                votes: {},
                totalVotes: 0,
                voters: new Set()
            };
        }

        const options = slide.options || [];
        const showResults = slide.showResults !== false;
        const timer = slide.timer || null;

        return `
            <div class="pulse-container" id="pulseContainer-${pollId}">
                <div class="pulse-header">
                    <div class="pulse-badge">📊 PULSECHECK</div>
                    <h2 class="pulse-question">${slide.question}</h2>
                    ${timer ? `
                        <div class="pulse-timer" id="pulseTimer-${pollId}">
                            <svg class="pulse-timer-ring" viewBox="0 0 36 36">
                                <path class="pulse-timer-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                <path class="pulse-timer-fill" id="pulseTimerPath-${pollId}" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke-dasharray="100, 100"/>
                            </svg>
                            <span class="pulse-timer-text" id="pulseTimerText-${pollId}">${timer}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="pulse-options" id="pulseOptions-${pollId}">
                    ${options.map((opt, i) => `
                        <div class="pulse-option" id="pulseOpt-${pollId}-${i}" 
                             onclick="window.__pulsecheck_vote('${pollId}', ${i})"
                             data-color="${getOptionColor(i)}">
                            <div class="pulse-option-letter" style="background:${getOptionColor(i)}">${String.fromCharCode(65 + i)}</div>
                            <div class="pulse-option-text">${opt}</div>
                            <div class="pulse-option-bar" id="pulseBar-${pollId}-${i}" style="width:0%"></div>
                            ${showResults ? `
                                <div class="pulse-option-count" id="pulseCount-${pollId}-${i}">0</div>
                                <div class="pulse-option-pct" id="pulsePct-${pollId}-${i}">0%</div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="pulse-footer">
                    <div class="pulse-total">
                        <span class="pulse-total-icon">👥</span>
                        <span id="pulseTotalVotes-${pollId}">0</span> röster
                    </div>
                    <div class="pulse-controls">
                        <button class="pulse-btn pulse-btn-reset" onclick="window.__pulsecheck_reset('${pollId}')">↻ Nollställ</button>
                        <button class="pulse-btn pulse-btn-close" onclick="window.__pulsecheck_close('${pollId}')">✕ Avsluta</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get a color for option index
     */
    function getOptionColor(index) {
        const colors = ['#6366f1', '#22c55e', '#f97316', '#ef4444', '#eab308', '#a855f7', '#06b6d4', '#ec4899'];
        return colors[index % colors.length];
    }

    /**
     * Handle a local vote (from presenter's browser — for demo/testing)
     */
    window.__pulsecheck_vote = function(pollId, optIndex) {
        const poll = activePolls[pollId];
        if (!poll) return;

        // Prevent double voting (local only)
        if (poll.voters.has('local')) return;
        poll.voters.add('local');

        recordVote(pollId, optIndex);
    };

    /**
     * Record a vote and update the UI
     */
    function recordVote(pollId, optIndex) {
        const poll = activePolls[pollId];
        if (!poll) return;

        poll.votes[optIndex] = (poll.votes[optIndex] || 0) + 1;
        poll.totalVotes++;

        updatePollUI(pollId);
    }

    /**
     * Update the visual representation of poll results
     */
    function updatePollUI(pollId) {
        const poll = activePolls[pollId];
        if (!poll) return;

        // Update total
        const totalEl = document.getElementById(`pulseTotalVotes-${pollId}`);
        if (totalEl) totalEl.textContent = poll.totalVotes;

        // Find max for relative bars
        const maxVotes = Math.max(1, ...Object.values(poll.votes));

        // Update each option
        const slide = window.slidesData?.find(s => s.id === pollId);
        const optCount = slide?.options?.length || 0;

        for (let i = 0; i < optCount; i++) {
            const votes = poll.votes[i] || 0;
            const pct = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
            const barWidth = poll.totalVotes > 0 ? (votes / maxVotes) * 100 : 0;

            const bar = document.getElementById(`pulseBar-${pollId}-${i}`);
            const count = document.getElementById(`pulseCount-${pollId}-${i}`);
            const pctEl = document.getElementById(`pulsePct-${pollId}-${i}`);

            if (bar) {
                bar.style.width = barWidth + '%';
                bar.style.background = getOptionColor(i);
                bar.style.opacity = '0.15';
            }
            if (count) count.textContent = votes;
            if (pctEl) pctEl.textContent = pct + '%';
        }

        // Highlight winner (largest bar)
        let maxIdx = 0;
        let maxVal = 0;
        for (const [idx, val] of Object.entries(poll.votes)) {
            if (val > maxVal) { maxVal = val; maxIdx = parseInt(idx); }
        }
        for (let i = 0; i < optCount; i++) {
            const optEl = document.getElementById(`pulseOpt-${pollId}-${i}`);
            if (optEl) {
                optEl.classList.toggle('winner', i === maxIdx && poll.totalVotes > 0);
            }
        }
    }

    /**
     * Reset a poll
     */
    window.__pulsecheck_reset = function(pollId) {
        const poll = activePolls[pollId];
        if (!poll) return;
        
        poll.votes = {};
        poll.totalVotes = 0;
        poll.voters.clear();
        updatePollUI(pollId);
    };

    /**
     * Close a poll and broadcast end signal
     */
    window.__pulsecheck_close = function(pollId) {
        if (typeof window.slideCastPoll === 'function') {
            // Signal audience that poll is closed
            // Use the existing SlideCast presenter ws
        }
    };

    /**
     * Start a countdown timer
     */
    function startTimer(pollId, seconds) {
        let remaining = seconds;
        const pathEl = document.getElementById(`pulseTimerPath-${pollId}`);
        const textEl = document.getElementById(`pulseTimerText-${pollId}`);
        
        if (!pathEl || !textEl) return;

        const interval = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(interval);
                textEl.textContent = '✓';
                pathEl.style.strokeDasharray = '0, 100';
                return;
            }
            
            textEl.textContent = remaining;
            const pct = (remaining / seconds) * 100;
            pathEl.style.strokeDasharray = `${pct}, 100`;
            
            if (remaining <= 5) {
                textEl.style.color = '#ef4444';
            }
        }, 1000);
    }

    /**
     * Broadcast poll to SlideCast audience
     */
    function broadcastPoll(slide) {
        if (typeof window.slideCastPoll === 'function') {
            window.slideCastPoll(slide.question, slide.options, slide.id);
        }
    }

    /**
     * Listen for incoming votes from SlideCast
     * Hook into the presenter's handleIncoming
     */
    function hookVoteListener() {
        // The SlideCast presenter hook already calls recordVote in pollResults
        // We need to intercept those and update our UI
        
        // Check periodically if there's a SlideCast connection
        const checkInterval = setInterval(() => {
            if (window.__slidecast_hookVote) {
                clearInterval(checkInterval);
                return;
            }
            
            // Patch the handleIncoming if SlideCast is loaded
            // This is done via the existing presenter hook's recordVote
        }, 1000);

        // Also expose a global function for SlideCast to call
        window.__pulsecheck_remoteVote = function(pollId, optIndex) {
            recordVote(pollId, optIndex);
        };
    }

    // ===== INJECT STYLES =====
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pulse-container {
                width: 100%;
                max-width: 1000px;
                text-align: center;
            }

            .pulse-header {
                margin-bottom: 2rem;
            }

            .pulse-badge {
                display: inline-block;
                padding: 0.4rem 1rem;
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15));
                border: 1px solid rgba(99, 102, 241, 0.3);
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                color: #a78bfa;
                letter-spacing: 0.1em;
                margin-bottom: 1rem;
            }

            .pulse-question {
                font-size: clamp(1.6rem, 4vw, 2.8rem);
                font-weight: 700;
                background: linear-gradient(135deg, var(--text, #f1f5f9), var(--accent, #f97316));
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                line-height: 1.3;
                max-width: 800px;
                margin: 0 auto;
            }

            .pulse-timer {
                position: relative;
                width: 60px;
                height: 60px;
                margin: 1.5rem auto 0;
            }

            .pulse-timer-ring {
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
            }

            .pulse-timer-bg {
                fill: none;
                stroke: rgba(255, 255, 255, 0.1);
                stroke-width: 2.5;
            }

            .pulse-timer-fill {
                fill: none;
                stroke: #6366f1;
                stroke-width: 2.5;
                stroke-linecap: round;
                transition: stroke-dasharray 1s linear;
            }

            .pulse-timer-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 1.2rem;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
                transition: color 0.3s;
            }

            .pulse-options {
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
                margin: 0 auto;
                max-width: 700px;
            }

            .pulse-option {
                position: relative;
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1.2rem 1.5rem;
                background: var(--card-bg, #2a2a2a);
                border: 2px solid var(--border, rgba(255,255,255,0.15));
                border-radius: 14px;
                cursor: pointer;
                transition: all 0.3s;
                overflow: hidden;
                text-align: left;
            }

            .pulse-option:hover {
                border-color: var(--accent, #f97316);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            }

            .pulse-option.winner {
                border-color: #22c55e;
                box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);
            }

            .pulse-option-letter {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 0.95rem;
                color: white;
                flex-shrink: 0;
                z-index: 1;
            }

            .pulse-option-text {
                flex: 1;
                font-size: clamp(1rem, 2vw, 1.3rem);
                font-weight: 500;
                z-index: 1;
            }

            .pulse-option-bar {
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                border-radius: 12px;
                transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 0;
            }

            .pulse-option-count {
                font-family: 'JetBrains Mono', monospace;
                font-weight: 700;
                font-size: 1.1rem;
                min-width: 2rem;
                text-align: right;
                z-index: 1;
            }

            .pulse-option-pct {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.85rem;
                opacity: 0.6;
                min-width: 3rem;
                text-align: right;
                z-index: 1;
            }

            .pulse-footer {
                margin-top: 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .pulse-total {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1rem;
                opacity: 0.7;
            }

            .pulse-total-icon {
                font-size: 1.2rem;
            }

            .pulse-controls {
                display: flex;
                gap: 0.5rem;
            }

            .pulse-btn {
                padding: 0.5rem 1rem;
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 8px;
                background: rgba(255,255,255,0.05);
                color: white;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.2s;
            }

            .pulse-btn:hover {
                background: rgba(255,255,255,0.1);
            }

            /* Auditorium scaling */
            @media (min-width: 1200px) {
                .pulse-question {
                    font-size: clamp(2.5rem, 5vw, 3.5rem);
                }
                .pulse-option {
                    padding: 1.8rem 2rem;
                }
                .pulse-option-text {
                    font-size: 1.5rem;
                }
                .pulse-option-count {
                    font-size: 1.4rem;
                }
                .pulse-option-letter {
                    width: 44px;
                    height: 44px;
                    font-size: 1.1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ===== INIT =====
    function init() {
        injectStyles();
        registerPulseType();
        hookVoteListener();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Small delay to ensure shell.html has initialized
        setTimeout(init, 50);
    }
})();
