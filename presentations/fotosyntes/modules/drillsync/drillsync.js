/**
 * DrillSync v1.0 — Synkroniserad Quiz för SlideCraft
 * 
 * Utökar Drill Deck och Knowledge Check med synkront
 * publikdeltagande via SlideCast watch-vyn.
 * 
 * Kräver: SlideCast (slidecast-presenter.js) + relay-server
 * 
 * Usage: <script src="modules/drillsync/drillsync.js"></script>
 * (ladda EFTER shell.html + slidecast-presenter.js)
 * 
 * slides.json-format:
 * {
 *   "id": "quiz-1",
 *   "type": "drill-sync",
 *   "title": "Snabbkoll: Ekologi",
 *   "questions": [
 *     {
 *       "question": "Vad kallas en organism som bryter ner döda organismer?",
 *       "options": ["Producent", "Konsument", "Nedbrytare", "Toppredator"],
 *       "correct": 2,
 *       "explanation": "Nedbrytare (dekomponerare) som svampar och bakterier bryter ner dött organiskt material."
 *     }
 *   ],
 *   "showLeaderboard": true,
 *   "timePerQuestion": 20
 * }
 */

(function() {
    'use strict';

    // ===== QUIZ STATE =====
    let currentQuiz = null;
    let currentQuestionIdx = 0;
    let participantAnswers = {}; // { participantId: { questionIdx: optionIdx, time: ms } }
    let quizTimer = null;
    let questionStartTime = 0;

    /**
     * Register drill-sync slide type
     */
    function registerDrillSyncType() {
        if (typeof window.renderCurrentSlide !== 'function') {
            console.warn('DrillSync: renderCurrentSlide not found.');
            return;
        }

        const originalRender = window.renderCurrentSlide;
        window.renderCurrentSlide = function() {
            const slide = window.slidesData[window.currentSlideIndex];
            if (slide && slide.type === 'drill-sync') {
                const content = document.getElementById('slideContent');
                const slideView = document.getElementById('slideView');
                document.getElementById('slideIdDisplay').textContent = 
                    `${window.currentSlideIndex + 1}/${window.slidesData.length} • ${slide.id}`;
                
                slideView.style.backgroundImage = '';
                
                // Initialize quiz if new
                if (!currentQuiz || currentQuiz.id !== slide.id) {
                    currentQuiz = slide;
                    currentQuestionIdx = 0;
                    participantAnswers = {};
                }

                content.innerHTML = renderDrillSync(slide);
                
                if (typeof window.updateSourceButton === 'function') {
                    window.updateSourceButton();
                }
                return;
            }
            originalRender.apply(this, arguments);
        };
    }

    /**
     * Render the drill-sync quiz control panel
     */
    function renderDrillSync(slide) {
        const q = slide.questions[currentQuestionIdx];
        const total = slide.questions.length;
        const timeLimit = slide.timePerQuestion || 20;
        const isLast = currentQuestionIdx >= total - 1;

        return `
            <div class="drill-sync-container">
                <div class="drill-sync-header">
                    <div class="drill-sync-badge">🧠 DRILLSYNC</div>
                    <h2 class="drill-sync-title">${slide.title || 'Quiz'}</h2>
                    <div class="drill-sync-progress">
                        <div class="drill-sync-progress-bar">
                            ${slide.questions.map((_, i) => `
                                <div class="drill-sync-dot ${i < currentQuestionIdx ? 'done' : ''} ${i === currentQuestionIdx ? 'active' : ''}"></div>
                            `).join('')}
                        </div>
                        <span class="drill-sync-progress-text">Fråga ${currentQuestionIdx + 1} av ${total}</span>
                    </div>
                </div>

                <div class="drill-sync-question-area">
                    <div class="drill-sync-question">${q.question}</div>
                    
                    <div class="drill-sync-timer-bar" id="drillTimerBar">
                        <div class="drill-sync-timer-fill" id="drillTimerFill"></div>
                    </div>
                    <div class="drill-sync-timer-text" id="drillTimerText">${timeLimit}s</div>

                    <div class="drill-sync-options" id="drillSyncOptions">
                        ${q.options.map((opt, i) => `
                            <div class="drill-sync-option" id="drillOpt-${i}" 
                                 onclick="window.__drillsync_reveal(${i})"
                                 data-idx="${i}">
                                <span class="drill-sync-option-letter" style="background:${getColor(i)}">${String.fromCharCode(65 + i)}</span>
                                <span class="drill-sync-option-text">${opt}</span>
                                <span class="drill-sync-option-count" id="drillCount-${i}">0</span>
                                <span class="drill-sync-option-bar" id="drillBar-${i}"></span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="drill-sync-controls">
                    <button class="drill-sync-btn" onclick="window.__drillsync_broadcast()">
                        📡 Skicka till publik
                    </button>
                    <button class="drill-sync-btn drill-sync-btn-reveal" onclick="window.__drillsync_showAnswer()">
                        ✨ Visa rätt svar
                    </button>
                    <button class="drill-sync-btn drill-sync-btn-next" onclick="window.__drillsync_next()">
                        ${isLast ? '🏆 Visa resultat' : '→ Nästa fråga'}
                    </button>
                </div>

                <div class="drill-sync-audience-status" id="drillAudienceStatus">
                    <span class="drill-sync-audience-icon">👥</span>
                    <span id="drillAnswerCount">0</span> har svarat
                </div>
            </div>
        `;
    }

    function getColor(i) {
        return ['#6366f1', '#22c55e', '#f97316', '#ef4444', '#eab308', '#a855f7'][i % 6];
    }

    /**
     * Broadcast current question to audience
     */
    window.__drillsync_broadcast = function() {
        if (!currentQuiz) return;
        const q = currentQuiz.questions[currentQuestionIdx];
        const timeLimit = currentQuiz.timePerQuestion || 20;

        // Start local timer
        startQuestionTimer(timeLimit);
        questionStartTime = Date.now();

        // Send via SlideCast relay
        sendToRelay({
            type: 'drill',
            action: 'question',
            data: {
                quizId: currentQuiz.id,
                questionIdx: currentQuestionIdx,
                question: q.question,
                options: q.options,
                timeLimit: timeLimit,
                total: currentQuiz.questions.length
            }
        });

        // Disable broadcast button
        const btn = event.target;
        btn.textContent = '✅ Skickad';
        btn.disabled = true;
    };

    /**
     * Show the correct answer
     */
    window.__drillsync_showAnswer = function() {
        if (!currentQuiz) return;
        const q = currentQuiz.questions[currentQuestionIdx];
        const correctIdx = q.correct;

        // Clear timer
        if (quizTimer) clearInterval(quizTimer);

        // Highlight correct answer
        document.querySelectorAll('.drill-sync-option').forEach((el, i) => {
            if (i === correctIdx) {
                el.classList.add('correct');
            } else {
                el.classList.add('wrong');
            }
        });

        // Show explanation if available
        if (q.explanation) {
            const optionsArea = document.getElementById('drillSyncOptions');
            const explanationEl = document.createElement('div');
            explanationEl.className = 'drill-sync-explanation';
            explanationEl.innerHTML = `<strong>💡 Förklaring:</strong> ${q.explanation}`;
            optionsArea.after(explanationEl);
        }

        // Broadcast answer reveal to audience
        sendToRelay({
            type: 'drill',
            action: 'reveal',
            data: {
                quizId: currentQuiz.id,
                questionIdx: currentQuestionIdx,
                correct: correctIdx,
                explanation: q.explanation || ''
            }
        });
    };

    /**
     * Advance to next question or show results
     */
    window.__drillsync_next = function() {
        if (!currentQuiz) return;

        if (currentQuestionIdx >= currentQuiz.questions.length - 1) {
            // Show leaderboard / results
            showResults();
            return;
        }

        currentQuestionIdx++;
        
        // Re-render
        const content = document.getElementById('slideContent');
        content.innerHTML = renderDrillSync(currentQuiz);

        // Broadcast question change
        sendToRelay({
            type: 'drill',
            action: 'next',
            data: { quizId: currentQuiz.id, questionIdx: currentQuestionIdx }
        });
    };

    /**
     * Reveal answer from presenter click (also shows audience count)
     */
    window.__drillsync_reveal = function(optIdx) {
        // Just highlight the clicked option locally
        const el = document.getElementById(`drillOpt-${optIdx}`);
        if (el) el.classList.toggle('selected');
    };

    /**
     * Show final results / leaderboard
     */
    function showResults() {
        const content = document.getElementById('slideContent');
        const total = currentQuiz.questions.length;
        
        // Calculate per-option accuracy
        const questionResults = currentQuiz.questions.map((q, i) => {
            const answers = Object.values(participantAnswers)
                .filter(a => a[i] !== undefined);
            const correctCount = answers.filter(a => a[i] === q.correct).length;
            return {
                question: q.question,
                correctCount: correctCount,
                totalAnswers: answers.length,
                pct: answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0
            };
        });

        content.innerHTML = `
            <div class="drill-sync-container">
                <div class="drill-sync-header">
                    <div class="drill-sync-badge">🏆 RESULTAT</div>
                    <h2 class="drill-sync-title">${currentQuiz.title}</h2>
                </div>
                <div class="drill-sync-results">
                    ${questionResults.map((r, i) => `
                        <div class="drill-sync-result-row">
                            <span class="drill-sync-result-num">${i + 1}.</span>
                            <span class="drill-sync-result-question">${r.question.substring(0, 60)}${r.question.length > 60 ? '...' : ''}</span>
                            <div class="drill-sync-result-bar-container">
                                <div class="drill-sync-result-bar" style="width:${r.pct}%; background: ${r.pct >= 70 ? '#22c55e' : r.pct >= 40 ? '#eab308' : '#ef4444'}"></div>
                            </div>
                            <span class="drill-sync-result-pct">${r.pct}%</span>
                        </div>
                    `).join('')}
                </div>
                <div class="drill-sync-controls" style="margin-top:2rem">
                    <button class="drill-sync-btn" onclick="window.__drillsync_restart()">↻ Kör igen</button>
                </div>
            </div>
        `;

        // Broadcast results
        sendToRelay({
            type: 'drill',
            action: 'results',
            data: { quizId: currentQuiz.id, results: questionResults }
        });
    }

    window.__drillsync_restart = function() {
        currentQuestionIdx = 0;
        participantAnswers = {};
        const content = document.getElementById('slideContent');
        content.innerHTML = renderDrillSync(currentQuiz);
    };

    /**
     * Timer for each question
     */
    function startQuestionTimer(seconds) {
        if (quizTimer) clearInterval(quizTimer);
        
        let remaining = seconds;
        const fill = document.getElementById('drillTimerFill');
        const text = document.getElementById('drillTimerText');

        quizTimer = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(quizTimer);
                if (text) text.textContent = 'Tid!';
                if (fill) fill.style.width = '0%';
                return;
            }
            
            if (text) text.textContent = remaining + 's';
            if (fill) fill.style.width = ((remaining / seconds) * 100) + '%';
            
            if (remaining <= 5 && text) text.style.color = '#ef4444';
        }, 1000);
    }

    /**
     * Handle incoming audience answers
     */
    function handleDrillAnswer(msg) {
        const { participantId, questionIdx, option, time } = msg;
        
        if (!participantAnswers[participantId]) {
            participantAnswers[participantId] = {};
        }
        participantAnswers[participantId][questionIdx] = option;

        // Update answer count
        const countEl = document.getElementById('drillAnswerCount');
        if (countEl) {
            const uniqueAnswerers = Object.keys(participantAnswers).length;
            countEl.textContent = uniqueAnswerers;
        }

        // Update option counts
        const optCount = {};
        Object.values(participantAnswers).forEach(answers => {
            const ans = answers[currentQuestionIdx];
            if (Array.isArray(ans)) {
                ans.forEach(a => { optCount[a] = (optCount[a] || 0) + 1; });
            } else if (ans !== undefined) {
                optCount[ans] = (optCount[ans] || 0) + 1;
            }
        });

        const totalAnswers = Object.values(optCount).reduce((a, b) => a + b, 0);
        const maxCount = Math.max(1, ...Object.values(optCount));

        const optElements = currentQuiz?.questions[currentQuestionIdx]?.options?.length || 0;
        for (let i = 0; i < optElements; i++) {
            const count = optCount[i] || 0;
            const countEl = document.getElementById(`drillCount-${i}`);
            const barEl = document.getElementById(`drillBar-${i}`);
            
            if (countEl) countEl.textContent = count;
            if (barEl) {
                barEl.style.width = totalAnswers > 0 ? ((count / maxCount) * 100) + '%' : '0%';
                barEl.style.background = getColor(i);
                barEl.style.opacity = '0.12';
            }
        }
    }

    /**
     * Send messages via SlideCast relay
     */
    function sendToRelay(msg) {
        if (typeof window.slideCastSend === 'function') {
            window.slideCastSend(msg);
        } else if (window.__slidecast_ws && window.__slidecast_ws.readyState === WebSocket.OPEN) {
            window.__slidecast_ws.send(JSON.stringify(msg));
        }
    }

    /**
     * Listen for incoming drill answers
     */
    function hookAnswerListener() {
        window.__drillsync_remoteAnswer = function(msg) {
            handleDrillAnswer(msg);
        };
    }

    // ===== STYLES =====
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .drill-sync-container {
                width: 100%;
                max-width: 1000px;
                text-align: center;
            }
            .drill-sync-header { margin-bottom: 1.5rem; }
            .drill-sync-badge {
                display: inline-block;
                padding: 0.4rem 1rem;
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(99, 102, 241, 0.15));
                border: 1px solid rgba(34, 197, 94, 0.3);
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                color: #86efac;
                letter-spacing: 0.1em;
                margin-bottom: 0.5rem;
            }
            .drill-sync-title {
                font-size: clamp(1.4rem, 3vw, 2rem);
                font-weight: 700;
                opacity: 0.8;
            }
            .drill-sync-progress { margin-top: 1rem; }
            .drill-sync-progress-bar {
                display: flex;
                gap: 6px;
                justify-content: center;
                margin-bottom: 0.5rem;
            }
            .drill-sync-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: rgba(255,255,255,0.15);
                transition: all 0.3s;
            }
            .drill-sync-dot.done { background: #22c55e; }
            .drill-sync-dot.active { 
                background: #6366f1; 
                transform: scale(1.4);
                box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
            }
            .drill-sync-progress-text {
                font-size: 0.8rem;
                opacity: 0.5;
            }

            .drill-sync-question-area { margin: 1.5rem 0; }
            .drill-sync-question {
                font-size: clamp(1.3rem, 3.5vw, 2.2rem);
                font-weight: 600;
                margin-bottom: 1.5rem;
                line-height: 1.4;
            }

            .drill-sync-timer-bar {
                width: 100%;
                height: 6px;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 0.3rem;
            }
            .drill-sync-timer-fill {
                height: 100%;
                width: 100%;
                background: linear-gradient(90deg, #6366f1, #22c55e);
                border-radius: 3px;
                transition: width 1s linear;
            }
            .drill-sync-timer-text {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.85rem;
                opacity: 0.6;
                margin-bottom: 1.5rem;
                transition: color 0.3s;
            }

            .drill-sync-options {
                display: flex;
                flex-direction: column;
                gap: 0.6rem;
                max-width: 700px;
                margin: 0 auto;
            }
            .drill-sync-option {
                position: relative;
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem 1.2rem;
                background: var(--card-bg, #2a2a2a);
                border: 2px solid var(--border, rgba(255,255,255,0.15));
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s;
                overflow: hidden;
                text-align: left;
            }
            .drill-sync-option:hover {
                border-color: rgba(255,255,255,0.3);
                transform: translateX(4px);
            }
            .drill-sync-option.correct {
                border-color: #22c55e !important;
                background: rgba(34, 197, 94, 0.1) !important;
                box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
            }
            .drill-sync-option.wrong {
                opacity: 0.4;
                border-color: rgba(255,255,255,0.05);
            }
            .drill-sync-option.selected {
                border-color: #6366f1;
            }
            .drill-sync-option-letter {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 0.85rem;
                color: white;
                flex-shrink: 0;
                z-index: 1;
            }
            .drill-sync-option-text {
                flex: 1;
                font-size: clamp(0.95rem, 1.5vw, 1.2rem);
                z-index: 1;
            }
            .drill-sync-option-count {
                font-family: 'JetBrains Mono', monospace;
                font-weight: 700;
                font-size: 1rem;
                z-index: 1;
                min-width: 1.5rem;
                text-align: right;
            }
            .drill-sync-option-bar {
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                border-radius: 10px;
                transition: width 0.5s ease;
                z-index: 0;
            }

            .drill-sync-explanation {
                margin-top: 1rem;
                padding: 1rem 1.5rem;
                background: rgba(34, 197, 94, 0.08);
                border-left: 4px solid #22c55e;
                border-radius: 0 12px 12px 0;
                text-align: left;
                font-size: 1rem;
                line-height: 1.6;
                max-width: 700px;
                margin-left: auto;
                margin-right: auto;
                animation: fadeIn 0.4s ease;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .drill-sync-controls {
                display: flex;
                gap: 0.8rem;
                justify-content: center;
                margin-top: 1.5rem;
                flex-wrap: wrap;
            }
            .drill-sync-btn {
                padding: 0.7rem 1.5rem;
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 10px;
                background: rgba(255,255,255,0.05);
                color: white;
                cursor: pointer;
                font-size: 0.95rem;
                font-weight: 500;
                transition: all 0.2s;
            }
            .drill-sync-btn:hover {
                background: rgba(255,255,255,0.1);
                transform: translateY(-2px);
            }
            .drill-sync-btn-reveal {
                background: rgba(34, 197, 94, 0.15);
                border-color: rgba(34, 197, 94, 0.3);
            }
            .drill-sync-btn-next {
                background: rgba(99, 102, 241, 0.15);
                border-color: rgba(99, 102, 241, 0.3);
            }

            .drill-sync-audience-status {
                margin-top: 1rem;
                font-size: 0.9rem;
                opacity: 0.5;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.4rem;
            }

            /* Results view */
            .drill-sync-results {
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
                max-width: 800px;
                margin: 1.5rem auto 0;
                text-align: left;
            }
            .drill-sync-result-row {
                display: flex;
                align-items: center;
                gap: 0.8rem;
                padding: 0.8rem 1rem;
                background: rgba(255,255,255,0.03);
                border-radius: 10px;
            }
            .drill-sync-result-num {
                font-weight: 700;
                opacity: 0.5;
                min-width: 1.5rem;
            }
            .drill-sync-result-question {
                flex: 1;
                font-size: 0.9rem;
                opacity: 0.8;
            }
            .drill-sync-result-bar-container {
                width: 120px;
                height: 8px;
                background: rgba(255,255,255,0.08);
                border-radius: 4px;
                overflow: hidden;
            }
            .drill-sync-result-bar {
                height: 100%;
                border-radius: 4px;
                transition: width 0.8s ease;
            }
            .drill-sync-result-pct {
                font-family: 'JetBrains Mono', monospace;
                font-weight: 700;
                font-size: 0.9rem;
                min-width: 3rem;
                text-align: right;
            }

            /* Auditorium scaling */
            @media (min-width: 1200px) {
                .drill-sync-question { font-size: clamp(2rem, 4vw, 2.8rem); }
                .drill-sync-option { padding: 1.4rem 1.8rem; }
                .drill-sync-option-text { font-size: 1.3rem; }
            }
        `;
        document.head.appendChild(style);
    }

    // ===== INIT =====
    function init() {
        injectStyles();
        registerDrillSyncType();
        hookAnswerListener();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
})();
