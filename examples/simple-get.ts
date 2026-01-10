/**
 * Simple GET request example
 */
import * as impers from "../src/index.js";

async function main() {
  // Simple GET request
  const response = await impers.get("https://example.com");

  console.log("Status:", response.statusCode);
  console.log("Content-Type:", response.headers.get("content-type"));
  console.log("Body length:", response.text.length);

  const fp = await impers.get("https://tls.browserleaks.com/json", {impersonate: "chrome142"});

  console.log("Status:", fp.statusCode);
  console.log("Fingerprints:");
  console.log(fp.text);
}

main().catch(console.error);
