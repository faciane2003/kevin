import { WebSocketServer } from "ws";

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const wss = new WebSocketServer({ port });

const clients = new Map();

const safeJson = (data) => {
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
};

const broadcast = (payload, exclude) => {
  const message = safeJson(payload);
  if (!message) return;
  for (const ws of wss.clients) {
    if (ws.readyState !== ws.OPEN) continue;
    if (exclude && ws === exclude) continue;
    ws.send(message);
  }
};

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    if (msg?.type === "join" && msg.id) {
      clients.set(ws, {
        id: msg.id,
        name: msg.name || "Player",
        pos: msg.pos || { x: 0, y: 0, z: 0 },
        rot: msg.rot || { y: 0 },
      });
      const existing = Array.from(clients.values()).filter((p) => p.id !== msg.id);
      ws.send(safeJson({ type: "init", players: existing }) || "");
      broadcast({ type: "join", player: clients.get(ws) }, ws);
      return;
    }

    if (msg?.type === "move" && msg.id) {
      const current = clients.get(ws);
      if (!current) return;
      current.pos = msg.pos || current.pos;
      current.rot = msg.rot || current.rot;
      broadcast({ type: "move", id: msg.id, pos: current.pos, rot: current.rot }, ws);
      return;
    }

    if (msg?.type === "chat" && msg.id && typeof msg.message === "string") {
      const current = clients.get(ws);
      const name = current?.name || msg.name || "Player";
      broadcast({ type: "chat", id: msg.id, name, message: msg.message }, ws);
      return;
    }
  });

  ws.on("close", () => {
    const current = clients.get(ws);
    if (current) {
      broadcast({ type: "leave", id: current.id });
    }
    clients.delete(ws);
  });
});

console.log(`WebSocket server running on ws://localhost:${port}`);
