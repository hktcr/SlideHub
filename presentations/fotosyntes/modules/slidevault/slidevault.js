#!/usr/bin/env node

/**
 * SlideVault — SlideCraft Presentation Index Generator v1.0
 * 
 * Scans the GAIA ecosystem for all slides.json manifests and standalone
 * SlideCraft HTML files, generating a searchable slide_index.json catalog.
 * 
 * Usage:
 *   node slidevault.js [--gaia-root /path/to/GAIA]
 * 
 * Output:
 *   SlideCraft/modules/slidevault/slide_index.json
 */

const fs = require('fs');
const path = require('path');

// Resolve GAIA root
const args = process.argv.slice(2);
let gaiaRoot = args.includes('--gaia-root') 
    ? args[args.indexOf('--gaia-root') + 1]
    : path.resolve(__dirname, '..', '..', '..');

console.log(`🗃️  SlideVault v1.0 — Scanning ${gaiaRoot}`);

const SKIP_DIRS = ['node_modules', '.git', '.obsidian', '.gemini', '__pycache__'];

/**
 * Recursively find files matching a predicate
 */
function findFiles(dir, predicate, results = []) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
        return results;
    }
    
    for (const entry of entries) {
        if (SKIP_DIRS.includes(entry.name)) continue;
        
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findFiles(fullPath, predicate, results);
        } else if (predicate(entry.name)) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Extract metadata from a slides.json manifest
 */
function processManifest(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        const meta = data.meta || {};
        const slides = data.slides || [];
        
        const relPath = path.relative(gaiaRoot, filePath);
        const dir = path.dirname(relPath);
        
        return {
            source: relPath,
            directory: dir,
            type: 'json-manifest',
            project: meta.project || meta.title || path.basename(dir),
            event: meta.event || null,
            date: meta.date || null,
            slideCount: slides.length,
            slides: slides.map((s, i) => ({
                index: i,
                id: s.id || `slide-${i}`,
                type: s.type || 'unknown',
                title: extractTitle(s),
                hasBackground: !!s.background,
                hasSources: !!(s.sources && s.sources.length > 0),
                tags: inferTags(s)
            }))
        };
    } catch (e) {
        console.warn(`  ⚠️ Failed to parse: ${filePath} (${e.message})`);
        return null;
    }
}

/**
 * Extract a human-readable title from a slide object
 */
function extractTitle(slide) {
    if (slide.title) return slide.title;
    if (slide.name) return slide.name;
    if (slide.value) return `${slide.value} ${slide.label || ''}`.trim();
    if (slide.text) {
        const clean = slide.text.replace(/\*/g, '').substring(0, 60);
        return clean + (slide.text.length > 60 ? '...' : '');
    }
    if (slide.author) return slide.author;
    return null;
}

/**
 * Infer searchable tags from slide content
 */
function inferTags(slide) {
    const tags = new Set();
    tags.add(slide.type);
    
    // Interactive patterns
    if (slide.type === 'token-demo') tags.add('interactive');
    if (slide.type === 'quad-flip') tags.add('interactive');
    if (slide.type === 'step-slide') tags.add('interactive');
    if (slide.type === 'knowledge_check') tags.add('quiz');
    if (slide.type === 'incidents') tags.add('ai-safety');
    if (slide.type === 'prompt-demo') tags.add('ai');
    
    // Content-based tags
    const text = JSON.stringify(slide).toLowerCase();
    if (text.includes('elevhälsa') || text.includes('pupil')) tags.add('elevhälsa');
    if (text.includes('gdpr') || text.includes('eu ai act')) tags.add('regulatory');
    if (text.includes('oecd') || text.includes('pisa')) tags.add('statistics');
    if (text.includes('biolog') || text.includes('ekolog')) tags.add('biology');
    if (text.includes('fotosyntes') || text.includes('cell')) tags.add('biology');
    if (text.includes('mentimeter')) tags.add('quiz');
    
    return [...tags];
}

/**
 * Extract basic info from standalone HTML slide files
 */
function processHTMLFile(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const relPath = path.relative(gaiaRoot, filePath);
        
        // Extract <title>
        const titleMatch = raw.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.html');
        
        // Count slide elements
        const slideCount = (raw.match(/class="slide[^"]*"/gi) || []).length || 1;
        
        // Detect type
        const isTypewriter = raw.includes('typewriter') || raw.includes('typeNext');
        const isDrillDeck = raw.includes('drill') || raw.includes('flashcard');
        const isShell = raw.includes('slides.json') || raw.includes('slideTypeRegistry');
        
        if (isShell) return null; // Skip shell.html files (handled via manifest)
        
        return {
            source: relPath,
            directory: path.dirname(relPath),
            type: 'standalone-html',
            project: path.basename(path.dirname(relPath)) || path.basename(filePath, '.html'),
            title: title,
            slideCount: slideCount,
            patterns: [
                isTypewriter ? 'typewriter' : null,
                isDrillDeck ? 'drill-deck' : null
            ].filter(Boolean)
        };
    } catch (e) {
        return null;
    }
}

// ===== MAIN EXECUTION =====

// Find all slides.json files
const manifests = findFiles(gaiaRoot, name => name === 'slides.json');
console.log(`  📄 Found ${manifests.length} slides.json manifests`);

// Find standalone SlideCraft HTML files in relevant directories
const htmlFiles = findFiles(gaiaRoot, name => name.endsWith('.html'))
    .filter(f => {
        const rel = path.relative(gaiaRoot, f);
        return rel.includes('SlideCraft') || rel.includes('Deployments');
    });
console.log(`  🌐 Found ${htmlFiles.length} HTML files in SlideCraft/Deployments`);

// Process all sources
const presentations = [];
let totalSlides = 0;

for (const m of manifests) {
    const result = processManifest(m);
    if (result) {
        presentations.push(result);
        totalSlides += result.slideCount;
        console.log(`  ✅ ${result.project} (${result.slideCount} slides)`);
    }
}

const standaloneSlides = [];
for (const h of htmlFiles) {
    const result = processHTMLFile(h);
    if (result) {
        standaloneSlides.push(result);
        totalSlides += result.slideCount;
    }
}
console.log(`  📦 ${standaloneSlides.length} standalone HTML presentations`);

// Generate index
const index = {
    meta: {
        generated: new Date().toISOString(),
        gaiaRoot: gaiaRoot,
        version: '1.0'
    },
    stats: {
        totalPresentations: presentations.length + standaloneSlides.length,
        totalSlides: totalSlides,
        manifestPresentations: presentations.length,
        standalonePresentations: standaloneSlides.length
    },
    presentations: presentations,
    standaloneSlides: standaloneSlides,
    // Flat index for quick search
    slideIndex: presentations.flatMap(p => 
        p.slides.map(s => ({
            presentation: p.project,
            presentationDate: p.date,
            source: p.source,
            ...s
        }))
    )
};

// Write output
const outputDir = path.join(gaiaRoot, 'SlideCraft', 'modules', 'slidevault');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'slide_index.json');
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2), 'utf8');

console.log(`\n🗃️  SlideVault index generated:`);
console.log(`   ${outputPath}`);
console.log(`   ${index.stats.totalPresentations} presentations, ${index.stats.totalSlides} total slides`);
