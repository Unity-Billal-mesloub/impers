/**
 * Test AsyncWebSocket class with standalone server
 * Start ws-server.ts first: npx tsx examples/ws-server.ts
 */
import { AsyncWebSocket } from "impers";

const port = process.argv[2] || "8765";

async function main() {
  console.log("Connecting to WebSocket server...");

  try {
    const ws = await AsyncWebSocket.connect(`ws://127.0.0.1:${port}/`);
    console.log("Connected!");
    console.log("URL:", ws.url);
    console.log("Connected:", ws.connected);

    console.log("\nSending message...");
    await ws.sendStr("Hello from AsyncWebSocket!");
    console.log("Message sent!");

    console.log("\nReceiving message...");
    const response = await ws.recvStr(5);
    console.log("Received:", response);

    console.log("\nClosing...");
    await ws.close();
    console.log("Closed!");
    console.log("Close event:", ws.closeEvent);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
