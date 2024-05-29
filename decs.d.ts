declare module "is-plain-object" {
  export function isPlainObject(o: unknown): o is Record<string, unknown>;
}
