import * as imper from "./src/index.js";

async function main() {
  console.log("Testing simple request...");
  
  const response = await imper.get("https://httpbin.org/get");
  
  console.log("Status:", response.statusCode);
  console.log("Content length:", response.content.length);
  console.log("Text length:", response.text.length);
  console.log("Body preview:", response.text.substring(0, 200));
}

main().catch(console.error);
