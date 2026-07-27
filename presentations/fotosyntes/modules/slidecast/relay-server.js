/**
 * SlideCast Relay Server v1.0
 * 
 * A minimal WebSocket relay server that syncs presenter → audience.
 * Zero dependencies beyond Node.js built-in modules + ws.
 * 
 * Usage:
 *   npm install ws
 *   node relay-server.js [--port 8787]
 * 
 * Or deploy as a Cloudflare Worker (see relay-worker.js).
 * 
 * Protocol:
 *   Presenter → Relay:  { type: "slide", data: {...} }
 *   Relay → Audience:   { type: "slide", data: {...} }
 *   Audience → Relay:   { type: "question", text: "...", timestamp: "..." }
 *   Relay → Presenter:  { type: "question", text: "...", timestamp: "..." }
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Try to load ws, provide instructions if missing
let WebSocket, WebSocketServer;
try {
    const ws = require('ws');
    WebSocketServer = ws.WebSocketServer || ws.Server;
    WebSocket = ws;
} catch (e) {
    console.error('❌ Missing dependency: ws');
    console.error('   Run: npm install ws');
    process.exit(1);
}

const PORT = parseInt(process.argv.find((_, i, a) => a[i-1] === '--port') || '8787');
const PRESENTER_TOKEN = process.env.SLIDECAST_TOKEN || process.argv.find((_, i, a) => a[i-1] === '--token') || null;

if (!PRESENTER_TOKEN) {
    console.warn('⚠️ SLIDECAST_TOKEN ej satt: Relay tillåter obegränsad presentatörsanslutning (lokalt testläge)');
}

// ===== ROOM STATE =====
const rooms = new Map();

function getRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            presenter: null,
            audience: new Set(),
            state: {
                slide: null,
                meta: null,
                poll: null
            }
        });
    }
    return rooms.get(roomId);
}

// ===== HTTP SERVER =====
const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // GET /state/:roomId — Return current room state (polling fallback, only if active presenter)
    const stateMatch = pathname.match(/^\/state\/([^/]+)$/);
    if (stateMatch && req.method === 'GET') {
        const room = getRoom(stateMatch[1]);
        if (!room.presenter) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ type: 'state', data: { slide: null, poll: null } }));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            type: 'state',
            data: room.state
        }));
        return;
    }

    // POST /message/:roomId — HTTP message relay (fallback)
    const msgMatch = pathname.match(/^\/message\/([^/]+)$/);
    if (msgMatch && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const msg = JSON.parse(body);
                const room = getRoom(msgMatch[1]);
                handleMessage(msg, null, room, 'audience');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // GET /events/:roomId — SSE endpoint (fallback)
    const sseMatch = pathname.match(/^\/events\/([^/]+)$/);
    if (sseMatch && req.method === 'GET') {
        const roomId = sseMatch[1];
        const room = getRoom(roomId);

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Send current state immediately if presenter active
        if (room.presenter && room.state.slide) {
            res.write(`data: ${JSON.stringify({ type: 'state', data: room.state })}\n\n`);
        }

        // Store SSE client
        const sseClient = { res, roomId };
        if (!room._sseClients) room._sseClients = new Set();
        room._sseClients.add(sseClient);

        req.on('close', () => {
            room._sseClients.delete(sseClient);
        });
        return;
    }

    // GET /watch — Serve audience view (watch.html)
    if (pathname === '/watch' || pathname === '/watch/') {
        const watchPath = path.join(__dirname, 'watch.html');
        if (fs.existsSync(watchPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(fs.readFileSync(watchPath));
        } else {
            res.writeHead(404);
            res.end('watch.html not found — place it next to relay-server.js');
        }
        return;
    }

    // GET /component-forge.js — Serve Component Forge module
    if (pathname === '/component-forge.js') {
        const forgePath = path.join(__dirname, '..', 'component-forge', 'component-forge.js');
        if (fs.existsSync(forgePath)) {
            res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
            res.end(fs.readFileSync(forgePath));
        } else {
            res.writeHead(404);
            res.end('component-forge.js not found');
        }
        return;
    }

    // GET / — Status page (aggragerad, läcker ej rumsnamn)
    if (pathname === '/') {
        let totalAudience = 0;
        let activeRooms = 0;
        rooms.forEach((room) => {
            if (room.presenter) activeRooms++;
            totalAudience += room.audience.size;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            service: 'SlideCast Relay',
            version: '1.2',
            uptime: process.uptime(),
            activeRooms: activeRooms,
            totalAudience: totalAudience,
            tokenProtected: !!PRESENTER_TOKEN
        }, null, 2));
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

// ===== WEBSOCKET SERVER =====
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;
    const match = pathname.match(/^\/ws\/([^/]+)$/);

    if (!match) {
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        ws._roomId = match[1];
        wss.emit('connection', ws, request);
    });
});

wss.on('connection', (ws) => {
    const roomId = ws._roomId;
    const room = getRoom(roomId);
    let role = 'audience'; // Default

    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw.toString());

            if (msg.type === 'join') {
                role = msg.role || 'audience';
                
                if (role === 'presenter' || role === 'presenter-remote') {
                    if (PRESENTER_TOKEN && msg.token !== PRESENTER_TOKEN) {
                        ws.send(JSON.stringify({ type: 'error', code: 'auth', message: 'Ogiltig presentatörstoken' }));
                        setTimeout(() => { try { ws.close(4001, 'auth'); } catch(e) {} }, 50);
                        return;
                    }
                    if (room.presenter && room.presenter !== ws && room.presenter.readyState === 1) {
                        if (PRESENTER_TOKEN && msg.token === PRESENTER_TOKEN) {
                            try { room.presenter.close(4003, 'takeover'); } catch(e) {}
                        } else {
                            ws.send(JSON.stringify({ type: 'error', code: 'occupied', message: 'Rummet har redan en presentatör' }));
                            setTimeout(() => { try { ws.close(4002, 'occupied'); } catch(e) {} }, 50);
                            return;
                        }
                    }
                    room.presenter = ws;
                    if (msg.meta) {
                        room.state.meta = msg.meta;
                    }
                    console.log(`🎤 Presenter joined room: ${roomId}`);
                } else {
                    room.audience.add(ws);
                    console.log(`👤 Audience joined room: ${roomId} (${room.audience.size} total)`);
                    
                    // Send current state to new audience member if presenter active
                    if (room.presenter && room.state.slide) {
                        ws.send(JSON.stringify({ type: 'state', data: room.state }));
                    }
                }

                // Broadcast audience count
                broadcastToPresenter(room, {
                    type: 'audience_count',
                    count: room.audience.size
                });
                return;
            }

            handleMessage(msg, ws, room, role);
        } catch (e) {
            console.warn('Invalid message:', e.message);
        }
    });

    ws.on('close', () => {
        if (role === 'presenter' || role === 'presenter-remote') {
            room.presenter = null;
            console.log(`🎤 Presenter left room: ${roomId}`);
        } else {
            room.audience.delete(ws);
            console.log(`👤 Audience left room: ${roomId} (${room.audience.size} remaining)`);
            broadcastToPresenter(room, {
                type: 'audience_count',
                count: room.audience.size
            });
        }
    });
});

// ===== MESSAGE ROUTING =====
function handleMessage(msg, senderWs, room, role) {
    switch (msg.type) {
        case 'slide':
            // Presenter → Audience
            room.state.slide = msg.data;
            broadcastToAudience(room, msg);
            break;

        case 'meta':
            room.state.meta = msg.data;
            broadcastToAudience(room, msg);
            break;
        case 'poll_start':
            room.state.poll = msg.data;
            broadcastToAudience(room, msg);
            break;

        case 'poll_end':
            room.state.poll = null;
            broadcastToAudience(room, msg);
            break;

        case 'ask_start':
        case 'ask_show':
            room.state.ask = msg.data || null;
            broadcastToAudience(room, msg);
            break;

        case 'ask_answer':
            broadcastToPresenter(room, msg);
            break;

        case 'question':
            // Audience → Presenter
            broadcastToPresenter(room, msg);
            break;

        case 'vote':
            // Audience → Presenter
            broadcastToPresenter(room, msg);
            break;

        case 'drill':
            // Presenter → Audience (quiz questions, reveals, results)
            broadcastToAudience(room, msg);
            break;

        case 'drill_answer':
            // Audience → Presenter (quiz answers)
            broadcastToPresenter(room, msg);
            break;
    }
}

function broadcastToAudience(room, msg) {
    const data = JSON.stringify(msg);
    
    // WebSocket clients
    room.audience.forEach(ws => {
        if (ws.readyState === 1) { // OPEN
            ws.send(data);
        }
    });

    // SSE clients
    if (room._sseClients) {
        room._sseClients.forEach(client => {
            try {
                client.res.write(`data: ${data}\n\n`);
            } catch (e) {
                room._sseClients.delete(client);
            }
        });
    }
}

function broadcastToPresenter(room, msg) {
    if (room.presenter && room.presenter.readyState === 1) {
        room.presenter.send(JSON.stringify(msg));
    }
}

// ===== START =====
server.listen(PORT, () => {
    console.log(`\n📡 SlideCast Relay Server v1.0`);
    console.log(`   Running on http://localhost:${PORT}`);
    console.log(`   WebSocket: ws://localhost:${PORT}/ws/{roomId}`);
    console.log(`   SSE:       http://localhost:${PORT}/events/{roomId}`);
    console.log(`   Status:    http://localhost:${PORT}/\n`);
    console.log(`   Audience page: watch.html?relay=http://localhost:${PORT}&room=default`);
    console.log(`   Presenter:     shell.html?relay=http://localhost:${PORT}&room=default\n`);
});
