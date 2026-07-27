#!/usr/bin/env node
/**
 * registry-sync.js — SlideForge Type Registry Sync
 *
 * Parsar component-forge.js, extraherar alla slide-typer med JSDoc-metadata,
 * genererar type_registry.json + SLIDEFORGE_COMPONENTS.md, och validerar slide_bank.json.
 *
 * Kör: node modules/registry-sync/registry-sync.js
 * Inga externa dependencies — bara fs och path.
 */

const fs = require('fs');
const path = require('path');

// ── Paths ─────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..', '..');
const FORGE_PATH = path.join(ROOT, 'modules', 'component-forge', 'component-forge.js');
const REGISTRY_PATH = path.join(__dirname, 'type_registry.json');
const COMPONENTS_MD_PATH = path.join(ROOT, 'SLIDEFORGE_COMPONENTS.md');
const SLIDE_BANK_PATH = path.join(ROOT, 'slide_bank.json');

// ── Category mapping ──────────────────────────────────────────
// Hårdkodad mapping baserad på typnamn → kategori
const CATEGORY_MAP = {
  // Text & Narrative
  'word-cascade': 'text',
  'giant-text': 'text',
  'letter-morph': 'text',
  'rewrite-progression': 'text',
  'quote': 'text',
  'bullet-build': 'text',
  'acronym-list': 'text',
  'token-spinner': 'text',

  // Visual & Media
  'hero-image': 'visual',
  'collage': 'visual',
  'map-pins': 'visual',
  'map-journey': 'visual',
  'map-progression': 'visual',
  'portrait-quote': 'visual',
  'semantic-nebula': 'visual',

  // Data & Evidence
  'line-chart': 'data',
  'bar-race': 'data',
  'progress-ring': 'data',
  'number-wall': 'data',
  'stat-compare': 'data',
  'timeline-vertical': 'data',

  // Interactive & Dialogue
  'box-reveal': 'interactive',
  'ai-conversation': 'interactive',
  'before-after': 'interactive',
  'prompt-reveal': 'interactive',
  'pitfall': 'interactive',
  'comparison': 'interactive',
  'voice-collage': 'interactive',
  'reflection': 'interactive',
  'mindmap': 'interactive',
  'mindmap-tree': 'interactive',
  'warning-pulse': 'interactive',

  // Layout & Structure
  'section-divider': 'layout',
  'outro': 'layout',
  'callout': 'layout',
  'process-chain': 'layout',
};

const CATEGORY_LABELS = {
  text: '📝 Text & Narrativ',
  visual: '🖼️ Visuellt & Media',
  data: '📊 Data & Evidens',
  interactive: '🎯 Interaktivt & Dialog',
  layout: '🏗️ Layout & Struktur',
};

// ── Step 1: Parse component-forge.js ──────────────────────────

