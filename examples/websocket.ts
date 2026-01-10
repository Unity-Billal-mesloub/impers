/**
 * WebSocket example
 *
 * This example connects to a public WebSocket echo server.
 */
import { wsConnect, WebSocketMessageType } from "../src/index.js";

async function main() {
  console.log("Connecting to WebSocket server...");

  try {
    // Connect to a public WebSocket echo server
    const ws = await wsConnect("wss://echo.websocket.org");

    console.log("Connected!");
    console.log("URL:", ws.url);

    // Send a text message
    console.log("\nSending text message...");
    await ws.sendStr("Hello, WebSocket!");

    // Receive the echo
    const response = await ws.recvStr(5);
    console.log("Received:", response);

    // Send JSON
    console.log("\nSending JSON...");
    await ws.sendJson({ type: "greeting", message: "Hello from impers!" });

    // Receive JSON echo
    const jsonResponse = await ws.recvJson<{ type: string; message: string }>(5);
    console.log("Received JSON:", jsonResponse);

    // Close the connection
    console.log("\nClosing connection...");
    await ws.close(1000, "Done");

    console.log("Connection closed.");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
