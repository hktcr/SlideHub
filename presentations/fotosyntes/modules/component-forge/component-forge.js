/**
 * SlideCraft Component Forge (P6) — Sprint 1+2+3+4
 * 
 * Drop-in module that registers animated slide types:
 *   Sprint 1: word-cascade, box-reveal, bullet-build
 *   Sprint 2: line-chart, comparison, timeline-vertical
 *   Sprint 3: progress-ring, number-wall, bar-race
 *   Sprint 4: giant-text, callout, section-divider, hero-image, outro
 *   Sprint 5: ai-conversation, before-after, prompt-reveal, pitfall
 *   Sprint 6: stat-compare, voice-collage, portrait-quote, reflection
 *   Sprint 7+8: collage, process-chain, acronym-list, map-pins, mindmap
 *   Signature: letter-morph (Håkan-original)
 *
 * Usage: Add <script src="modules/component-forge/component-forge.js"></script>
 *        to any SlideCraft shell.html
 * 
 * Zero-dependency. Monkey-patches slideTypeRegistry.
 */
(function() {
    'use strict';

    // ===== INJECT CSS =====
    const style = document.createElement('style');
    style.textContent = `
        /* === SlideForge Motion Tokens === */
        :root {
          --sf-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
          --sf-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
          --sf-ease-dramatic: cubic-bezier(0.23, 1, 0.32, 1);
          --sf-ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          --sf-dur-fast: 0.4s;
          --sf-dur-normal: 0.6s;
          --sf-dur-slow: 0.8s;
          --sf-dur-ambient: 3s;
          --sf-motion-scale: 1;
          --sf-font-quote: 'Georgia', 'Times New Roman', serif;
        }

        @media (prefers-reduced-motion: reduce) {
          :root {
            --sf-motion-scale: 0;
            --sf-dur-fast: 0.01s;
            --sf-dur-normal: 0.01s;
            --sf-dur-slow: 0.01s;
            --sf-dur-ambient: 0.01s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [class*="pulse"], [class*="glow"], [class*="shimmer"],
          [class*="spin"], [class*="breathe"], [class*="float"] {
            animation-duration: 0.01s !important;
            animation-iteration-count: 1 !important;
          }
        }

        /* === SlideForge Density === */
        .sf-density-handheld .slide-word-cascade .wc-word { font-size: clamp(1.1rem, 6vw, 1.8rem); }
        .sf-density-handheld .slide-bullet-build .bb-item { font-size: clamp(0.95rem, 4.2vw, 1.3rem); }
        .sf-density-handheld .br-grid { grid-template-columns: 1fr !important; }
        .sf-density-handheld .nw-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .sf-density-handheld .cmp-grid { grid-template-columns: 1fr !important; }
        .sf-density-handheld .slide-embed,
        .sf-density-handheld .slide-video { aspect-ratio: 4/3; }
        .sf-density-handheld h2 { font-size: clamp(1.2rem, 5vw, 1.8rem) !important; }
        .sf-density-handheld .lc-chart { height: 40vh; }

        /* === SlideForge Print Fallback === */
        @media print {
          * {
            animation: none !important;
            transition: none !important;
          }
          :root {
            --bg: #ffffff !important;
            --surface: #f5f5f5 !important;
            --text: #000000 !important;
            --text-muted: #555555 !important;
            --accent: #2563eb !important;
            --accent2: #7c3aed !important;
            --border: #cccccc !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .slide {
            page-break-after: always;
            min-height: 100vh;
            break-inside: avoid;
            opacity: 1 !important;
            transform: none !important;
          }
          /* Force all elements visible in print */
          [style*="opacity: 0"],
          [style*="opacity:0"] {
            opacity: 1 !important;
            transform: none !important;
          }
          /* Hide interactive-only elements */
          .slide-nav, .theme-switcher, .slidecast-bar,
          .rehearsal-bar, .pulsecheck-overlay, .drillsync-overlay {
            display: none !important;
          }
        }

        /* === Text-wrap balance for headings === */
        .slide h1, .slide h2, .slide .title,
        [class*="-title"], [class*="Title"] {
          text-wrap: balance;
        }

        /* ===== WORD CASCADE ===== */
        @keyframes wordDrop {
            0% { opacity: 0; transform: translateY(-28px) scale(0.95); }
            60% { opacity: 1; transform: translateY(4px) scale(1.02); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wordLand {
            0% { opacity: 0; transform: translateY(-28px) scale(0.95); }
            50% { opacity: 1; transform: translateY(6px) scale(1.08); }
            70% { transform: translateY(-2px) scale(1.02); }
            100% { opacity: 1; transform: translateY(0) scale(1); text-shadow: 0 0 30px var(--accent, #f97316); }
        }
        .slide-word-cascade {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 0.4em;
            padding: 2rem;
            min-height: 60vh;
        }
        .slide-word-cascade .wc-word {
            font-size: clamp(2rem, 5vw, 4.5rem);
            font-weight: 700;
            color: var(--text, #f1f5f9);
            opacity: 0;
            display: inline-block;
        }
        .slide-word-cascade .wc-word.wc-emphasis {
            color: var(--accent, #f97316);
            font-style: italic;
        }

        /* ===== BOX REVEAL ===== */
        @keyframes boxBounce {
            0% { opacity: 0; transform: scale(0) rotate(-5deg); }
            50% { opacity: 1; transform: scale(1.08) rotate(1deg); }
            70% { transform: scale(0.97) rotate(-0.5deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes shimmerBorder {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
        .slide-box-reveal {
            padding: 2rem;
        }
        .slide-box-reveal h2 {
            text-align: center;
            font-size: clamp(1.5rem, 3vw, 2.5rem);
            margin-bottom: 2rem;
            opacity: 0;
            animation: wordDrop 0.6s ease 0.1s forwards;
        }
        .slide-box-reveal .br-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.5rem;
            max-width: 1000px;
            margin: 0 auto;
        }
        .slide-box-reveal .br-box {
            background: var(--card-bg, #2a2a2a);
            border: 1px solid var(--border, rgba(255,255,255,0.15));
            border-radius: 16px;
            padding: 1.8rem 1.5rem;
            text-align: center;
            opacity: 0;
            position: relative;
            overflow: hidden;
        }
        .slide-box-reveal .br-box::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 16px;
            padding: 1px;
            background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
            background-size: 200% 100%;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation: shimmerBorder 4s ease-in-out infinite;
            pointer-events: none;
        }
        .slide-box-reveal .br-icon {
            font-size: 2.5rem;
            margin-bottom: 0.8rem;
            display: block;
        }
        .slide-box-reveal .br-icon-img {
            width: 48px;
            height: 48px;
            object-fit: contain;
            margin: 0 auto 0.8rem;
            display: block;
        }
        .slide-box-reveal .br-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--accent, #f97316);
            margin-bottom: 0.5rem;
        }
        .slide-box-reveal .br-text {
            font-size: 0.95rem;
            color: var(--text-muted, rgba(255,255,255,0.7));
            line-height: 1.5;
        }

        /* ===== BULLET BUILD ===== */
        @keyframes bulletSlide {
            0% { opacity: 0; transform: translateX(-30px); }
            60% { opacity: 1; transform: translateX(4px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes dotPop {
            0% { transform: scale(0); }
            60% { transform: scale(1.4); }
            100% { transform: scale(1); }
        }
        .slide-bullet-build {
            padding: 2rem 3rem;
            max-width: 900px;
            margin: 0 auto;
        }
        .slide-bullet-build h2 {
            font-size: clamp(1.5rem, 3vw, 2.5rem);
            margin-bottom: 2rem;
            opacity: 0;
            animation: wordDrop 0.6s ease 0.1s forwards;
        }
        .slide-bullet-build .bb-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .slide-bullet-build .bb-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 0.8rem 0;
            font-size: clamp(1.1rem, 2.2vw, 1.6rem);
            color: var(--text, #f1f5f9);
            opacity: 0;
            border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
        }
        .slide-bullet-build .bb-item:last-child {
            border-bottom: none;
        }
        .slide-bullet-build .bb-dot {
            width: 12px;
            height: 12px;
            min-width: 12px;
            border-radius: 50%;
            background: var(--accent, #f97316);
            margin-top: 0.45em;
            opacity: 0;
        }
        .slide-bullet-build .bb-item.bb-emphasis {
            color: var(--accent, #f97316);
            font-weight: 600;
        }
        .slide-bullet-build .bb-subtitle {
            font-size: 0.85em;
            color: var(--text-muted, rgba(255,255,255,0.6));
            margin-top: 0.3rem;
            display: block;
        }

        /* ===== LINE CHART ===== */
        .slide-line-chart {
            padding: 2rem;
            max-width: 900px;
            margin: 0 auto;
        }
        .slide-line-chart h2 {
            text-align: center;
            font-size: clamp(1.3rem, 2.5vw, 2rem);
            margin-bottom: 1.5rem;
            opacity: 0;
            animation: wordDrop 0.6s ease 0.1s forwards;
        }
        .slide-line-chart .lc-chart {
            position: relative;
            width: 100%;
            aspect-ratio: 16/9;
        }
        .slide-line-chart svg {
            width: 100%;
            height: 100%;
        }
        .slide-line-chart .lc-axis-label {
            fill: var(--text-muted, rgba(255,255,255,0.5));
            font-size: 12px;
            font-family: inherit;
        }
        .slide-line-chart .lc-grid-line {
            stroke: var(--border, rgba(255,255,255,0.1));
            stroke-width: 1;
        }
        .slide-line-chart .lc-data-line {
            fill: none;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        @keyframes drawLine {
            to { stroke-dashoffset: 0; }
        }
        .slide-line-chart .lc-dot {
            opacity: 0;
            cursor: pointer;
            transition: r 0.2s, filter 0.2s;
        }
        .slide-line-chart .lc-dot:hover {
            filter: brightness(1.5);
        }
        .slide-line-chart .lc-point-label {
            fill: var(--text, rgba(255,255,255,0.9));
            font-size: 11px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            opacity: 0;
            animation: wordDrop 0.4s ease forwards;
        }
        @keyframes dotAppear {
            0% { opacity: 0; r: 0; }
            60% { opacity: 1; r: 7; }
            100% { opacity: 1; r: 5; }
        }
        .lc-tooltip {
            position: absolute;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid var(--accent, #f97316);
            padding: 1.2rem 1.5rem;
            border-radius: 10px;
            color: #fff;
            font-size: 1.25rem;
            pointer-events: none;
            opacity: 0;
            transform: translate(-50%, -100%) translateY(-10px);
            transition: opacity 0.2s, transform 0.2s;
            z-index: 100;
            white-space: nowrap;
            box-shadow: 0 8px 30px rgba(0,0,0,0.7);
        }
        .lc-tooltip.visible {
            opacity: 1;
            transform: translate(-50%, -100%) translateY(-18px);
        }
        .lc-tooltip-title {
            font-weight: bold;
            color: var(--accent, #f97316);
            margin-bottom: 0.5rem;
            font-size: 1.5rem;
        }
        .slide-line-chart .lc-legend {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 1rem;
            opacity: 0;
            animation: wordDrop 0.5s ease 2.5s forwards;
        }
        .slide-line-chart .lc-legend-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: var(--text-muted, rgba(255,255,255,0.7));
        }
        .slide-line-chart .lc-legend-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

        /* ===== COMPARISON ===== */
        @keyframes slideFromLeft {
            from { opacity: 0; transform: translateX(-60px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideFromRight {
            from { opacity: 0; transform: translateX(60px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes highlightPulse {
            0%, 100% { background: rgba(var(--accent-rgb, 249,115,22), 0.08); }
            50% { background: rgba(var(--accent-rgb, 249,115,22), 0.18); }
        }
        .slide-comparison {
            padding: 2rem;
            max-width: 950px;
            margin: 0 auto;
        }
        .slide-comparison h2 {
            text-align: center;
            font-size: clamp(1.4rem, 2.8vw, 2.2rem);
            margin-bottom: 2rem;
            opacity: 0;
            animation: wordDrop 0.6s ease 0.1s forwards;
        }
        .slide-comparison .cmp-grid {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 0;
            align-items: stretch;
        }
        .slide-comparison .cmp-col {
            opacity: 0;
            padding: 1.5rem;
        }
        .slide-comparison .cmp-col.cmp-left {
            animation: slideFromLeft 0.7s ease 0.3s forwards;
        }
        .slide-comparison .cmp-col.cmp-right {
            animation: slideFromRight 0.7s ease 0.5s forwards;
        }
        .slide-comparison .cmp-divider {
            width: 2px;
            background: linear-gradient(180deg, transparent, var(--accent, #f97316), transparent);
            opacity: 0;
            animation: wordDrop 0.5s ease 0.4s forwards;
        }
        .slide-comparison .cmp-label {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--accent, #f97316);
            margin-bottom: 1.2rem;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .slide-comparison .cmp-item {
            padding: 0.8rem 1rem;
            margin-bottom: 0.6rem;
            border-radius: 10px;
            font-size: clamp(0.95rem, 1.8vw, 1.2rem);
            color: var(--text, #f1f5f9);
            background: var(--card-bg, #2a2a2a);
            border: 1px solid var(--border, rgba(255,255,255,0.1));
            transition: background 0.3s;
        }
        .slide-comparison .cmp-item.cmp-highlight {
            border-color: var(--accent, #f97316);
            animation: highlightPulse 3s ease-in-out 1.5s infinite;
        }

        /* ===== TIMELINE VERTICAL ===== */
        @keyframes drawDown {
            from { height: 0; }
            to { height: 100%; }
        }
        @keyframes nodePopIn {
            0% { opacity: 0; transform: scale(0) translateX(-50%); }
            60% { opacity: 1; transform: scale(1.15) translateX(-50%); }
            100% { opacity: 1; transform: scale(1) translateX(-50%); }
        }
        .slide-timeline-v {
            padding: 2rem;
            max-width: 750px;
            margin: 0 auto;
        }
        .slide-timeline-v h2 {
            text-align: center;
            font-size: clamp(1.3rem, 2.5vw, 2rem);
            margin-bottom: 2rem;
            opacity: 0;
            animation: wordDrop 0.6s ease 0.1s forwards;
        }
        .slide-timeline-v .tv-track {
            position: relative;
            padding-left: 60px;
            min-height: 300px;
            margin-top: 2rem;
        }
        .slide-timeline-v .tv-line {
            position: absolute;
            left: 20px;
            top: 0;
            width: 4px;
            height: 0;
            background: linear-gradient(180deg, var(--accent, #f97316), var(--accent2, #a855f7));
            border-radius: 2px;
            animation: drawDown 2s ease 0.3s forwards;
        }
        .slide-timeline-v .tv-node {
            position: relative;
            padding: 1.5rem 0 2.5rem 2rem;
            opacity: 0;
        }
        .slide-timeline-v .tv-dot {
            position: absolute;
            left: -48px;
            top: 1.8rem;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--accent, #f97316);
            border: 4px solid var(--bg, #000);
            opacity: 0;
        }
        .slide-timeline-v .tv-year {
            font-size: clamp(1.2rem, 2vw, 1.5rem);
            font-weight: 700;
            color: var(--accent, #f97316);
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }
        .slide-timeline-v .tv-text {
            font-size: clamp(1.8rem, 3.5vw, 2.5rem);
            font-weight: 500;
            color: var(--text, #f1f5f9);
            line-height: 1.4;
        }
        .slide-timeline-v .tv-sub {
            font-size: clamp(1.2rem, 2vw, 1.5rem);
            color: var(--text-muted, rgba(255,255,255,0.6));
            margin-top: 0.5rem;
            line-height: 1.4;
        }

        /* ===== PROGRESS RING ===== */
        @keyframes ringFill {
            to { stroke-dashoffset: var(--ring-target); }
        }
        .slide-progress-ring {
            padding: 2rem;
            text-align: center;
        }
        .slide-progress-ring h2 {
            font-size: clamp(1.3rem, 2.5vw, 2rem);
            margin-bottom: 1.5rem;
            opacity: 0;
            animation: wordDrop 0.6s ease 0.1s forwards;
        }
        .slide-progress-ring .pr-wrap {
            position: relative;
            display: inline-block;
        }
        .slide-progress-ring svg {
            transform: rotate(-90deg);
        }
        .slide-progress-ring .pr-bg {
            fill: none;
            stroke: var(--surface, #1a1a1a);
            stroke-width: 12;
        }
        .slide-progress-ring .pr-fg {
            fill: none;
            stroke-width: 12;
            stroke-linecap: round;
        }
        .slide-progress-ring .pr-center {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        .slide-progress-ring .pr-value {
            font-size: clamp(3rem, 8vw, 6rem);
            font-weight: 700;
            color: var(--text, #f1f5f9);
            line-height: 1;
        }
        .slide-progress-ring .pr-unit {
            font-size: 0.4em;
            color: var(--text-muted, rgba(255,255,255,0.6));
        }
        .slide-progress-ring .pr-subtitle {
            font-size: 0.95rem;
            color: var(--text-muted, rgba(255,255,255,0.6));
            margin-top: 1rem;
            opacity: 0;
            animation: wordDrop 0.5s ease 2.5s forwards;
        }

        /* ===== NUMBER WALL ===== */
        .slide-number-wall {
            padding: 2rem;
        }
        .slide-number-wall h2 {
            text-align: center;
            font-size: clamp(1.3rem, 2.5vw, 2rem);
            margin-bottom: 2rem;
            opacity: 0;
            animation: wordDrop 0.6s ease 0.1s forwards;
        }
        .slide-number-wall .nw-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1.5rem;
            max-width: 900px;
            margin: 0 auto;
        }
        .slide-number-wall .nw-cell {
            text-align: center;
            padding: 1.5rem 1rem;
            background: var(--card-bg, #2a2a2a);
            border: 1px solid var(--border, rgba(255,255,255,0.1));
            border-radius: 16px;
            opacity: 0;
        }
        .slide-number-wall .nw-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            display: block;
        }
        .slide-number-wall .nw-icon-img {
            width: 36px;
            height: 36px;
            object-fit: contain;
            margin: 0 auto 0.5rem;
            display: block;
        }
        .slide-number-wall .nw-value {
            font-size: clamp(2.2rem, 5vw, 3.5rem);
            font-weight: 700;
            color: var(--accent, #f97316);
            line-height: 1.1;
        }
        .slide-number-wall .nw-label {
            font-size: 0.9rem;
            color: var(--text-muted, rgba(255,255,255,0.6));
            margin-top: 0.3rem;
        }

        /* ===== BAR RACE ===== */
        @keyframes barGrow {
            from { width: 0; }
        }
        @keyframes barPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(var(--bar-rgb, 255,255,255), 0.3); }
            50% { box-shadow: 0 0 12px 4px rgba(var(--bar-rgb, 255,255,255), 0.15); }
        }
        .slide-bar-race {
            padding: 2rem 3rem;
            max-width: 850px;
            margin: 0 auto;
        }
        .slide-bar-race h2 {
            text-align: center;
            font-size: clamp(1.3rem, 2.5vw, 2rem);
            margin-bottom: 2rem;
            opacity: 0;
            animation: wordDrop 0.6s ease 0.1s forwards;
        }
        .slide-bar-race .brc-row {
            display: grid;
            grid-template-columns: 120px 1fr 50px;
            align-items: center;
            gap: 0.8rem;
            margin-bottom: 0.8rem;
            opacity: 0;
        }
        .slide-bar-race .brc-label {
            font-size: clamp(0.85rem, 1.5vw, 1.05rem);
            color: var(--text, #f1f5f9);
            text-align: right;
            font-weight: 600;
        }
        .slide-bar-race .brc-track {
            height: 32px;
            background: var(--surface, #1a1a1a);
            border-radius: 8px;
            overflow: hidden;
            position: relative;
        }
        .slide-bar-race .brc-bar {
            height: 100%;
            border-radius: 8px;
            position: relative;
        }
        .slide-bar-race .brc-val {
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--text-muted, rgba(255,255,255,0.6));
        }
        .slide-bar-race .brc-row.brc-leader .brc-val {
            color: var(--accent, #f97316);
        }

        /* ===== SHARED: Slide active overrides ===== */
        .slide-word-cascade,
        .slide-box-reveal,
        .slide-bullet-build,
        .slide-line-chart,
        .slide-comparison,
        .slide-timeline-v,
        .slide-progress-ring,
        .slide-number-wall,
        .slide-bar-race {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 70vh;
        }
        .slide-word-cascade {
            flex-direction: row;
            flex-wrap: wrap;
            align-content: center;
        }

        /* ===== SPRINT 4: GIANT TEXT ===== */
        @keyframes gtWordFade {
            0% { opacity: 0; transform: translateY(12px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .slide-giant-text {
            display: flex; flex-direction: column; align-items: flex-start;
            justify-content: center; padding: 3rem 5rem; min-height: 70vh;
            position: relative; overflow: hidden;
        }
        .slide-giant-text.gt-center { align-items: center; text-align: center; }
        .slide-giant-text .gt-decoration {
            position: absolute; right: 5%; top: 50%; transform: translateY(-50%);
            font-size: clamp(15rem, 35vw, 45rem); font-weight: 900;
            color: var(--accent, #f97316); opacity: 0.07; line-height: 1;
            pointer-events: none; z-index: 0;
        }
        .slide-giant-text .gt-text {
            position: relative; z-index: 1;
            font-size: clamp(2.5rem, 7vw, 7rem); font-weight: 700;
            line-height: 1.15; color: var(--text, #f1f5f9);
        }
        .slide-giant-text .gt-text .gt-bold {
            color: var(--accent, #f97316); font-weight: 800;
        }
        .slide-giant-text .gt-text .gt-word {
            display: inline-block; opacity: 0; margin-right: 0.25em;
            animation: gtWordFade 0.5s ease-out forwards;
        }
        .slide-giant-text.gt-serif .gt-text { font-family: Georgia, 'Times New Roman', serif; font-style: italic; }

        /* ===== SPRINT 4: CALLOUT ===== */
        @keyframes calloutEnter {
            0% { opacity: 0; transform: scale(0.92); }
            100% { opacity: 1; transform: scale(1); }
        }
        @keyframes calloutPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.1); }
            50% { box-shadow: 0 0 25px 5px rgba(255,255,255,0.15); }
        }
        .slide-callout {
            display: flex; align-items: center; justify-content: center;
            padding: 3rem 5rem; min-height: 70vh;
        }
        .slide-callout .co-box {
            max-width: 700px; padding: 2.5rem 3rem;
            border-radius: 16px; border-left: 5px solid var(--co-color, var(--accent, #f97316));
            background: rgba(255,255,255,0.06);
            animation: calloutEnter 0.6s ease-out;
        }
        .slide-callout .co-box.co-pulsate {
            animation: calloutEnter 0.6s ease-out, calloutPulse 3s ease-in-out 1s infinite;
        }
        .slide-callout .co-tag {
            font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em;
            color: var(--co-color, var(--accent, #f97316)); margin-bottom: 0.5rem; font-weight: 600;
        }
        .slide-callout .co-title {
            font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 700;
            color: var(--text, #f1f5f9); margin-bottom: 0.75rem;
        }
        .slide-callout .co-body {
            font-size: 1.15rem; color: var(--text, #f1f5f9); opacity: 0.85; line-height: 1.6;
        }
        .slide-callout .co-items { list-style: none; padding: 0; margin: 0.75rem 0 0; }
        .slide-callout .co-items li {
            padding: 0.3rem 0; padding-left: 1.2rem; position: relative;
            color: var(--text, #f1f5f9); opacity: 0.85;
        }
        .slide-callout .co-items li::before {
            content: ''; position: absolute; left: 0; top: 0.7rem;
            width: 6px; height: 6px; border-radius: 50%;
            background: var(--co-color, var(--accent, #f97316));
        }

        /* ===== SPRINT 4: SECTION DIVIDER ===== */
        @keyframes sdNumberGlow {
            0%, 100% { text-shadow: 0 0 40px rgba(255,255,255,0.1); }
            50% { text-shadow: 0 0 80px var(--accent, #f97316); }
        }
        .slide-section-divider {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 3rem; min-height: 70vh; text-align: center;
        }
        .slide-section-divider .sd-number {
            font-size: clamp(5rem, 15vw, 14rem); font-weight: 900;
            color: var(--accent, #f97316); opacity: 0.3; line-height: 1;
            animation: sdNumberGlow 4s ease-in-out infinite;
        }
        .slide-section-divider.sd-hero .sd-number { opacity: 0.5; }
        .slide-section-divider .sd-title {
            font-size: clamp(2rem, 5vw, 4rem); font-weight: 700;
            color: var(--text, #f1f5f9); margin-top: -0.5rem;
        }
        .slide-section-divider .sd-subtitle {
            font-size: 1.2rem; color: var(--text, #f1f5f9); opacity: 0.6;
            margin-top: 0.5rem; max-width: 500px;
        }
        .slide-section-divider .sd-duration {
            font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.15em;
            color: var(--accent, #f97316); margin-top: 1rem; opacity: 0.7;
        }
        .slide-section-divider .sd-progress {
            width: 200px; height: 3px; background: rgba(255,255,255,0.1);
            border-radius: 3px; margin-top: 1.5rem; overflow: hidden;
        }
        .slide-section-divider .sd-progress-fill {
            height: 100%; background: var(--accent, #f97316); border-radius: 3px;
            transition: width 0.8s ease-out;
        }

        /* ===== SPRINT 4: HERO IMAGE ===== */
        @keyframes hiKenBurns {
            0% { transform: scale(1.05) translate(0, 0); }
            50% { transform: scale(1.1) translate(-1%, -1%); }
            100% { transform: scale(1.05) translate(0, 0); }
        }
        .slide-hero-image {
            position: relative; min-height: 70vh; display: flex;
            overflow: hidden;
        }
        .slide-hero-image .hi-bg {
            position: absolute; inset: 0; background-size: cover;
            background-position: center; z-index: 0;
        }
        .slide-hero-image .hi-bg.hi-kenburns { animation: hiKenBurns 15s ease-in-out infinite; }
        .slide-hero-image .hi-gradient {
            position: absolute; inset: 0; z-index: 1;
        }
        .slide-hero-image .hi-gradient.hi-grad-bottom {
            background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%);
        }
        .slide-hero-image .hi-gradient.hi-grad-top {
            background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 60%);
        }
        .slide-hero-image .hi-gradient.hi-grad-left {
            background: linear-gradient(to right, rgba(0,0,0,0.85) 0%, transparent 60%);
        }
        .slide-hero-image .hi-gradient.hi-grad-radial {
            background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%);
        }
        .slide-hero-image .hi-content {
            position: relative; z-index: 2; padding: 3rem 4rem;
            display: flex; flex-direction: column; justify-content: flex-end;
            width: 100%; max-width: 700px;
        }
        .slide-hero-image .hi-content.hi-pos-tl { justify-content: flex-start; align-self: flex-start; }
        .slide-hero-image .hi-content.hi-pos-tc { justify-content: flex-start; align-self: center; text-align: center; }
        .slide-hero-image .hi-content.hi-pos-tr { justify-content: flex-start; align-self: flex-end; }
        .slide-hero-image .hi-content.hi-pos-cl { justify-content: center; align-self: flex-start; }
        .slide-hero-image .hi-content.hi-pos-cc { justify-content: center; align-self: center; text-align: center; }
        .slide-hero-image .hi-content.hi-pos-cr { justify-content: center; align-self: flex-end; }
        .slide-hero-image .hi-content.hi-pos-bl { justify-content: flex-end; align-self: flex-start; }
        .slide-hero-image .hi-content.hi-pos-bc { justify-content: flex-end; align-self: center; text-align: center; }
        .slide-hero-image .hi-content.hi-pos-br { justify-content: flex-end; align-self: flex-end; text-align: right; }
        .slide-hero-image .hi-title {
            font-size: clamp(2rem, 5vw, 4rem); font-weight: 700;
            color: #fff; text-shadow: 0 2px 20px rgba(0,0,0,0.5);
        }
        .slide-hero-image .hi-subtitle {
            font-size: 1.2rem; color: rgba(255,255,255,0.85); margin-top: 0.5rem;
            text-shadow: 0 1px 10px rgba(0,0,0,0.5);
        }

        /* ===== SPRINT 4: OUTRO ===== */
        @keyframes outroFadeUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .slide-outro {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 3rem; min-height: 70vh; text-align: center;
        }
        .slide-outro .ou-title {
            font-size: clamp(3rem, 8vw, 6rem); font-weight: 800;
            color: var(--text, #f1f5f9); margin-bottom: 0.5rem;
            animation: outroFadeUp 0.8s ease-out;
        }
        .slide-outro .ou-subtitle {
            font-size: 1.3rem; color: var(--text, #f1f5f9); opacity: 0.7;
            margin-bottom: 2rem; animation: outroFadeUp 0.8s ease-out 0.2s both;
        }
        .slide-outro .ou-contacts {
            display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center;
            margin-bottom: 1.5rem; animation: outroFadeUp 0.8s ease-out 0.4s both;
        }
        .slide-outro .ou-contact {
            font-size: 1rem; color: var(--accent, #f97316); opacity: 0.9;
        }
        .slide-outro .ou-qr-section {
            display: flex; gap: 2rem; align-items: center;
            animation: outroFadeUp 0.8s ease-out 0.6s both;
        }
        .slide-outro .ou-qr-block { text-align: center; }
        .slide-outro .ou-qr-block img {
            width: 140px; height: 140px; border-radius: 12px;
            background: #fff; padding: 8px;
        }
        .slide-outro .ou-qr-caption {
            font-size: 0.8rem; color: var(--text, #f1f5f9); opacity: 0.6; margin-top: 0.4rem;
        }
        .slide-outro .ou-cta {
            margin-top: 1.5rem; font-size: 1.1rem; font-weight: 600;
            color: var(--accent, #f97316);
            animation: outroFadeUp 0.8s ease-out 0.8s both;
        }
        .slide-outro .ou-next-steps {
            list-style: none; padding: 0; margin: 1rem 0 0;
            animation: outroFadeUp 0.8s ease-out 0.7s both;
        }
        .slide-outro .ou-next-steps li {
            padding: 0.3rem 0; color: var(--text, #f1f5f9); opacity: 0.8;
        }
        .slide-outro .ou-next-steps li::before {
            content: ''; display: inline-block; width: 8px; height: 8px;
            border-radius: 50%; background: var(--accent, #f97316);
            margin-right: 0.7rem; vertical-align: middle;
        }

        /* ===== SPRINT 5: AI CONVERSATION ===== */
        @keyframes aicDotPulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
        }
        @keyframes aicMsgIn {
            0% { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .slide-ai-conversation {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 2rem 3rem; min-height: 70vh;
        }
        .slide-ai-conversation .aic-title {
            font-size: 1.4rem; font-weight: 700; color: var(--text, #f1f5f9);
            margin-bottom: 1.5rem; text-align: center;
        }
        .slide-ai-conversation .aic-chat {
            width: 100%; max-width: 640px; display: flex; flex-direction: column; gap: 0.6rem;
            background: rgba(255,255,255,0.04); border-radius: 16px; padding: 1.5rem;
            max-height: 55vh; overflow-y: auto;
        }
        .slide-ai-conversation .aic-msg {
            max-width: 80%; padding: 0.7rem 1rem; border-radius: 14px;
            font-size: 0.95rem; line-height: 1.5; opacity: 0;
            animation: aicMsgIn 0.4s ease-out forwards;
        }
        .slide-ai-conversation .aic-msg.aic-user {
            align-self: flex-end; background: var(--accent, #f97316); color: #fff;
            border-bottom-right-radius: 4px;
        }
        .slide-ai-conversation .aic-msg.aic-ai {
            align-self: flex-start; background: rgba(255,255,255,0.1);
            color: var(--text, #f1f5f9); border-bottom-left-radius: 4px;
        }
        .slide-ai-conversation .aic-label {
            font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
            letter-spacing: 0.08em; margin-bottom: 0.2rem; opacity: 0.6;
        }
        .slide-ai-conversation .aic-dots {
            display: inline-flex; gap: 4px; padding: 0.5rem 0;
        }
        .slide-ai-conversation .aic-dots span {
            width: 6px; height: 6px; border-radius: 50%; background: var(--text, #f1f5f9);
        }
        .slide-ai-conversation .aic-dots span:nth-child(1) { animation: aicDotPulse 1.2s infinite 0s; }
        .slide-ai-conversation .aic-dots span:nth-child(2) { animation: aicDotPulse 1.2s infinite 0.2s; }
        .slide-ai-conversation .aic-dots span:nth-child(3) { animation: aicDotPulse 1.2s infinite 0.4s; }

        /* ===== SPRINT 5: BEFORE-AFTER ===== */
        @keyframes baTypeChar {
            0% { width: 0; }
            100% { width: 100%; }
        }
        @keyframes baResultIn {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
        }
        @keyframes baProcessDot {
            0%, 80%, 100% { opacity: 0.2; }
            40% { opacity: 1; }
        }
        .slide-before-after {
            display: flex; align-items: stretch; min-height: 70vh; gap: 0;
        }
        .slide-before-after .ba-prompt-side, .slide-before-after .ba-result-side {
            flex: 1; display: flex; flex-direction: column; justify-content: center;
            padding: 3rem;
        }
        .slide-before-after .ba-prompt-side {
            background: rgba(255,255,255,0.03); border-right: 1px solid rgba(255,255,255,0.08);
        }
        .slide-before-after .ba-label {
            font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em;
            color: var(--accent, #f97316); margin-bottom: 0.75rem; font-weight: 600;
        }
        .slide-before-after .ba-prompt-text {
            font-family: 'SF Mono', 'Fira Code', monospace; font-size: 1rem;
            color: var(--text, #f1f5f9); line-height: 1.6;
            background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.08);
            overflow: hidden; white-space: pre-wrap;
        }
        .slide-before-after .ba-processing {
            display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;
            font-size: 0.85rem; color: var(--text, #f1f5f9); opacity: 0.6;
        }
        .slide-before-after .ba-processing .ba-dot {
            width: 5px; height: 5px; border-radius: 50%; background: var(--accent, #f97316);
        }
        .slide-before-after .ba-processing .ba-dot:nth-child(1) { animation: baProcessDot 1.4s infinite 0s; }
        .slide-before-after .ba-processing .ba-dot:nth-child(2) { animation: baProcessDot 1.4s infinite 0.2s; }
        .slide-before-after .ba-processing .ba-dot:nth-child(3) { animation: baProcessDot 1.4s infinite 0.4s; }
        .slide-before-after .ba-result-content {
            animation: baResultIn 0.8s ease-out 0.5s both;
        }
        .slide-before-after .ba-result-content img {
            max-width: 100%; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .slide-before-after .ba-result-text {
            font-size: 1.15rem; line-height: 1.7; color: var(--text, #f1f5f9);
        }
        .slide-before-after .ba-caption {
            font-size: 0.85rem; color: var(--text, #f1f5f9); opacity: 0.5; margin-top: 0.75rem;
        }

        /* ===== SPRINT 5: PROMPT REVEAL ===== */
        @keyframes prCursorBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        .slide-prompt-reveal {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 3rem; min-height: 70vh;
        }
        .slide-prompt-reveal .pr-title {
            font-size: 1.2rem; font-weight: 600; color: var(--text, #f1f5f9);
            margin-bottom: 1rem; opacity: 0.7;
        }
        .slide-prompt-reveal .pr-window {
            width: 100%; max-width: 700px; background: rgba(0,0,0,0.4);
            border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
            overflow: hidden;
        }
        .slide-prompt-reveal .pr-toolbar {
            display: flex; align-items: center; gap: 6px; padding: 10px 14px;
            background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .slide-prompt-reveal .pr-dot {
            width: 10px; height: 10px; border-radius: 50%;
        }
        .slide-prompt-reveal .pr-dot:nth-child(1) { background: #ff5f57; }
        .slide-prompt-reveal .pr-dot:nth-child(2) { background: #febc2e; }
        .slide-prompt-reveal .pr-dot:nth-child(3) { background: #28c840; }
        .slide-prompt-reveal .pr-lang {
            margin-left: auto; font-size: 0.7rem; text-transform: uppercase;
            letter-spacing: 0.1em; color: var(--accent, #f97316); font-weight: 600;
        }
        .slide-prompt-reveal .pr-code {
            padding: 1.5rem; font-family: 'SF Mono', 'Fira Code', monospace;
            font-size: 0.95rem; line-height: 1.7; color: var(--text, #f1f5f9);
            white-space: pre-wrap;
        }
        .slide-prompt-reveal .pr-cursor {
            display: inline-block; width: 2px; height: 1.1em;
            background: var(--accent, #f97316); vertical-align: text-bottom;
            animation: prCursorBlink 0.8s infinite;
        }
        .slide-prompt-reveal .pr-caption {
            font-size: 0.9rem; color: var(--text, #f1f5f9); opacity: 0.5;
            margin-top: 1rem; text-align: center;
        }

        /* ===== SPRINT 5: PITFALL ===== */
        @keyframes pfShake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
            20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        @keyframes pfStrikethrough {
            0% { width: 0; }
            100% { width: 100%; }
        }
        @keyframes pfCorrectionIn {
            0% { opacity: 0; transform: translateX(20px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        .slide-pitfall {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 3rem; min-height: 70vh;
        }
        .slide-pitfall .pf-badge {
            font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.15em; padding: 0.3rem 1rem; border-radius: 20px;
            margin-bottom: 1.5rem;
        }
        .slide-pitfall .pf-badge.pf-warning { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .slide-pitfall .pf-badge.pf-danger { background: rgba(239,68,68,0.2); color: #ef4444; }
        .slide-pitfall .pf-badge.pf-critical {
            background: rgba(239,68,68,0.3); color: #ef4444;
            animation: pfShake 0.6s ease-in-out;
        }
        .slide-pitfall .pf-qa {
            max-width: 650px; width: 100%;
        }
        .slide-pitfall .pf-question {
            font-size: 1.1rem; color: var(--text, #f1f5f9); padding: 1rem 1.2rem;
            background: rgba(255,255,255,0.06); border-radius: 12px;
            margin-bottom: 0.8rem;
        }
        .slide-pitfall .pf-answer {
            font-size: 1rem; color: var(--text, #f1f5f9); opacity: 0.8;
            padding: 1rem 1.2rem; background: rgba(255,255,255,0.03);
            border-radius: 12px; border-left: 3px solid rgba(255,255,255,0.15);
            position: relative; margin-bottom: 1rem;
        }
        .slide-pitfall .pf-answer .pf-strike {
            position: absolute; top: 50%; left: 0; height: 2px;
            background: #ef4444; animation: pfStrikethrough 0.8s ease-out 1.5s forwards;
        }
        .slide-pitfall .pf-correction {
            padding: 1rem 1.2rem; border-radius: 12px; border-left: 3px solid;
            animation: pfCorrectionIn 0.6s ease-out 2.5s both;
        }
        .slide-pitfall .pf-correction.pf-sev-warning {
            background: rgba(245,158,11,0.08); border-color: #f59e0b; color: #fbbf24;
        }
        .slide-pitfall .pf-correction.pf-sev-danger {
            background: rgba(239,68,68,0.08); border-color: #ef4444; color: #f87171;
        }
        .slide-pitfall .pf-correction.pf-sev-critical {
            background: rgba(239,68,68,0.12); border-color: #ef4444; color: #f87171;
            box-shadow: 0 0 20px rgba(239,68,68,0.2);
        }

        /* ===== SPRINT 6: STAT COMPARE ===== */
        @keyframes scArrowPulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 8px rgba(249,115,22,0.4)); } 100% { transform: scale(1); } }
        @keyframes scArrowDraw {
            0% { stroke-dashoffset: 60; }
            100% { stroke-dashoffset: 0; }
        }
        .slide-stat-compare {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 3rem; min-height: 70vh; text-align: center;
        }
        .slide-stat-compare .sc-title {
            font-size: 1.3rem; font-weight: 600; color: var(--text, #f1f5f9);
            margin-bottom: 2rem; opacity: 0.7;
        }
        .slide-stat-compare .sc-row {
            display: flex; align-items: center; gap: 2rem;
        }
        .slide-stat-compare .sc-num {
            text-align: center;
        }
        .slide-stat-compare .sc-value {
            font-size: clamp(3rem, 8vw, 6rem); font-weight: 800;
            line-height: 1;
        }
        .slide-stat-compare .sc-label {
            font-size: 0.9rem; color: var(--text, #f1f5f9); opacity: 0.5; margin-top: 0.3rem;
        }
        .slide-stat-compare .sc-arrow {
            width: 60px; height: 40px;
        }
        .slide-stat-compare .sc-arrow line, .slide-stat-compare .sc-arrow polyline {
            stroke: var(--accent, #f97316); stroke-width: 2; fill: none;
            stroke-dasharray: 60; stroke-dashoffset: 60;
            animation: scArrowDraw 1s ease-out 1s forwards;
        }
        .slide-stat-compare .sc-caption {
            font-size: 0.9rem; color: var(--text, #f1f5f9); opacity: 0.5; margin-top: 1.5rem;
        }

        /* ===== SPRINT 6: VOICE COLLAGE ===== */
        @keyframes vcCardIn {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
        }
        .slide-voice-collage {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 2rem 3rem; min-height: 70vh;
        }
        .slide-voice-collage .vc-title {
            font-size: 1.4rem; font-weight: 700; color: var(--text, #f1f5f9);
            margin-bottom: 1.5rem;
        }
        .slide-voice-collage .vc-grid {
            display: flex; flex-wrap: wrap; gap: 0.8rem; justify-content: center;
            max-width: 800px;
        }
        .slide-voice-collage .vc-card {
            padding: 1rem 1.3rem; background: rgba(255,255,255,0.06);
            border-radius: 12px; border-left: 3px solid var(--accent, #f97316);
            opacity: 0; animation: vcCardIn 0.4s ease-out forwards;
            max-width: 280px;
        }
        .slide-voice-collage .vc-card .vc-text {
            font-size: 0.95rem; color: var(--text, #f1f5f9); line-height: 1.5;
            font-style: italic;
        }
        .slide-voice-collage .vc-card .vc-author {
            font-size: 0.75rem; color: var(--accent, #f97316); margin-top: 0.4rem;
            font-weight: 600; font-style: normal;
        }

        /* ===== SPRINT 6: PORTRAIT QUOTE ===== */
        @keyframes pqFadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .slide-portrait-quote {
            display: flex; align-items: center; justify-content: center;
            padding: 3rem 4rem; min-height: 70vh; gap: 3rem;
        }
        .slide-portrait-quote .pq-image {
            width: 14rem; height: 14rem; border-radius: 50%; object-fit: cover;
            border: 0.2rem solid var(--accent, #f97316); flex-shrink: 0;
            box-shadow: 0 0 2rem rgba(0,0,0,0.3);
        }
        .slide-portrait-quote .pq-content { max-width: 40rem; }
        .slide-portrait-quote .pq-mark {
            font-size: 5rem; line-height: 1; color: var(--accent, #f97316); opacity: 0.2;
            font-family: Georgia, serif; margin-bottom: -1.5rem;
        }
        .slide-portrait-quote .pq-text {
            font-size: 1.3rem; line-height: 1.6; color: var(--text, #f1f5f9);
            font-style: italic; animation: pqFadeIn 0.6s ease-out;
        }
        .slide-portrait-quote .pq-attribution {
            margin-top: 1rem; font-size: 1rem; font-weight: 700;
            color: var(--text, #f1f5f9);
            animation: pqFadeIn 0.6s ease-out 0.3s both;
        }
        .slide-portrait-quote .pq-context {
            font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em;
            color: var(--accent, #f97316); margin-top: 0.2rem;
            animation: pqFadeIn 0.6s ease-out 0.4s both;
        }
        @keyframes pqSlideLeft {
            0% { opacity: 0; transform: translateX(-120px) perspective(800px) rotateY(8deg); }
            100% { opacity: 1; transform: translateX(0) perspective(800px) rotateY(0deg); }
        }
        .slide-portrait-quote.pq-slide-left {
            animation: pqSlideLeft 0.7s var(--sf-ease-smooth) forwards;
        }

        /* ===== SPRINT 6: REFLECTION ===== */
        @keyframes refQuestionIn {
            0% { opacity: 0; transform: translateX(-15px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        .slide-reflection {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 3rem; min-height: 70vh;
        }
        .slide-reflection .ref-tag {
            font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em;
            color: var(--accent, #f97316); margin-bottom: 0.5rem; font-weight: 600;
        }
        .slide-reflection .ref-title {
            font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 700;
            color: var(--text, #f1f5f9); margin-bottom: 0.5rem; text-align: center;
        }
        .slide-reflection .ref-duration {
            font-size: 0.85rem; color: var(--text, #f1f5f9); opacity: 0.5;
            margin-bottom: 2rem;
        }
        .slide-reflection .ref-questions {
            list-style: none; padding: 0; max-width: 550px; width: 100%;
        }
        .slide-reflection .ref-questions li {
            padding: 0.7rem 0; padding-left: 1.5rem; position: relative;
            font-size: 1.15rem; color: var(--text, #f1f5f9); line-height: 1.5;
            opacity: 0; animation: refQuestionIn 0.5s ease-out forwards;
            border-left: 2px solid rgba(255,255,255,0.08);
        }
        .slide-reflection .ref-questions li::before {
            content: ''; position: absolute; left: -5px; top: 1rem;
            width: 8px; height: 8px; border-radius: 50%;
            background: var(--accent, #f97316);
        }

        /* ===== SPRINT 7+8: COLLAGE ===== */
        @keyframes colImgIn {
            0% { opacity: 0; transform: scale(0.92); }
            100% { opacity: 1; transform: scale(1); }
        }
        .slide-collage {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 2rem 3rem; min-height: 70vh;
        }
        .slide-collage .col-title {
            font-size: 1.3rem; font-weight: 700; color: var(--text, #f1f5f9);
            margin-bottom: 1rem;
        }
        .slide-collage .col-grid {
            display: grid; gap: 0.5rem; width: 100%; max-width: 900px;
        }
        .slide-collage .col-grid.col-2 { grid-template-columns: 1fr 1fr; }
        .slide-collage .col-grid.col-3 { grid-template-columns: 1fr 1fr 1fr; }
        .slide-collage .col-grid.col-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .slide-collage .col-img {
            width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 10px;
            opacity: 0; animation: colImgIn 0.5s ease-out forwards;
            cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
        }
        .slide-collage .col-img:hover { transform: scale(1.03); box-shadow: 0 4px 20px rgba(0,0,0,0.4); }

        /* ===== SPRINT 7+8: PROCESS CHAIN ===== */
        @keyframes pcNodeIn {
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
        }
        .slide-process-chain {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 2rem 3rem; min-height: 70vh;
        }
        .slide-process-chain .pc-title {
            font-size: 1.3rem; font-weight: 700; color: var(--text, #f1f5f9);
            margin-bottom: 1.5rem;
        }
        .slide-process-chain .pc-chain {
            display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
            justify-content: center;
        }
        .slide-process-chain .pc-node {
            padding: 0.8rem 1.2rem; background: rgba(255,255,255,0.06);
            border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
            text-align: center; opacity: 0; animation: pcNodeIn 0.4s ease-out forwards;
            min-width: 100px;
        }
        .slide-process-chain .pc-node.pc-active {
            border-color: var(--accent, #f97316);
            box-shadow: 0 0 15px rgba(249,115,22,0.2);
        }
        .slide-process-chain .pc-node-label {
            font-size: 0.95rem; font-weight: 700; color: var(--text, #f1f5f9);
        }
        .slide-process-chain .pc-node-hint {
            font-size: 0.75rem; color: var(--text, #f1f5f9); opacity: 0.5; margin-top: 0.2rem;
        }
        .slide-process-chain .pc-arrow {
            color: var(--accent, #f97316); font-size: 1.2rem; opacity: 0.5;
        }

        /* ===== SPRINT 7+8: ACRONYM LIST ===== */
        @keyframes alRowIn {
            0% { opacity: 0; transform: translateX(-10px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        .slide-acronym-list {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 3rem; min-height: 70vh;
        }
        .slide-acronym-list .al-title {
            font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800;
            color: var(--accent, #f97316); margin-bottom: 0.3rem;
        }
        .slide-acronym-list .al-tagline {
            font-size: 0.9rem; color: var(--text, #f1f5f9); opacity: 0.5;
            margin-bottom: 1.5rem;
        }
        .slide-acronym-list .al-rows { max-width: 600px; width: 100%; }
        .slide-acronym-list .al-row {
            display: flex; align-items: baseline; gap: 1rem;
            padding: 0.5rem 0; opacity: 0; animation: alRowIn 0.4s ease-out forwards;
        }
        .slide-acronym-list .al-letter {
            font-size: 2rem; font-weight: 900; color: var(--accent, #f97316);
            min-width: 2.5rem; text-align: center;
        }
        .slide-acronym-list .al-letter { transition: transform 0.2s, text-shadow 0.2s; cursor: default; }
        .slide-acronym-list .al-row:hover .al-letter { transform: scale(1.2); text-shadow: 0 0 15px rgba(249,115,22,0.4); }
        .slide-acronym-list .al-word {
            font-size: 1.1rem; font-weight: 700; color: var(--text, #f1f5f9);
        }
        .slide-acronym-list .al-desc {
            font-size: 0.9rem; color: var(--text, #f1f5f9); opacity: 0.6; font-style: italic;
        }

        /* ===== SPRINT 7+8 BONUS: MAP PINS ===== */
        @keyframes mpPinDrop {
            0% { opacity: 0; transform: translate(-50%, -150%); }
            60% { transform: translate(-50%, -90%); }
            80% { transform: translate(-50%, -105%); }
            100% { opacity: 1; transform: translate(-50%, -100%); }
        }
        .slide-map-pins {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 2rem; min-height: 70vh;
        }
        .slide-map-pins .mp-title {
            font-size: 1.3rem; font-weight: 700; color: var(--text, #f1f5f9);
            margin-bottom: 1rem;
        }
        .slide-map-pins .mp-container {
            position: relative; display: inline-block; max-width: 800px; width: 100%;
        }
        .slide-map-pins .mp-container img {
            width: 100%; border-radius: 12px; display: block;
        }
        .slide-map-pins .mp-pin {
            position: absolute; width: 18px; height: 18px;
            background: var(--accent, #f97316); border-radius: 50%;
            border: 2px solid #fff; cursor: pointer;
            opacity: 0; animation: mpPinDrop 0.5s ease-out forwards;
            z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            transition: transform 0.2s;
        }
        .slide-map-pins .mp-pin:hover { transform: translate(-50%, -100%) scale(1.3); }
        .slide-map-pins .mp-pin::after {
            content: ''; position: absolute; top: -6px; left: -6px;
            width: 30px; height: 30px; border-radius: 50%;
            border: 2px solid var(--accent, #f97316); opacity: 0;
            animation: calloutPulse 2s infinite 1s;
        }
        .slide-map-pins .mp-tooltip {
            position: absolute; bottom: calc(100% + 10px); left: 50%;
            transform: translateX(-50%); background: rgba(0,0,0,0.9);
            color: #fff; padding: 0.5rem 0.8rem; border-radius: 10px;
            font-size: 0.8rem; white-space: nowrap; pointer-events: none;
            opacity: 0; transition: opacity 0.2s;
            border: 1px solid rgba(255,255,255,0.15);
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .slide-map-pins .mp-tooltip::after {
            content: ""; position: absolute; top: 100%; left: 50%;
            margin-left: -6px; border-width: 6px; border-style: solid;
            border-color: rgba(0,0,0,0.9) transparent transparent transparent;
        }
        .slide-map-pins .mp-pin:hover .mp-tooltip,
        .slide-map-pins .mp-pin.mp-open .mp-tooltip { opacity: 1; }

        /* ===== SPRINT 7+8 BONUS: MINDMAP ===== */
        @keyframes mmNodePop {
            0% { opacity: 0; transform: scale(0.7); }
            70% { transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
        }
        .slide-mindmap {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 2rem; min-height: 70vh;
        }
        .slide-mindmap .mm-title {
            font-size: 1.3rem; font-weight: 700; color: var(--text, #f1f5f9);
            margin-bottom: 1rem;
        }
        .slide-mindmap .mm-canvas {
            position: relative; width: 100%; max-width: 850px;
            min-height: 400px;
        }
        .slide-mindmap .mm-node {
            position: absolute; padding: 0.6rem 1.2rem;
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
            border-radius: 12px; cursor: pointer;
            opacity: 0; animation: mmNodePop 0.4s ease-out forwards;
            transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
            z-index: 2;
        }
        .slide-mindmap .mm-node:hover {
            border-color: var(--accent, #f97316);
            box-shadow: 0 0 20px rgba(249,115,22,0.25);
            background: rgba(255,255,255,0.12);
        }
        @keyframes mmCenterPulse { 0% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); } 70% { box-shadow: 0 0 0 15px rgba(249,115,22,0); } 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); } }
        .slide-mindmap .mm-node.mm-center {
            background: var(--accent, #f97316); color: #fff;
            border-color: var(--accent, #f97316); font-weight: 700;
            font-size: 1.1rem;
        }
            animation: mmCenterPulse 3s infinite;
        .slide-mindmap .mm-node-label {
            font-size: 0.9rem; font-weight: 600; color: var(--text, #f1f5f9);
        }
        .slide-mindmap .mm-node-detail {
            display: none; font-size: 0.8rem; color: var(--text, #f1f5f9);
            opacity: 0.7; margin-top: 0.3rem; max-width: 200px;
        }
        .slide-mindmap .mm-node.mm-expanded .mm-node-detail { display: block; }
        .slide-mindmap .mm-lines {
            position: absolute; inset: 0; z-index: 1;
        }
        .slide-mindmap .mm-lines line {
            stroke: rgba(255,255,255,0.12); stroke-width: 1;
        }

        /* ===== SPRINT 7+8 BONUS: MAP JOURNEY ===== */
        .slide-map-journey { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; }
        .slide-map-journey .mj-container { position: relative; width: 90%; margin: auto; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .slide-map-journey img { width: 100%; display: block; filter: brightness(0.8) contrast(1.2) grayscale(0.5); }
        .slide-map-journey .mj-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        .slide-map-journey .mj-path { fill: none; stroke: var(--accent, #f97316); stroke-width: 3px; stroke-dasharray: 10 10; animation: mjDash 20s linear infinite; }
        @keyframes mjDash { to { stroke-dashoffset: -1000; } }
        .slide-map-journey .mj-pin { position: absolute; width: 20px; height: 20px; background: var(--accent); border-radius: 50%; border: 3px solid #fff; transform: translate(-50%, -50%); box-shadow: 0 0 15px var(--accent); z-index: 2; }
        .slide-map-journey .mj-label { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 8px; background: rgba(0,0,0,0.8); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; white-space: nowrap; font-weight: 600; }

        /* ===== SPRINT 7+8 BONUS: MINDMAP TREE ===== */
        .slide-mindmap-tree { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .slide-mindmap-tree .mt-canvas { position: relative; width: 90%; height: 80%; }
        .slide-mindmap-tree .mt-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        .slide-mindmap-tree .mt-node { position: absolute; padding: 0.8rem 1.2rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; font-weight: 600; font-size: 1rem; color: #fff; transform: translate(-50%, -50%); backdrop-filter: blur(10px); z-index: 2; transition: all 0.3s; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .slide-mindmap-tree .mt-node:hover { transform: translate(-50%, -50%) scale(1.05); background: rgba(255,255,255,0.1); }
        .slide-mindmap-tree .mt-root { background: rgba(249,115,22,0.2); border-color: var(--accent); font-size: 1.2rem; color: var(--accent); }
        .slide-mindmap-tree .mt-branch { background: rgba(34,211,238,0.15); border-color: #22d3ee; }
        .slide-mindmap-tree .mt-leaf { background: rgba(168,85,247,0.15); border-color: #a855f7; font-size: 0.9rem; font-weight: 400; }

        /* ===== SIGNATURE: LETTER MORPH ===== */
        .slide-letter-morph {
            position: relative; min-height: 70vh; width: 100%;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden; cursor: pointer; user-select: none;
        }
        .slide-letter-morph .lm-letter {
            position: absolute; font-family: 'Inter', sans-serif;
            font-weight: 700; pointer-events: none;
            transition: all 1.2s var(--sf-ease-dramatic);
        }
        .slide-letter-morph .lm-letter.lm-active {
            color: var(--text, #f1f5f9);
        }
        .slide-letter-morph .lm-letter.lm-highlight {
            color: var(--accent, #f97316); opacity: 0.9 !important;
            text-shadow: 0 0 15px rgba(249, 115, 22, 0.8);
            z-index: 10;
        }
        .slide-letter-morph .lm-letter.lm-frame {
            color: var(--accent, #f97316); opacity: 0.06;
        }
        .slide-letter-morph .lm-hint {
            position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
            font-size: 0.7rem; color: var(--text, #f1f5f9); opacity: 0.3;
            letter-spacing: 0.1em; text-transform: uppercase;
        }
        .slide-letter-morph .lm-counter {
            position: absolute; top: 1rem; right: 1.5rem;
            font-size: 0.7rem; color: var(--accent, #f97316); opacity: 0.5;
            font-family: 'JetBrains Mono', monospace;
        }

        /* ===== TOKEN SPINNER ===== */
        .slide-token-spinner {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            min-height: 70vh; padding: 2rem 5rem;
        }
        .ts-content {
            font-size: clamp(2rem, 4vw, 3.5rem);
            font-weight: 300;
            line-height: 1.6;
            color: var(--text);
            max-width: 1200px;
            text-align: left;
        }
        .ts-spinner-wrapper {
            display: inline-flex;
            flex-direction: column;
            vertical-align: bottom;
            position: relative;
            margin: 0 0.1em;
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 3px solid var(--accent, #f97316);
            border-radius: 4px 4px 0 0;
            transition: background 0.3s, border 0.3s;
        }
        .ts-spinner-mask {
            display: flex;
            flex-direction: column;
            height: 1.2em;
            overflow: hidden;
        }
        .ts-prob-badge {
            position: absolute;
            top: -1.4rem;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.8rem;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            color: var(--accent, #f97316);
            opacity: 0;
            transition: opacity 0.2s, color 0.4s;
            text-shadow: 0 0 10px rgba(249, 115, 22, 0.6);
            pointer-events: none;
            z-index: 10;
        }
        .ts-spinner-wrapper.ts-spinning .ts-prob-badge { opacity: 1; }
        .ts-spinner-wrapper.ts-solidified .ts-prob-badge { opacity: 1; color: #10b981; text-shadow: 0 0 15px rgba(16, 185, 129, 0.8); }
        .ts-spinner-wrapper.ts-solidified {
            background: transparent;
            border-color: transparent;
        }
        .ts-spinner-wrapper.ts-solidified .ts-spinner-word {
            color: var(--accent, #f97316);
            font-weight: 700;
        }
        .ts-spinner-track {
            display: flex;
            flex-direction: column;
            transform: translateY(0);
        }
        .ts-spinner-word {
            height: 1.2em;
            line-height: 1.2em;
            padding: 0 0.2em;
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255,255,255,0.4);
        }

        /* ===== MAP-PROGRESSION ===== */
        .slide-map-progression { display: flex; width: 100%; height: 100%; position: relative; overflow: hidden; background: #000; color: #fff; text-align: left; }
        .mprog-map-area { flex: 1; position: relative; display: flex; justify-content: center; align-items: center; background: #050505; }
        
        /* The wrapper guarantees that the pins' percentage coordinates always exactly match the map image, regardless of screen shape */
        .mprog-map-wrapper { position: relative; width: 100%; max-width: 100%; max-height: 100%; aspect-ratio: 16/9; display: flex; justify-content: center; align-items: center; }
        .mprog-map-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.85; filter: contrast(1.1); }
        
        .mprog-sidebar { width: clamp(260px, 22vw, 360px); background: rgba(10,10,15,0.95); border-left: 1px solid rgba(255,255,255,0.1); padding: clamp(1.5rem, 2vw, 2.5rem) clamp(1rem, 1.5vw, 1.5rem); display: flex; flex-direction: column; z-index: 10; box-shadow: -15px 0 40px rgba(0,0,0,0.6); }
        .mprog-title { font-size: clamp(1.8rem, 2vw, 2.2rem); font-weight: 300; margin-bottom: 2rem; color: var(--accent); line-height: 1.2; letter-spacing: -0.02em; }
        .mprog-list { display: flex; flex-direction: column; gap: 0.8rem; overflow-y: auto; padding-right: 0.5rem; }
        .mprog-item { padding: 1rem 1.2rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; cursor: pointer; transition: all 0.3s var(--sf-ease-smooth); opacity: 0; transform: translateX(30px); display: none; }
        .mprog-item.revealed { opacity: 1; transform: translateX(0); display: block; }
        .mprog-item:hover, .mprog-item.active { background: rgba(255,255,255,0.08); border-color: var(--accent); transform: scale(1.02); }
        .mprog-item-title { font-weight: 600; font-size: clamp(1.2rem, 1.6vw, 1.6rem); margin-bottom: 0.4rem; color: #fff; }
        .mprog-item-subtitle { font-size: clamp(0.8rem, 1vw, 1rem); color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px; }
        
        .mprog-pin { position: absolute; width: clamp(20px, 2vw, 28px); height: clamp(20px, 2vw, 28px); background: #fff; border-radius: 50%; transform: translate(-50%, -50%) scale(0); transition: transform var(--sf-dur-normal) var(--sf-ease-spring); cursor: pointer; z-index: 5; box-shadow: 0 0 20px rgba(255,255,255,0.8); display: none; }
        .mprog-pin.revealed { transform: translate(-50%, -50%) scale(1); display: block; }
        .mprog-pin.active { background: #ef4444; box-shadow: 0 0 30px rgba(239,68,68,0.8); z-index: 6; }
        .mprog-pin.active::after { content: ''; position: absolute; top: -16px; left: -16px; right: -16px; bottom: -16px; border-radius: 50%; border: 3px solid #ef4444; animation: mprog-pulse 2s var(--sf-ease-smooth) infinite; }
        @keyframes mprog-pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.8); opacity: 0; } }
        
        .mprog-infobox { position: absolute; width: clamp(400px, 45vw, 650px); background: rgba(15, 15, 20, 0.9); border: 1px solid rgba(255,255,255,0.1); border-top: 4px solid var(--accent); border-radius: 16px; padding: clamp(1.5rem, 3vw, 3rem); z-index: 20; opacity: 0; pointer-events: none; transition: all var(--sf-dur-fast) var(--sf-ease-smooth); backdrop-filter: blur(15px); box-shadow: 0 25px 60px rgba(0,0,0,0.7); transform: translateY(30px); }
        .mprog-infobox.show { opacity: 1; pointer-events: auto; transform: translateY(0); }
        .mprog-close { position: absolute; top: 1.5rem; right: 1.5rem; background: none; border: none; color: #fff; font-size: 2.5rem; cursor: pointer; opacity: 0.4; transition: opacity 0.2s; padding: 0; line-height: 1; }
        .mprog-close:hover { opacity: 1; }
        .mprog-info-title { font-size: clamp(2.2rem, 3.5vw, 3.5rem); font-weight: 300; margin-bottom: 0.8rem; color: #fff; letter-spacing: -0.02em; }
        .mprog-info-meta { font-size: clamp(0.9rem, 1.2vw, 1.2rem); color: var(--accent); margin-bottom: clamp(1rem, 2vw, 2rem); text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
        .mprog-info-desc { font-size: clamp(1.1rem, 1.6vw, 1.6rem); line-height: 1.6; color: rgba(255,255,255,0.9); font-weight: 300; }
        
        .mprog-svg-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 15; }
        .mprog-svg-overlay line { transition: opacity 0.3s ease; stroke-linecap: round; }

        /* ===== WARNING PULSE ===== */
        @keyframes warnPulse {
            0% { transform: scale(0.95); text-shadow: 0 0 20px rgba(239, 68, 68, 0.4); opacity: 0.8; }
            50% { transform: scale(1.05); text-shadow: 0 0 100px rgba(239, 68, 68, 1); opacity: 1; }
            100% { transform: scale(0.95); text-shadow: 0 0 20px rgba(239, 68, 68, 0.4); opacity: 0.8; }
        }
        @keyframes warnDrop {
            0% { transform: translateY(-50px) scale(1.5); opacity: 0; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes warnSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .slide-warning-pulse {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            min-height: 70vh; text-align: center;
        }
        .slide-warning-pulse .wp-mark-spinner {
            animation: warnSpin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) 5s forwards;
            margin-bottom: 0rem;
        }
        .slide-warning-pulse .wp-mark {
            font-size: clamp(8rem, 25vw, 20rem);
            font-weight: 900;
            color: #ef4444;
            line-height: 1;
            animation: warnDrop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, warnPulse 2s ease-in-out infinite 0.6s;
        }
        .slide-warning-pulse .wp-title {
            font-size: clamp(2rem, 5vw, 3.5rem);
            font-weight: 700;
            color: var(--text, #f1f5f9);
            opacity: 0;
            animation: gtWordFade 0.6s ease forwards 0.4s;
        }
        .slide-warning-pulse .wp-subtitle {
            font-size: clamp(1rem, 2vw, 1.5rem);
            color: rgba(255,255,255,0.7);
            margin-top: 1rem;
            opacity: 0;
            animation: gtWordFade 0.6s ease forwards 0.6s;
            max-width: 800px;
        }
    `;
    document.head.appendChild(style);

    // === SlideForge Lifecycle ===
    window.SlideForge = window.SlideForge || {};
    window.SlideForge.cleanup = window.SlideForge.cleanup || [];
    window.SlideForge.handlers = window.SlideForge.handlers || {};
    window.SlideForge.steps = window.SlideForge.steps || { total: 0, current: 0, apply: null };

    window.SlideForge.registerCleanup = function(fn) { 
      window.SlideForge.cleanup.push(fn); 
    };
    window.SlideForge.registerSteps = function(total, applyFn) {
      window.SlideForge.steps = { total: total, current: 0, apply: applyFn };
    };
    window.SlideForge.nextStep = function() {
      const st = window.SlideForge.steps;
      if (st && st.apply && st.current < st.total) { st.current++; st.apply(st.current); return true; }
      return false;
    };
    window.SlideForge.prevStep = function() {
      const st = window.SlideForge.steps;
      if (st && st.apply && st.current > 0) { st.current--; st.apply(st.current); return true; }
      return false;
    };
    window.SlideForge.applyPreset = function(name) {
      const preset = name || 'classroom';
      const root = document.documentElement;
      window.SlideForge.activePreset = preset;
      document.body.classList.remove('sf-preset-auditorium', 'sf-preset-remote', 'sf-preset-workshop', 'sf-preset-classroom');
      if (preset === 'auditorium') {
        root.style.setProperty('--sf-font-scale', '1.3');
        root.style.setProperty('--sf-anim-duration', '0.4s');
        document.body.classList.add('sf-preset-auditorium');
      } else if (preset === 'remote') {
        root.style.setProperty('--sf-font-scale', '0.9');
        root.style.setProperty('--sf-anim-duration', '0.2s');
        document.body.classList.add('sf-preset-remote');
      } else if (preset === 'workshop') {
        root.style.setProperty('--sf-font-scale', '1.0');
        root.style.setProperty('--sf-anim-duration', '0.5s');
        document.body.classList.add('sf-preset-workshop');
      } else {
        root.style.setProperty('--sf-font-scale', '1.0');
        root.style.setProperty('--sf-anim-duration', '0.6s');
        document.body.classList.add('sf-preset-classroom');
      }
    };

    window.SlideForge.destroyAll = function() { 
      window.SlideForge.cleanup.forEach(function(fn) { try { fn(); } catch(e) { console.warn('SlideForge cleanup error:', e); } });
      window.SlideForge.cleanup = [];
      window.SlideForge.steps = { total: 0, current: 0, apply: null };
      // Rensa handlers
      Object.keys(window.SlideForge.handlers).forEach(function(k) { delete window.SlideForge.handlers[k]; });
    };

    // === HTML Escaping ===
    const SF_HTML_FIELDS = new Set([
      'titleHtml', 'warnings', 'resultContent', 'code', 'promptText',
      'intro', 'description', 'newsFlash'
    ]);

    function escapeHtml(str) {
      if (typeof str !== 'string') return str;
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function safeField(value, fieldName) {
      if (typeof value !== 'string') return value || '';
      return SF_HTML_FIELDS.has(fieldName) ? value : escapeHtml(value);
    }

    // ===== REGISTER SLIDE TYPES =====

    /**
     * word-cascade: Words that drop into place
     * JSON: { type: "word-cascade", words: ["Every","student","deserves","to","be","*seen*"], speed: 200, finalPause: true }
     */
    function renderWordCascade(s) {
        const speed = s.speed || 200;
        const words = (s.words || []).map((w, i) => {
            const isEmphasis = w.startsWith('*') && w.endsWith('*');
            const cleanWord = isEmphasis ? w.slice(1, -1) : w;
            const isLast = i === (s.words || []).length - 1;
            const animName = (isEmphasis || (s.finalPause && isLast)) ? 'wordLand' : 'wordDrop';
            const cls = isEmphasis ? 'wc-word wc-emphasis' : 'wc-word';
            return `<span class="${cls}" style="animation: ${animName} 0.55s var(--sf-ease-spring) ${i * speed}ms forwards">${cleanWord}</span>`;
        }).join('');

        return `<div class="slide-word-cascade">${words}</div>`;
    }

    /**
     * box-reveal: Boxes that bounce in with glassmorphism borders
     * JSON: { type: "box-reveal", title: "...",
     *         boxes: [{ title: "...", text: "...", icon: "optional emoji", iconSrc: "optional/path.png" }, ...] }
     */
    function renderBoxReveal(s) {
        const boxes = (s.boxes || []).map((box, i) => {
            let iconHTML = '';
            if (box.iconSrc) {
                iconHTML = `<img class="br-icon-img" src="${box.iconSrc}" alt="${box.title || ''}">`;
            } else if (box.icon) {
                iconHTML = `<span class="br-icon">${box.icon}</span>`;
            }
            return `
            <div class="br-box" style="animation: boxBounce 0.65s var(--sf-ease-spring) ${300 + i * 250}ms forwards">
                ${iconHTML}
                <div class="br-title">${box.title || ''}</div>
                <div class="br-text">${box.text || ''}</div>
            </div>
        `;
        }).join('');

        return `
            <div class="slide-box-reveal">
                <h2>${s.title || ''}</h2>
                <div class="br-grid">${boxes}</div>
            </div>
        `;
    }

    /**
     * bullet-build: Progressive bullet point reveals
     * JSON: { type: "bullet-build", title: "...", items: ["Point 1", "*Emphasis point*", "Point with|subtitle"], auto: true, interval: 800 }
     */
    function renderBulletBuild(s) {
        const interval = s.interval || 600;
        const items = (s.items || []).map((item, i) => {
            const isEmphasis = item.startsWith('*') && item.endsWith('*');
            let text = isEmphasis ? item.slice(1, -1) : item;
            let subtitle = '';
            
            // Support "Main text|Subtitle" format
            if (text.includes('|')) {
                const parts = text.split('|');
                text = parts[0];
                subtitle = parts[1];
            }
            
            const cls = isEmphasis ? 'bb-item bb-emphasis' : 'bb-item';
            const delay = 400 + i * interval;
            
            return `
                <li class="${cls}" style="animation: bulletSlide 0.5s ease ${delay}ms forwards">
                    <span class="bb-dot" style="animation: dotPop 0.35s var(--sf-ease-spring) ${delay - 100}ms forwards"></span>
                    <span>
                        ${text}
                        ${subtitle ? `<span class="bb-subtitle">${subtitle}</span>` : ''}
                    </span>
                </li>
            `;
        }).join('');

        return `
            <div class="slide-bullet-build">
                <h2>${s.title || ''}</h2>
                <ul class="bb-list">${items}</ul>
            </div>
        `;
    }

    // ===== SPRINT 2: LINE CHART =====

    /**
     * line-chart: SVG lines drawn with stroke-dashoffset animation
     * JSON: { type: "line-chart", title: "...", xLabel: "...", yLabel: "...",
     *         labels: ["2020","2021",...],
     *         series: [{ name: "...", color: "#6366f1", points: [12,18,25,34,56] }] }
     */
    function renderLineChart(s) {
        const id = 'lc-' + Math.random().toString(36).slice(2, 8);
        const W = 800, H = 400;
        const pad = { top: 30, right: 30, bottom: 50, left: 55 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;
        const labels = s.labels || [];
        const series = s.series || [];

        let isTimeAxis = false;
        let timeMin = 0, timeMax = 1;
        
        let allPts = [];
        series.forEach(sr => {
            if (!sr.points) return;
            sr.normPoints = sr.points.map((p, i) => {
                if (typeof p === 'number') return { index: i, y: p };
                if (p.x && typeof p.x === 'string' && p.x.includes('-')) {
                    isTimeAxis = true;
                    return { ...p, time: new Date(p.x).getTime() };
                }
                return { index: i, ...p };
            });
            allPts.push(...sr.normPoints);
        });

        let yMin = Math.min(0, ...allPts.map(p => p.y));
        let yMax = Math.max(...allPts.map(p => p.y)) * 1.15;
        
        if (isTimeAxis) {
            timeMin = Math.min(...allPts.map(p => p.time));
            timeMax = Math.max(...allPts.map(p => p.time));
            if (timeMin === timeMax) timeMax = timeMin + 1;
            const padTime = (timeMax - timeMin) * 0.05;
            timeMin -= padTime;
            timeMax += padTime;
        }

        const xScale = (p) => {
            if (isTimeAxis) {
                return pad.left + ((p.time - timeMin) / (timeMax - timeMin)) * chartW;
            }
            return pad.left + (p.index / Math.max(1, labels.length - 1)) * chartW;
        };
        const yScale = (v) => pad.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

        let gridLines = '';
        for (let i = 0; i <= 4; i++) {
            const yVal = yMin + (i / 4) * (yMax - yMin);
            const y = yScale(yVal);
            gridLines += `<line class="lc-grid-line" x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}"/>`;
            gridLines += `<text class="lc-axis-label" x="${pad.left - 8}" y="${y + 4}" text-anchor="end">${Math.round(yVal)}</text>`;
        }

        let xLabels = '';
        if (isTimeAxis) {
            const numLabels = labels.length > 0 ? labels.length : 5;
            for(let i=0; i<numLabels; i++) {
                const t = timeMin + (i / Math.max(1, numLabels - 1)) * (timeMax - timeMin);
                const d = new Date(t);
                const l = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                const x = pad.left + (i / Math.max(1, numLabels - 1)) * chartW;
                xLabels += `<text class="lc-axis-label" x="${x}" y="${H - pad.bottom + 25}" text-anchor="middle">${l}</text>`;
            }
        } else {
            xLabels = labels.map((l, i) =>
                `<text class="lc-axis-label" x="${xScale({index:i})}" y="${H - pad.bottom + 25}" text-anchor="middle">${l}</text>`
            ).join('');
        }

        let yAxisLabel = s.yLabel ? `<text class="lc-axis-label" x="15" y="${pad.top + chartH/2}" text-anchor="middle" transform="rotate(-90,15,${pad.top + chartH/2})">${s.yLabel}</text>` : '';
        let xAxisLabel = s.xLabel ? `<text class="lc-axis-label" x="${pad.left + chartW/2}" y="${H - 5}" text-anchor="middle">${s.xLabel}</text>` : '';

        let linesHTML = '';
        let dotsHTML = '';
        series.forEach((sr, si) => {
            const ptsHTML = (sr.normPoints || []).map(p => `${xScale(p)},${yScale(p.y)}`).join(' ');
            
            let pathLen = 0;
            for (let i = 1; i < sr.normPoints.length; i++) {
                pathLen += Math.hypot(xScale(sr.normPoints[i]) - xScale(sr.normPoints[i-1]), yScale(sr.normPoints[i].y) - yScale(sr.normPoints[i-1].y));
            }

            const delay = 0.5 + si * 0.8;
            linesHTML += `<polyline class="lc-data-line" points="${ptsHTML}" stroke="${sr.color || '#6366f1'}" 
                style="stroke-dasharray:${pathLen};stroke-dashoffset:${pathLen};animation:drawLine 2s ease ${delay}s forwards"/>`;

            (sr.normPoints || []).forEach((p, i) => {
                const dotDelay = delay + 0.3 + i * 0.15;
                const labelAttr = p.label ? `data-label="${p.label}"` : '';
                const infoAttr = p.info ? `data-info="${p.info}"` : '';
                const valAttr = `data-val="${p.y}"`;
                dotsHTML += `<circle class="lc-dot" cx="${xScale(p)}" cy="${yScale(p.y)}" r="0" fill="${sr.color || '#6366f1'}" 
                    ${labelAttr} ${infoAttr} ${valAttr}
                    style="animation:dotAppear 0.4s ease ${dotDelay}s forwards; pointer-events:all;"/>`;
                
                // Permanent label next to dot
                if (p.label) {
                    const labelDelay = dotDelay + 0.2;
                    const lx = xScale(p);
                    const ly = yScale(p.y);
                    // Alternate above/below to avoid overlap on dense points
                    const above = (i % 2 === 0);
                    const labelX = lx + 8;
                    const labelY = above ? ly - 12 : ly + 18;
                    dotsHTML += `<text class="lc-point-label" x="${labelX}" y="${labelY}" text-anchor="start" style="animation-delay:${labelDelay}s">${p.label}</text>`;
                }
            });
        });

        const legend = series.map(sr =>
            `<div class="lc-legend-item"><div class="lc-legend-dot" style="background:${sr.color}"></div>${sr.name || ''}</div>`
        ).join('');

        setTimeout(() => {
            const chartEl = document.getElementById(id);
            if (!chartEl) return;
            const tooltip = document.createElement('div');
            tooltip.className = 'lc-tooltip';
            chartEl.querySelector('.lc-chart').appendChild(tooltip);
            
            const dots = chartEl.querySelectorAll('.lc-dot');
            dots.forEach(dot => {
                dot.addEventListener('mouseenter', (e) => {
                    const label = dot.dataset.label;
                    const info = dot.dataset.info;
                    const val = dot.dataset.val;
                    if (!label && !info) return;
                    
                    tooltip.innerHTML = (label ? '<div class="lc-tooltip-title">' + label + '</div>' : '') +
                                      (info ? '<div style="white-space:normal; max-width:320px; line-height:1.5; font-size:1.15rem;">' + info + '</div>' : '') +
                                      '<div style="margin-top:0.5rem; opacity:0.8; font-family:monospace; font-size:1.2rem; color:var(--accent, #f97316);">' + val + ' minuter</div>';
                    
                    const rect = chartEl.querySelector('.lc-chart').getBoundingClientRect();
                    const dotRect = dot.getBoundingClientRect();
                    
                    const top = dotRect.top - rect.top;
                    const left = dotRect.left - rect.left + (dotRect.width/2);
                    
                    tooltip.style.left = left + 'px';
                    tooltip.style.top = top + 'px';
                    tooltip.classList.add('visible');
                });
                dot.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
                
                // Allow click as fallback for mobile/touch
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tooltip.classList.toggle('visible');
                });
            });
        }, 100);

        return `
            <div class="slide-line-chart" id="${id}">
                <h2>${s.title || ''}</h2>
                <div class="lc-chart">
                    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
                        ${gridLines}
                        ${xLabels}
                        ${yAxisLabel}
                        ${xAxisLabel}
                        ${linesHTML}
                        ${dotsHTML}
                    </svg>
                </div>
                <div class="lc-legend">${legend}</div>
            </div>
        `;
    }

    // ===== SPRINT 2: COMPARISON =====

    /**
     * comparison: Side-by-side columns sliding in from opposite edges
     * JSON: { type: "comparison", title: "...",
     *         left: { label: "Utan", items: ["40 min/elev", ...] },
     *         right: { label: "Med", items: ["8 min/elev", ...] },
     *         highlights: [0, 1] }
     */
    function renderComparison(s) {
        const left = s.left || { label: '', items: [] };
        const right = s.right || { label: '', items: [] };
        const highlights = new Set(s.highlights || []);

        const renderItems = (items, side) => items.map((item, i) => {
            const hl = highlights.has(i) ? ' cmp-highlight' : '';
            const delay = (side === 'left' ? 0.6 : 0.8) + i * 0.15;
            return `<div class="cmp-item${hl}" style="opacity:0;animation:${side === 'left' ? 'slideFromLeft' : 'slideFromRight'} 0.5s ease ${delay}s forwards">${item}</div>`;
        }).join('');

        return `
            <div class="slide-comparison">
                <h2>${s.title || ''}</h2>
                <div class="cmp-grid">
                    <div class="cmp-col cmp-left">
                        <div class="cmp-label">${left.label || ''}</div>
                        ${renderItems(left.items || [], 'left')}
                    </div>
                    <div class="cmp-divider"></div>
                    <div class="cmp-col cmp-right">
                        <div class="cmp-label">${right.label || ''}</div>
                        ${renderItems(right.items || [], 'right')}
                    </div>
                </div>
            </div>
        `;
    }

    // ===== SPRINT 2: TIMELINE VERTICAL =====

    /**
     * timeline-vertical: Line drawn downward with nodes popping in
     * JSON: { type: "timeline-vertical", title: "...",
     *         nodes: [{ year: "2022", text: "...", sub: "optional detail" }, ...] }
     */
    function renderTimelineVertical(s) {
        const nodes = (s.nodes || []).map((node, i) => {
            const nodeDelay = 0.5 + i * 0.5;
            const dotDelay = nodeDelay - 0.1;
            return `
                <div class="tv-node" style="animation:bulletSlide 0.5s ease ${nodeDelay}s forwards">
                    <div class="tv-dot" style="animation:nodePopIn var(--sf-dur-fast) var(--sf-ease-spring) ${dotDelay}s forwards"></div>
                    <div class="tv-year">${node.year || ''}</div>
                    <div class="tv-text">${node.text || ''}</div>
                    ${node.sub ? `<div class="tv-sub">${node.sub}</div>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="slide-timeline-v">
                <h2>${s.title || ''}</h2>
                <div class="tv-track">
                    <div class="tv-line"></div>
                    ${nodes}
                </div>
            </div>
        `;
    }

    // ===== SPRINT 3: PROGRESS RING =====

    /**
     * progress-ring: Circular SVG gauge with countUp
     * JSON: { type: "progress-ring", title: "...", value: 78, max: 100, unit: "%",
     *         color: "#22c55e", subtitle: "Biologi, VT 2026" }
     */
    function renderProgressRing(s) {
        const val = s.value || 0;
        const max = s.max || 100;
        const pct = val / max;
        const R = 120, CX = 140, CY = 140;
        const C = 2 * Math.PI * R;
        const target = C * (1 - pct);
        const color = s.color || 'var(--accent, #f97316)';
        const uid = 'pr-' + Math.random().toString(36).slice(2, 8);

        // CountUp via inline script triggered after render
        setTimeout(() => {
            const el = document.getElementById(uid);
            if (!el) return;
            const duration = 2000;
            const start = performance.now();
            function tick(now) {
                const t = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
                el.textContent = Math.round(eased * val);
                if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }, 500);

        return `
            <div class="slide-progress-ring">
                <h2>${s.title || ''}</h2>
                <div class="pr-wrap">
                    <svg width="280" height="280" viewBox="0 0 280 280">
                        <circle class="pr-bg" cx="${CX}" cy="${CY}" r="${R}"/>
                        <circle class="pr-fg" cx="${CX}" cy="${CY}" r="${R}"
                            stroke="${color}"
                            stroke-dasharray="${C}"
                            stroke-dashoffset="${C}"
                            style="--ring-target:${target};animation:ringFill 2s ease 0.4s forwards"/>
                    </svg>
                    <div class="pr-center">
                        <div class="pr-value"><span id="${uid}">0</span><span class="pr-unit">${s.unit || ''}</span></div>
                    </div>
                </div>
                ${s.subtitle ? `<div class="pr-subtitle">${s.subtitle}</div>` : ''}
            </div>
        `;
    }

    // ===== SPRINT 3: NUMBER WALL =====

    /**
     * number-wall: Grid of animated counters
     * JSON: { type: "number-wall", title: "...",
     *         numbers: [{ value: 268, label: "Slides", icon: "📊" }, ...] }
     */
    function renderNumberWall(s) {
        const nums = s.numbers || [];
        const fmtNum = (n) => {
          const num = parseFloat(n);
          if (isNaN(num)) return n;
          return new Intl.NumberFormat('sv-SE').format(num);
        };
        const cells = nums.map((n, i) => {
            const uid = 'nw-' + Math.random().toString(36).slice(2, 8);
            const delay = 300 + i * 200;

            // Schedule countUp
            setTimeout(() => {
                const el = document.getElementById(uid);
                if (!el) return;
                const target = n.value || 0;
                const duration = 1800;
                const start = performance.now();
                function tick(now) {
                    const t = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - t, 4);
                    el.textContent = fmtNum(Math.round(eased * target));
                    if (t < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
            }, delay + 400);

            let iconHTML = '';
            if (n.iconSrc) {
                iconHTML = `<img class="nw-icon-img" src="${n.iconSrc}" alt="${n.label || ''}">`;
            } else if (n.icon) {
                iconHTML = `<span class="nw-icon">${n.icon}</span>`;
            }

            return `
                <div class="nw-cell" style="animation:boxBounce var(--sf-dur-normal) var(--sf-ease-spring) ${delay}ms forwards">
                    ${iconHTML}
                    <div class="nw-value" id="${uid}">0</div>
                    <div class="nw-label">${n.label || ''}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="slide-number-wall">
                <h2>${s.title || ''}</h2>
                <div class="nw-grid">${cells}</div>
            </div>
        `;
    }

    // ===== SPRINT 3: BAR RACE =====

    /**
     * bar-race: Horizontal animated bars sorted by value
     * JSON: { type: "bar-race", title: "...", unit: "%",
     *         items: [{ label: "ChatGPT", value: 78, color: "#6366f1" }, ...] }
     */
    function renderBarRace(s) {
        const items = [...(s.items || [])].sort((a, b) => (b.value || 0) - (a.value || 0));
        const maxVal = items.length ? items[0].value : 1;
        const unit = s.unit || '';

        const rows = items.map((item, i) => {
            const pct = ((item.value || 0) / maxVal) * 100;
            const delay = 400 + i * 200;
            const isLeader = i === 0;
            const leaderClass = isLeader ? ' brc-leader' : '';
            const pulseAnim = isLeader ? ';animation-name:barPulse;animation-duration:3s;animation-delay:2.5s;animation-iteration-count:infinite' : '';

            return `
                <div class="brc-row${leaderClass}" style="animation:bulletSlide 0.5s ease ${delay}ms forwards">
                    <div class="brc-label">${item.label || ''}</div>
                    <div class="brc-track">
                        <div class="brc-bar" style="width:${pct}%;background:${item.color || 'var(--accent)'};animation:barGrow 1.2s ease ${delay + 100}ms both${pulseAnim}"></div>
                    </div>
                    <div class="brc-val">${item.value}${unit}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="slide-bar-race">
                <h2>${s.title || ''}</h2>
                ${rows}
            </div>
        `;
    }

    // ===== SPRINT 4 RENDERERS =====

    /**
     * giant-text — One big statement. **bold** = accent.
     * Props: text, align ("left"|"center"), variant ("display"|"serif"),
     *        entrance ("fade"|"word-by-word"|"instant"), decoration (string)
     */
    function renderGiantText(s) {
        const align = s.align === 'center' ? 'gt-center' : '';
        const variant = s.variant === 'serif' ? 'gt-serif' : '';
        const entrance = s.entrance || 'word-by-word';
        const deco = s.decoration ? `<div class="gt-decoration">${s.decoration}</div>` : '';

        // Parse **bold** markers
        const rawText = safeField(s.text, 'text') || '';
        const parts = rawText.split(/(\*\*[^*]+\*\*)/g);

        let wordIndex = 0;
        const htmlParts = parts.map(part => {
            const isBold = part.startsWith('**') && part.endsWith('**');
            const clean = isBold ? part.slice(2, -2) : part;
            const words = clean.split(/\s+/).filter(w => w);
            return words.map(w => {
                const delay = entrance === 'word-by-word' ? `animation-delay: ${wordIndex++ * 0.12}s` : '';
                const cls = isBold ? 'gt-word gt-bold' : 'gt-word';
                const style = entrance === 'instant' ? 'opacity:1' : delay;
                return `<span class="${cls}" style="${style}">${w} </span>`;
            }).join('');
        }).join('');

        return `
            <div class="slide-giant-text ${align} ${variant}">
                ${deco}
                <div class="gt-text">${htmlParts}</div>
            </div>
        `;
    }

    /**
     * callout — Prominent box with variant color.
     * Props: variant ("insight"|"info"|"warning"|"success"|"danger"|"quote"),
     *        title, tag, body, items[], pulsate (bool)
     */
    function renderCallout(s) {
        const colorMap = {
            insight: 'var(--accent, #06b6d4)',
            info: 'var(--accent, #06b6d4)',
            quote: 'var(--accent, #06b6d4)',
            warning: '#f59e0b',
            success: '#10b981',
            danger: '#ef4444'
        };
        const tagMap = {
            insight: 'NYCKELINSIKT', info: 'INFO', warning: 'VARNING',
            success: 'FRAMGÅNG', danger: 'VARNING', quote: 'CITAT'
        };
        const variant = s.variant || 'insight';
        const color = colorMap[variant] || colorMap.insight;
        const tag = s.tag || tagMap[variant] || '';
        const pulsate = (s.pulsate || variant === 'warning' || variant === 'danger') ? 'co-pulsate' : '';

        let itemsHtml = '';
        if (s.items && s.items.length) {
            itemsHtml = `<ul class="co-items">${s.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
        }

        return `
            <div class="slide-callout">
                <div class="co-box ${pulsate}" style="--co-color: ${color}">
                    ${tag ? `<div class="co-tag">${tag}</div>` : ''}
                    ${s.title ? `<div class="co-title">${safeField(s.title, 'title')}</div>` : ''}
                    ${s.body ? `<div class="co-body">${s.body}</div>` : ''}
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    /**
     * section-divider — Section break with number + title.
     * Props: number, title, subtitle, duration, variant ("centered"|"hero"|"left"),
     *        progress { current, total }
     */
    function renderSectionDivider(s) {
        const variant = s.variant === 'hero' ? 'sd-hero' : '';
        const number = s.number || '';
        let progressHtml = '';
        if (s.progress) {
            const pct = Math.round((s.progress.current / s.progress.total) * 100);
            progressHtml = `
                <div class="sd-progress">
                    <div class="sd-progress-fill" style="width: ${pct}%"></div>
                </div>
            `;
        }

        return `
            <div class="slide-section-divider ${variant}">
                ${number ? `<div class="sd-number">${number}</div>` : ''}
                <div class="sd-title">${safeField(s.title, 'title') || ''}</div>
                ${s.subtitle ? `<div class="sd-subtitle">${s.subtitle}</div>` : ''}
                ${s.duration ? `<div class="sd-duration">${s.duration}</div>` : ''}
                ${progressHtml}
            </div>
        `;
    }

    /**
     * hero-image — Full-bleed image with text overlay.
     * Props: src, title, subtitle, gradient ("bottom"|"top"|"left"|"radial"|"none"),
     *        textPosition ("bl"|"bc"|"br"|"tl"|"tc"|"tr"|"cl"|"cc"|"cr"),
     *        overlay (0-1), kenBurns (bool)
     */
    function renderHeroImage(s) {
        const gradient = s.gradient || 'bottom';
        const pos = s.textPosition || 'bl';
        const overlay = s.overlay != null ? s.overlay : 0.35;
        const kb = s.kenBurns ? 'hi-kenburns' : '';
        const gradClass = gradient !== 'none' ? `hi-grad-${gradient}` : '';

        return `
            <div class="slide-hero-image">
                <div class="hi-bg ${kb}" style="background-image: url('${s.src || ''}');
                    filter: brightness(${1 - overlay});"></div>
                ${gradClass ? `<div class="hi-gradient ${gradClass}"></div>` : ''}
                <div class="hi-content hi-pos-${pos}">
                    ${s.title ? `<div class="hi-title">${s.title}</div>` : ''}
                    ${s.subtitle ? `<div class="hi-subtitle">${s.subtitle}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * outro — Closing slide with title, contacts, QR code(s), CTA.
     * Props: title, subtitle, contacts[] (strings), qrUrl, qrCaption,
     *        secondaryQrUrl, secondaryQrCaption, cta, nextSteps[]
     */
    function renderOutro(s) {
        const title = s.title || 'Tack!';
        const qrSize = 150;
        const qrApi = (url) => `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000`;

        let contactsHtml = '';
        if (s.contacts && s.contacts.length) {
            contactsHtml = `<div class="ou-contacts">${s.contacts.map(c => `<span class="ou-contact">${c}</span>`).join('')}</div>`;
        }

        let qrHtml = '';
        if (s.qrUrl) {
            qrHtml += `<div class="ou-qr-block"><img src="${qrApi(s.qrUrl)}" alt="QR"><div class="ou-qr-caption">${s.qrCaption || s.qrUrl}</div></div>`;
        }
        if (s.secondaryQrUrl) {
            qrHtml += `<div class="ou-qr-block"><img src="${qrApi(s.secondaryQrUrl)}" alt="QR"><div class="ou-qr-caption">${s.secondaryQrCaption || s.secondaryQrUrl}</div></div>`;
        }

        let nextStepsHtml = '';
        if (s.nextSteps && s.nextSteps.length) {
            nextStepsHtml = `<ul class="ou-next-steps">${s.nextSteps.map(n => `<li>${n}</li>`).join('')}</ul>`;
        }

        return `
            <div class="slide-outro">
                <div class="ou-title">${title}</div>
                ${s.subtitle ? `<div class="ou-subtitle">${s.subtitle}</div>` : ''}
                ${contactsHtml}
                ${qrHtml ? `<div class="ou-qr-section">${qrHtml}</div>` : ''}
                ${nextStepsHtml}
                ${s.cta ? `<div class="ou-cta">${s.cta}</div>` : ''}
            </div>
        `;
    }

    // ===== SPRINT 5 RENDERERS =====

    /**
     * ai-conversation — Simulated AI chat with typing indicator.
     * Props: title, messages[] ({ role: "user"|"ai", label?, text }),
     *        userLabel, aiLabel, highlightPattern (regex string)
     */
    function renderAiConversation(s) {
        const userLabel = s.userLabel || 'Du';
        const aiLabel = s.aiLabel || 'AI';
        const highlight = s.highlightPattern ? new RegExp(`(${s.highlightPattern})`, 'gi') : null;
        const msgs = s.messages || [];

        let msgHtml = '';
        msgs.forEach((m, i) => {
            const isUser = (m.role || '').toLowerCase() === 'user';
            const cls = isUser ? 'aic-user' : 'aic-ai';
            const label = m.label || (isUser ? userLabel : aiLabel);
            const baseDelay = i * 1.2;
            let text = m.text || '';
            if (highlight && !isUser) {
                text = text.replace(highlight, '<strong style="color:var(--accent,#f97316)">$1</strong>');
            }

            // Typing dots before AI messages
            if (!isUser && i > 0) {
                const dotsDelay = baseDelay - 0.6;
                msgHtml += `<div class="aic-msg aic-ai" style="animation-delay:${dotsDelay}s; padding: 0.5rem 1rem;">
                    <div class="aic-dots"><span></span><span></span><span></span></div>
                </div>`;
            }

            msgHtml += `<div class="aic-msg ${cls}" style="animation-delay:${baseDelay}s">
                <div class="aic-label">${label}</div>
                ${text}
            </div>`;
        });

        return `
            <div class="slide-ai-conversation">
                ${s.title ? `<div class="aic-title">${s.title}</div>` : ''}
                <div class="aic-chat">${msgHtml}</div>
            </div>
        `;
    }

    /**
     * before-after — Prompt typed → result revealed.
     * Props: promptText, resultType ("image"|"text"|"code"),
     *        resultContent (text or image URL), caption, comparison (bool)
     */
    function renderBeforeAfter(s) {
        const resultType = s.resultType || 'text';
        let resultHtml = '';
        if (resultType === 'image') {
            resultHtml = `<img src="${s.resultContent || ''}" alt="Result">`;
        } else if (resultType === 'code') {
            resultHtml = `<pre style="font-family:'SF Mono',monospace;font-size:0.9rem;color:var(--text,#f1f5f9);line-height:1.6;white-space:pre-wrap;">${s.resultContent || ''}</pre>`;
        } else {
            resultHtml = `<div class="ba-result-text">${s.resultContent || ''}</div>`;
        }

        return `
            <div class="slide-before-after">
                <div class="ba-prompt-side">
                    <div class="ba-label">Prompt</div>
                    <div class="ba-prompt-text">${s.promptText || ''}</div>
                    <div class="ba-processing">
                        <span class="ba-dot"></span><span class="ba-dot"></span><span class="ba-dot"></span>
                        <span style="margin-left:0.3rem">Genererar...</span>
                    </div>
                </div>
                <div class="ba-result-side">
                    <div class="ba-label">Resultat</div>
                    <div class="ba-result-content">
                        ${resultHtml}
                    </div>
                    ${s.caption ? `<div class="ba-caption">${s.caption}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * prompt-reveal — Code/prompt in a terminal-like window.
     * Props: code, language, title, caption, mode ("typewriter"|"instant"|"input")
     */
    function renderPromptReveal(s) {
        const mode = s.mode || 'instant';
        const lang = s.language || 'prompt';
        const code = s.code || '';

        // Typewriter effect: show text char-by-char via CSS clip
        const codeHtml = mode === 'typewriter'
            ? `<span class="pr-typed">${code}</span><span class="pr-cursor"></span>`
            : code;

        return `
            <div class="slide-prompt-reveal">
                ${s.title ? `<div class="pr-title">${s.title}</div>` : ''}
                <div class="pr-window">
                    <div class="pr-toolbar">
                        <div class="pr-dot"></div><div class="pr-dot"></div><div class="pr-dot"></div>
                        <span class="pr-lang">${lang}</span>
                    </div>
                    <div class="pr-code">${codeHtml}</div>
                </div>
                ${s.caption ? `<div class="pr-caption">${s.caption}</div>` : ''}
            </div>
        `;
    }

    /**
     * pitfall — AI failure visualization.
     * Props: badge, severity ("warning"|"danger"|"critical"),
     *        question, answer, correction
     */
    function renderPitfall(s) {
        const sev = s.severity || 'danger';
        const badge = s.badge || (sev === 'critical' ? 'HALLUCINATION' : 'AI-FÄLLA');

        return `
            <div class="slide-pitfall${sev === 'critical' ? ' pf-shake-container' : ''}">
                <div class="pf-badge pf-${sev}">${badge}</div>
                <div class="pf-qa">
                    ${s.question ? `<div class="pf-question">❓ ${s.question}</div>` : ''}
                    ${s.answer ? `<div class="pf-answer">${s.answer}<div class="pf-strike"></div></div>` : ''}
                    ${s.correction ? `<div class="pf-correction pf-sev-${sev}">✓ ${s.correction}</div>` : ''}
                </div>
            </div>
        `;
    }

    // ===== SPRINT 6 RENDERERS =====

    /**
     * stat-compare — Two numbers with animated arrow.
     * Props: title, from, fromLabel, fromSuffix, to, toLabel, toSuffix, caption
     */
    function renderStatCompare(s) {
        const fmtNum = (n) => {
          const num = parseFloat(n);
          if (isNaN(num)) return n;
          return new Intl.NumberFormat('sv-SE').format(num);
        };
        const from = s.from != null ? s.from : 0;
        const to = s.to != null ? s.to : 0;
        const fromColor = to > from ? 'rgba(255,255,255,0.5)' : '#ef4444';
        const toColor = to > from ? '#10b981' : '#ef4444';

        return `
            <div class="slide-stat-compare">
                ${s.title ? `<div class="sc-title">${s.title}</div>` : ''}
                <div class="sc-row">
                    <div class="sc-num">
                        <div class="sc-value" style="color:${fromColor}">${s.fromPrefix||''}${fmtNum(from)}${s.fromSuffix||''}</div>
                        ${s.fromLabel ? `<div class="sc-label">${s.fromLabel}</div>` : ''}
                    </div>
                    <svg class="sc-arrow" viewBox="0 0 60 40">
                        <line x1="5" y1="20" x2="45" y2="20"/>
                        <polyline points="38,12 48,20 38,28"/>
                    </svg>
                    <div class="sc-num">
                        <div class="sc-value" style="color:${toColor}">${s.toPrefix||''}${fmtNum(to)}${s.toSuffix||''}</div>
                        ${s.toLabel ? `<div class="sc-label">${s.toLabel}</div>` : ''}
                    </div>
                </div>
                ${s.caption ? `<div class="sc-caption">${s.caption}</div>` : ''}
            </div>
        `;
    }

    /**
     * voice-collage — Grid of short quotes.
     * Props: title, voices[] ({ text, author }), highlightIndex
     */
    function renderVoiceCollage(s) {
        const voices = s.voices || [];
        const rotations = [-2, 1.5, -1, 2, -1.5, 0.8, -0.5, 1.8];
        const cards = voices.map((v, i) => {
            const rot = rotations[i % rotations.length];
            const delay = i * 0.12;
            const highlight = i === s.highlightIndex ? 'border-color: var(--accent, #f97316); box-shadow: 0 0 15px rgba(249,115,22,0.2);' : '';
            const fontSize = (v.text || '').length < 40 ? '1.15rem' : '0.95rem';
            return `<div class="vc-card" style="animation-delay:${delay}s; transform:rotate(${rot}deg); ${highlight}">
                <div class="vc-text" style="font-size:${fontSize}">${v.text || ''}</div>
                ${v.author ? `<div class="vc-author">— ${v.author}</div>` : ''}
            </div>`;
        }).join('');

        return `
            <div class="slide-voice-collage">
                ${s.title ? `<div class="vc-title">${s.title}</div>` : ''}
                <div class="vc-grid">${cards}</div>
            </div>
        `;
    }

    /**
     * portrait-quote — Quote with portrait image.
     * Props: image, attribution, context, text, imagePosition ("left"|"right")
     */
    function renderPortraitQuote(s) {
        const pos = s.imagePosition === 'right' ? 'row-reverse' : 'row';
        const animClass = s.animation === 'slide-left' ? ' pq-slide-left' : '';
        return `
            <div class="slide-portrait-quote${animClass}" style="flex-direction:${pos}">
                ${s.image ? `<img class="pq-image" src="${s.image}" alt="${s.attribution || ''}">` : ''}
                <div class="pq-content">
                    <div class="pq-mark">“</div>
                    <div class="pq-text" style="font-family: var(--sf-font-quote, Georgia, serif);">${s.text || ''}</div>
                    ${s.attribution ? `<div class="pq-attribution">${s.attribution}</div>` : ''}
                    ${s.context ? `<div class="pq-context">${s.context}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * reflection — Sequential questions for audience.
     * Props: title, tag, duration, questions[], mode ("pair"|"group"|"individual")
     */
    function renderReflection(s) {
        const questions = s.questions || [];
        const tag = s.tag || 'REFLEKTION';
        const modeIcons = { pair: '👥', group: '👫👫', individual: '🧑' };
        const modeIcon = modeIcons[s.mode] || '';

        const qs = questions.map((q, i) => {
            const delay = i * 0.4;
            return `<li style="animation-delay:${delay}s">${q}</li>`;
        }).join('');

        return `
            <div class="slide-reflection">
                <div class="ref-tag">${tag} ${modeIcon}</div>
                ${s.title ? `<div class="ref-title">${s.title}</div>` : ''}
                ${s.duration ? `<div class="ref-duration">${s.duration}</div>` : ''}
                <ul class="ref-questions">${qs}</ul>
            </div>
        `;
    }

    // ===== SPRINT 7+8+BONUS RENDERERS =====

    /**
     * collage — Image grid.
     * Props: title, images[] (URLs), layout ("grid-2"|"grid-3"|"grid-4")
     */
    function renderCollage(s) {
        const images = s.images || [];
        const cols = s.layout === 'grid-2' ? 'col-2' : s.layout === 'grid-4' ? 'col-4' : 'col-3';
        const imgs = images.map((url, i) =>
            `<img class="col-img" src="${url}" alt="" style="animation-delay:${i * 0.15}s">`
        ).join('');
        return `
            <div class="slide-collage">
                ${s.title ? `<div class="col-title">${s.title}</div>` : ''}
                <div class="col-grid ${cols}">${imgs}</div>
            </div>
        `;
    }

    /**
     * process-chain — Node chain with arrows.
     * Props: title, nodes[] ({ label, hint, status: "done"|"active"|"upcoming" })
     */
    function renderProcessChain(s) {
        const nodes = s.nodes || [];
        const html = nodes.map((n, i) => {
            const cls = n.status === 'active' ? 'pc-active' : '';
            const delay = i * 0.2;
            const arrow = i < nodes.length - 1 ? '<span class="pc-arrow">→</span>' : '';
            return `<div class="pc-node ${cls}" style="animation-delay:${delay}s">
                <div class="pc-node-label">${n.label || ''}</div>
                ${n.hint ? `<div class="pc-node-hint">${n.hint}</div>` : ''}
            </div>${arrow}`;
        }).join('');
        return `
            <div class="slide-process-chain">
                ${s.title ? `<div class="pc-title">${s.title}</div>` : ''}
                <div class="pc-chain">${html}</div>
            </div>
        `;
    }

    /**
     * acronym-list — SAMR, Bloom etc.
     * Props: title, tagline, items[] ({ letter, word, description })
     */
    function renderAcronymList(s) {
        const items = s.items || [];
        const rows = items.map((item, i) => {
            const delay = i * 0.15;
            return `<div class="al-row" style="animation-delay:${delay}s">
                ${item.letter ? `<div class="al-letter">${item.letter}</div>` : ''}
                <div>
                    <span class="al-word">${item.word || ''}</span>
                    ${item.description ? `<span class="al-desc"> — ${item.description}</span>` : ''}
                </div>
            </div>`;
        }).join('');
        return `
            <div class="slide-acronym-list">
                ${s.title ? `<div class="al-title">${s.title}</div>` : ''}
                ${s.tagline ? `<div class="al-tagline">${s.tagline}</div>` : ''}
                <div class="al-rows">${rows}</div>
            </div>
        `;
    }

    /**
     * map-pins — Image with positioned pins, click-to-show info panels.
     * Props: title, mapImage, pins[] ({ label, x, y, note })
     */
    function renderMapPins(s) {
        const pins = s.pins || [];
        const pinHtml = pins.map((p, i) => {
            const delay = i * 0.2;
            return `<div class="mp-pin" style="left:${p.x}%; top:${p.y}%; animation-delay:${delay}s"
                onclick="this.classList.toggle('mp-open')">
                <div class="mp-tooltip">${p.label || ''}${p.note ? ` — ${p.note}` : ''}</div>
                <div class="mp-pulse"></div>
            </div>`;
        }).join('');
        return `
            <div class="slide-map-pins">
                ${s.title ? `<div class="mp-title">${s.title}</div>` : ''}
                <div class="mp-container">
                    <img src="${s.mapImage || ''}" alt="Map">
                    ${pinHtml}
                </div>
            </div>
        `;
    }

    /**
     * map-progression — Drops pins sequentially via nextStep, shows info box avoiding the pin.
     * Props: title, mapImage, labs[] ({ id, name, location, x, y, desc, meta })
     */
    function renderMapProgression(s) {
        const id = 'mprog_' + Math.random().toString(36).slice(2, 8);
        const labs = s.labs || [];
        
        const sidebarHtml = labs.map((l, i) => `
            <div class="mprog-item" id="${id}-item-${i}" onclick="window.${id}_activate(${i})">
                <div class="mprog-item-title">${l.name || ''}</div>
            <div class="mprog-item-subtitle">${l.location || ''}</div>
            </div>
        `).join('');

        const pinsHtml = labs.map((l, i) => `
            <div class="mprog-pin" id="${id}-pin-${i}" style="left:${l.x}%; top:${l.y}%;" onclick="window.${id}_activate(${i})"></div>
        `).join('');

        // Provide logic via setTimeout
        setTimeout(() => {
            let step = 0;
            let activeIdx = -1;
            let lineReqFrame;
            const infoBox = document.getElementById(`${id}-infobox`);
            if(!infoBox) return; // Prevent errors if DOM missing
            
            function updateLine() {
                if (activeIdx < 0) return;
                const pin = document.getElementById(`${id}-pin-${activeIdx}`);
                const wrapper = document.getElementById(`${id}-wrapper`);
                const line = document.getElementById(`${id}-line`);
                if (!pin || !infoBox || !wrapper || !line) return;
                
                const wRect = wrapper.getBoundingClientRect();
                const pRect = pin.getBoundingClientRect();
                const bRect = infoBox.getBoundingClientRect();
                
                if (wRect.width === 0 || bRect.width === 0) {
                    lineReqFrame = requestAnimationFrame(updateLine);
                    return;
                }
                
                const pinX = pRect.left + pRect.width/2 - wRect.left;
                const pinY = pRect.top + pRect.height/2 - wRect.top;
                const boxY = bRect.top + bRect.height/2 - wRect.top;
                
                let boxX;
                const lab = labs[activeIdx];
                if (lab.x < 50) {
                    // Box is on the right, connect to its left edge
                    boxX = bRect.left - wRect.left - 5;
                } else {
                    // Box is on the left, connect to its right edge
                    boxX = bRect.right - wRect.left + 5;
                }
                
                line.setAttribute('x1', boxX);
                line.setAttribute('y1', boxY);
                line.setAttribute('x2', pinX);
                line.setAttribute('y2', pinY);
                
                lineReqFrame = requestAnimationFrame(updateLine);
            }
            
            window[`${id}_activate`] = (idx) => {
                // You can only click items that have been revealed (idx < step)
                if(idx >= step) return;
                // Deactivate old
                if(activeIdx >= 0) {
                    const oldItem = document.getElementById(`${id}-item-${activeIdx}`);
                    const oldPin = document.getElementById(`${id}-pin-${activeIdx}`);
                    if(oldItem) oldItem.classList.remove('active');
                    if(oldPin) oldPin.classList.remove('active');
                }
                activeIdx = idx;
                const lab = labs[idx];
                const item = document.getElementById(`${id}-item-${idx}`);
                const pin = document.getElementById(`${id}-pin-${idx}`);
                if(item) item.classList.add('active');
                if(pin) pin.classList.add('active');
                
                // Populate info
                document.getElementById(`${id}-info-title`).innerHTML = lab.name || '';
                document.getElementById(`${id}-info-meta`).innerHTML = lab.meta || lab.location || '';
                document.getElementById(`${id}-info-desc`).innerHTML = lab.desc || '';
                
                // Position info box dynamically relative to pin (avoid overlap and ensure line visibility)
                let clampedY = Math.max(15, Math.min(lab.y, 85)); // Keep it vertically inside the wrapper
                if(lab.x < 50) {
                    infoBox.style.left = Math.min(lab.x + 8, 55) + '%';
                    infoBox.style.right = 'auto';
                } else {
                    infoBox.style.right = Math.min(100 - lab.x + 8, 55) + '%';
                    infoBox.style.left = 'auto';
                }
                infoBox.style.top = clampedY + '%';
                infoBox.style.transform = 'translateY(-50%)';
                
                infoBox.classList.add('show');
                infoBox.classList.remove('hide');
                
                if (lineReqFrame) cancelAnimationFrame(lineReqFrame);
                document.getElementById(`${id}-line`).setAttribute('opacity', '0.6');
                updateLine();
            };

            window[`${id}_close`] = (e) => {
                if(e) e.stopPropagation();
                infoBox.classList.remove('show');
                infoBox.classList.add('hide');
                if (lineReqFrame) cancelAnimationFrame(lineReqFrame);
                document.getElementById(`${id}-line`).setAttribute('opacity', '0');
                if(activeIdx >= 0) {
                    const activePin = document.getElementById(`${id}-pin-${activeIdx}`);
                    const activeItem = document.getElementById(`${id}-item-${activeIdx}`);
                    if(activePin) activePin.classList.remove('active');
                    if(activeItem) activeItem.classList.remove('active');
                    activeIdx = -1;
                }
            };

            window['handleNextStep_' + id] = () => {
                if (step < labs.length) {
                    // Reveal next
                    const stepItem = document.getElementById(`${id}-item-${step}`);
                    const stepPin = document.getElementById(`${id}-pin-${step}`);
                    if(stepItem) stepItem.classList.add('revealed');
                    if(stepPin) stepPin.classList.add('revealed');
                    
                    // Increment step first so activate allows it
                    const currentStep = step;
                    step++;
                    
                    // Activate it automatically
                    window[`${id}_activate`](currentStep);
                    return true;
                }
                return false; // Let it proceed to next slide
            };
            // Alias for backward compatibility
            window.handleNextStep = window['handleNextStep_' + id];

            window.SlideForge.registerCleanup(function() {
                delete window[id + '_activate'];
                delete window[id + '_close'];
                delete window['handleNextStep_' + id];
            });
        }, 50);

        return `
            <div class="slide-map-progression">
                <div class="mprog-map-area">
                    <div class="mprog-map-wrapper" id="${id}-wrapper">
                        <img class="mprog-map-img" src="${s.mapImage || ''}" alt="Map">
                        <svg class="mprog-svg-overlay">
                            <line id="${id}-line" x1="0" y1="0" x2="0" y2="0" stroke="var(--accent, #f97316)" stroke-width="2" stroke-dasharray="4,6" opacity="0" />
                        </svg>
                        ${pinsHtml}
                        <div class="mprog-infobox" id="${id}-infobox">
                            <button class="mprog-close" onclick="window.${id}_close(event)">×</button>
                            <div class="mprog-info-title" id="${id}-info-title"></div>
                            <div class="mprog-info-meta" id="${id}-info-meta"></div>
                            <div class="mprog-info-desc" id="${id}-info-desc"></div>
                        </div>
                    </div>
                </div>
                <div class="mprog-sidebar">
                    <div class="mprog-title">${s.title || ''}</div>
                    <div class="mprog-list">
                        ${sidebarHtml}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * mindmap — Interactive concept map with auto-positioned nodes and curved SVG connections.
     * Props: title, center (string), nodes[] ({ label, detail, children[]? })
     * Auto-calculates radial positions. Click to expand detail.
     */
    function renderMindmap(s) {
        const nodes = s.nodes || [];
        const id = 'mm-' + Math.random().toString(36).slice(2, 8);

        // Auto-calculate positions if not provided
        const positioned = nodes.map((n, i) => {
            const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
            const rx = 35, ry = 35;
            return {
                ...n,
                x: n.x != null ? n.x : 50 + Math.cos(angle) * rx,
                y: n.y != null ? n.y : 50 + Math.sin(angle) * ry
            };
        });

        // SVG curved paths from center to each node
        const cx = 50, cy = 50;
        const paths = positioned.map((n, i) => {
            const mx = (cx + n.x) / 2;
            const my = (cy + n.y) / 2;
            // Add slight curve
            const offset = (i % 2 === 0 ? 5 : -5);
            const cpx = mx + offset;
            const cpy = my + offset;
            return `<path d="M ${cx} ${cy} Q ${cpx} ${cpy} ${n.x} ${n.y}"
                fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.4"
                stroke-dasharray="1 0.5" />`;
        }).join('');

        // Node elements with color coding
        const colors = ['#f97316', '#a855f7', '#22d3ee', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];
        const nodeHtml = positioned.map((n, i) => {
            const delay = (i + 1) * 0.12;
            const color = colors[i % colors.length];
            return `<div class="mm-node" style="left:${n.x}%; top:${n.y}%; transform:translate(-50%,-50%); animation-delay:${delay}s; border-color:${color}"
                onclick="this.classList.toggle('mm-expanded')">
                <div class="mm-node-label" style="color:${color}">${n.label || ''}</div>
                ${n.detail ? `<div class="mm-node-detail">${n.detail}</div>` : ''}
            </div>`;
        }).join('');

        return `
            <div class="slide-mindmap" id="${id}">
                ${s.title ? `<div class="mm-title">${s.title}</div>` : ''}
                <div class="mm-canvas">
                    <svg class="mm-lines" viewBox="0 0 100 100" preserveAspectRatio="none">${paths}</svg>
                    <div class="mm-node mm-center" style="left:${cx}%; top:${cy}%; transform:translate(-50%,-50%); opacity:1">
                        <div class="mm-node-label">${s.center || 'Tema'}</div>
                    </div>
                    ${nodeHtml}
                </div>
            </div>
        `;
    }

    // ===== SIGNATURE: LETTER MORPH =====

    /**
     * letter-morph — Scattered letters form words, unused become elliptical frame.
     * Props: phrases[] (array of strings)
     * Click to cycle through phrases.
     * Uses setTimeout post-render pattern (no embedded script tags).
     */
    function renderLetterMorph(s) {
        const id = 'lm-' + Math.random().toString(36).slice(2, 8);
        const phrases = s.phrases || ['Hej världen'];
        const totalLetters = 150; // Ökad från 80 för att klara längre meningar och bygga ett fylligare moln

        // Schedule initialization after DOM insertion via setTimeout
        setTimeout(() => {
            const el = document.getElementById(id);
            if (!el) return;
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ';
            let phraseIdx = 0;
            let letters = [];
            let seed = 42;
            let isMorphing = false;

            function rng() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

            function createLetters() {
                letters.forEach(l => l.el && l.el.remove());
                letters = [];
                seed = 42;
                for (let i = 0; i < totalLetters; i++) {
                    const span = document.createElement('span');
                    span.className = 'lm-letter';
                    span.textContent = alphabet[Math.floor(rng() * alphabet.length)];
                    span.style.fontSize = (14 + rng() * 20) + 'px';
                span.style.left = (rng() * 90 + 5) + '%';
                    span.style.top = (rng() * 85 + 5) + '%';
                    span.style.opacity = '0.08';
                    span.style.transform = 'rotate(' + (rng() * 60 - 30) + 'deg)';
                    el.appendChild(span);
                    letters.push({ el: span, role: 'scatter' });
                }
            }

            function morphTo(phrase) {
                // Skapa en osynlig layout-container för att räkna ut perfekta pixel-koordinater
                const layout = document.createElement('div');
                layout.style.position = 'absolute';
                layout.style.inset = '0';
                layout.style.display = 'flex';
                layout.style.flexWrap = 'wrap';
                layout.style.justifyContent = 'center';
                layout.style.alignItems = 'center';
                layout.style.alignContent = 'center';
                layout.style.padding = '10%';
                layout.style.gap = '1.5rem'; // Mellanrum mellan ord
                layout.style.visibility = 'hidden';
                
                // Om meningen är extremt lång, krymp fonten något. Annars använd den stora, ståtliga rubrikfonten.
                const charsCount = phrase.replace(/\s+/g, '').length;
                const fontClamp = charsCount > 40 ? 'clamp(1.5rem, 4vmin, 3.5rem)' : 'clamp(2rem, 6vmin, 5rem)';
                layout.style.fontSize = fontClamp;
                layout.style.fontWeight = '700';
                layout.style.textAlign = 'center';
                
                const words = phrase.toUpperCase().split(' ');
                const targetSpans = [];
                
                words.forEach(word => {
                    const wordDiv = document.createElement('div');
                    wordDiv.style.display = 'flex';
                    word.split('').forEach(char => {
                        const span = document.createElement('span');
                        span.textContent = char;
                        wordDiv.appendChild(span);
                        targetSpans.push({ char, span });
                    });
                    layout.appendChild(wordDiv);
                });
                
                el.appendChild(layout);
                
                // Läs av de exakta koordinaterna i relation till containern (el)
                const elRect = el.getBoundingClientRect();
                const targetCoords = targetSpans.map(t => {
                    const rect = t.span.getBoundingClientRect();
                    return {
                        char: t.char,
                        x: rect.left - elRect.left,
                        y: rect.top - elRect.top,
                        width: rect.width,
                        height: rect.height
                    };
                });
                
                el.removeChild(layout);

                el.removeChild(layout);

                // STEG 1: Alla bokstäver sprids som ett moln över hela skärmen
                letters.forEach((l, i) => {
                    // Sätt rätt tecken för de som ska användas
                    if (i < targetCoords.length) {
                        l.el.textContent = targetCoords[i].char;
                    } else {
                        l.el.textContent = alphabet[Math.floor(Math.abs(Math.sin(i * 7.3 + phraseIdx)) * alphabet.length)];
                    }
                    l.el.className = 'lm-letter lm-frame';
                    l.el.style.fontSize = (1 + Math.abs(Math.sin(i * 2.1)) * 1.5) + 'rem';
                    l.el.style.opacity = '0.04';
                    l.el.style.transform = 'translate(-50%, -50%) rotate(' + Math.round(Math.sin(i * 3.4) * 45) + 'deg)';
                    
                    const rx = (Math.abs(Math.sin(i * 12.3 + phraseIdx)) * 90 + 5);
                    const ry = (Math.abs(Math.cos(i * 18.1 + phraseIdx)) * 90 + 5);
                    l.el.style.left = rx + '%';
                    l.el.style.top = ry + '%';
                });

                document.getElementById(`${id}-counter`).textContent = (phraseIdx + 1) + ' / ' + phrases.length;

                // Om det är allra första initieringen, montera direkt utan scatter/highlight delay
                if (!el.dataset.firstRunDone) {
                    el.dataset.firstRunDone = "true";
                    targetCoords.forEach((t, i) => {
                        const l = letters[i];
                        l.el.className = 'lm-letter lm-active';
                        l.el.style.fontSize = fontClamp;
                        l.el.style.opacity = '1';
                        l.el.style.transform = 'translate(-50%, -50%) rotate(0deg)';
                        l.el.style.left = (t.x + t.width/2) + 'px';
                        l.el.style.top = (t.y + t.height/2) + 'px';
                    });
                    isMorphing = false;
                    return;
                }

                // STEG 2: Rätt bokstäver identifieras och lyser upp i orange (efter att scatter startat)
                setTimeout(() => {
                    targetCoords.forEach((t, i) => {
                        const l = letters[i];
                        l.el.className = 'lm-letter lm-highlight';
                    });
                }, 800);

                // STEG 3: De upplysta bokstäverna flyger samman och bildar orden
                setTimeout(() => {
                    targetCoords.forEach((t, i) => {
                        const l = letters[i];
                        l.el.className = 'lm-letter lm-active';
                        l.el.style.fontSize = fontClamp;
                        l.el.style.opacity = '1';
                        l.el.style.transform = 'translate(-50%, -50%) rotate(0deg)';
                        l.el.style.left = (t.x + t.width/2) + 'px';
                        l.el.style.top = (t.y + t.height/2) + 'px';
                    });
                    
                    setTimeout(() => { isMorphing = false; }, 1200); // Lås upp för nästa klick
                }, 1800);
            }

            createLetters();

            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !el.dataset.initialized) {
                    el.dataset.initialized = "true";
                    // Initial load is instant (handled inside morphTo)
                    isMorphing = true;
                    setTimeout(() => morphTo(phrases[phraseIdx]), 50);
                }
            });
            observer.observe(el);
            window.SlideForge.registerCleanup(function() { observer.disconnect(); });

            el.addEventListener('click', () => {
                if (el.dataset.initialized && !isMorphing) {
                    isMorphing = true;
                    phraseIdx = (phraseIdx + 1) % phrases.length;
                    morphTo(phrases[phraseIdx]);
                }
            });
        }, 100); // 100ms delay ensures DOM is ready after innerHTML

        return `
            <div class="slide-letter-morph" id="${id}">
                <div class="lm-hint">Klicka för nästa</div>
                <div class="lm-counter"></div>
            </div>
        `;
    }

    /**
     * rewrite-progression - Typewriter replacing text in specific slots
     * Props: template, prefix (array), steps (array of objects mapping slot keys to text)
     */
    function renderRewriteProgression(s) {
        const id = 'rp-' + Math.random().toString(36).slice(2, 8);
        const tpl = s.template || '';
        const steps = s.steps || [];
        const prefixes = s.prefix || [];
        
        if (steps.length === 0) return '';
        
        const first = steps[0];
        const buildSentence = (step) => {
            let result = tpl;
            for (const key in step) {
                result = result.replace(`{${key}}`, `<span class="rw-slot" data-key="${key}">${step[key]}</span>`);
            }
            return result;
        };

        setTimeout(() => {
            const container = document.getElementById(id);
            if (!container) return;
            
            let currentStep = 0;
            let animating = false;
            const mainEl = container.querySelector('.rewrite-main');
            const prefixEl = container.querySelector('.rewrite-prefix');

            async function eraseSlot(slot, text) {
                slot.classList.add('active');
                for (let i = text.length; i >= 0; i--) {
                    slot.textContent = text.substring(0, i);
                    await new Promise(r => setTimeout(r, 40));
                }
            }

            async function typeSlot(slot, text, isChanged) {
                for (let i = 0; i <= text.length; i++) {
                    slot.textContent = text.substring(0, i);
                    await new Promise(r => setTimeout(r, 50));
                }
                slot.classList.remove('active');
                if (isChanged) slot.classList.add('changed');
            }

            async function transitionTo(stepIdx) {
                animating = true;
                const step = steps[stepIdx];
                const prevStep = steps[stepIdx - 1];

                const slots = mainEl.querySelectorAll('.rw-slot');
                slots.forEach(slot => slot.classList.remove('changed'));

                if (prefixEl && prefixes[stepIdx - 1]) {
                    prefixEl.textContent = prefixes[stepIdx - 1];
                    prefixEl.classList.add('visible');
                    await new Promise(r => setTimeout(r, 800));
                }

                // Run animations concurrently for all changed slots
                const animations = [];
                for (const slot of slots) {
                    const key = slot.dataset.key;
                    if (prevStep[key] !== step[key]) {
                        animations.push((async () => {
                            await eraseSlot(slot, prevStep[key] || '');
                            await new Promise(r => setTimeout(r, 200));
                            await typeSlot(slot, step[key] || '', true);
                        })());
                    }
                }
                await Promise.all(animations);

                await new Promise(r => setTimeout(r, 600));
                if (prefixEl) prefixEl.classList.remove('visible');
                animating = false;
            }

            window['handleNextStep_' + id] = () => {
                if (animating) return true; // block until animation finishes
                if (currentStep < steps.length - 1) {
                    currentStep++;
                    transitionTo(currentStep);
                    return true;
                }
                return false;
            };
            // Alias for backward compatibility
            window.handleNextStep = window['handleNextStep_' + id];
            
            container.onclick = function(e) {
                if (window['handleNextStep_' + id] && !window['handleNextStep_' + id]()) {
                    if (typeof window.nextSlide === 'function') window.nextSlide();
                }
            };

            window.SlideForge.registerCleanup(function() {
                delete window['handleNextStep_' + id];
            });
        }, 100);

        return `
            <div class="slide-rewrite" id="${id}">
                <div class="rewrite-prefix"></div>
                <div class="rewrite-main">${buildSentence(first)}</div>
            </div>
        `;
    }

    /**
     * quote - Typewriter quote style
     * Props: text, author, style ("typewriter"), slowSpeed
     */
    function renderQuote(s) {
        const id = 'quote-' + Math.random().toString(36).slice(2, 8);
        const isTypewriter = s.style === 'typewriter';
        const rawText = safeField(s.text, 'text') || '';
        const author = s.author || '';
        const slowSpeed = s.slowSpeed || false;
        
        if (isTypewriter) {
            setTimeout(() => {
                const container = document.getElementById(id + '-text');
                const authorEl = document.getElementById(id + '-author');
                if (!container) return;
                
                const baseDelay = slowSpeed ? 60 : 30;
                const randomDelay = slowSpeed ? 80 : 40;
                
                let chars = [];
                let inHighlight = false;
                let i = 0;
                while (i < rawText.length) {
                    if (rawText[i] === '*') {
                        inHighlight = !inHighlight;
                        i++;
                    } else {
                        chars.push({ char: rawText[i], highlight: inHighlight });
                        i++;
                    }
                }

                container.innerHTML = '';
                let charIndex = 0;

                function typeNext() {
                    if (charIndex < chars.length) {
                        const c = chars[charIndex];
                        if (c.highlight) {
                            container.innerHTML = container.innerHTML.replace(/<span class="cursor[^>]*>.*?<\/span>$/, '');
                            container.innerHTML += `<span class="highlight" style="color: var(--accent); font-weight: bold;">${c.char}</span><span class="cursor" style="display:inline-block; width:0.6em; height:1.1em; background:var(--accent); margin-left:0.2em; vertical-align:middle;"></span>`;
                        } else {
                            container.innerHTML = container.innerHTML.replace(/<span class="cursor[^>]*>.*?<\/span>$/, '');
                            container.innerHTML += c.char + '<span class="cursor" style="display:inline-block; width:0.6em; height:1.1em; background:currentColor; margin-left:0.2em; vertical-align:middle;"></span>';
                        }
                        charIndex++;
                        setTimeout(typeNext, baseDelay + Math.random() * randomDelay);
                    } else {
                        container.innerHTML = container.innerHTML.replace(/<span class="cursor[^>]*>.*?<\/span>$/, '');
                        container.innerHTML += '<span class="cursor" style="display:inline-block; width:0.6em; height:1.1em; background:currentColor; margin-left:0.2em; vertical-align:middle; animation: blink-cursor 0.8s step-end infinite;"></span>';
                        if (author && authorEl) {
                            authorEl.textContent = author.startsWith('—') ? author : '— ' + author;
                            authorEl.style.opacity = '0.6';
                        }
                    }
                }

                container.innerHTML = '<span class="cursor" style="display:inline-block; width:0.6em; height:1.1em; background:currentColor; margin-left:0.2em; vertical-align:middle;"></span>';
                setTimeout(typeNext, 500);
            }, 100);
            
            return `<div class="slide-quote typewriter" id="${id}" style="text-align: center; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh;">
                <div class="quote-text" id="${id}-text" style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 300; line-height: 1.5; color: var(--text); font-family: var(--sf-font-quote, Georgia, serif);"></div>
                <div class="quote-author" id="${id}-author" style="opacity:0; margin-top: 2rem; font-size: 1.5rem; transition: opacity 1s ease;"></div>
            </div>`;
        } else {
            const text = rawText.replace(/\*([^*]+)\*/g, '<span class="highlight" style="color: var(--accent); font-weight: bold;">$1</span>');
            return `<div class="slide-quote" style="text-align: center; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh;">
                <div class="quote-text" style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 300; line-height: 1.5; color: var(--text); font-family: var(--sf-font-quote, Georgia, serif);">» ${text} «</div>
                ${author ? `<div class="quote-author" style="margin-top: 2rem; font-size: 1.5rem; opacity: 0.8;">— ${author}</div>` : ''}
            </div>`;
        }
    }

    /**
     * map-journey — Stylized map with an animated route connecting pins.
     * Props: title, mapImage, points[] ({ label, x, y })
     */
    function renderMapJourney(s) {
        const points = s.points || [];
        const pathData = points.length > 0 ? 'M ' + points.map(p => `${p.x} ${p.y}`).join(' L ') : '';
        
        const pinHtml = points.map(p => `
            <div class="mj-pin" style="left:${p.x}%; top:${p.y}%;">
                <div class="mj-label">${p.label}</div>
            </div>
        `).join('');

        return `
            <div class="slide-map-journey">
                ${s.title ? `<div class="mj-title" style="padding: 2rem; font-size: 2rem; font-weight: bold; color: var(--accent, #f97316);">${s.title}</div>` : ''}
                <div class="mj-container">
                    <img src="${s.mapImage || ''}" alt="Map">
                    <svg class="mj-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path class="mj-path" d="${pathData}" vector-effect="non-scaling-stroke" />
                    </svg>
                    ${pinHtml}
                </div>
            </div>
        `;
    }

    /**
     * mindmap-tree — Multi-level hierarchical mindmap with curved connections.
     * Props: title, root (string), branches[] ({ label, leaves: [string] })
     */
    function renderMindmapTree(s) {
        const root = s.root || 'Root';
        const branches = s.branches || [];
        
        let html = '';
        let svg = '';
        
        // Root at left center
        const rootX = 15;
        const rootY = 50;
        html += `<div class="mt-node mt-root" style="left:${rootX}%; top:${rootY}%;">${root}</div>`;
        
        const branchX = 45;
        const leafX = 85;
        
        branches.forEach((b, i) => {
            const branchY = 20 + (60 / Math.max(1, branches.length - 1)) * i;
            // Line from root to branch
            svg += `<path d="M ${rootX} ${rootY} C ${rootX+15} ${rootY}, ${branchX-15} ${branchY}, ${branchX} ${branchY}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />`;
            html += `<div class="mt-node mt-branch" style="left:${branchX}%; top:${branchY}%;">${b.label}</div>`;
            
            if (b.leaves && b.leaves.length > 0) {
                b.leaves.forEach((l, j) => {
                    const leafOffset = (j - (b.leaves.length-1)/2) * 12; // vertical spread
                    const leafY = branchY + leafOffset;
                    // Line from branch to leaf
                    svg += `<path d="M ${branchX} ${branchY} C ${branchX+15} ${branchY}, ${leafX-15} ${leafY}, ${leafX} ${leafY}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" stroke-dasharray="4 4" />`;
                    html += `<div class="mt-node mt-leaf" style="left:${leafX}%; top:${leafY}%;">${l}</div>`;
                });
            }
        });

        return `
            <div class="slide-mindmap-tree">
                ${s.title ? `<div class="mt-title" style="position:absolute; top:2rem; left:3rem; font-size:2rem; font-weight:bold; color:var(--text, #f1f5f9);">${s.title}</div>` : ''}
                <div class="mt-canvas">
                    <svg class="mt-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${svg}</svg>
                    ${html}
                </div>
            </div>
        `;
    }

    /**
     * warning-pulse - An animated exclamation mark warning slide.
     * Props: title, subtitle
     */
    function renderWarningPulse(s) {
        return `
            <div class="slide-warning-pulse">
                <div class="wp-mark-spinner">
                    <div class="wp-mark">!</div>
                </div>
                <div class="wp-title">${s.title || ''}</div>
                <div class="wp-subtitle">${s.subtitle || ''}</div>
            </div>
        `;
    }

    /**
     * token-spinner — Typewriter with slot-machine token generation
     * Props: text (string)
     */
    function renderTokenSpinner(s) {
        const id = 'ts-' + Math.random().toString(36).slice(2, 8);
        const rawText = s.text || '';
        
        // Split by spaces to animate word by word
        const words = rawText.split(' ').filter(w => w.length > 0);
        
        // Vocabulary for the LLM to "guess" from (more technical/statistical/predictive)
        const decoyWords = ["prediktera", "sannolikhet", "matris", "vektor", "kontext", "parametrar", "vikter", "algoritm", "data", "modell", "träningsdata", "inferens", "generera", "kalkylera", "kombinera", "statistiskt", "korrelation", "analys", "mönster", "beräkna", "chattbott", "kod", "syntax", "skriva", "läsa", "process", "eller", "som", "det", "är", "på", "till", "med", "för", "den", "har", "inte", "av", "om", "så", "bli", "maskininlärning", "neuralt", "nätverk"];

        setTimeout(() => {
            const container = document.getElementById(`${id}-content`);
            if (!container) return;
            
            let wordIdx = 0;
            
            async function processNextWord() {
                if (wordIdx >= words.length) return;
                const word = words[wordIdx];
                
                if (wordIdx === 0) {
                    // Type out the very first word
                    const span = document.createElement('span');
                    container.appendChild(span);
                    for (let i = 0; i < word.length; i++) {
                        span.textContent += word[i];
                        await new Promise(r => setTimeout(r, 60));
                    }
                    container.appendChild(document.createTextNode(' '));
                    
                    wordIdx++;
                    await new Promise(r => setTimeout(r, 200));
                    processNextWord();
                } else {
                    // Spin for all subsequent words
                    const spinnerWrapper = document.createElement('span');
                    spinnerWrapper.className = 'ts-spinner-wrapper ts-spinning';
                    
                    const probBadge = document.createElement('div');
                    probBadge.className = 'ts-prob-badge';
                    probBadge.textContent = '00.0%';
                    spinnerWrapper.appendChild(probBadge);

                    const spinnerMask = document.createElement('span');
                    spinnerMask.className = 'ts-spinner-mask';

                    const spinnerTrack = document.createElement('span');
                    spinnerTrack.className = 'ts-spinner-track';
                    
                    const trackOptions = [];
                    // Generate 6-10 random decoys
                    const numDecoys = 6 + Math.floor(Math.random() * 5);
                    for(let i=0; i < numDecoys; i++) {
                        trackOptions.push(decoyWords[Math.floor(Math.random() * decoyWords.length)]);
                    }
                    trackOptions.push(word); // The correct word is last
                    
                    trackOptions.forEach(opt => {
                        const wordDiv = document.createElement('div');
                        wordDiv.className = 'ts-spinner-word';
                        wordDiv.textContent = opt;
                        spinnerTrack.appendChild(wordDiv);
                    });
                    
                    spinnerMask.appendChild(spinnerTrack);
                    spinnerWrapper.appendChild(spinnerMask);
                    container.appendChild(spinnerWrapper);
                    
                    // Trigger CSS animation
                    await new Promise(r => setTimeout(r, 30));
                    
                    const targetY = -((trackOptions.length - 1) * 1.2);
                    
                    // The spin duration should be fast but visible (e.g., 0.8s to 1.2s)
                    const duration = 0.8 + Math.random() * 0.4;
                    spinnerTrack.style.transition = `transform ${duration}s cubic-bezier(0.1, 0.8, 0.2, 1)`;
                    spinnerTrack.style.transform = `translateY(${targetY}em)`;
                    
                    // Flash probabilities rapidly while spinning
                    const startTime = Date.now();
                    const probInterval = setInterval(() => {
                        probBadge.textContent = (Math.random() * 85).toFixed(1) + '%';
                    }, 50);

                    // Wait for spin to finish
                    await new Promise(r => setTimeout(r, duration * 1000 + 50));
                    clearInterval(probInterval);
                    
                    // Solidify
                    probBadge.textContent = (95 + Math.random() * 4.9).toFixed(1) + '%';
                    spinnerWrapper.classList.remove('ts-spinning');
                    spinnerWrapper.classList.add('ts-solidified');
                    container.appendChild(document.createTextNode(' '));
                    
                    wordIdx++;
                    
                    // Dynamic pauses based on punctuation
                    let pause = 150;
                    if (word.endsWith('.') || word.endsWith(',') || word.endsWith(':')) pause = 700;
                    
                    // Dramatic cliffhanger pause before "Eller?"
                    if (wordIdx < words.length && words[wordIdx].toLowerCase().includes('eller')) {
                        pause = 2000;
                    }
                    
                    await new Promise(r => setTimeout(r, pause));
                    processNextWord();
                }
            }
            
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !container.dataset.started) {
                    container.dataset.started = 'true';
                    setTimeout(processNextWord, 500);
                }
            });
            observer.observe(container);
            window.SlideForge.registerCleanup(function() { observer.disconnect(); });
            
        }, 100);

        return `
            <div class="slide-token-spinner" id="${id}">
                <div class="ts-content" id="${id}-content"></div>
            </div>
        `;
    }

    // ===== SEMANTIC NEBULA =====
    function renderSemanticNebula(s) {
        const id = 'sn-' + Math.random().toString(36).slice(2, 8);
        const startWord = s.startWord || "PROMPT";
        const titleText = s.title || "Latent Semantisk Rymd";
        
        // Custom CSS injected globally once
        if (!document.getElementById('css-semantic-nebula')) {
            const style = document.createElement('style');
            style.id = 'css-semantic-nebula';
            style.innerHTML = `
                .slide-semantic-nebula { 
                    position: absolute; inset: 0; width: 100vw; height: 100vh; 
                    background: #000; overflow: hidden; display: flex; 
                    flex-direction: column; align-items: center; justify-content: center; 
                }
                .sn-canvas-container { position: absolute; inset: 0; z-index: 1; }
                .sn-canvas { width: 100%; height: 100%; display: block; }
                .sn-sidebar { 
                    position: absolute; top: 0; bottom: 0; right: 0; 
                    width: 38vw; max-width: 560px; 
                    background: linear-gradient(to left, rgba(0,0,0,0.92) 30%, rgba(0,0,0,0.6) 70%, transparent); 
                    display: flex; flex-direction: column; justify-content: center; 
                    padding: 4rem 3.5rem 4rem 2.5rem; pointer-events: none; z-index: 10; gap: 1.8rem; 
                }
                .sn-sentence { 
                    color: rgba(255,255,255,0.85); 
                    font-size: clamp(1.4rem, 2.2vw, 2rem); 
                    font-weight: 300; 
                    line-height: 1.5; 
                    letter-spacing: 0.01em;
                    opacity: 0; 
                    transform: translateY(40px) scale(0.97); 
                    transition: opacity 1.4s var(--sf-ease-smooth), 
                                transform 1.4s var(--sf-ease-smooth);
                    text-shadow: 0 0 30px rgba(255, 180, 100, 0.08);
                    border-left: 2px solid transparent;
                    padding-left: 1.2rem;
                }
                .sn-sentence.active { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                    border-left-color: rgba(251, 191, 36, 0.4);
                }
                .sn-sentence.fade-out { 
                    opacity: 0; 
                    transform: translateY(-35px) scale(0.97); 
                    transition: opacity 1s ease-in, transform 1s ease-in;
                }
                @keyframes snWordFade { to { opacity: 1; } }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            const canvas = document.getElementById(`${id}-canvas`);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            
            let w, h;
            function resize() {
                const rect = canvas.parentElement.getBoundingClientRect();
                w = canvas.width = rect.width * window.devicePixelRatio;
                h = canvas.height = rect.height * window.devicePixelRatio;
                ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                w /= window.devicePixelRatio;
                h /= window.devicePixelRatio;
            }
            const resizeHandler = resize;
            window.addEventListener('resize', resizeHandler);
            resize();

            // 3D Engine Variables
            let time = 0;
            let camZ = 0; // Flight through space
            let camX = 0; // Sway left/right
            let cx = w / 2;
            let cy = h / 2;
            
            // Galaxy clusters organized in thematic SUPER-CLUSTERS (hopar)
            const clusters = [];
            
            // Each super-cluster has a theme, hue, and spatial anchor
            const superClusters = [
                { theme: 'språk', hue: 200, words: ['ord', 'mening', 'syntax', 'kontext', 'semantik', 'fras', 'token', 'språk'], anchorX: -500, anchorY: -200 },
                { theme: 'logik', hue: 45, words: ['logik', 'struktur', 'mönster', 'kedja', 'slutsats', 'premiss', 'induktion', 'bevis'], anchorX: 400, anchorY: -300 },
                { theme: 'biologi', hue: 120, words: ['neural', 'synaps', 'koppling', 'nod', 'nätverk', 'signal', 'impuls', 'cortex'], anchorX: -300, anchorY: 300 },
                { theme: 'sinnen', hue: 320, words: ['bild', 'ton', 'känsla', 'intuition', 'perception', 'minne', 'dröm', 'association'], anchorX: 500, anchorY: 250 },
                { theme: 'matematik', hue: 280, words: ['vektor', 'matris', 'vikt', 'dimension', 'rum', 'avstånd', 'gradient', 'funktion'], anchorX: 0, anchorY: -450 }
            ];
            
            superClusters.forEach((sc, sci) => {
                const numInGroup = 5 + Math.floor(Math.random() * 3); // 5-7 galaxes per super-cluster
                for (let i = 0; i < numInGroup; i++) {
                    const spread = 250; // How far apart galaxes in a group are
                    clusters.push({
                        origX: sc.anchorX + (Math.random() - 0.5) * spread,
                        origY: sc.anchorY + (Math.random() - 0.5) * spread,
                        origZ: sci * 500 + Math.random() * 400,
                        hue: sc.hue + (Math.random() - 0.5) * 30, // Slight hue variation within group
                        radius: 60 + Math.random() * 80,
                        superCluster: sci,
                        words: Array(4 + Math.floor(Math.random() * 4)).fill(0).map(() => ({
                            dx: (Math.random() - 0.5) * 2.5,
                            dy: (Math.random() - 0.5) * 2.5,
                            txt: sc.words[Math.floor(Math.random() * sc.words.length)]
                        })),
                        pulse: 0
                    });
                }
            });

            // PERIPHERAL clusters — far off at the edges, rarely targeted
            const peripherals = [
                { theme: 'poesi', hue: 350, words: ['metafor', 'rytm', 'vers', 'klang', 'bild', 'stämning'], anchorX: -1100, anchorY: 0 },
                { theme: 'humor', hue: 55, words: ['ironi', 'timing', 'absurd', 'vits', 'parodi', 'satir'], anchorX: 1100, anchorY: -150 },
                { theme: 'musik', hue: 170, words: ['harmoni', 'ackord', 'tonart', 'resonans', 'melodi', 'tempo'], anchorX: 900, anchorY: 400 }
            ];
            
            peripherals.forEach((pc, pci) => {
                const numInGroup = 3 + Math.floor(Math.random() * 2);
                for (let i = 0; i < numInGroup; i++) {
                    clusters.push({
                        origX: pc.anchorX + (Math.random() - 0.5) * 180,
                        origY: pc.anchorY + (Math.random() - 0.5) * 180,
                        origZ: 300 + Math.random() * 2000,
                        hue: pc.hue + (Math.random() - 0.5) * 20,
                        radius: 40 + Math.random() * 50,
                        superCluster: 5 + pci, // separate from main 0-4
                        isPeripheral: true,
                        words: Array(3 + Math.floor(Math.random() * 3)).fill(0).map(() => ({
                            dx: (Math.random() - 0.5) * 2.5,
                            dy: (Math.random() - 0.5) * 2.5,
                            txt: pc.words[Math.floor(Math.random() * pc.words.length)]
                        })),
                        pulse: 0
                    });
                }
            });

            // Rays and Particles
            let activeRay = null;
            let lastTarget = null;
            let rayWait = 0;
            const particles = [];
            
            // Nebula state
            let nebulaSize = 5;
            let nebulaPulse = 0;
            let nebulaHues = [];

            function draw() {
                cx = w / 2;
                cy = h / 2;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // Crisper trails
                ctx.fillRect(0, 0, w, h);
                
                time += 0.01;
                const camSpeed = 1.2 + time * 0.5; // Accelerates continuously
                camZ += camSpeed;
                camX = Math.sin(time * 0.3) * 80; // Gentle lateral sway
                
                // Draw Nebula in center
                nebulaPulse += 0.05;
                const currentNebRadius = nebulaSize + Math.sin(nebulaPulse) * (nebulaSize * 0.1);
                
                if (nebulaHues.length > 0) {
                    const mixHue = nebulaHues[Math.floor((time * 10) % nebulaHues.length)];
                    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, currentNebRadius * 2.5);
                    grad.addColorStop(0, 'hsla(' + mixHue + ', 100%, 80%, 0.9)');
                    grad.addColorStop(0.3, 'hsla(' + mixHue + ', 100%, 50%, 0.5)');
                    grad.addColorStop(1, 'hsla(' + mixHue + ', 100%, 10%, 0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(cx, cy, currentNebRadius * 2.5, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, currentNebRadius);
                    grad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.fillStyle = grad;
                    ctx.fill();
                }

                const fov = 500;
                
                // Project all clusters
                clusters.forEach((c, idx) => {
                    const angle = time * 0.12 + idx * 0.7;
                    const rx = Math.cos(angle) * c.origX - Math.sin(angle) * c.origZ * 0.3 - camX;
                    
                    let dz = c.origZ - camZ;
                    while (dz < -200) dz += 2800;
                    while (dz > 2600) dz -= 2800;
                    
                    const ry = c.origY + Math.sin(time * 0.4 + idx) * 120;
                    
                    const scale = fov / (fov + dz);
                    c.projX = cx + rx * scale;
                    c.projY = cy + ry * scale;
                    c.scale = Math.max(0, scale);
                    c.dz = dz;
                    c.visible = dz > 10;
                });

                // Draw inter-cluster nebulae (connecting mist within super-clusters)
                superClusters.forEach((sc, sci) => {
                    const groupClusters = clusters.filter(c => c.superCluster === sci && c.visible && c.scale > 0.15);
                    if (groupClusters.length < 2) return;
                    
                    // Find center of mass for this group
                    let avgX = 0, avgY = 0, avgScale = 0;
                    groupClusters.forEach(c => { avgX += c.projX; avgY += c.projY; avgScale += c.scale; });
                    avgX /= groupClusters.length;
                    avgY /= groupClusters.length;
                    avgScale /= groupClusters.length;
                    
                    // Draw a large, faint connecting nebula
                    const nebRad = 200 * avgScale;
                    if (nebRad > 15) {
                        const nebGrad = ctx.createRadialGradient(avgX, avgY, 0, avgX, avgY, nebRad);
                        nebGrad.addColorStop(0, 'hsla(' + sc.hue + ', 60%, 40%, ' + (0.025 * avgScale) + ')');
                        nebGrad.addColorStop(0.6, 'hsla(' + sc.hue + ', 60%, 25%, ' + (0.012 * avgScale) + ')');
                        nebGrad.addColorStop(1, 'hsla(' + sc.hue + ', 60%, 10%, 0)');
                        ctx.fillStyle = nebGrad;
                        ctx.beginPath();
                        ctx.arc(avgX, avgY, nebRad, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });

                // Draw clusters with larger, more visible words
                clusters.forEach(c => {
                    if (!c.visible) return;
                    c.pulse *= 0.93;
                    
                    // Draw cluster core
                    const crad = c.radius * c.scale;
                    const cgrad = ctx.createRadialGradient(c.projX, c.projY, 0, c.projX, c.projY, crad);
                    cgrad.addColorStop(0, 'hsla(' + c.hue + ', 80%, 60%, ' + (0.1 + c.pulse) + ')');
                    cgrad.addColorStop(1, 'hsla(' + c.hue + ', 80%, 20%, 0)');
                    ctx.fillStyle = cgrad;
                    ctx.beginPath();
                    ctx.arc(c.projX, c.projY, crad, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw words — much larger and more visible
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const wordSize = Math.max(16, Math.round(22 * c.scale));
                    c.words.forEach((wObj, wi) => {
                        const wx = c.projX + Math.cos(time * 0.6 + wi * 1.3) * crad * 0.7 * wObj.dx;
                        const wy = c.projY + Math.sin(time * 0.6 + wi * 1.3) * crad * 0.7 * wObj.dy;
                        const wordAlpha = Math.min(1, 0.5 + c.pulse * 0.5) * Math.min(1, c.scale * 2);
                        ctx.font = wordSize + "px 'Inter', sans-serif";
                        ctx.fillStyle = 'hsla(' + c.hue + ', 100%, ' + (75 + c.pulse * 25) + '%, ' + wordAlpha + ')';
                        ctx.fillText(wObj.txt, wx, wy);
                    });
                });

                // Logic: Elegant thread jumping between clusters
                if (!activeRay && rayWait <= 0) {
                    let nextTarget;
                    let attempts = 0;
                    
                    // ~12% chance to target a peripheral cluster (long-range association)
                    const goPeripheral = Math.random() < 0.12;
                    const candidates = goPeripheral 
                        ? clusters.filter(c => c.isPeripheral && c.visible)
                        : clusters.filter(c => !c.isPeripheral && c.visible);
                    
                    if (candidates.length > 0) {
                        do {
                            nextTarget = candidates[Math.floor(Math.random() * candidates.length)];
                            attempts++;
                        } while (nextTarget === lastTarget && attempts < 10);
                    } else {
                        // Fallback to any visible cluster
                        do {
                            nextTarget = clusters[Math.floor(Math.random() * clusters.length)];
                            attempts++;
                        } while ((nextTarget === lastTarget || nextTarget.dz < 200) && attempts < 10);
                    }

                    activeRay = {
                        target: nextTarget,
                        hue: nextTarget.hue,
                        progress: 0,
                        curveOffset: (Math.random() - 0.5) * 400
                    };
                }
                if (rayWait > 0) rayWait--;

                // Update and draw active ray (the searching thread)
                if (activeRay) {
                    let startX = cx, startY = cy;
                    if (lastTarget) {
                        startX = lastTarget.projX;
                        startY = lastTarget.projY;
                    }
                    const endX = activeRay.target.projX;
                    const endY = activeRay.target.projY;
                    
                    activeRay.progress += 0.012; // Slow, organic speed
                    
                    const t = activeRay.progress;
                    
                    // Calculate bezier curve for a soft organic thread
                    const cpx = (startX + endX) / 2 + activeRay.curveOffset;
                    const cpy = (startY + endY) / 2 - 200;
                    
                    const curX = (1-t)*(1-t)*startX + 2*(1-t)*t*cpx + t*t*endX;
                    const curY = (1-t)*(1-t)*startY + 2*(1-t)*t*cpy + t*t*endY;
                    
                    // Draw the faint thread trail
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.quadraticCurveTo(cpx, cpy, curX, curY);
                    ctx.strokeStyle = `hsla(${activeRay.hue}, 100%, 75%, 0.4)`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    
                    // Draw the glowing "head" of the thread
                    ctx.beginPath();
                    ctx.arc(curX, curY, 3, 0, Math.PI*2);
                    ctx.fillStyle = `hsla(${activeRay.hue}, 100%, 90%, 1)`;
                    ctx.shadowColor = `hsla(${activeRay.hue}, 100%, 70%, 1)`;
                    ctx.shadowBlur = 15;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    
                    if (activeRay.progress >= 1) {
                        activeRay.target.pulse = 1.5; // Soft glow on the hit cluster
                        
                        // Extract meaning! A particle carrying a word floats back via the viewer
                        const harvestedWord = activeRay.target.words[Math.floor(Math.random() * activeRay.target.words.length)].txt;
                        particles.push({
                            startX: endX, startY: endY,
                            x: endX, y: endY,
                            hue: activeRay.hue,
                            progress: 0,
                            phase: 0, // 0 = fly to viewer, 1 = pause near viewer, 2 = fly to nebula
                            phaseTimer: 0,
                            speed: 0.012 + Math.random() * 0.006,
                            word: harvestedWord,
                            curveOffset: (Math.random() - 0.5) * 300,
                            // Viewer position: slightly off-center left, for cinematic feel
                            viewerX: cx * 0.35 + Math.random() * cx * 0.3,
                            viewerY: cy * 0.6 + Math.random() * cy * 0.3
                        });
                        
                        lastTarget = activeRay.target;
                        activeRay = null;
                        rayWait = 40; // Pause to admire the harvest before moving on
                    }
                }

                // Update and draw harvested particles (three-phase flyby)
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    let curX, curY, fontSize, alpha, orbSize;
                    
                    if (p.phase === 0) {
                        // Phase 0: Fly from cluster toward viewer
                        p.progress += p.speed;
                        const t = p.progress;
                        const cpx = (p.startX + p.viewerX) / 2 + p.curveOffset * 0.5;
                        const cpy = Math.min(p.startY, p.viewerY) - 120;
                        curX = (1-t)*(1-t)*p.startX + 2*(1-t)*t*cpx + t*t*p.viewerX;
                        curY = (1-t)*(1-t)*p.startY + 2*(1-t)*t*cpy + t*t*p.viewerY;
                        // Growing as it approaches
                        fontSize = 14 + t * 34; // 14px → 48px
                        alpha = 0.4 + t * 0.6;
                        orbSize = 4 + t * 8;
                        
                        if (p.progress >= 1) {
                            p.phase = 1;
                            p.phaseTimer = 0;
                            p.progress = 0;
                        }
                    } else if (p.phase === 1) {
                        // Phase 1: Pause near viewer — word is large and readable
                        p.phaseTimer++;
                        curX = p.viewerX + Math.sin(p.phaseTimer * 0.03) * 8; // gentle float
                        curY = p.viewerY + Math.cos(p.phaseTimer * 0.04) * 5;
                        fontSize = 48;
                        alpha = 1;
                        orbSize = 12;
                        
                        if (p.phaseTimer > 90) { // ~1.5 seconds at 60fps
                            p.phase = 2;
                            p.progress = 0;
                            p.pauseX = curX;
                            p.pauseY = curY;
                        }
                    } else {
                        // Phase 2: Drift into the nebula center
                        p.progress += p.speed * 0.8;
                        const t = p.progress;
                        const cpx = (p.pauseX + cx) / 2 + p.curveOffset * 0.3;
                        const cpy = (p.pauseY + cy) / 2 + 80;
                        curX = (1-t)*(1-t)*p.pauseX + 2*(1-t)*t*cpx + t*t*cx;
                        curY = (1-t)*(1-t)*p.pauseY + 2*(1-t)*t*cpy + t*t*cy;
                        // Shrinking and fading as it enters nebula
                        fontSize = 48 * (1 - t * 0.7); // 48 → ~14
                        alpha = 1 - t;
                        orbSize = 12 * (1 - t * 0.6);
                        
                        if (p.progress >= 1) {
                            nebulaSize = Math.min(nebulaSize + 3, 120);
                            if (!nebulaHues.includes(p.hue)) nebulaHues.push(p.hue);
                            particles.splice(i, 1);
                            continue;
                        }
                    }
                    
                    // Draw the glowing orb
                    ctx.beginPath();
                    ctx.arc(curX, curY, orbSize, 0, Math.PI*2);
                    ctx.fillStyle = `hsla(${p.hue}, 100%, 85%, ${alpha * 0.8})`;
                    ctx.shadowColor = `hsla(${p.hue}, 100%, 50%, 1)`;
                    ctx.shadowBlur = orbSize * 2;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    
                    // The harvested word
                    ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = `hsla(${p.hue}, 100%, 95%, ${alpha})`;
                    ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${alpha * 0.6})`;
                    ctx.shadowBlur = 15;
                    ctx.fillText(p.word, curX, curY - orbSize - 10);
                    ctx.shadowBlur = 0;
                }


                if(document.getElementById(id)) {
                    requestAnimationFrame(draw);
                } else {
                    window.removeEventListener('resize', resizeHandler);
                }
            }
            draw();

            const sidebar = document.getElementById(`${id}-sidebar`);
            if (sidebar) {
                const sentences = s.sentences || [
                    "AI söker inte i en databas.",
                    "Den navigerar i ett oändligt hav av mening.",
                    "Den drar till sig relaterade begrepp.",
                    "Fakta, mönster och toner kondenseras...",
                    "...tills ett nytt svar dröms fram."
                ];
                
                let currentSentence = 0;
                function showNextSentence() {
                    if(!document.getElementById(id)) return;
                    const el = document.createElement('div');
                    el.className = 'sn-sentence';
                    el.innerText = sentences[currentSentence];
                    sidebar.appendChild(el);
                    
                    if (sidebar.children.length > 3) {
                        const old = sidebar.children[0];
                        old.classList.add('fade-out');
                        setTimeout((node) => { if(node && node.parentNode) node.parentNode.removeChild(node); }, 1200, old);
                    }
                    
                    void el.offsetWidth; // force reflow
                    el.classList.add('active');
                    
                    currentSentence = (currentSentence + 1) % sentences.length;
                    setTimeout(showNextSentence, 4500);
                }
                showNextSentence();
            }

            window.SlideForge.registerCleanup(function() {
                window.removeEventListener('resize', resizeHandler);
            });

        }, 100);

        return `
            <div class="slide-semantic-nebula" id="${id}">
                <div class="sn-canvas-container">
                    <canvas class="sn-canvas" id="${id}-canvas"></canvas>
                </div>
                <div class="sn-sidebar" id="${id}-sidebar"></div>
            </div>
        `;
    }

    // ===== COMPOSITE RENDERER =====

    /**
     * Composite — combines multiple forge types in a flexible grid layout.
     * @param {Object} s
     * @param {string} s.layout - "rows" | "columns" | "grid-2" | "grid-3"
     * @param {Array} s.blocks - [{span: 1, block: {type: "giant-text", text: "..."}}]
     * @param {string} [s.gap] - Gap between blocks (default "1rem")
     */
    function renderComposite(s) {
      const id = 'composite-' + Math.random().toString(36).substr(2, 9);
      const layout = s.layout || 'columns';
      const gap = s.gap || '1rem';
      const blocks = s.blocks || [];

      // Determine grid CSS based on layout
      let gridCSS = '';
      switch(layout) {
        case 'rows': gridCSS = 'grid-template-columns: 1fr; grid-auto-rows: 1fr;'; break;
        case 'columns': gridCSS = `grid-template-columns: repeat(${blocks.length}, 1fr);`; break;
        case 'grid-2': gridCSS = 'grid-template-columns: repeat(2, 1fr);'; break;
        case 'grid-3': gridCSS = 'grid-template-columns: repeat(3, 1fr);'; break;
        default: gridCSS = `grid-template-columns: repeat(${Math.min(blocks.length, 3)}, 1fr);`;
      }

      // Build block HTML
      const blockHTML = blocks.map((b, i) => {
        const span = b.span || 1;
        const block = b.block || {};
        const blockType = block.type;
        const delay = i * 0.15; // Stagger animations

        // Prevent infinite recursion
        let content = '';
        if (blockType === 'composite') {
          // Allow one level of nesting
          const innerBlocks = (block.blocks || []).map((ib, j) => {
            const innerBlock = ib.block || {};
            if (innerBlock.type === 'composite') {
              return `<div class="${id}-cell"><div style="padding:2rem;color:var(--text-muted,#888);font-style:italic;">Max nesting depth reached</div></div>`;
            }
            const innerRenderer = allTypes[innerBlock.type];
            return innerRenderer ? `<div class="${id}-cell">${innerRenderer(innerBlock)}</div>` : '';
          }).join('');
          content = `<div style="display:grid;${gridCSS}gap:${gap};height:100%;">${innerBlocks}</div>`;
        } else {
          const renderer = allTypes[blockType];
          content = renderer ? renderer(block) : `<div style="padding:2rem;color:var(--text-muted,#888);">Unknown type: ${blockType}</div>`;
        }

        return `<div class="${id}-cell" style="grid-column: span ${span}; animation-delay: ${delay}s;">${content}</div>`;
      }).join('');

      return `
        <style>
          .${id}-grid {
            display: grid;
            ${gridCSS}
            gap: ${gap};
            height: 100%;
            min-height: 100vh;
            padding: 2rem;
            box-sizing: border-box;
            align-items: stretch;
          }
          .${id}-cell {
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            animation: ${id}-fadeIn var(--sf-dur-normal, 0.6s) var(--sf-ease-standard, ease) both;
          }
          /* Neutralize children's full-screen assumptions */
          .${id}-cell > div,
          .${id}-cell > section {
            min-height: auto !important;
            height: 100% !important;
            max-height: 100%;
          }
          @keyframes ${id}-fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 768px) {
            .${id}-grid {
              grid-template-columns: 1fr !important;
            }
          }
        </style>
        <div class="${id}-grid">${blockHTML}</div>
      `;
    }

    /**
     * video: Inbäddad videofil med valfri undertext.
     * @param {string} s.src - filsökväg eller URL
     * @param {string} [s.poster] - stillbild före uppspelning
     * @param {string} [s.captions] - sökväg till .vtt (undertextspår)
     * @param {boolean} [s.loop]
     * @param {boolean} [s.muted]
     * @param {string} [s.caption] - bildtext under videon
     */
    function renderVideo(s) {
      const uid = 'vid-' + Math.random().toString(36).slice(2, 8);
      setTimeout(() => {
        const el = document.getElementById(uid);
        if (!el || el.closest('.sb-poster')) return;
        window.SlideForge.registerCleanup(() => { try { el.pause(); el.removeAttribute('src'); el.load(); } catch(e) {} });
      }, 0);
      const track = s.captions ? `<track kind="captions" src="${s.captions}" srclang="sv" label="Svenska" default>` : '';
      return `<div class="slide-video">
        <video id="${uid}" controls playsinline preload="metadata" style="max-width:100%;max-height:80vh;border-radius:12px;"
          ${s.poster ? `poster="${s.poster}"` : ''} ${s.loop ? 'loop' : ''} ${s.muted ? 'muted' : ''}>
          <source src="${s.src}">${track}
        </video>
        ${s.caption ? `<div class="vid-caption" style="margin-top:0.5rem;font-size:0.85rem;color:var(--text-muted);text-align:center;">${s.caption}</div>` : ''}
      </div>`;
    }

    /**
     * embed: Sandboxad inbäddning av simulation, verktyg eller extern sida.
     * @param {string} s.src - URL
     * @param {string} s.title - tillgänglig titel, obligatorisk
     * @param {string} [s.sandbox] - default "allow-scripts allow-same-origin"
     * @param {string} [s.aspectRatio] - default "16/9"
     * @param {boolean} [s.sync] - true om målet implementerar sfState-kontraktet
     */
    function renderEmbed(s) {
      const uid = 'emb-' + Math.random().toString(36).slice(2, 8);
      setTimeout(() => {
        const host = document.getElementById(uid);
        if (!host || host.closest('.sb-poster')) return;
        const f = document.createElement('iframe');
        f.src = s.src;
        f.title = s.title || 'Inbäddat innehåll';
        f.setAttribute('sandbox', s.sandbox || 'allow-scripts allow-same-origin');
        f.setAttribute('loading', 'lazy');
        f.style.cssText = 'width:100%;height:100%;border:0;border-radius:12px;';
        host.appendChild(f);
        window.SlideForge.registerCleanup(() => { try { f.src = 'about:blank'; f.remove(); } catch(e) {} });
      }, 0);
      return `<div class="slide-embed" style="width:100%;max-width:1100px;aspect-ratio:${s.aspectRatio || '16/9'}">
        <div class="emb-host" id="${uid}" style="width:100%;height:100%;"></div>
      </div>`;
    }

    /**
     * ask: Fritext- och skalafrågor med kontrollerad presentatörsutrullning.
     * @param {string} s.question - frågetext
     * @param {string} [s.mode] - "word" | "sentence" | "scale"
     * @param {string} [s.display] - "cloud" | "wall" | "bars"
     * @param {number} [s.maxLength] - max antal tecken
     * @param {boolean} [s.anonymous] - alltid anonymiserat aggregat
     */
    function renderAsk(s) {
      const uid = 'ask-' + Math.random().toString(36).slice(2, 8);
      const question = safeField(s.question, 'question') || 'Fråga';
      const mode = s.mode || 'sentence';
      const display = s.display || 'wall';
      const btnText = s.btnText || 'Visa sammanställning';

      setTimeout(() => {
        const host = document.getElementById(uid);
        if (!host || host.closest('.sb-poster')) return;

        const sendBtn = host.querySelector('.ask-send-btn');
        const showBtn = host.querySelector('.ask-show-btn');
        const resultBox = host.querySelector('.ask-results');

        if (sendBtn) {
          sendBtn.onclick = () => {
            if (typeof window.slideCastSend === 'function') {
              window.slideCastSend({
                type: 'ask_start',
                data: { id: s.id, question: s.question, mode: mode, maxLength: s.maxLength || 200 }
              });
              sendBtn.textContent = '✓ Skickat till deltagarna';
              sendBtn.style.background = 'var(--green, #22c55e)';
            }
          };
        }

        if (showBtn) {
          showBtn.onclick = () => {
            if (resultBox) resultBox.style.display = 'block';
            showBtn.style.display = 'none';
          };
        }
      }, 0);

      return `<div class="slide-ask" id="${uid}" style="width:100%;max-width:900px;text-align:center;padding:2rem;">
        <div style="font-size:0.75rem;letter-spacing:0.1em;color:var(--accent);text-transform:uppercase;margin-bottom:0.5rem;">💬 FRÅGA TILL PUBLIKEN</div>
        <h2 style="font-size:clamp(1.5rem, 3.5vw, 2.8rem);font-weight:800;margin-bottom:1.5rem;">${question}</h2>
        <div style="display:flex;gap:1rem;justify-content:center;margin-bottom:1.5rem;">
          <button class="ask-send-btn" style="padding:0.8rem 1.5rem;border-radius:999px;border:none;background:var(--accent);color:#fff;font-weight:700;cursor:pointer;min-height:44px;">
            Skicka till deltagarna
          </button>
          <button class="ask-show-btn" style="padding:0.8rem 1.5rem;border-radius:999px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-weight:600;cursor:pointer;min-height:44px;">
            Visa sammanställning
          </button>
        </div>
        <div class="ask-results" style="display:none;margin-top:1.5rem;text-align:left;background:var(--card-bg);padding:1.5rem;border-radius:14px;border:1px solid var(--border);">
          <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.8rem;">Sammanställning (${mode} / ${display}):</div>
          <div class="ask-results-content" style="font-size:1.1rem;line-height:1.6;">Inga svar har visats ännu.</div>
        </div>
      </div>`;
    }

    // ===== MONKEY-PATCH REGISTRY =====
    const allTypes = {
        'ask': renderAsk,
        'video': renderVideo,
        'embed': renderEmbed,
        'composite': renderComposite,
        'semantic-nebula': renderSemanticNebula,
        'word-cascade': renderWordCascade,
        'box-reveal': renderBoxReveal,
        'bullet-build': renderBulletBuild,
        'line-chart': renderLineChart,
        'comparison': renderComparison,
        'timeline-vertical': renderTimelineVertical,
        'progress-ring': renderProgressRing,
        'number-wall': renderNumberWall,
        'bar-race': renderBarRace,
        // Sprint 4
        'giant-text': renderGiantText,
        'callout': renderCallout,
        'section-divider': renderSectionDivider,
        'hero-image': renderHeroImage,
        'outro': renderOutro,
        'rewrite-progression': renderRewriteProgression,
        'quote': renderQuote,
        // Sprint 5
        'ai-conversation': renderAiConversation,
        'before-after': renderBeforeAfter,
        'prompt-reveal': renderPromptReveal,
        'pitfall': renderPitfall,
        // Sprint 6
        'stat-compare': renderStatCompare,
        'voice-collage': renderVoiceCollage,
        'portrait-quote': renderPortraitQuote,
        'reflection': renderReflection,
        // Sprint 7+8+Bonus
        'collage': renderCollage,
        'process-chain': renderProcessChain,
        'acronym-list': renderAcronymList,
        'map-pins': renderMapPins,
        'mindmap': renderMindmap,
        'map-journey': renderMapJourney,
        'mindmap-tree': renderMindmapTree,
        'map-progression': renderMapProgression,
        'warning-pulse': renderWarningPulse,
        'token-spinner': renderTokenSpinner,
        // Signature
        'letter-morph': renderLetterMorph
    };

    function registerTypes() {
        if (typeof window.slideTypeRegistry === 'object') {
            Object.assign(window.slideTypeRegistry, allTypes);
            console.log('[ComponentForge] Registered:', Object.keys(allTypes).join(', '));
        } else {
            setTimeout(registerTypes, 100);
        }
    }

    // Also patch watch.html renderSlideContent if in audience mode
    function patchWatchRenderer() {
        if (typeof window.renderSlideContent === 'function') {
            const original = window.renderSlideContent;
            window.renderSlideContent = function(data) {
                const s = data.slide || data;
                if (allTypes[s.type]) return allTypes[s.type](s);
                return original.apply(this, arguments);
            };
        }
    }

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            registerTypes();
            patchWatchRenderer();
        });
    } else {
        registerTypes();
        patchWatchRenderer();
    }

    // Expose for external use
    window.__componentForge = allTypes;
})();
