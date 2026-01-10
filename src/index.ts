/**
 * impers - TypeScript HTTP client powered by libcurl
 *
 * A comprehensive HTTP client library that wraps libcurl through FFI,
 * providing a Python requests-like API with browser impersonation support.
 */

// Re-export everything from public API
export * from "./public.js";

// Export constants namespace
export * as constants from "./ffi/constants.js";

// Alias for curl_cffi compatibility
export { Curl as Easy } from "./core/easy.js";
