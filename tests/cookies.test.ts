/**
 * Tests for Cookies class
 */
import { Cookies } from "../src/http/cookies.js";

describe("Cookies", () => {
  describe("constructor", () => {
    it("should create empty cookies", () => {
      const cookies = new Cookies();
      expect(cookies.toObject()).toEqual({});
    });

    it("should initialize from object", () => {
      const cookies = new Cookies({
        session: "abc123",
        user: "john",
      });
      expect(cookies.get("session")).toBe("abc123");
      expect(cookies.get("user")).toBe("john");
    });

    it("should initialize from another Cookies instance", () => {
      const original = new Cookies({ session: "abc123" });
      const copy = new Cookies(original);
      expect(copy.get("session")).toBe("abc123");
    });
  });

  describe("get and set", () => {
    it("should get cookie value", () => {
      const cookies = new Cookies();
      cookies.set("session", "abc123");
      expect(cookies.get("session")).toBe("abc123");
    });

    it("should return null for missing cookie", () => {
      const cookies = new Cookies();
      expect(cookies.get("missing")).toBeNull();
    });

    it("should set cookie with options", () => {
      const cookies = new Cookies();
      cookies.set("session", "abc123", {
        domain: "example.com",
        path: "/api",
        secure: true,
        httpOnly: true,
        expires: new Date("2030-01-01"),
      });
      const cookie = cookies.getCookie("session", "example.com", "/api");
      expect(cookie?.value).toBe("abc123");
      expect(cookie?.domain).toBe("example.com");
      expect(cookie?.path).toBe("/api");
      expect(cookie?.secure).toBe(true);
      expect(cookie?.httpOnly).toBe(true);
    });
  });

  describe("has and delete", () => {
    it("should check existence with has()", () => {
      const cookies = new Cookies({ session: "abc123" });
      expect(cookies.has("session")).toBe(true);
      expect(cookies.has("missing")).toBe(false);
    });

    it("should remove with delete()", () => {
      const cookies = new Cookies({ session: "abc123" });
      cookies.delete("session");
      expect(cookies.has("session")).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all cookies", () => {
      const cookies = new Cookies({
        session: "abc123",
        user: "john",
      });
      cookies.clear();
      expect(cookies.toObject()).toEqual({});
    });
  });

  describe("iteration", () => {
    it("should iterate over all cookies", () => {
      const cookies = new Cookies({
        session: "abc123",
        user: "john",
      });
      const collected: string[] = [];
      for (const cookie of cookies) {
        collected.push(cookie.name);
      }
      expect(collected.length).toBe(2);
      expect(collected).toContain("session");
      expect(collected).toContain("user");
    });
  });

  describe("toCookieHeader", () => {
    it("should format as cookie header string", () => {
      const cookies = new Cookies({
        session: "abc123",
        user: "john",
      });
      const header = cookies.toCookieHeader();
      expect(header).toContain("session=abc123");
      expect(header).toContain("user=john");
    });
  });

  describe("URL matching", () => {
    it("should get cookies for URL", () => {
      const cookies = new Cookies();
      cookies.set("global", "value1", { domain: "example.com" });
      cookies.set("api", "value2", { domain: "api.example.com" });
      cookies.set("other", "value3", { domain: "other.com" });

      const forUrl = cookies.getForUrl("https://api.example.com/test");
      const names = forUrl.map((c) => c.name);
      expect(names).toContain("api");
    });

    it("should match path", () => {
      const cookies = new Cookies();
      cookies.set("root", "value1", { path: "/" });
      cookies.set("api", "value2", { path: "/api" });

      const forRoot = cookies.getForUrl("https://example.com/");
      const rootNames = forRoot.map((c) => c.name);
      expect(rootNames).toContain("root");
      expect(rootNames).not.toContain("api");

      const forApi = cookies.getForUrl("https://example.com/api/users");
      const apiNames = forApi.map((c) => c.name);
      expect(apiNames).toContain("root");
      expect(apiNames).toContain("api");
    });
  });

  describe("parseSetCookie", () => {
    it("should parse Set-Cookie header", () => {
      const cookie = Cookies.parseSetCookie("session=abc123; Path=/; HttpOnly");
      expect(cookie.name).toBe("session");
      expect(cookie.value).toBe("abc123");
      expect(cookie.path).toBe("/");
      expect(cookie.httpOnly).toBe(true);
    });

    it("should parse Set-Cookie with domain", () => {
      const cookie = Cookies.parseSetCookie("user=john; Domain=example.com; Secure");
      expect(cookie.name).toBe("user");
      expect(cookie.value).toBe("john");
      expect(cookie.domain).toBe("example.com");
      expect(cookie.secure).toBe(true);
    });
  });
});