function parseComponentForge() {
  console.log(`\n📖 Läser ${path.relative(ROOT, FORGE_PATH)} ...`);
  const source = fs.readFileSync(FORGE_PATH, 'utf-8');

  // 1a. Extrahera allTypes-objektet
  const allTypesMatch = source.match(/const\s+allTypes\s*=\s*\{([\s\S]*?)\};/);
  if (!allTypesMatch) {
    console.error('❌ Kunde inte hitta allTypes-objektet i component-forge.js');
    process.exit(1);
  }

  const allTypesBlock = allTypesMatch[1];

  // Parsa varje rad: 'type-name': renderFunctionName
  const entryRegex = /'([^']+)'\s*:\s*(\w+)/g;
  const entries = [];
  let m;
  while ((m = entryRegex.exec(allTypesBlock)) !== null) {
    entries.push({ type: m[1], renderer: m[2] });
  }

  console.log(`   ✅ Hittade ${entries.length} typregistreringar i allTypes`);

  // 1b. Extrahera JSDoc-kommentarer för varje renderer
  // Strategi: hitta funktionsraden, sedan sök bakåt för närmaste /** ... */
  const sourceLines = source.split('\n');

  const types = entries.map(entry => {
    const result = {
      type: entry.type,
      renderer: entry.renderer,
      description: '',
      props: [],
      category: CATEGORY_MAP[entry.type] || 'interactive',
    };

    // Hitta raden med function renderXxx(
    const funcPattern = new RegExp('function\\s+' + entry.renderer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(');
    let funcLineIdx = -1;
    for (let i = 0; i < sourceLines.length; i++) {
      if (funcPattern.test(sourceLines[i])) {
        funcLineIdx = i;
        break;
      }
    }

    if (funcLineIdx > 0) {
      // Sök bakåt från funktionsraden för att hitta närmaste */ 
      let commentEndIdx = -1;
      for (let i = funcLineIdx - 1; i >= 0; i--) {
        const trimmed = sourceLines[i].trim();
        if (trimmed === '' || trimmed.startsWith('//')) continue; // hoppa whitespace/enradskommentarer
        if (trimmed.endsWith('*/') || trimmed === '*/') {
          commentEndIdx = i;
          break;
        }
        break; // Icke-tom, icke-kommentar-rad = ingen JSDoc
      }

      if (commentEndIdx >= 0) {
        // Sök bakåt för /** starten
        let commentStartIdx = -1;
        for (let i = commentEndIdx; i >= 0; i--) {
          if (sourceLines[i].includes('/**')) {
            commentStartIdx = i;
            break;
          }
        }

        if (commentStartIdx >= 0) {
          const commentBlock = sourceLines.slice(commentStartIdx, commentEndIdx + 1).join('\n');
          // Extrahera innehållet inuti /** ... */
          const innerMatch = commentBlock.match(/\/\*\*([\s\S]*?)\*\//);
          if (innerMatch) {
            const comment = innerMatch[1];

      // Rensa kommentarens rader
      const lines = comment
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line.length > 0);

      // Första raden (eller första icke-@param-raden) = beskrivning
      const descLines = [];
      const propLines = [];
      let inProps = false;

      for (const line of lines) {
        if (line.startsWith('@param') || line.startsWith('Props:') || line.startsWith('JSON:')) {
          inProps = true;
        }

        if (inProps) {
          propLines.push(line);
        } else {
          descLines.push(line);
        }
      }

      // Beskrivning: ta bort typnamn-prefix om det finns (t.ex. "word-cascade: Words that...")
      let desc = descLines.join(' ').trim();
      const typePrefix = entry.type + ':';
      const typePrefixDash = entry.type + ' —';
      const typePrefixMinus = entry.type + ' -';
      if (desc.startsWith(typePrefix)) {
        desc = desc.slice(typePrefix.length).trim();
      } else if (desc.startsWith(typePrefixDash)) {
        desc = desc.slice(typePrefixDash.length).trim();
      } else if (desc.startsWith(typePrefixMinus)) {
        desc = desc.slice(typePrefixMinus.length).trim();
      }
      result.description = desc;

      // Parsa props — tre format:
      // 1. @param {Type} s.propName - description
      // 2. Props: prop1, prop2, ...
      // 3. JSON: { type: "...", prop1: ..., prop2: ... }
      const propsText = propLines.join(' ');

      // Format 1: @param
      const paramRegex = /@param\s*\{([^}]*)\}\s*s\.(\w+)\s*(?:-\s*(.*))?/g;
      let pm;
      while ((pm = paramRegex.exec(propsText)) !== null) {
        result.props.push({
          name: pm[2],
          type: pm[1],
          description: (pm[3] || '').trim(),
        });
      }

      // Format 2: Props:
      if (result.props.length === 0) {
        const propsMatch = propsText.match(/Props:\s*(.*?)(?:$)/);
        if (propsMatch) {
          const propsStr = propsMatch[1].trim();
          // Parsa kommaseparerade props, hantera () och [] som grupper
          const propTokens = splitPropsString(propsStr);
          for (const token of propTokens) {
            const prop = parsePropsToken(token);
            if (prop) result.props.push(prop);
          }
        }
      }

      // Format 3: JSON:
      if (result.props.length === 0) {
        const jsonMatch = propsText.match(/JSON:\s*\{([^}]*)\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[1];
          // Extrahera key: value-par (hoppa över type:)
          const kvRegex = /(\w+)\s*:\s*(?:"[^"]*"|[^,}]+)/g;
          let kv;
          while ((kv = kvRegex.exec(jsonStr)) !== null) {
            const propName = kv[0].split(':')[0].trim();
            if (propName === 'type') continue;
            const valPart = kv[0].split(':').slice(1).join(':').trim().replace(/^"|"$/g, '');
            result.props.push({
              name: propName,
              type: inferType(valPart),
              description: '',
            });
          }
        }
      }
          } // if (innerMatch)
        } // if (commentStartIdx)
      } // if (commentEndIdx)
    } // if (funcLineIdx)

    // Fallback om ingen JSDoc hittades
    if (!result.description) {
      result.description = `Renderer for ${entry.type}`;
    }

    return result;
  });

  return types;
}

