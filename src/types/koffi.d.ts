declare module "koffi" {
  type KoffiLibrary = {
    func(signature: string): (...args: unknown[]) => unknown;
  };

  type KoffiType = unknown;

  const koffi: {
    load(path: string): KoffiLibrary;

    // Type definitions
    struct(name: string, members: Record<string, string>): KoffiType;
    pointer(type: string | KoffiType): KoffiType;
    out(type: string | KoffiType): KoffiType;
    inout(type: string | KoffiType): KoffiType;

    // Callback/function pointer support
    proto(signature: string): KoffiType;
    register(fn: unknown, type: KoffiType): unknown;
    callback(signature: string, fn: unknown): unknown;

    // Memory operations
    decode(value: unknown, type: string | KoffiType): unknown;
    encode(value: unknown, type: string | KoffiType): Buffer;

    // Utility
    sizeof(type: string | KoffiType): number;
    alignof(type: string | KoffiType): number;
    array(type: string | KoffiType, length: number): KoffiType;

    // Pointer operations
    address(value: unknown): bigint;

    // Introspection
    introspect(type: KoffiType): unknown;
  };

  export default koffi;
}
