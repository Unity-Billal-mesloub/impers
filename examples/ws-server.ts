/**
 * Simple standalone WebSocket server for testing
 */
import { WebSocketServer, WebSocket } from "ws";

const PORT = parseInt(process.argv[2] || "8765", 10);

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  ws.on("message", (message: Buffer) => {
    console.log("Received:", message.toString());
    // Echo back the message
    ws.send(message);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

console.log(`WebSocket server listening on ws://127.0.0.1:${PORT}`);
