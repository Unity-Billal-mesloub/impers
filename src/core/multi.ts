import {
  curl_multi_init,
  curl_multi_cleanup,
  curl_multi_add_handle,
  curl_multi_remove_handle,
  curl_multi_perform,
  curl_multi_poll,
  curl_multi_info_read,
  curl_multi_setopt_long,
  curl_multi_strerror,
  getHandleAddress,
  type CurlMultiHandle,
  type CurlHandle,
  type MultiInfoMessage,
} from "../ffi/libcurl.js";
import { CurlMCode, CurlMOpt, CurlMsg, CurlCode } from "../ffi/constants.js";
import type { Curl } from "./easy.js";

export interface MultiOptions {
  maxConnections?: number;
  maxHostConnections?: number;
  maxTotalConnections?: number;
  pipelining?: boolean;
}

interface PendingTransfer {
  curl: Curl;
  handle: CurlHandle;
  handleAddr: string; // Address of the handle for lookup
  resolve: (result: TransferResult) => void;
  reject: (error: Error) => void;
}

export interface TransferResult {
  code: number;
}

/**
 * CurlMulti - Async multi-handle interface for concurrent requests
 *
 * Uses poll-based async to integrate with Node.js event loop.
 * This allows multiple HTTP requests to run concurrently without blocking.
 */
export class CurlMulti {
  private handle: CurlMultiHandle | null;
  private pendingTransfers: Map<string, PendingTransfer> = new Map(); // keyed by handle address
  private curlToAddr: Map<Curl, string> = new Map();
  private polling: boolean = false;
  private pollTimer: ReturnType<typeof setImmediate> | null = null;
  private closed: boolean = false;

  constructor(options: MultiOptions = {}) {
    this.handle = curl_multi_init();
    if (!this.handle) {
      throw new Error("Failed to initialize curl multi handle");
    }

    // Configure multi handle options
    if (options.maxConnections !== undefined) {
      this.setOptLong(CurlMOpt.CURLMOPT_MAXCONNECTS, options.maxConnections);
    }
    if (options.maxHostConnections !== undefined) {
      this.setOptLong(CurlMOpt.CURLMOPT_MAX_HOST_CONNECTIONS, options.maxHostConnections);
    }
    if (options.maxTotalConnections !== undefined) {
      this.setOptLong(CurlMOpt.CURLMOPT_MAX_TOTAL_CONNECTIONS, options.maxTotalConnections);
    }
    if (options.pipelining !== undefined) {
      // 2 = CURLPIPE_MULTIPLEX for HTTP/2 multiplexing
      this.setOptLong(CurlMOpt.CURLMOPT_PIPELINING, options.pipelining ? 2 : 0);
    }
  }

  private setOptLong(option: number, value: number): void {
    if (!this.handle) return;
    const code = curl_multi_setopt_long(this.handle, option, value);
    if (code !== CurlMCode.CURLM_OK) {
      throw new Error(`curl_multi_setopt failed: ${curl_multi_strerror(code)}`);
    }
  }

  /**
   * Add a Curl handle and perform the transfer asynchronously
   * Returns a Promise that resolves when the transfer completes
   */
  async perform(curl: Curl): Promise<TransferResult> {
    if (this.closed) {
      throw new Error("CurlMulti has been closed");
    }
    if (!this.handle) {
      throw new Error("CurlMulti handle is null");
    }

    const easyHandle = curl.getHandle();
    if (!easyHandle) {
      throw new Error("Curl handle is null");
    }

    return new Promise<TransferResult>((resolve, reject) => {
      // Get the handle address for lookup
      const handleAddr = getHandleAddress(easyHandle);

      // Add to multi handle
      const code = curl_multi_add_handle(this.handle!, easyHandle);
      if (code !== CurlMCode.CURLM_OK) {
        reject(new Error(`curl_multi_add_handle failed: ${curl_multi_strerror(code)}`));
        return;
      }

      // Store pending transfer keyed by handle address
      const transfer: PendingTransfer = { curl, handle: easyHandle, handleAddr, resolve, reject };
      this.pendingTransfers.set(handleAddr, transfer);
      this.curlToAddr.set(curl, handleAddr);

      // Start polling if not already
      this.startPolling();
    });
  }

  /**
   * Start the poll loop if not already running
   */
  private startPolling(): void {
    if (this.polling || this.closed) return;
    this.polling = true;
    this.pollLoop();
  }

