import { isPlainObject } from "is-plain-object";

// issues mocking window itself as undefined, interferes with the test runner
export function isWindowUndefined() {
  return typeof window === "undefined";
}

export function defaultParse(unparsed: string): unknown {
  // JSON.parse errors on "undefined"
  if (unparsed === "undefined") return undefined;

  // Number parses "" to 0
  if (unparsed === "") return "";

  // Number coerces bigints to numbers
  const maybeNum = Number(unparsed);
  if (!Number.isNaN(maybeNum)) return maybeNum;

  try {
    return JSON.parse(unparsed);
  } catch {
    return unparsed;
  }
}

// from React Query: https://github.com/TanStack/query/blob/b0c09aa63d7b8dad84d34ee5ba49d280032e467d/packages/query-core/src/utils.ts#L178
export function hash(val: unknown): string {
  return JSON.stringify(val, (_, val) =>
    isPlainObject(val)
      ? Object.keys(val)
          .sort()
          .reduce((result: Record<string, unknown>, key) => {
            result[key] = val[key];
            return result;
          }, {})
      : val,
  );
}
