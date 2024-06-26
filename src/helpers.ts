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
