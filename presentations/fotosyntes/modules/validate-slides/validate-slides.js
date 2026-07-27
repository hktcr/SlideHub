/**
 * SlideForge Schemavaliderare — validate-slides.js v1.0
 * 
 * Validerar slides.json mot komponentregistret och strukturregler.
 * Kan köras fristående via Node.js eller importeras.
 * 
 * Usage CLI:
 *   node modules/validate-slides/validate-slides.js [path/to/slides.json]
 */

const fs = require('fs');
const path = require('path');

function validateSlidesFile(filePath) {
    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
        return { valid: false, errors: [`Filen saknas: ${filePath}`], warnings: [] };
    }

    try {
        const raw = fs.readFileSync(absPath, 'utf8');
        const data = JSON.parse(raw);
        return validateSlidesData(data);
    } catch (e) {
        return { valid: false, errors: [`JSON parse-fel: ${e.message}`], warnings: [] };
    }
}

function validateSlidesData(data) {
    const errors = [];
    const warnings = [];

    if (!data || typeof data !== 'object') {
        return { valid: false, errors: ['Indata är inte ett giltigt objekt'], warnings };
    }

    if (!Array.isArray(data.slides)) {
        errors.push('Rotobjektet saknar obligatorisk "slides"-array.');
        return { valid: false, errors, warnings };
    }

    // Ladda kända typer från type_registry.json om tillgänglig
    let knownTypes = null;
    const regPath = path.join(__dirname, '..', 'registry-sync', 'type_registry.json');
    if (fs.existsSync(regPath)) {
        try {
            const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
            knownTypes = new Set(Object.keys(reg));
        } catch (e) {}
    }

    const slideIds = new Set();
    const kebabRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    data.slides.forEach((s, idx) => {
        const pos = `Slide #${idx + 1}`;
        if (!s.id) {
            errors.push(`${pos} saknar "id".`);
        } else {
            if (typeof s.id !== 'string' || !kebabRegex.test(s.id)) {
                warnings.push(`${pos} (id: "${s.id}") bör använda kebab-case.`);
            }
            if (slideIds.has(s.id)) {
                errors.push(`${pos} har duplicerat id: "${s.id}".`);
            }
            slideIds.add(s.id);
        }

        if (!s.type) {
            errors.push(`${pos} saknar "type".`);
        } else if (knownTypes && !knownTypes.has(s.type)) {
            warnings.push(`${pos} använder okänd typ "${s.type}".`);
        }

        // Typspecifika krav
        if (s.type === 'video' && !s.src) {
            errors.push(`${pos} ("video") saknar "src".`);
        }
        if (s.type === 'embed') {
            if (!s.src) errors.push(`${pos} ("embed") saknar "src".`);
            if (!s.title) warnings.push(`${pos} ("embed") saknar "title" (viktigt för tillgänglighet).`);
        }
        if (s.type === 'ask' && !s.question) {
            errors.push(`${pos} ("ask") saknar "question".`);
        }
    });

    // Board-validering om tavlan finns
    if (data.board) {
        if (!Array.isArray(data.board.sections)) {
            errors.push('Tavlan (board) saknar "sections"-array.');
        } else {
            const sectionIds = new Set();
            data.board.sections.forEach((sec, sIdx) => {
                const sPos = `Board Section #${sIdx + 1}`;
                if (!sec.id) errors.push(`${sPos} saknar "id".`);
                else {
                    if (sectionIds.has(sec.id)) errors.push(`${sPos} har duplicerat section id: "${sec.id}".`);
                    sectionIds.add(sec.id);
                }
                if (!sec.title) errors.push(`${sPos} saknar "title".`);
                if (!Array.isArray(sec.slides)) errors.push(`${sPos} saknar "slides"-array.`);
                else {
                    sec.slides.forEach(refId => {
                        if (!slideIds.has(refId)) {
                            errors.push(`${sPos} refererar till obefintlig slide id "${refId}".`);
                        }
                    });
                }
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

// CLI-exekvering
if (require.main === module) {
    const targetFile = process.argv[2] || path.join(__dirname, '..', '..', 'Deployments', 'slidecraft-showcase', 'slides.json');
    console.log(`\n🔍 Validerar slides.json: ${targetFile}`);
    const res = validateSlidesFile(targetFile);

    if (res.valid) {
        console.log(`✅ Validering GODKÄND (${res.warnings.length} varningar)`);
    } else {
        console.log(`❌ Validering MISSLYCKADES (${res.errors.length} fel, ${res.warnings.length} varningar)`);
    }

    if (res.errors.length > 0) {
        console.log('\n🔴 FEL:');
        res.errors.forEach(e => console.log(`  • ${e}`));
    }
    if (res.warnings.length > 0) {
        console.log('\n🟡 VARNINGAR:');
        res.warnings.forEach(w => console.log(`  • ${w}`));
    }
    process.exit(res.valid ? 0 : 1);
}

module.exports = { validateSlidesFile, validateSlidesData };
