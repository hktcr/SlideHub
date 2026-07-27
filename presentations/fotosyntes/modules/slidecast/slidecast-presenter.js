/**
 * SlideCast Presenter Hook v1.0
 * 
 * Drop-in module for SlideCraft shell.html.
 * Broadcasts slide changes to connected audience clients
 * and receives/displays audience questions.
 * 
 * Usage: <script src="modules/slidecast/slidecast-presenter.js"></script>
 * 
 * The hook auto-detects renderCurrentSlide() calls by monkey-patching
 * the function, requiring zero modifications to existing shell code.
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'slidecast-relay';
    let ws = null;
    let relayUrl = null;
    let roomId = 'default';
    let isActive = false;
    let questions = [];
    let pollResults = {};
    let presenterToken = '';

    /**
     * Initialize the presenter broadcast system
     */
    function init() {
        // Get relay URL from localStorage or URL params
        const params = new URLSearchParams(window.location.search);
        relayUrl = params.get('relay') || localStorage.getItem(STORAGE_KEY);
        roomId = params.get('room') || 'default';
        presenterToken = params.get('token') || localStorage.getItem('slidecast-token') || '';
        if (params.get('token')) localStorage.setItem('slidecast-token', params.get('token'));

        // Create presenter UI elements
        createPresenterUI();

        // Monkey-patch renderCurrentSlide to broadcast on every slide change
        if (typeof window.renderCurrentSlide === 'function') {
            const originalRender = window.renderCurrentSlide;
            window.renderCurrentSlide = function() {
                originalRender.apply(this, arguments);
                broadcastSlideChange();
            };
        }

        // Also hook into openSlide for card-grid based navigation
        if (typeof window.openSlide === 'function') {
            const originalOpen = window.openSlide;
            window.openSlide = function(index) {
                originalOpen.apply(this, arguments);
                setTimeout(broadcastSlideChange, 100);
            };
        }

        // Connect if relay URL is known
        if (relayUrl) {
            connect();
        }
    }

    /**
     * Connect to relay server
     */
    function connect() {
        if (!relayUrl) return;

        localStorage.setItem(STORAGE_KEY, relayUrl);
        const wsUrl = relayUrl.replace(/^http/, 'ws') + '/ws/' + roomId;

        try {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                isActive = true;
                updateStatusIndicator('connected');
                ws.send(JSON.stringify({
                    type: 'join',
                    role: 'presenter',
                    token: presenterToken,
                    meta: getPresenterMeta()
                }));
                // Send initial state
                broadcastSlideChange();
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    handleIncoming(msg);
                } catch (e) {}
            };

            ws.onclose = () => {
                isActive = false;
                updateStatusIndicator('disconnected');
                // Auto-reconnect
                setTimeout(() => {
                    if (relayUrl) connect();
                }, 3000);
            };

            ws.onerror = () => {
                isActive = false;
                updateStatusIndicator('error');
            };
        } catch (e) {
            console.warn('SlideCast: Connection failed', e);
        }
    }

    /**
     * Sanitize slide data for audience broadcast (remove speaker notes, handle non-synced embeds)
     */
    function sanitizeForAudience(slide) {
        if (!slide) return {};
        const clone = JSON.parse(JSON.stringify(slide));
        delete clone.notes; // Never send speaker notes to audience
        if (clone.type === 'embed' && clone.sync !== true) {
            return { type: 'embed-placeholder', title: clone.title || 'Visas på duken' };
        }
        return clone;
    }

    /**
     * Broadcast current slide to all connected audience clients
     */
    function broadcastSlideChange() {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        if (typeof window.slidesData === 'undefined' || typeof window.currentSlideIndex === 'undefined') return;

        const slide = window.slidesData[window.currentSlideIndex];
        if (!slide) return;

        const steps = window.SlideForge && window.SlideForge.steps ? window.SlideForge.steps : { current: 0, total: 0 };

        ws.send(JSON.stringify({
            type: 'slide',
            data: {
                index: window.currentSlideIndex,
                total: window.slidesData.length,
                step: steps.current,
                stepTotal: steps.total,
                slide: sanitizeForAudience(slide)
            }
        }));
    }

    /**
     * Handle incoming messages (questions, votes)
     */
    function handleIncoming(msg) {
        switch (msg.type) {
            case 'error':
                isActive = false;
                updateStatusIndicator('error');
                const t = document.getElementById('slidecastStatusText');
                if (t) t.textContent = '⚠️ ' + (msg.message || 'Anslutning nekad');
                console.error('SlideCast: ' + msg.code + ' - ' + msg.message);
                break;
            case 'question':
                addQuestion(msg);
                break;
            case 'vote':
                recordVote(msg);
                break;
            case 'ask_answer':
                recordAskAnswer(msg);
                break;
            case 'audience_count':
                updateAudienceCount(msg.count);
                break;
        }
    }

    /**
     * Add a question from the audience
     */
    function addQuestion(msg) {
        questions.unshift({
            text: msg.text,
            time: new Date(msg.timestamp || Date.now()),
            read: false
        });

        updateQuestionBadge();
        showQuestionToast(msg.text);
    }

    /**
     * Escape HTML special characters
     */
    function escHtml(str) {
        const d = document.createElement('span');
        d.textContent = String(str == null ? '' : str);
        return d.innerHTML;
    }

    /**
     * Show a brief notification for new questions
     */
    function showQuestionToast(text) {
        const toast = document.createElement('div');
        toast.className = 'slidecast-toast';
        const safeText = escHtml(text);
        toast.innerHTML = `
            <span class="slidecast-toast-icon">💬</span>
            <span class="slidecast-toast-text">${safeText.substring(0, 80)}${safeText.length > 80 ? '...' : ''}</span>
        `;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('visible');
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        });
    }

    window.slideCastSend = function(msg) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.warn('SlideCast: Not connected');
            return false;
        }
        ws.send(JSON.stringify(msg));
        return true;
    };

    const askAnswers = {};   // { askId: { texts: [], voters: Set } }
    function recordAskAnswer(msg) {
        const id = msg.askId;
        if (!id) return;
        if (!askAnswers[id]) askAnswers[id] = { texts: [], voters: new Set() };
        const a = askAnswers[id];
        if (msg.participantId) {
            if (a.voters.has(msg.participantId)) return;
            a.voters.add(msg.participantId);
        }
        a.texts.push(String(msg.text || '').slice(0, 300));
        if (typeof window.__ask_updateCount === 'function') window.__ask_updateCount(id, a.texts.length);
    }
    
    window.__ask_getAggregate = function(id) {
        const a = askAnswers[id];
        return a ? { n: a.texts.length, texts: a.texts.slice() } : { n: 0, texts: [] };
    };

    /**
     * Record a poll vote
     */
    function recordVote(msg) {
        const id = msg.pollId;
        if (!id) return;
        if (!pollResults[id]) pollResults[id] = { counts: {}, voters: new Set() };
        const p = pollResults[id];
        if (msg.participantId) {
            if (p.voters.has(msg.participantId)) return;
            p.voters.add(msg.participantId);
        }
        p.counts[msg.option] = (p.counts[msg.option] || 0) + 1;
        updatePollResults(id, msg.option);
    }

    function updatePollResults(pollId, optIndex) {
        if (typeof window.__pulsecheck_remoteVote === 'function') {
            window.__pulsecheck_remoteVote(pollId, optIndex);
        }
    }

    /**
     * Send a poll to all audience clients
     */
    window.slideCastPoll = function(question, options, pollId) {
        const id = pollId || ('poll-' + Date.now());
        pollResults[id] = pollResults[id] || { counts: {}, voters: new Set() };
        window.slideCastSend({ type: 'poll_start', data: { id: id, question: question, options: options } });
        return id;
    };

    /**
     * Get presentation metadata for the relay
     */
    function getPresenterMeta() {
        if (typeof window.slidesData === 'undefined') return {};
        
        // Try to extract from first title slide
        const titleSlide = window.slidesData.find(s => s.type === 'title');
        return {
            title: titleSlide ? titleSlide.title : document.title,
            slideCount: window.slidesData.length,
            date: new Date().toISOString()
        };
    }

    // ===== UI CREATION =====

    function createPresenterUI() {
        // Status indicator (top-left, near existing controls)
        const statusBtn = document.createElement('button');
        statusBtn.id = 'slidecastStatus';
        statusBtn.className = 'slidecast-status';
        statusBtn.title = 'SlideCast — Publiksynk';
        statusBtn.innerHTML = '📡';
        statusBtn.onclick = () => togglePresenterPanel();
        document.body.appendChild(statusBtn);

        // Question badge
        const badge = document.createElement('span');
        badge.id = 'slidecastBadge';
        badge.className = 'slidecast-badge';
        badge.style.display = 'none';
        statusBtn.appendChild(badge);

        // Presenter panel (questions list, connection settings)
        const panel = document.createElement('div');
        panel.id = 'slidecastPanel';
        panel.className = 'slidecast-panel';
        panel.innerHTML = `
            <div class="slidecast-panel-header">
                <span>📡 SlideCast</span>
                <button onclick="document.getElementById('slidecastPanel').classList.remove('visible')">✕</button>
            </div>
            <div class="slidecast-panel-body">
                <div class="slidecast-conn-section">
                    <label>Relay-server</label>
                    <div style="display:flex;gap:0.5rem">
                        <input type="text" id="slidecastRelayInput" placeholder="ws://localhost:8787" 
                               value="${relayUrl || ''}" style="flex:1">
                        <button onclick="window.__slidecast_connect()" id="slidecastConnectBtn">Anslut</button>
                    </div>
                    <div class="slidecast-status-text" id="slidecastStatusText">
                        ${relayUrl ? 'Ansluter...' : 'Ej ansluten'}
                    </div>
                    <div class="slidecast-audience-count" id="slidecastAudience" style="display:none">
                        👥 <span id="slidecastAudienceNum">0</span> i publiken
                    </div>
                </div>
                <div class="slidecast-room-section">
                    <label>Rumskod</label>
                    <div style="display:flex;gap:0.5rem;align-items:center">
                        <input type="text" id="slidecastRoomCode" placeholder="t.ex. BJÖRN" 
                               value="${roomId !== 'default' ? roomId : ''}" 
                               style="flex:1;text-transform:uppercase;letter-spacing:0.15em;font-weight:700"
                               maxlength="6">
                        <button onclick="window.__slidecast_setCode()" style="white-space:nowrap">Aktivera</button>
                        <button onclick="window.__slidecast_randomCode()" title="Slumpa kod" style="padding:0.5rem">🎲</button>
                    </div>
                    <div class="slidecast-room-status" id="slidecastRoomStatus" style="margin-top:0.4rem;font-size:0.8rem;color:rgba(255,255,255,0.5)">
                        ${roomId !== 'default' ? '🟢 Kod aktiv: ' + roomId : 'Ingen kod satt'}
                    </div>
                    <label style="margin-top:1rem">Presentatörstoken</label>
                    <div style="display:flex;gap:0.5rem;align-items:center">
                        <input type="password" id="slidecastToken" placeholder="Hemlig token" 
                               value="${presenterToken || ''}" 
                               style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:white;padding:0.5rem 0.8rem;outline:none;">
                        <button onclick="window.__slidecast_setToken()" style="white-space:nowrap">Spara</button>
                    </div>
                    <button onclick="window.__slidecast_closeRoom()" id="slidecastCloseBtn" 
                            style="margin-top:0.5rem;width:100%;padding:0.4rem;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:8px;color:#fca5a5;cursor:pointer;font-size:0.8rem;display:${roomId !== 'default' ? 'block' : 'none'}">
                        ✕ Stäng rum
                    </button>
                </div>
                <div class="slidecast-questions-section">
                    <label>Frågor från publiken</label>
                    <div id="slidecastQuestions" class="slidecast-questions">
                        <div class="slidecast-no-questions">Inga frågor ännu</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        // Inject styles
        const style = document.createElement('style');
        style.textContent = `
            .slidecast-status {
                position: fixed;
                top: 1rem;
                left: 1rem;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.15);
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(8px);
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                z-index: 9999;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .slidecast-status:hover { border-color: rgba(255,255,255,0.4); }
            .slidecast-status.connected { border-color: #22c55e; }
            .slidecast-status.error { border-color: #ef4444; }

            .slidecast-badge {
                position: absolute;
                top: -4px;
                right: -4px;
                min-width: 18px;
                height: 18px;
                border-radius: 9px;
                background: #ef4444;
                color: white;
                font-size: 0.65rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 4px;
                animation: badgePop 0.3s ease;
            }
            @keyframes badgePop {
                0% { transform: scale(0); }
                50% { transform: scale(1.3); }
                100% { transform: scale(1); }
            }

            .slidecast-panel {
                position: fixed;
                top: 4rem;
                left: 1rem;
                width: 340px;
                max-height: 80vh;
                background: rgba(15,15,25,0.95);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 16px;
                z-index: 9998;
                transform: translateY(10px);
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            }
            .slidecast-panel.visible {
                transform: translateY(0);
                opacity: 1;
                pointer-events: all;
            }

            .slidecast-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid rgba(255,255,255,0.08);
                font-weight: 600;
                font-size: 0.9rem;
            }
            .slidecast-panel-header button {
                background: none;
                border: none;
                color: rgba(255,255,255,0.5);
                font-size: 1.2rem;
                cursor: pointer;
            }

            .slidecast-panel-body {
                padding: 1rem;
                overflow-y: auto;
                max-height: calc(80vh - 60px);
            }

            .slidecast-conn-section { margin-bottom: 1.5rem; }
            .slidecast-room-section { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
            .slidecast-conn-section label,
            .slidecast-room-section label,
            .slidecast-questions-section label {
                display: block;
                font-size: 0.75rem;
                color: rgba(255,255,255,0.5);
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .slidecast-conn-section input {
                padding: 0.5rem 0.8rem;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 8px;
                color: white;
                font-size: 0.85rem;
                font-family: 'JetBrains Mono', monospace;
                outline: none;
            }
            .slidecast-conn-section input:focus {
                border-color: #6366f1;
            }
            .slidecast-conn-section button {
                padding: 0.5rem 1rem;
                background: #6366f1;
                border: none;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                font-size: 0.85rem;
                white-space: nowrap;
            }

            .slidecast-status-text {
                font-size: 0.8rem;
                margin-top: 0.5rem;
                color: rgba(255,255,255,0.5);
            }

            .slidecast-audience-count {
                margin-top: 0.5rem;
                font-size: 0.85rem;
                color: #22c55e;
            }

            .slidecast-questions {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .slidecast-no-questions {
                color: rgba(255,255,255,0.3);
                font-size: 0.85rem;
                text-align: center;
                padding: 1rem;
            }
            .slidecast-question-item {
                padding: 0.8rem;
                background: rgba(255,255,255,0.04);
                border-radius: 8px;
                border-left: 3px solid #6366f1;
                font-size: 0.9rem;
                line-height: 1.4;
                animation: slideIn 0.3s ease;
            }
            .slidecast-question-item .time {
                font-size: 0.7rem;
                color: rgba(255,255,255,0.3);
                margin-top: 0.3rem;
            }
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(-10px); }
                to { opacity: 1; transform: translateX(0); }
            }

            .slidecast-toast {
                position: fixed;
                bottom: 5rem;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: rgba(15,15,25,0.95);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(99, 102, 241, 0.3);
                border-radius: 12px;
                padding: 0.8rem 1.2rem;
                display: flex;
                align-items: center;
                gap: 0.8rem;
                z-index: 10000;
                opacity: 0;
                transition: all 0.3s ease;
                max-width: 500px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            }
            .slidecast-toast.visible {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            .slidecast-toast-icon { font-size: 1.3rem; }
            .slidecast-toast-text { font-size: 0.9rem; }
        `;
        document.head.appendChild(style);
    }

    function togglePresenterPanel() {
        const panel = document.getElementById('slidecastPanel');
        panel.classList.toggle('visible');
    }

    function updateStatusIndicator(state) {
        const btn = document.getElementById('slidecastStatus');
        const text = document.getElementById('slidecastStatusText');
        
        btn.className = 'slidecast-status ' + state;

        const labels = {
            connected: '✅ Ansluten — publiken synkas',
            disconnected: '❌ Frånkopplad',
            error: '⚠️ Anslutningsfel',
            connecting: '⏳ Ansluter...'
        };
        if (text) text.textContent = labels[state] || state;
    }

    function updateQuestionBadge() {
        const badge = document.getElementById('slidecastBadge');
        const unread = questions.filter(q => !q.read).length;
        
        if (unread > 0) {
            badge.textContent = unread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }

        // Update questions list
        const list = document.getElementById('slidecastQuestions');
        if (questions.length === 0) {
            list.innerHTML = '<div class="slidecast-no-questions">Inga frågor ännu</div>';
        } else {
            list.innerHTML = questions.map(q => `
                <div class="slidecast-question-item">
                    ${escHtml(q.text)}
                    <div class="time">${q.time.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `).join('');
        }
    }

    function updateAudienceCount(count) {
        const el = document.getElementById('slidecastAudience');
        const num = document.getElementById('slidecastAudienceNum');
        if (count > 0) {
            el.style.display = 'block';
            num.textContent = count;
        } else {
            el.style.display = 'none';
        }
    }

    // Expose connect function for UI
    window.__slidecast_connect = function() {
        const input = document.getElementById('slidecastRelayInput');
        relayUrl = input.value.trim();
        if (relayUrl) {
            if (ws) ws.close();
            connect();
        }
    };

    // ===== ROOM CODE MANAGEMENT =====

    /**
     * Set a custom room code
     */
    window.__slidecast_setCode = function() {
        const input = document.getElementById('slidecastRoomCode');
        const code = input.value.trim().toUpperCase();
        if (!code || code.length < 2) return;

        roomId = code;
        input.value = code;

        // Reconnect with new room ID
        if (ws) ws.close();
        if (relayUrl) connect();

        updateRoomStatus(code);
    };

    /**
     * Generate a random memorable code
     */
    window.__slidecast_randomCode = function() {
        // Short, memorable codes — mix of consonants and vowels
        const syllables = ['BA','BE','BI','BO','BU','DA','DE','DI','DO','DU',
                          'FA','FE','FI','FO','FU','KA','KE','KI','KO','KU',
                          'LA','LE','LI','LO','LU','MA','ME','MI','MO','MU',
                          'NA','NE','NI','NO','NU','PA','PE','PI','PO','PU',
                          'RA','RE','RI','RO','RU','SA','SE','SI','SO','SU',
                          'TA','TE','TI','TO','TU','VA','VE','VI','VO','VU'];
        const code = syllables[Math.floor(Math.random()*syllables.length)] + 
                     syllables[Math.floor(Math.random()*syllables.length)] +
                     Math.floor(Math.random()*10);
        
        const input = document.getElementById('slidecastRoomCode');
        input.value = code;

        roomId = code;
        if (ws) ws.close();
        if (relayUrl) connect();

        updateRoomStatus(code);
    };

    /**
     * Set presenter token manually
     */
    window.__slidecast_setToken = function() {
        const input = document.getElementById('slidecastToken');
        presenterToken = input.value.trim();
        localStorage.setItem('slidecast-token', presenterToken);
        if (ws) ws.close();
        if (relayUrl) connect();
    };

    /**
     * Close the room (disconnect, reset to default)
     */
    window.__slidecast_closeRoom = function() {
        roomId = 'default';
        if (ws) ws.close();
        ws = null;
        isActive = false;

        const input = document.getElementById('slidecastRoomCode');
        input.value = '';
        updateStatusIndicator('disconnected');
        updateRoomStatus(null);
    };

    function updateRoomStatus(code) {
        const statusEl = document.getElementById('slidecastRoomStatus');
        const closeBtn = document.getElementById('slidecastCloseBtn');
        if (code) {
            statusEl.innerHTML = `🟢 Kod aktiv: <strong style="letter-spacing:0.15em;color:#a78bfa">${code}</strong>`;
            closeBtn.style.display = 'block';
        } else {
            statusEl.textContent = 'Ingen kod satt';
            closeBtn.style.display = 'none';
        }
    }

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
