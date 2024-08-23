import { isWindowUndefined } from "./utils";

export interface Options<TVal> {
  /**
   * @param `unsanitized` The raw string pulled from the URL search param.
   * @returns The sanitized string.
   */
  sanitize?: (unsanitized: string) => string;
  /**
   * @param `unparsed` The result of `sanitize` is passed as `unparsed`.
   * @returns A parsed value of the type `TVal`, i.e the type of the parsed search param value.
   */
  parse?: (unparsed: string) => TVal;
  /**
   * `validate` is expected to validate and return the `unvalidated` argument passed to it (presumably of type `TVal`), throw an error, or return null. If an error is thrown, `onError` is called and `useSearchParam` returns `null`.
   *
   * @param `unvalidated` The result of `parse` is passed as `unvalidated`.
   * @returns The `unvalidated` argument now validated as type `TVal`, or `null`.
   */
  validate?: (unvalidated: unknown) => TVal | null;
  /**
   * A value of type `string` - any valid `string` input to the `URLSearchParams` constructor.
   *
   * When passed, `serverSideSearchParams` will be used when `window` is `undefined` to access the URL search param. This is useful for generating content on the server, i.e. with Next.js.
   */
  serverSideSearchParams?: string;
  /**
   * @param `error` The error caught in one of the `try` `catch` blocks.
   * @returns
   */
  onError?: (error: unknown) => void;
}

export function _getProcessedSearchParamVal<TVal>({
  rawSearchParamVal,
  sanitize,
  parse,
  validate,
  buildOnError,
  localOnError,
}: {
  rawSearchParamVal: string;
  sanitize: Required<Options<TVal>>["sanitize"];
  validate: Required<Options<TVal>>["validate"];
  buildOnError: Options<TVal>["onError"];
  localOnError: Options<TVal>["onError"];
  parse: Required<Options<TVal>>["parse"];
}) {
  try {
    const sanitized = sanitize(rawSearchParamVal);
    const parsed = parse(sanitized);
    const validated = validate(parsed);

    return validated;
  } catch (e) {
    buildOnError?.(e);
    localOnError?.(e);
    return null;
  }
}

export function _getRawSearchParamVal<TVal>({
  searchParamKey,
  serverSideSearchParams,
  buildOnError,
  localOnError,
}: {
  searchParamKey: string;
  serverSideSearchParams: Options<TVal>["serverSideSearchParams"];
  buildOnError: Options<TVal>["onError"];
  localOnError: Options<TVal>["onError"];
}) {
  try {
    const getSearch = () => {
      if (isWindowUndefined()) {
        if (typeof serverSideSearchParams === "string") {
          return serverSideSearchParams;
        }
        return null;
      }
      return window.location.search;
    };
    const search = getSearch();

    if (search === null) {
      return null;
    }

    const urlParams = new URLSearchParams(search);
    const rawSearchParamVal = urlParams.get(searchParamKey);
    if (rawSearchParamVal === null) {
      return null;
    }

    return rawSearchParamVal;
  } catch (e) {
    buildOnError?.(e);
    localOnError?.(e);
    return null;
  }
}