/**
 * Splittar Props:-strängar som: "title, messages[] ({ role, text }), userLabel"
 * vid komman som inte är inuti parenteser/brackets.
 */
function splitPropsString(str) {
  const tokens = [];
  let depth = 0;
  let current = '';
  for (const ch of str) {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      tokens.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) tokens.push(current.trim());
  return tokens;
}

/**
 * Parsa en enskild prop-token som:
 *   "title"
 *   "messages[] ({ role, text })"
 *   "variant (\"left\"|\"center\")"
 *   "progress { current, total }"
 */
function parsePropsToken(token) {
  if (!token) return null;
  // Ta bort trailing kommentar
  token = token.replace(/\s*\/\/.*$/, '').trim();
  if (!token) return null;

  // Plocka namn, typ-hints i parenteser, och brackets
  const match = token.match(/^(\w+)(\[\])?\s*(.*)?$/);
  if (!match) return null;

  const name = match[1];
  const isArray = !!match[2];
  const rest = (match[3] || '').trim();

  let type = isArray ? 'Array' : 'string';
  let description = '';

  if (rest) {
    // Hantera (\"value1\"|\"value2\") — enum-liknande
    const enumMatch = rest.match(/^\(([^)]+)\)$/);
    if (enumMatch) {
      type = 'string';
      description = enumMatch[1].replace(/\\"/g, '"').replace(/"/g, '').trim();
    }
    // Hantera ({ ... }) — objekt-array
    else if (rest.startsWith('(') && rest.endsWith(')')) {
      type = isArray ? 'Array<Object>' : 'Object';
      description = rest;
    }
    // Hantera { ... } — objekt
    else if (rest.startsWith('{') && rest.endsWith('}')) {
      type = 'Object';
      description = rest;
    }
    // Hantera (bool) eller (string)
    else if (rest.match(/^\((\w+)\)$/)) {
      type = rest.replace(/[()]/g, '');
    }
    // Allt annat = beskrivning
    else {
      description = rest;
    }
  }

  return { name, type, description };
}

function inferType(val) {
  if (val.startsWith('"') || val.startsWith("'")) return 'string';
  if (val.startsWith('[')) return 'Array';
  if (val.startsWith('{')) return 'Object';
  if (val === 'true' || val === 'false') return 'boolean';
  if (!isNaN(Number(val))) return 'number';
  return 'string';
}

// ── Step 2: Generate type_registry.json ───────────────────────

function generateRegistry(types) {
  const registry = {
    generated: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    source: 'component-forge.js',
    types: types.map(t => ({
      type: t.type,
      renderer: t.renderer,
      description: t.description,
      category: t.category,
      props: t.props,
    })),
  };

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
  console.log(`   ✅ Skrev ${path.relative(ROOT, REGISTRY_PATH)} (${types.length} typer)`);
  return registry;
}

// ── Step 3: Regenerate SLIDEFORGE_COMPONENTS.md ───────────────

function generateComponentsMd(types) {
  const grouped = {};
  for (const t of types) {
    const cat = t.category || 'interactive';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  }

  // Sortera typer inom varje kategori
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => a.type.localeCompare(b.type));
  }

  const categoryOrder = ['text', 'visual', 'data', 'interactive', 'layout'];

  let md = '';
  md += '# SlideForge: Registrerade Komponenttyper\n\n';
  md += '> ⚠️ **AUTOGENERERAD** — redigera inte manuellt. Kör `node modules/registry-sync/registry-sync.js`\n\n';
  md += `Totalt **${types.length} unika slidetyper** extraherade från \`component-forge.js\`.\n\n`;
  md += `*Genererad: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC*\n\n`;
  md += '---\n\n';

  for (const cat of categoryOrder) {
    const catTypes = grouped[cat];
    if (!catTypes || catTypes.length === 0) continue;

    const label = CATEGORY_LABELS[cat] || cat;
    md += `## ${label} (${catTypes.length})\n\n`;

    for (const t of catTypes) {
      md += `### \`${t.type}\`\n`;
      md += `**Renderer:** \`${t.renderer}\`\n\n`;
      if (t.description) {
        md += `${t.description}\n\n`;
      }
      if (t.props && t.props.length > 0) {
        md += '| Prop | Typ | Beskrivning |\n';
        md += '|------|-----|-------------|\n';
        for (const p of t.props) {
          md += `| \`${p.name}\` | \`${p.type}\` | ${p.description || '—'} |\n`;
        }
        md += '\n';
      } else {
        md += '*Inga dokumenterade props.*\n\n';
      }
    }
  }

  md += '---\n\n';
  md += `*Genererad automatiskt av \`registry-sync.js\` den ${new Date().toISOString().slice(0, 10)}.*\n`;

  fs.writeFileSync(COMPONENTS_MD_PATH, md, 'utf-8');
  console.log(`   ✅ Skrev ${path.relative(ROOT, COMPONENTS_MD_PATH)}`);
}

