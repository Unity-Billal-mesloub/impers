import { curl_slist_append, curl_slist_free_all } from "../ffi/libcurl.js";

export class SList {
  pointer: unknown | null;

  constructor() {
    this.pointer = null;
  }

  append(value: string): this {
    this.pointer = curl_slist_append(this.pointer, value);
    return this;
  }

  free(): void {
    if (this.pointer) {
      curl_slist_free_all(this.pointer);
      this.pointer = null;
    }
  }
}
