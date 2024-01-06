// issues mocking window itself as undefined, interferes with the test runner
export function isWindowUndefined() {
  return typeof window === "undefined";
}

export function defaultParse(unparsed: string) {
  // JSON.parse errors on "undefined"
  if (unparsed === "undefined") return undefined;

  // parseFloat coerces bigints to numbers
  const maybeNum = parseFloat(unparsed);
  if (!Number.isNaN(maybeNum)) return maybeNum;

  try {
    return JSON.parse(unparsed);
  } catch {
    return unparsed;
  }
}
