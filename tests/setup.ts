/**
 * Jest setup file - starts mock server before all tests
 */
import { startMockServer, stopMockServer, getServerUrl } from "./mock-server.js";

// Store the server URL globally
declare global {
  // eslint-disable-next-line no-var
  var TEST_SERVER_URL: string;
}

beforeAll(async () => {
  const port = await startMockServer();
  globalThis.TEST_SERVER_URL = getServerUrl();
  console.log(`Mock server started at ${globalThis.TEST_SERVER_URL}`);
});

afterAll(async () => {
  await stopMockServer();
  console.log("Mock server stopped");
});
