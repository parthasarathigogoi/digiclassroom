const http = require("http");
const { WebSocketServer } = require("ws");

const port = Number(process.env.WS_PORT || 3004);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("DigiClassroom WebSocket Server\n");
});

const wss = new WebSocketServer({ server });

const rooms = new Map();

function getRoomId(url) {
  try {
    const u = new URL(url, `http://localhost:${port}`);
    const room = u.searchParams.get("room");
    return room && room.trim() ? room.trim() : "lobby";
  } catch {
    return "lobby";
  }
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function broadcast(roomId, payload) {
  const set = rooms.get(roomId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const client of set) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}

function roomSize(roomId) {
  const set = rooms.get(roomId);
  if (!set) return 0;
  let count = 0;
  for (const client of set) {
    if (client.readyState === client.OPEN) count += 1;
  }
  return count;
}

wss.on("connection", (ws, req) => {
  const roomId = getRoomId(req.url || "/");
  ws._roomId = roomId;
  ws._name = "Student";

  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(ws);

  broadcast(roomId, { type: "presence", roomId, count: roomSize(roomId) });

  ws.on("message", (raw) => {
    const msg = safeJsonParse(String(raw));
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "join" && typeof msg.name === "string") {
      ws._name = msg.name.trim() || "Student";
      broadcast(roomId, {
        type: "system",
        roomId,
        text: `${ws._name} joined`,
        ts: Date.now()
      });
      broadcast(roomId, { type: "presence", roomId, count: roomSize(roomId) });
      return;
    }

    if (msg.type === "chat" && typeof msg.text === "string") {
      const text = msg.text.trim();
      if (!text) return;
      broadcast(roomId, {
        type: "chat",
        roomId,
        name: ws._name,
        text,
        ts: Date.now()
      });
    }
  });

  ws.on("close", () => {
    const rid = ws._roomId || roomId;
    const set = rooms.get(rid);
    if (set) set.delete(ws);
    if (set && set.size === 0) rooms.delete(rid);
    broadcast(rid, {
      type: "system",
      roomId: rid,
      text: `${ws._name || "Student"} left`,
      ts: Date.now()
    });
    broadcast(rid, { type: "presence", roomId: rid, count: roomSize(rid) });
  });
});

server.listen(port, () => {
  console.log(`WebSocket server running on ws://localhost:${port}`);
});
