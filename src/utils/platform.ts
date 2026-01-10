// Re-export from the new loader module for backwards compatibility
export {
  resolveLibcurlPath,
  resolveLibrary,
  isUsingImpersonate,
  getPlatformInfo,
  type LibraryInfo,
} from "../ffi/loader.js";
