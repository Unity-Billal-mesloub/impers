/**
 * Tests for Headers class
 */
import { Headers } from "../src/http/headers.js";

describe("Headers", () => {
  describe("constructor", () => {
    it("should create empty headers", () => {
      const headers = new Headers();
      expect(headers.size).toBe(0);
    });

    it("should initialize from object", () => {
      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "text/html",
      });
      expect(headers.get("content-type")).toBe("application/json");
      expect(headers.get("accept")).toBe("text/html");
    });

    it("should initialize from array of tuples", () => {
      const headers = new Headers([
        ["Content-Type", "application/json"],
        ["Accept", "text/html"],
      ]);
      expect(headers.get("content-type")).toBe("application/json");
      expect(headers.get("accept")).toBe("text/html");
    });

    it("should initialize from another Headers instance", () => {
      const original = new Headers({ "Content-Type": "application/json" });
      const copy = new Headers(original);
      expect(copy.get("content-type")).toBe("application/json");
    });
  });

  describe("case insensitivity", () => {
    it("should treat header names case-insensitively", () => {
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      expect(headers.get("content-type")).toBe("application/json");
      expect(headers.get("CONTENT-TYPE")).toBe("application/json");
      expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("should overwrite with different case", () => {
      const headers = new Headers();
      headers.set("content-type", "text/plain");
      headers.set("Content-Type", "application/json");
      expect(headers.get("content-type")).toBe("application/json");
    });
  });

  describe("get and getAll", () => {
    it("should return null for missing headers", () => {
      const headers = new Headers();
      expect(headers.get("x-missing")).toBeNull();
    });

    it("should return first value with get()", () => {
      const headers = new Headers();
      headers.append("Accept", "text/html");
      headers.append("Accept", "application/json");
      expect(headers.get("Accept")).toBe("text/html");
    });

    it("should return all values with getAll()", () => {
      const headers = new Headers();
      headers.append("Accept", "text/html");
      headers.append("Accept", "application/json");
      expect(headers.getAll("Accept")).toEqual(["text/html", "application/json"]);
    });
  });

  describe("set and append", () => {
    it("should set replaces all values", () => {
      const headers = new Headers();
      headers.append("Accept", "text/html");
      headers.append("Accept", "application/json");
      headers.set("Accept", "text/plain");
      expect(headers.getAll("Accept")).toEqual(["text/plain"]);
    });

    it("should append adds to existing values", () => {
      const headers = new Headers();
      headers.set("Accept", "text/html");
      headers.append("Accept", "application/json");
      expect(headers.getAll("Accept")).toEqual(["text/html", "application/json"]);
    });
  });

  describe("has and delete", () => {
    it("should check existence with has()", () => {
      const headers = new Headers({ Accept: "text/html" });
      expect(headers.has("Accept")).toBe(true);
      expect(headers.has("Content-Type")).toBe(false);
    });

    it("should remove with delete()", () => {
      const headers = new Headers({ Accept: "text/html" });
      headers.delete("Accept");
      expect(headers.has("Accept")).toBe(false);
    });
  });

  describe("iteration", () => {
    it("should return all keys", () => {
      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "text/html",
      });
      const keys = [...headers.keys()];
      expect(keys).toContain("content-type");
      expect(keys).toContain("accept");
    });

    it("should iterate with forEach", () => {
      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "text/html",
      });
      const collected: Array<[string, string]> = [];
      headers.forEach((value, key) => {
        collected.push([key, value]);
      });
      expect(collected.length).toBe(2);
    });
  });

  describe("toCurlHeaders", () => {
    it("should convert to curl header format", () => {
      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "text/html",
      });
      const curlHeaders = headers.toCurlHeaders();
      expect(curlHeaders).toContain("Content-Type: application/json");
      expect(curlHeaders).toContain("Accept: text/html");
    });

    it("should handle multiple values", () => {
      const headers = new Headers();
      headers.append("Accept", "text/html");
      headers.append("Accept", "application/json");
      const curlHeaders = headers.toCurlHeaders();
      expect(curlHeaders.filter((h) => h.startsWith("Accept:"))).toHaveLength(2);
    });
  });

  describe("fromRaw", () => {
    it("should parse raw header string", () => {
      const headerString = `HTTP/1.1 200 OK\r
Content-Type: application/json\r
X-Custom-Header: value\r
\r
`;
      const headers = Headers.fromRaw(headerString);
      expect(headers.get("content-type")).toBe("application/json");
      expect(headers.get("x-custom-header")).toBe("value");
    });
  });

  describe("toObject", () => {
    it("should convert to plain object", () => {
      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "text/html",
      });
      const obj = headers.toObject();
      expect(obj["Content-Type"]).toBe("application/json");
      expect(obj["Accept"]).toBe("text/html");
    });
  });
});
