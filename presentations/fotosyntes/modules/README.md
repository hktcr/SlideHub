# SlideCraft Modules

Oberoende utbyggnadsmoduler för SlideCraft-ekosystemet. Varje modul fungerar som en drop-in-komponent — grundpresentationen (`shell.html` + `slides.json`) förblir alltid funktionell utan dem.

## 📦 Moduler

### 🎨 SkinSwitch (P2) — Visuell identitetsväxlare
Byt mellan visuella teman (Dark/Light/Biology/Municipal/Mission) med en knapptryckning.

**Aktivering:** Lägg till i `shell.html`:
```html
<script src="modules/skinswitch/skinswitch.js"></script>
```

**Tangentbord:** `T` öppnar/stänger temapanelen.

**Filer:**
- `skinswitch/skinswitch.js` — Drop-in modul (auto-init)
- `skinswitch/themes.json` — Temaladdning (5 inbyggda teman)

---

### 📡 SlideCast (P1) — Synkron publikvy
Publiken ser dina slides i realtid via en webbsida. Inkluderar frågekanal, pollstöd, och DrillSync-quiz.

**Arkitektur:**
```
Presentatör (shell.html)  ←→  Relay Server  ←→  Publik (watch.html)
```

**Komponenter:**
- `slidecast/slidecast-presenter.js` — Drop-in presenter-hook
- `slidecast/watch.html` — Publikens webbsida (stöd för slides, polls, quiz)
- `slidecast/relay-server.js` — Node.js relay (kräver `ws`)

**Snabbstart:**
```bash
# 1. Installera dependency
cd SlideCraft/modules/slidecast
npm install ws

# 2. Starta relay
node relay-server.js

# 3. Öppna presenter med relay-parameter
# shell.html?relay=http://localhost:8787&room=default

# 4. Dela watch-URL med publiken (QR-kod)
# watch.html?relay=http://localhost:8787&room=default&title=Min+Presentation
```

**Demo-läge (utan server):**
```
watch.html?demo=true
```

---

### 📊 PulseCheck (P4) — Realtids-poll
Ny slide-typ `pulse` för live-omröstning direkt i presentationen.

**Aktivering:**
```html
<script src="modules/pulsecheck/pulsecheck.js"></script>
```

**slides.json-format:**
```json
{
    "id": "poll-ai-trygg",
    "type": "pulse",
    "question": "Hur trygga känner ni er med AI i elevhälsoarbetet?",
    "options": ["Mycket trygga", "Ganska trygga", "Osäkra", "Otrygga"],
    "showResults": true,
    "timer": 30
}
```

**Funktioner:**
- Animerade resultatstaplar med procent
- Countdown-timer (SVG-ring)
- Highlight av ledande alternativ
- Live-röster via SlideCast (eller lokal klickröstning)

**Filer:**
- `pulsecheck/pulsecheck.js` — Drop-in modul (registrerar slide-typ)

---

### 🧠 DrillSync (P5) — Synkroniserad quiz
Ny slide-typ `drill-sync` för interaktiva kunskapskontroller med hela publiken.

**Aktivering:**
```html
<script src="modules/drillsync/drillsync.js"></script>
```

**slides.json-format:**
```json
{
    "id": "quiz-ekologi",
    "type": "drill-sync",
    "title": "Snabbkoll: Ekologi",
    "timePerQuestion": 20,
    "showLeaderboard": true,
    "questions": [
        {
            "question": "Vad kallas en organism som bryter ner döda organismer?",
            "options": ["Producent", "Konsument", "Nedbrytare", "Toppredator"],
            "correct": 2,
            "explanation": "Nedbrytare (dekomponerare) bryter ner dött organiskt material."
        }
    ]
}
```

**Funktioner:**
- Presentatörskontroll: Skicka fråga → Visa svar → Nästa fråga → Resultat
- Timer per fråga (konfigurerbar)
- Publiksvar via watch.html (en röst per person)
- Rätt/fel-markering med förklaringstext
- Sammanfattande resultatvy med procent per fråga

**Filer:**
- `drillsync/drillsync.js` — Drop-in modul (registrerar slide-typ)

---

### 🗃️ SlideVault (P3) — Presentationskatalog
Automatisk inventering av alla SlideCraft-presentationer i GAIA.

**Körning:**
```bash
node modules/slidevault/slidevault.js
```

**Output:** `slide_index.json` med metadata för alla presentationer och slides.

**Filer:**
- `slidevault/slidevault.js` — Indexeringsscript
- `slidevault/slide_index.json` — Genererat index (63 presentationer, 268 slides)

---

## 🔌 Laddningsordning

För full funktionalitet i en presentation, ladda modulerna i denna ordning:

```html
<!-- I slutet av shell.html, före </body> -->

<!-- P2: Temaväxlare (oberoende) -->
<script src="modules/skinswitch/skinswitch.js"></script>

<!-- P1: Publiksynk (oberoende) -->
<script src="modules/slidecast/slidecast-presenter.js"></script>

<!-- P4: Live-poll (kräver shell.html renderCurrentSlide) -->
<script src="modules/pulsecheck/pulsecheck.js"></script>

<!-- P5: Quiz-synk (kräver shell.html + SlideCast) -->
<script src="modules/drillsync/drillsync.js"></script>
```

---

## 🏗️ Design-principer

1. **Noll-beroendefilosofi:** Grundpresentationen fungerar alltid utan moduler
2. **Drop-in:** En `<script>`-tag räcker för att aktivera
3. **Oberoende moduler:** Varje modul är ett eget paket utan interna beroenden
4. **Graceful degradation:** Allt fallbackar till fungerande tillstånd vid fel
5. **Monkey-patching:** Moduler wrappas runt befintliga funktioner utan att ändra shell.html

---
*Skapad 2026-05-01 · Uppdaterad 2026-05-02 · gAIa 🌲*
