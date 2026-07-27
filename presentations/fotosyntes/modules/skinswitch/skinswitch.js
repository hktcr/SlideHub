/**
 * SlideCraft SkinSwitch v1.0
 * Runtime visual identity switcher.
 * 
 * Drop-in module: Add <script src="modules/skinswitch/skinswitch.js"></script>
 * to any SlideCraft shell.html. The module auto-initializes on DOMContentLoaded.
 * 
 * Keyboard shortcut: T (toggle theme panel), M (toggle calm mode)
 * 
 * Graceful degradation: If themes.json fails to load, the module
 * silently falls back to inline default themes.
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'slidecraft-theme';
    const THEMES_URL_CANDIDATES = [
        'modules/skinswitch/themes.json',
        '../modules/skinswitch/themes.json',
        '../../SlideCraft/modules/skinswitch/themes.json'
    ];

    // Inline fallback themes (subset) in case themes.json can't load
    const FALLBACK_THEMES = {
        'auditorium-dark': {
            name: 'Auditorium Dark', icon: '🌑',
            vars: {
                '--bg': '#000000', '--surface': '#1a1a1a', '--card-bg': '#2a2a2a',
                '--card-bg-hover': '#333333', '--text': '#f1f5f9',
                '--text-muted': 'rgba(255, 255, 255, 0.7)',
                '--accent': '#f97316', '--accent2': '#a855f7',
                '--green': '#22c55e', '--yellow': '#eab308', '--red': '#ef4444',
                '--border': 'rgba(255, 255, 255, 0.15)',
                '--border-hover': 'rgba(255, 255, 255, 0.3)'
            }
        },
        'teams-white': {
            name: 'Teams White', icon: '☀️',
            vars: {
                '--bg': '#ffffff', '--surface': '#f8fafc', '--card-bg': '#f1f5f9',
                '--card-bg-hover': '#e2e8f0', '--text': '#1e293b',
                '--text-muted': 'rgba(30, 41, 59, 0.7)',
                '--accent': '#2563eb', '--accent2': '#7c3aed',
                '--green': '#16a34a', '--yellow': '#ca8a04', '--red': '#dc2626',
                '--border': 'rgba(30, 41, 59, 0.15)',
                '--border-hover': 'rgba(30, 41, 59, 0.3)'
            }
        }
    };

    let themes = {};
    let currentTheme = null;
    let panelVisible = false;

    /**
     * Apply a theme by setting CSS custom properties on :root
     */
    function applyTheme(themeId) {
        const theme = themes[themeId];
        if (!theme) return;

        const root = document.documentElement;
        Object.entries(theme.vars).forEach(([prop, value]) => {
            root.style.setProperty(prop, value);
        });

        currentTheme = themeId;
        localStorage.setItem(STORAGE_KEY, themeId);

        // Update active indicator in panel
        document.querySelectorAll('.skinswitch-item').forEach(el => {
            el.classList.toggle('active', el.dataset.theme === themeId);
        });

        // Update toggle button label
        const btn = document.getElementById('skinswitchToggle');
        if (btn) btn.textContent = theme.icon;
    }

    /**
     * Create the theme selection panel UI
     */
    function createPanel() {
        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'skinswitchToggle';
        toggleBtn.className = 'skinswitch-toggle';
        toggleBtn.textContent = '🎨';
        toggleBtn.title = 'Byt visuell identitet (T)';
        toggleBtn.onclick = () => togglePanel();
        document.body.appendChild(toggleBtn);

        // Panel
        const panel = document.createElement('div');
        panel.id = 'skinswitchPanel';
        panel.className = 'skinswitch-panel';
        panel.innerHTML = `
            <div class="skinswitch-header">
                <span>Visuell identitet</span>
                <button class="skinswitch-close" onclick="document.getElementById('skinswitchPanel').classList.remove('visible')">&times;</button>
            </div>
            <div class="skinswitch-list">
                ${Object.entries(themes).map(([id, t]) => `
                    <div class="skinswitch-item ${id === currentTheme ? 'active' : ''}" 
                         data-theme="${id}" 
                         onclick="window.__skinswitch_apply('${id}')">
                        <span class="skinswitch-icon">${t.icon}</span>
                        <div class="skinswitch-info">
                            <div class="skinswitch-name">${t.name}</div>
                            <div class="skinswitch-desc">${t.description || ''}</div>
                        </div>
                        <div class="skinswitch-preview">
                            <span style="background:${t.vars['--bg']};border:1px solid ${t.vars['--border']}"></span>
                            <span style="background:${t.vars['--accent']}"></span>
                            <span style="background:${t.vars['--accent2']}"></span>
                            <span style="background:${t.vars['--green']}"></span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(panel);

        // Inject styles
        const style = document.createElement('style');
        style.textContent = `
            .skinswitch-toggle {
                position: fixed;
                bottom: 1rem;
                left: 1rem;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.2);
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(8px);
                color: white;
                font-size: 1.3rem;
                cursor: pointer;
                z-index: 9999;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .skinswitch-toggle:hover {
                transform: scale(1.1);
                border-color: rgba(255,255,255,0.5);
            }
            .skinswitch-panel {
                position: fixed;
                bottom: 4rem;
                left: 1rem;
                width: 320px;
                max-height: 80vh;
                background: rgba(20,20,30,0.95);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 16px;
                overflow: hidden;
                z-index: 9998;
                transform: translateY(10px);
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            }
            .skinswitch-panel.visible {
                transform: translateY(0);
                opacity: 1;
                pointer-events: all;
            }
            .skinswitch-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.2rem;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                font-weight: 600;
                font-size: 0.9rem;
                color: rgba(255,255,255,0.9);
            }
            .skinswitch-close {
                background: none;
                border: none;
                color: rgba(255,255,255,0.5);
                font-size: 1.3rem;
                cursor: pointer;
            }
            .skinswitch-list {
                padding: 0.5rem;
                overflow-y: auto;
                max-height: calc(80vh - 60px);
            }
            .skinswitch-item {
                display: flex;
                align-items: center;
                gap: 0.8rem;
                padding: 0.8rem;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s;
                border: 2px solid transparent;
            }
            .skinswitch-item:hover {
                background: rgba(255,255,255,0.05);
            }
            .skinswitch-item.active {
                background: rgba(255,255,255,0.08);
                border-color: rgba(255,255,255,0.2);
            }
            .skinswitch-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            .skinswitch-info {
                flex: 1;
                min-width: 0;
            }
            .skinswitch-name {
                font-weight: 600;
                font-size: 0.85rem;
                color: rgba(255,255,255,0.9);
            }
            .skinswitch-desc {
                font-size: 0.7rem;
                color: rgba(255,255,255,0.5);
                margin-top: 0.2rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .skinswitch-preview {
                display: flex;
                gap: 3px;
                flex-shrink: 0;
            }
            .skinswitch-preview span {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    function togglePanel() {
        const panel = document.getElementById('skinswitchPanel');
        if (panel) {
            panelVisible = !panelVisible;
            panel.classList.toggle('visible', panelVisible);
        }
    }

    /**
     * Attempt to load themes.json from multiple candidate paths
     */
    async function loadThemes() {
        for (const url of THEMES_URL_CANDIDATES) {
            try {
                const resp = await fetch(url);
                if (resp.ok) {
                    const data = await resp.json();
                    return data.themes || {};
                }
            } catch (e) {
                // Try next candidate
            }
        }
        return null;
    }

    /**
     * Initialize SkinSwitch
     */
    async function init() {
        // Try loading external themes, fall back to inline
        const loaded = await loadThemes();
        themes = loaded || FALLBACK_THEMES;

        // Restore saved theme or default
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        currentTheme = (savedTheme && themes[savedTheme]) ? savedTheme : 'auditorium-dark';

        // Apply saved theme immediately (before panel creation)
        if (savedTheme && themes[savedTheme]) {
            applyTheme(savedTheme);
        }

        // Create UI
        createPanel();

        // Update toggle icon
        const btn = document.getElementById('skinswitchToggle');
        if (btn && themes[currentTheme]) {
            btn.textContent = themes[currentTheme].icon;
        }

        // Keyboard shortcut: T to toggle
        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 't' || e.key === 'T') {
                togglePanel();
            }
            if (e.key === 'M' || e.key === 'm') {
                const root = document.documentElement;
                const current = getComputedStyle(root).getPropertyValue('--sf-motion-scale').trim();
                const calm = current === '1' || current === '' ? '0.4' : '1';
                root.style.setProperty('--sf-motion-scale', calm);
                // Visa en kort indikator
                const indicator = document.createElement('div');
                indicator.textContent = calm === '0.4' ? '🌿 Calm mode' : '⚡ Full motion';
                indicator.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:8px 16px;border-radius:8px;background:rgba(0,0,0,0.8);color:white;font-family:system-ui;font-size:14px;z-index:9999;transition:opacity 0.3s;';
                document.body.appendChild(indicator);
                setTimeout(() => { indicator.style.opacity = '0'; setTimeout(() => indicator.remove(), 300); }, 1500);
            }
        });
    }

    // Expose apply function globally for onclick handlers
    window.__skinswitch_apply = applyTheme;

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
