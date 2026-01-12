/**
 * Test WebSocket with local mock server
 */
import { startMockServer, stopMockServer, getServerPort } from "../tests/mock-server.js";
import koffi from "koffi";
import { resolveLibcurlPath } from "impers";

const lib = koffi.load(resolveLibcurlPath());

// Define functions
const curl_easy_init = lib.func("void * curl_easy_init()");
const curl_easy_cleanup = lib.func("void curl_easy_cleanup(void *)");
const curl_easy_setopt = lib.func("int curl_easy_setopt(void *, int, ...)");
const curl_easy_perform = lib.func("int curl_easy_perform(void *)");
const curl_easy_strerror = lib.func("const char * curl_easy_strerror(int)");
const curl_ws_send = lib.func("int curl_ws_send(void *, void *, size_t, size_t *, int64, uint32)");
const curl_ws_recv = lib.func("int curl_ws_recv(void *, void *, size_t, size_t *, void **)");

// Constants
const CURLOPT_URL = 10002;
const CURLOPT_CONNECT_ONLY = 141;
const CURLOPT_VERBOSE = 41;
const CURLOPT_HTTP_VERSION = 84;
const CURL_HTTP_VERSION_1_1 = 2;
const CURLWS_TEXT = 1;

async function main() {
  console.log("Starting mock server...");
  await startMockServer();
  const port = getServerPort();
  console.log("Mock server started on port", port);

  try {
    const handle = curl_easy_init();
    console.log("\nHandle:", handle);

    // Set URL to local WebSocket endpoint (use ws:// scheme)
    const url = `ws://127.0.0.1:${port}/ws/echo`;
    curl_easy_setopt(handle, CURLOPT_URL, "str", url);
    console.log("URL set to:", url);

    // Enable verbose mode
    curl_easy_setopt(handle, CURLOPT_VERBOSE, "long", 1);

    // Force HTTP/1.1 (WebSocket requires HTTP/1.1 upgrade)
    curl_easy_setopt(handle, CURLOPT_HTTP_VERSION, "long", CURL_HTTP_VERSION_1_1);
    console.log("HTTP version set to 1.1");

    // Set CONNECT_ONLY to 2 for WebSocket mode
    curl_easy_setopt(handle, CURLOPT_CONNECT_ONLY, "long", 2);
    console.log("CONNECT_ONLY set to 2 (WebSocket mode)");

    console.log("\nPerforming connection...");
    const code = curl_easy_perform(handle);
    console.log("Perform result:", code, curl_easy_strerror(code));

    if (code === 0) {
      console.log("\nTrying to send WebSocket message...");
      const message = Buffer.from("Hello WebSocket!");
      const sent = new BigUint64Array(1);

      const sendCode = curl_ws_send(handle, message, message.length, sent, BigInt(0), CURLWS_TEXT);
      console.log("Send result:", sendCode, curl_easy_strerror(sendCode));
      console.log("Bytes sent:", Number(sent[0]));

      if (sendCode === 0) {
        console.log("\nTrying to receive...");
        const recvBuffer = Buffer.alloc(1024);
        const received = new BigUint64Array(1);
        const metaPtr = [null];

        const recvCode = curl_ws_recv(handle, recvBuffer, recvBuffer.length, received, metaPtr);
        console.log("Recv result:", recvCode, curl_easy_strerror(recvCode));
        console.log("Bytes received:", Number(received[0]));
        if (Number(received[0]) > 0) {
          console.log("Data:", recvBuffer.subarray(0, Number(received[0])).toString());
        }
      }
    }

    curl_easy_cleanup(handle);
  } finally {
    console.log("\nStopping mock server...");
    await stopMockServer();
  }
}

main().catch(console.error);
