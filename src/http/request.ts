/**
 * HTTP Request representation
 */

import { Headers, type HeadersInit } from "./headers.js";

export type BodyInit = string | Buffer | URLSearchParams | Record<string, unknown>;

export interface RequestInit {
  headers?: HeadersInit;
  body?: BodyInit;
}

/**
 * Request - Represents an HTTP request
 */
export class Request {
  readonly method: string;
  readonly url: URL;
  readonly headers: Headers;
  readonly body: Buffer | null;

  constructor(method: string, url: string | URL, init?: RequestInit) {
    this.method = method.toUpperCase();
    this.url = typeof url === "string" ? new URL(url) : url;
    this.headers = new Headers(init?.headers);
    this.body = init?.body ? this.normalizeBody(init.body) : null;
  }

  /**
   * Normalize body to Buffer
   */
  private normalizeBody(body: BodyInit): Buffer {
    if (Buffer.isBuffer(body)) {
      return body;
    }

    if (typeof body === "string") {
      return Buffer.from(body, "utf-8");
    }

    if (body instanceof URLSearchParams) {
      return Buffer.from(body.toString(), "utf-8");
    }

    // Assume JSON-serializable object
    return Buffer.from(JSON.stringify(body), "utf-8");
  }

  /**
   * Get the full URL as string
   */
  get href(): string {
    return this.url.href;
  }

  /**
   * Get the hostname
   */
  get hostname(): string {
    return this.url.hostname;
  }

  /**
   * Get the pathname
   */
  get pathname(): string {
    return this.url.pathname;
  }

  /**
   * Get query string
   */
  get search(): string {
    return this.url.search;
  }

  /**
   * Check if body exists
   */
  get hasBody(): boolean {
    return this.body !== null && this.body.length > 0;
  }

  /**
   * Get body as string
   */
  get text(): string | null {
    return this.body ? this.body.toString("utf-8") : null;
  }

  /**
   * Clone the request
   */
  clone(): Request {
    return new Request(this.method, this.url, {
      headers: this.headers.clone(),
      body: this.body ? Buffer.from(this.body) : undefined,
    });
  }
}