  /**
   * Main poll loop - runs via setImmediate to avoid blocking
   */
  private pollLoop(): void {
    if (this.closed || !this.handle || this.pendingTransfers.size === 0) {
      this.polling = false;
      return;
    }

    // Perform any ready transfers
    const { code: performCode, runningHandles } = curl_multi_perform(this.handle);

    if (performCode !== CurlMCode.CURLM_OK && performCode !== CurlMCode.CURLM_CALL_MULTI_PERFORM) {
      // Error - fail all pending transfers
      const error = new Error(`curl_multi_perform failed: ${curl_multi_strerror(performCode)}`);
      this.failAllPending(error);
      this.polling = false;
      return;
    }

    // Check for completed transfers
    this.checkCompleted();

    // If there are still running handles, continue polling
    if (runningHandles > 0 || this.pendingTransfers.size > 0) {
      // Use curl_multi_poll to wait for activity (with 10ms timeout)
      const { code: pollCode } = curl_multi_poll(this.handle, 10);

      if (pollCode !== CurlMCode.CURLM_OK) {
        const error = new Error(`curl_multi_poll failed: ${curl_multi_strerror(pollCode)}`);
        this.failAllPending(error);
        this.polling = false;
        return;
      }

      // Schedule next iteration
      this.pollTimer = setImmediate(() => this.pollLoop());
    } else {
      this.polling = false;
    }
  }

  /**
   * Find a pending transfer by handle address
   */
  private findPendingByHandle(completedHandle: CurlHandle): PendingTransfer | null {
    const handleAddr = getHandleAddress(completedHandle);
    return this.pendingTransfers.get(handleAddr) || null;
  }

  /**
   * Check for completed transfers and resolve/reject their promises
   */
  private checkCompleted(): void {
    if (!this.handle) return;

    let info = curl_multi_info_read(this.handle);

    while (info.message) {
      const msg = info.message;

      if (msg.msg === CurlMsg.CURLMSG_DONE) {
        const pending = this.findPendingByHandle(msg.easyHandle);

        if (pending) {
          // Remove from multi handle
          curl_multi_remove_handle(this.handle, pending.handle);
          this.pendingTransfers.delete(pending.handleAddr);
          this.curlToAddr.delete(pending.curl);

          // Resolve or reject based on result
          if (msg.result === CurlCode.CURLE_OK) {
            pending.resolve({ code: msg.result });
          } else {
            pending.reject(new Error(`Transfer failed with code ${msg.result}`));
          }
        }
      }

      info = curl_multi_info_read(this.handle);
    }
  }

  /**
   * Fail all pending transfers with an error
   */
  private failAllPending(error: Error): void {
    for (const [, pending] of this.pendingTransfers) {
      if (this.handle) {
        curl_multi_remove_handle(this.handle, pending.handle);
      }
      pending.reject(error);
    }
    this.pendingTransfers.clear();
    this.curlToAddr.clear();
  }

  /**
   * Cancel a specific transfer
   */
  cancel(curl: Curl): boolean {
    if (!this.handle) return false;

    const handleAddr = this.curlToAddr.get(curl);
    if (handleAddr === undefined) return false;

    const pending = this.pendingTransfers.get(handleAddr);
    if (!pending) return false;

    curl_multi_remove_handle(this.handle, pending.handle);
    this.pendingTransfers.delete(handleAddr);
    this.curlToAddr.delete(curl);
    pending.reject(new Error("Transfer cancelled"));

    return true;
  }

  /**
   * Get number of active transfers
   */
  get activeCount(): number {
    return this.pendingTransfers.size;
  }

  /**
   * Check if multi handle is closed
   */
  get isClosed(): boolean {
    return this.closed;
  }

  /**
   * Close the multi handle and cleanup resources
   */
  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;

    // Cancel poll timer
    if (this.pollTimer) {
      clearImmediate(this.pollTimer);
      this.pollTimer = null;
    }

    // Fail all pending transfers
    this.failAllPending(new Error("CurlMulti closed"));

    // Cleanup multi handle
    if (this.handle) {
      curl_multi_cleanup(this.handle);
      this.handle = null;
    }
  }
}

// Shared multi instance for simple use cases
let sharedMulti: CurlMulti | null = null;

/**
 * Get or create a shared CurlMulti instance
 */
export function getSharedMulti(): CurlMulti {
  if (!sharedMulti || sharedMulti.isClosed) {
    sharedMulti = new CurlMulti({
      maxTotalConnections: 100,
      maxHostConnections: 6,
      pipelining: true,
    });
  }
  return sharedMulti;
}

/**
 * Close the shared multi instance
 */
export async function closeSharedMulti(): Promise<void> {
  if (sharedMulti) {
    await sharedMulti.close();
    sharedMulti = null;
  }
}
