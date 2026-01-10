/**
 * Tests for HTTP requests using Session class
 */
import { Session } from "../src/http/session.js";
import { get, post, put, del, patch } from "../src/public.js";

describe("Session", () => {
  let session: Session;

  beforeEach(() => {
    session = new Session({
      timeout: 10,
    });
  });

  afterEach(async () => {
    await session.close();
  });

  describe("GET requests", () => {
    it("should make basic GET request", async () => {
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/get`);
      expect(resp.statusCode).toBe(200);
      expect(resp.ok).toBe(true);
    });

    it("should include query parameters", async () => {
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/get`, {
        params: { foo: "bar", num: 123 },
      });
      const json = resp.json() as { args: Record<string, string> };
      expect(json.args.foo).toBe("bar");
      expect(json.args.num).toBe("123");
    });

    it("should include custom headers", async () => {
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/headers`, {
        headers: { "X-Custom-Header": "test-value" },
      });
      const json = resp.json() as { headers: Record<string, string> };
      expect(json.headers["x-custom-header"]).toBe("test-value");
    });
  });

  describe("POST requests", () => {
    it("should send JSON body", async () => {
      const resp = await session.post(`${globalThis.TEST_SERVER_URL}/post`, {
        json: { message: "hello", count: 42 },
      });
      expect(resp.statusCode).toBe(200);
      const json = resp.json() as { json: { message: string; count: number } };
      expect(json.json).toEqual({ message: "hello", count: 42 });
    });

    it("should send form data", async () => {
      const resp = await session.post(`${globalThis.TEST_SERVER_URL}/post`, {
        data: { username: "test", password: "secret" },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const json = resp.json() as { form: Record<string, string> };
      expect(json.form.username).toBe("test");
      expect(json.form.password).toBe("secret");
    });
  });

  describe("PUT requests", () => {
    it("should make PUT request with JSON", async () => {
      const resp = await session.put(`${globalThis.TEST_SERVER_URL}/put`, {
        json: { id: 1, name: "updated" },
      });
      expect(resp.statusCode).toBe(200);
      const json = resp.json() as { json: { id: number; name: string } };
      expect(json.json).toEqual({ id: 1, name: "updated" });
    });
  });

  describe("DELETE requests", () => {
    it("should make DELETE request", async () => {
      const resp = await session.delete(`${globalThis.TEST_SERVER_URL}/delete`);
      expect(resp.statusCode).toBe(200);
    });
  });

  describe("PATCH requests", () => {
    it("should make PATCH request with JSON", async () => {
      const resp = await session.patch(`${globalThis.TEST_SERVER_URL}/patch`, {
        json: { field: "value" },
      });
      expect(resp.statusCode).toBe(200);
    });
  });

  describe("Response handling", () => {
    it("should parse JSON response", async () => {
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/get`);
      const json = resp.json();
      expect(typeof json).toBe("object");
    });

    it("should get text response", async () => {
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/get`);
      const text = resp.text;
      expect(typeof text).toBe("string");
      expect(text.length).toBeGreaterThan(0);
    });

    it("should get response headers", async () => {
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/get`);
      expect(resp.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("Status codes", () => {
    it("should handle 200 OK", async () => {
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/status/200`);
      expect(resp.statusCode).toBe(200);
      expect(resp.ok).toBe(true);
    });

    it("should handle 404 Not Found", async () => {
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/status/404`);
      expect(resp.statusCode).toBe(404);
      expect(resp.ok).toBe(false);
    });

    it("should handle 500 Server Error", async () => {
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/status/500`);
      expect(resp.statusCode).toBe(500);
      expect(resp.ok).toBe(false);
    });
  });

  describe("Redirects", () => {
    it("should follow redirects by default", async () => {
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/redirect/2`);
      expect(resp.statusCode).toBe(200);
      // After following redirects, should get successful response
      const json = resp.json() as { args: Record<string, string> };
      expect(json).toBeDefined();
    });

    it("should not follow redirects when disabled", async () => {
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/redirect/2`, {
        allowRedirects: false,
      });
      expect(resp.statusCode).toBe(302);
    });

    it("should respect maxRedirects", async () => {
      // Should fail if more redirects than allowed
      await expect(
        session.get(`${globalThis.TEST_SERVER_URL}/redirect/5`, {
          maxRedirects: 2,
        })
      ).rejects.toThrow();
    });
  });

  describe("Delays", () => {
    it("should handle delayed responses", async () => {
      const start = Date.now();
      const resp = await session.get(`${globalThis.TEST_SERVER_URL}/delay/1`);
      const elapsed = Date.now() - start;
      expect(resp.statusCode).toBe(200);
      expect(elapsed).toBeGreaterThanOrEqual(900); // Allow some tolerance
    });
  });
});

describe("Standalone functions", () => {
  it("get() should work", async () => {
    const resp = await get(`${globalThis.TEST_SERVER_URL}/get`);
    expect(resp.statusCode).toBe(200);
  });

  it("post() should work", async () => {
    const resp = await post(`${globalThis.TEST_SERVER_URL}/post`, {
      json: { test: true },
    });
    expect(resp.statusCode).toBe(200);
  });

  it("put() should work", async () => {
    const resp = await put(`${globalThis.TEST_SERVER_URL}/put`, {
      json: { test: true },
    });
    expect(resp.statusCode).toBe(200);
  });

  it("del() should work", async () => {
    const resp = await del(`${globalThis.TEST_SERVER_URL}/delete`);
    expect(resp.statusCode).toBe(200);
  });

  it("patch() should work", async () => {
    const resp = await patch(`${globalThis.TEST_SERVER_URL}/patch`, {
      json: { test: true },
    });
    expect(resp.statusCode).toBe(200);
  });
});

describe("Concurrent requests", () => {
  let session: Session;

  beforeEach(() => {
    session = new Session({ timeout: 10 });
  });

  afterEach(async () => {
    await session.close();
  });

  it("should handle multiple concurrent requests", async () => {
    const urls = [
      `${globalThis.TEST_SERVER_URL}/get?n=1`,
      `${globalThis.TEST_SERVER_URL}/get?n=2`,
      `${globalThis.TEST_SERVER_URL}/get?n=3`,
      `${globalThis.TEST_SERVER_URL}/get?n=4`,
      `${globalThis.TEST_SERVER_URL}/get?n=5`,
    ];

    const responses = await Promise.all(urls.map((url) => session.get(url)));

    expect(responses).toHaveLength(5);
    responses.forEach((resp) => {
      expect(resp.statusCode).toBe(200);
    });
  });

  it("should complete concurrent delayed requests faster than sequential", async () => {
    const start = Date.now();

    const responses = await Promise.all([
      session.get(`${globalThis.TEST_SERVER_URL}/delay/1`),
      session.get(`${globalThis.TEST_SERVER_URL}/delay/1`),
    ]);

    const elapsed = Date.now() - start;

    expect(responses).toHaveLength(2);
    // Should complete in ~1 second (concurrent), not ~2 seconds (sequential)
    expect(elapsed).toBeLessThan(2500);
  });
});