// ── Step 4: Validate & update slide_bank.json ─────────────────

function validateSlideBank(types) {
  console.log(`\n🔍 Validerar ${path.relative(ROOT, SLIDE_BANK_PATH)} ...`);

  if (!fs.existsSync(SLIDE_BANK_PATH)) {
    console.log('   ⚠️  slide_bank.json finns inte — hoppar validering');
    return { unknownTypes: [], updated: false };
  }

  const bank = JSON.parse(fs.readFileSync(SLIDE_BANK_PATH, 'utf-8'));
  const registeredTypes = new Set(types.map(t => t.type));
  const unknownTypes = [];

  // Kolla varje slide
  for (const slide of (bank.slides || [])) {
    const ct = slide.component_type;
    if (ct && !registeredTypes.has(ct)) {
      unknownTypes.push({ id: slide.id, component_type: ct });
    }
  }

  // Uppdatera meta
  const sortedTypes = [...registeredTypes].sort();
  const today = new Date().toISOString().slice(0, 10);

  let changed = false;
  if (!bank.meta) bank.meta = {};

  const currentTypes = bank.meta.registered_component_types || [];
  if (JSON.stringify(currentTypes.slice().sort()) !== JSON.stringify(sortedTypes)) {
    bank.meta.registered_component_types = sortedTypes;
    changed = true;
  }

  if (bank.meta.last_updated !== today) {
    bank.meta.last_updated = today;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(SLIDE_BANK_PATH, JSON.stringify(bank, null, 2) + '\n', 'utf-8');
    console.log(`   ✅ Uppdaterade slide_bank.json (meta.registered_component_types → ${sortedTypes.length} typer, datum → ${today})`);
  } else {
    console.log('   ℹ️  slide_bank.json var redan uppdaterad');
  }

  return { unknownTypes, updated: changed };
}

// ── Step 5: Rapport ───────────────────────────────────────────

function printReport(types, validation) {
  console.log('\n' + '═'.repeat(60));
  console.log('  📋 REGISTRY SYNC — RAPPORT');
  console.log('═'.repeat(60));
  console.log(`  Typer hittade:         ${types.length}`);

  // Kategorier
  const catCount = {};
  for (const t of types) {
    catCount[t.category] = (catCount[t.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(catCount).sort()) {
    const label = CATEGORY_LABELS[cat] || cat;
    console.log(`    ${label}: ${count}`);
  }

  if (validation.unknownTypes.length > 0) {
    console.log(`\n  ⚠️  Slides med OKÄND typ (${validation.unknownTypes.length}):`);
    for (const u of validation.unknownTypes) {
      console.log(`    • ${u.id} → "${u.component_type}"`);
    }
  } else {
    console.log('\n  ✅ Alla slides i slide_bank.json har giltiga typer');
  }

  console.log('\n  Uppdaterade filer:');
  console.log(`    • ${path.relative(ROOT, REGISTRY_PATH)}`);
  console.log(`    • ${path.relative(ROOT, COMPONENTS_MD_PATH)}`);
  if (validation.updated) {
    console.log(`    • ${path.relative(ROOT, SLIDE_BANK_PATH)}`);
  }

  console.log('═'.repeat(60) + '\n');
}

// ── Main ──────────────────────────────────────────────────────

function main() {
  console.log('🔄 SlideForge Registry Sync');
  console.log(`   Root: ${ROOT}`);

  if (!fs.existsSync(FORGE_PATH)) {
    console.error(`❌ Hittar inte ${FORGE_PATH}`);
    process.exit(1);
  }

  const types = parseComponentForge();
  generateRegistry(types);
  generateComponentsMd(types);
  const validation = validateSlideBank(types);
  printReport(types, validation);
}

main();
