/**
 * SlideForge Exporter — Åhörarkopia & Lektionslogg v1.0
 */
(function(exports) {
    'use strict';

    function generateAudienceCopy(slidesData, meta) {
        const title = (meta && meta.title) ? meta.title : 'Presentation';
        const subtitle = (meta && meta.subtitle) ? meta.subtitle : '';

        const slidesHtml = (slidesData || []).map((s, idx) => {
            if (s.notes_private) return ''; // hoppa över helt privata slides
            let body = '';
            if (s.title) body += `<h3 style="margin-bottom:0.5rem;color:#1e293b;">${s.title}</h3>`;
            if (s.text) body += `<p style="margin-bottom:0.5rem;color:#475569;">${s.text}</p>`;
            if (Array.isArray(s.items)) {
                body += `<ul style="margin-left:1.2rem;color:#334155;">${s.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
            }
            if (Array.isArray(s.boxes)) {
                body += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.8rem;margin-top:0.8rem;">
                    ${s.boxes.map(b => `<div style="background:#f1f5f9;padding:0.8rem;border-radius:8px;"><strong>${b.title}</strong><br><span style="font-size:0.9rem;">${b.text}</span></div>`).join('')}
                </div>`;
            }

            return `
                <div style="page-break-inside:avoid;margin-bottom:2rem;padding:1.5rem;border:1px solid #e2e8f0;border-radius:10px;background:#fff;">
                    <div style="font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:0.5rem;">Slide ${idx + 1}</div>
                    ${body}
                </div>
            `;
        }).join('');

        return `<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <title>Åhörarkopia — ${title}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #0f172a; line-height: 1.5; }
        header { text-align: center; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 2px solid #e2e8f0; }
        h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        p.sub { font-size: 1.1rem; color: #64748b; }
        @media print { body { max-width: 100%; margin: 0; } }
    </style>
</head>
<body>
    <header>
        <h1>${title}</h1>
        ${subtitle ? `<p class="sub">${subtitle}</p>` : ''}
        <p style="font-size:0.85rem;color:#94a3b8;margin-top:0.5rem;">Åhörarkopia genererad via SlideForge</p>
    </header>
    <main>${slidesHtml}</main>
</body>
</html>`;
    }

    function generateLessonLog(slidesData, meta, questionLog) {
        const title = (meta && meta.title) ? meta.title : 'Lektion';
        const totalDuration = (slidesData || []).reduce((acc, s) => acc + (s.duration_min || 0), 0);

        const slidesHtml = (slidesData || []).map((s, idx) => `
            <tr>
                <td style="padding:0.6rem;border-bottom:1px solid #e2e8f0;font-weight:700;">#${idx + 1} (${s.id || '-'})</td>
                <td style="padding:0.6rem;border-bottom:1px solid #e2e8f0;">${s.title || s.type}</td>
                <td style="padding:0.6rem;border-bottom:1px solid #e2e8f0;">${s.duration_min ? s.duration_min + ' min' : '-'}</td>
                <td style="padding:0.6rem;border-bottom:1px solid #e2e8f0;">${s.notes || '<i>Inga anteckningar</i>'}</td>
            </tr>
        `).join('');

        return `<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <title>Lektionslogg — ${title}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
        th { background: #f8fafc; text-align: left; padding: 0.6rem; border-bottom: 2px solid #cbd5e1; }
    </style>
</head>
<body>
    <h1>📋 Lektionslogg — ${title}</h1>
    <p>Beräknad totaltid: <strong>${totalDuration} minuter</strong></p>
    <table>
        <thead>
            <tr><th>Slide</th><th>Titel / Typ</th><th>Tidsbudget</th><th>Talaranteckningar</th></tr>
        </thead>
        <tbody>${slidesHtml}</tbody>
    </table>
</body>
</html>`;
    }

    exports.generateAudienceCopy = generateAudienceCopy;
    exports.generateLessonLog = generateLessonLog;

})(typeof exports !== 'undefined' ? exports : (window.SlideForgeExporter = {}));
