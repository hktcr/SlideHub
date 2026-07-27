# SlideCast Live — Så här kör du en presentation med publikvy

> **Noll kostnad. Noll deploy. Noll konto.**
> Cloudflare Tunnel exponerar din lokala relay-server med en publik URL.
> Publiken surfar dit — klart.

---

## Snabbstart (30 sekunder)

```bash
cd SlideCraft/modules/slidecast
./present.sh
```

Det som händer:
1. Relay-servern startas lokalt (port 8787)
2. En Cloudflare Tunnel öppnas automatiskt
3. Du får en publik URL (kopieras till clipboard)
4. Publiken surfar till `URL/watch`

---

## Steg för steg

### 1. Förberedelse (engångs-setup)

```bash
# Installera cloudflared (om inte redan gjort)
brew install cloudflared

# Installera WebSocket-beroende (om inte redan gjort)
cd SlideCraft/modules/slidecast
npm install ws
```

### 2. Starta presentationsläge

```bash
cd SlideCraft/modules/slidecast
./present.sh
```

Vänta ~5 sekunder. Du ser:

```
╔═══════════════════════════════════════════════╗
║              ✅ LIVE — REDO ATT PRESENTERA    ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  Relay URL (kopierad till clipboard):          ║
║  https://random-name.trycloudflare.com        ║
║                                               ║
║  Publikvy:                                     ║
║  https://random-name.trycloudflare.com/watch  ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

### 3. Öppna presentatörsvyn

Öppna din `shell.html` med relay-parametern:

```
shell.html?relay=https://random-name.trycloudflare.com&room=default
```

Eller om den är deployad på GitHub Pages:

```
https://hktcr.github.io/slidecraft-showcase/shell.html?relay=https://random-name.trycloudflare.com&room=default
```

### 4. Dela med publiken

Ge publiken URL:en till `/watch`:

```
https://random-name.trycloudflare.com/watch
```

Alternativt: visa en QR-kod eller berätta koden muntligt.

### 5. Avsluta

```bash
# Antingen:
Ctrl+C

# Eller från en annan terminal:
./present.sh --stop
```

---

## Hur det fungerar — teknisk översikt

```
┌────────────────┐     ┌───────────────────┐     ┌──────────────┐
│  Presentatör   │     │  Din Mac (lokalt)  │     │   Publiken   │
│  (shell.html)  │────▶│                    │◀────│ (watch.html) │
│                │ WS  │  relay-server.js   │ WS  │              │
└────────────────┘     │  :8787             │     └──────────────┘
                       │        ▲           │
                       └────────┼───────────┘
                                │
                       ┌────────┴───────────┐
                       │  Cloudflare Tunnel  │
                       │  (gratis, temp URL) │
                       │  trycloudflare.com  │
                       └────────────────────┘
```

1. **relay-server.js** körs på `localhost:8787`
2. **cloudflared** skapar en krypterad tunnel till Cloudflare
3. Cloudflare ger dig en **tillfällig publik URL** (ny varje gång)
4. Presentatörens `shell.html` ansluter via WebSocket
5. Vid varje slide-byte skickas JSON till relay → alla anslutna klienter
6. `watch.html` renderar samma slide som presentatören ser

### Dataflöde

```
Presentatör klickar "nästa slide"
    ↓
shell.html → ws://localhost:8787/ws/default
    ↓
relay-server.js sparar state + broadcastar
    ↓
ws://localhost:8787/ws/default → alla watch.html-klienter
    ↓
Publiken ser den nya sliden
```

---

## Rumskoder

Du kan köra flera presentationer samtidigt genom att använda olika rum:

```
# Presentatör A:
shell.html?relay=URL&room=BJORK

# Presentatör B:
shell.html?relay=URL&room=GRAN

# Publik A:
URL/watch?room=BJORK

# Publik B:
URL/watch?room=GRAN
```

Standardrummet är `default`.

---

## Felsökning

| Problem | Lösning |
|---------|---------|
| `cloudflared: command not found` | `brew install cloudflared` |
| `ws: module not found` | `cd modules/slidecast && npm install ws` |
| Tunnel-URL dyker inte upp | Kolla `.tunnel.log` i slidecast-mappen |
| Publiken ser ingen slide | Kontrollera att `?relay=URL&room=X` stämmer |
| Relay svarar inte | `./present.sh --stop` och starta om |

---

## Kostnader

| Komponent | Kostnad |
|-----------|---------|
| Cloudflare Tunnel | **Gratis** (Quick Tunnels, inga konton behövs) |
| relay-server.js | Körs lokalt — $0 |
| GitHub Pages (shell.html) | **Gratis** |
| WebSocket-trafik | Ingår i tunneln — $0 |
| **Totalt** | **$0** |

---

## Begränsningar

- **URL:en ändras** varje gång du startar `./present.sh` (Quick Tunnel)
  - Lösning: Registrera en Named Tunnel med `cloudflared tunnel create` (gratis med CF-konto)
- **Kräver internet** — tunneln går via Cloudflare
- **Kräver att din Mac är igång** under presentationen
- **Max deltagare**: Begränsas av din Macs RAM (~500+ med 8 GB)

---

## Avancerat: Named Tunnel (permanent URL)

Om du vill ha samma URL varje gång:

```bash
# Engångs-setup (kräver gratis Cloudflare-konto)
cloudflared tunnel login
cloudflared tunnel create slidecraft
cloudflared tunnel route dns slidecraft present.dittdomän.se

# Sedan vid presentation:
cloudflared tunnel run --url http://localhost:8787 slidecraft
```

---

*Dokumentation av SlideCast Live · gAIa 🌲 2026-05-02*
