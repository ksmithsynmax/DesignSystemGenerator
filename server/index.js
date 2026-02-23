import { WebSocketServer } from "ws";

const PORT = 9001;
const wss = new WebSocketServer({ port: PORT });

const clients = { react: null, plugin: null };

wss.on("connection", (ws) => {
  let role = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    // Registration message
    if (msg.type === "register") {
      role = msg.role;
      clients[role] = ws;
      console.log(`[relay] ${role} connected`);

      // Notify the other side
      const otherRole = role === "react" ? "plugin" : "react";
      if (clients[otherRole] && clients[otherRole].readyState === 1) {
        clients[otherRole].send(JSON.stringify({ type: "peer-connected", peer: role }));
        ws.send(JSON.stringify({ type: "peer-connected", peer: otherRole }));
      }
      return;
    }

    // Forward to the other role
    const target = role === "react" ? clients.plugin : clients.react;
    if (target && target.readyState === 1) {
      target.send(raw.toString());
    } else {
      ws.send(JSON.stringify({
        type: "error",
        message: `No ${role === "react" ? "plugin" : "react"} connected`,
      }));
    }
  });

  ws.on("close", () => {
    if (role && clients[role] === ws) {
      clients[role] = null;
      console.log(`[relay] ${role} disconnected`);
      const otherRole = role === "react" ? "plugin" : "react";
      if (clients[otherRole] && clients[otherRole].readyState === 1) {
        clients[otherRole].send(JSON.stringify({ type: "peer-disconnected", peer: role }));
      }
    }
  });
});

console.log(`[relay] WebSocket server listening on ws://localhost:${PORT}`);
