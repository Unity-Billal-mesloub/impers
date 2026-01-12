/**
 * POST request with JSON body example
 */
import * as impers from "impers";

async function main() {
  const response = await impers.post("https://httpbin.org/post", {
    json: { message: "hello", count: 42 },
  });

  console.log("Status:", response.statusCode);
  console.log("Response:", response.json());
}

main().catch(console.error);
