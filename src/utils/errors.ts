import { curl_easy_strerror } from "../ffi/libcurl.js";
import { CurlCode } from "../ffi/constants.js";

/**
 * Base exception for all request errors
 */
export class RequestException extends Error {
  cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "RequestException";
    this.cause = cause;
  }
}

/**
 * libcurl error with error code
 */
export class CurlError extends RequestException {
  code: number;

  constructor(code: number, message?: string, cause?: Error) {
    super(message || `libcurl error ${code}`, cause);
    this.name = "CurlError";
    this.code = code;
  }
}

/**
 * Connection error (network failure)
 */
export class ConnectionError extends RequestException {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = "ConnectionError";
  }
}

/**
 * DNS resolution error
 */
export class DNSError extends ConnectionError {
  hostname?: string;

  constructor(message: string, hostname?: string, cause?: Error) {
    super(message, cause);
    this.name = "DNSError";
    this.hostname = hostname;
  }
}

/**
 * Proxy connection error
 */
export class ProxyError extends ConnectionError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = "ProxyError";
  }
}

/**
 * SSL/TLS error
 */
export class SSLError extends RequestException {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = "SSLError";
  }
}

/**
 * Certificate verification error
 */
export class CertificateVerifyError extends SSLError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = "CertificateVerifyError";
  }
}

/**
 * Request timeout
 */
export class Timeout extends RequestException {
  constructor(message: string = "Request timed out", cause?: Error) {
    super(message, cause);
    this.name = "Timeout";
  }
}

/**
 * Connection timeout
 */
export class ConnectTimeout extends Timeout {
  constructor(cause?: Error) {
    super("Connection timed out", cause);
    this.name = "ConnectTimeout";
  }
}

/**
 * Read timeout
 */
export class ReadTimeout extends Timeout {
  constructor(cause?: Error) {
    super("Read timed out", cause);
    this.name = "ReadTimeout";
  }
}

/**
 * HTTP error (4xx/5xx response)
 */
export class HTTPError extends RequestException {
  statusCode: number;
  reason: string;
  response?: unknown;

  constructor(statusCode: number, reason: string, response?: unknown) {
    super(`HTTP ${statusCode}: ${reason}`);
    this.name = "HTTPError";
    this.statusCode = statusCode;
    this.reason = reason;
    this.response = response;
  }
}

/**
 * Too many redirects
 */
export class TooManyRedirects extends RequestException {
  maxRedirects: number;

  constructor(maxRedirects: number, cause?: Error) {
    super(`Exceeded maximum redirects: ${maxRedirects}`, cause);
    this.name = "TooManyRedirects";
    this.maxRedirects = maxRedirects;
  }
}

/**
 * Invalid URL
 */
export class InvalidURL extends RequestException {
  url: string;

  constructor(url: string, cause?: Error) {
    super(`Invalid URL: ${url}`, cause);
    this.name = "InvalidURL";
    this.url = url;
  }
}

/**
 * Invalid header
 */
export class InvalidHeader extends RequestException {
  header: string;

  constructor(header: string, cause?: Error) {
    super(`Invalid header: ${header}`, cause);
    this.name = "InvalidHeader";
    this.header = header;
  }
}

/**
 * Invalid proxy URL
 */
export class InvalidProxyURL extends RequestException {
  url: string;

  constructor(url: string, cause?: Error) {
    super(`Invalid proxy URL: ${url}`, cause);
    this.name = "InvalidProxyURL";
    this.url = url;
  }
}

/**
 * Impersonation error
 */
export class ImpersonateError extends RequestException {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = "ImpersonateError";
  }
}

/**
 * Session closed error
 */
export class SessionClosed extends RequestException {
  constructor(message: string = "Session has been closed", cause?: Error) {
    super(message, cause);
    this.name = "SessionClosed";
  }
}

/**
 * WebSocket error
 */
export class WebSocketError extends RequestException {
  code?: number;

  constructor(message: string, code?: number, cause?: Error) {
    super(message, cause);
    this.name = "WebSocketError";
    this.code = code;
  }
}

/**
 * WebSocket closed
 */
export class WebSocketClosed extends WebSocketError {
  closeCode: number | null;
  closeReason: string | null;

  constructor(closeCode: number | null, closeReason: string | null) {
    super(`WebSocket closed: ${closeCode} ${closeReason || ""}`);
    this.name = "WebSocketClosed";
    this.closeCode = closeCode;
    this.closeReason = closeReason;
  }
}

/**
 * Incomplete read error
 */
export class IncompleteRead extends RequestException {
  expected: number;
  received: number;

  constructor(expected: number, received: number, cause?: Error) {
    super(`Incomplete read: expected ${expected} bytes, got ${received}`, cause);
    this.name = "IncompleteRead";
    this.expected = expected;
    this.received = received;
  }
}

/**
 * JSON parsing error
 */
export class InvalidJSONError extends RequestException {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = "InvalidJSONError";
  }
}

/**
 * Cookie conflict error
 */
export class CookieConflict extends RequestException {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = "CookieConflict";
  }
}

/**
 * Interface error (network interface not available)
 */
export class InterfaceError extends RequestException {
  interfaceName: string;

  constructor(interfaceName: string, cause?: Error) {
    super(`Network interface unavailable: ${interfaceName}`, cause);
    this.name = "InterfaceError";
    this.interfaceName = interfaceName;
  }
}

/**
 * Raise CurlError if code is not CURLE_OK
 */
export function raiseIfError(code: number): void {
  if (code === CurlCode.CURLE_OK) {
    return;
  }

  const message = curl_easy_strerror(code) as string | null;
  throw mapCurlError(code, message || undefined);
}

/**
 * Map curl error codes to appropriate exception types
 */
export function mapCurlError(code: number, message?: string): RequestException {
  const msg = message || `libcurl error ${code}`;

  switch (code) {
    case CurlCode.CURLE_COULDNT_RESOLVE_HOST:
      return new DNSError(msg);

    case CurlCode.CURLE_COULDNT_RESOLVE_PROXY:
      return new ProxyError(`Failed to resolve proxy: ${msg}`);

    case CurlCode.CURLE_COULDNT_CONNECT:
      return new ConnectionError(msg);

    case CurlCode.CURLE_OPERATION_TIMEDOUT:
      return new Timeout(msg);

    case CurlCode.CURLE_SSL_CONNECT_ERROR:
      return new SSLError(msg);

    case CurlCode.CURLE_PEER_FAILED_VERIFICATION:
    case CurlCode.CURLE_SSL_CERTPROBLEM:
    case CurlCode.CURLE_SSL_CACERT_BADFILE:
      return new CertificateVerifyError(msg);

    case CurlCode.CURLE_TOO_MANY_REDIRECTS:
      return new TooManyRedirects(0);

    case CurlCode.CURLE_URL_MALFORMAT:
      return new InvalidURL(msg);

    case CurlCode.CURLE_PROXY:
      return new ProxyError(msg);

    case CurlCode.CURLE_INTERFACE_FAILED:
      return new InterfaceError(msg);

    case CurlCode.CURLE_SEND_ERROR:
    case CurlCode.CURLE_RECV_ERROR:
      return new ConnectionError(msg);

    case CurlCode.CURLE_GOT_NOTHING:
      return new ConnectionError("Server returned nothing (no headers, no data)");

    default:
      return new CurlError(code, msg);
  }
}
