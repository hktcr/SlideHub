#!/bin/bash
# ═══════════════════════════════════════════════════════════
# SlideCast Launch — Starta relay + Cloudflare Tunnel
# ═══════════════════════════════════════════════════════════
#
# Användning:
#   ./present.sh              → Starta relay + tunnel (port 8787)
#   ./present.sh --port 9000  → Annan port
#   ./present.sh --stop       → Stoppa allt
#
# Vad händer:
#   1. Relay-servern startas lokalt (WebSocket på vald port)
#   2. Cloudflare Tunnel öppnas → du får en publik URL
#   3. URL:en kopieras till clipboard och visas i terminalen
#   4. Publiken surfar till URL:en → watch.html
#   5. Du presenterar via shell.html (lokalt eller GitHub Pages)
#
# Krav:
#   - Node.js
#   - npm-paketet 'ws' (installeras automatiskt)
#   - cloudflared (brew install cloudflared)
#
# ═══════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${2:-8787}"
PID_FILE="$SCRIPT_DIR/.slidecast.pid"
TUNNEL_PID_FILE="$SCRIPT_DIR/.tunnel.pid"

# ===== STOP =====
if [ "$1" = "--stop" ]; then
    echo "🛑 Stoppar SlideCast..."
    [ -f "$PID_FILE" ] && kill "$(cat "$PID_FILE")" 2>/dev/null && rm "$PID_FILE" && echo "   Relay-server stoppad."
    [ -f "$TUNNEL_PID_FILE" ] && kill "$(cat "$TUNNEL_PID_FILE")" 2>/dev/null && rm "$TUNNEL_PID_FILE" && echo "   Cloudflare Tunnel stoppad."
    echo "✅ Allt stoppat."
    exit 0
fi

# ===== PRE-FLIGHT =====
echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║         SlideCast — Presentationsläge         ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Check dependencies
if ! command -v node &>/dev/null; then
    echo "❌ Node.js saknas. Installera: brew install node"
    exit 1
fi

if ! command -v cloudflared &>/dev/null; then
    echo "❌ cloudflared saknas. Installera: brew install cloudflared"
    exit 1
fi

# Install ws if needed
if [ ! -d "$SCRIPT_DIR/node_modules/ws" ]; then
    echo "📦 Installerar ws-beroende..."
    cd "$SCRIPT_DIR" && npm install ws --silent
fi

# Kill any existing instances
[ -f "$PID_FILE" ] && kill "$(cat "$PID_FILE")" 2>/dev/null && rm "$PID_FILE"
[ -f "$TUNNEL_PID_FILE" ] && kill "$(cat "$TUNNEL_PID_FILE")" 2>/dev/null && rm "$TUNNEL_PID_FILE"

# ===== START RELAY =====
echo "🔌 Startar relay-server på port $PORT..."
node "$SCRIPT_DIR/relay-server.js" --port "$PORT" &
RELAY_PID=$!
echo "$RELAY_PID" > "$PID_FILE"
sleep 1

# Verify relay is running
if ! kill -0 "$RELAY_PID" 2>/dev/null; then
    echo "❌ Relay-servern startade inte. Kontrollera loggen."
    exit 1
fi
echo "   ✅ Relay aktiv (PID: $RELAY_PID)"

# ===== START TUNNEL =====
echo "🌐 Öppnar Cloudflare Tunnel..."
echo ""

# Use a temp file to capture the tunnel URL
TUNNEL_LOG="$SCRIPT_DIR/.tunnel.log"
cloudflared tunnel --url "http://localhost:$PORT" 2>"$TUNNEL_LOG" &
TUNNEL_PID=$!
echo "$TUNNEL_PID" > "$TUNNEL_PID_FILE"

# Wait for tunnel URL to appear in logs
echo "   Väntar på tunnel-URL..."
TUNNEL_URL=""
for i in $(seq 1 30); do
    TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
    if [ -n "$TUNNEL_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Kunde inte hämta tunnel-URL. Kontrollera $TUNNEL_LOG"
    exit 1
fi

# Copy to clipboard (macOS)
echo "$TUNNEL_URL" | pbcopy 2>/dev/null || true

# ===== READY =====
echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║              ✅ LIVE — REDO ATT PRESENTERA    ║"
echo "╠═══════════════════════════════════════════════╣"
echo "║                                               ║"
echo "║  Relay URL (kopierad till clipboard):          ║"
echo "║  $TUNNEL_URL"
echo "║                                               ║"
echo "║  Publikvy:                                     ║"
echo "║  ${TUNNEL_URL}/watch                           ║"
echo "║                                               ║"
echo "║  WebSocket:                                    ║"
echo "║  wss://${TUNNEL_URL#https://}                  ║"
echo "║                                               ║"
echo "║  Presentatör:                                  ║"
echo "║  Öppna shell.html med ?relay=${TUNNEL_URL}     ║"
echo "║                                               ║"
echo "╠═══════════════════════════════════════════════╣"
echo "║  Stoppa: ./present.sh --stop                   ║"
echo "║  Eller: Ctrl+C                                ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Keep alive — wait for Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Avslutar..."
    kill "$RELAY_PID" 2>/dev/null
    kill "$TUNNEL_PID" 2>/dev/null
    rm -f "$PID_FILE" "$TUNNEL_PID_FILE" "$TUNNEL_LOG"
    echo "✅ SlideCast avslutad."
    exit 0
}
trap cleanup INT TERM

# Show relay output
echo "📡 Relay-logg (Ctrl+C för att avsluta):"
echo "─────────────────────────────────────────"
wait "$RELAY_PID"
