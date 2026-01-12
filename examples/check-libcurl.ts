/**
 * Check which libcurl is being used and its capabilities
 */
import { resolveLibrary, getPlatformInfo } from "impers";
import koffi from "koffi";

const libraryInfo = resolveLibrary();
const platformInfo = getPlatformInfo();

console.log("Platform:", platformInfo.platform, platformInfo.arch);
console.log("Library path:", libraryInfo.path);
console.log("Is curl-impersonate:", libraryInfo.isImpersonate);

// Load the library and check version
const lib = koffi.load(libraryInfo.path);
const curl_version = lib.func("const char * curl_version()");
const version = curl_version();
console.log("Curl version:", version);

// Check if WebSocket functions exist
try {
  const curl_ws_recv = lib.func("int curl_ws_recv(void *, void *, size_t, size_t *, void **)");
  console.log("WebSocket support: YES (curl_ws_recv found)");
} catch (e) {
  console.log("WebSocket support: NO (curl_ws_recv not found)");
}
