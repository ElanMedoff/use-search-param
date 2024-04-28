import React from "react";
import { defaultParse, isWindowUndefined } from "./helpers";

// TODO: rename back to UseSearchParamOptions?
interface Options<TVal> {
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
// TODO: deprecate next major version
type UseSearchParamOptions<TVal> = Options<TVal>;

type BuildOptions = Pick<Options<unknown>, "sanitize" | "parse" | "onError">;
// TODO: deprecate next major version
type BuildUseSearchParamOptions = BuildOptions;

function maybeGetSearchParam<TVal>({
  searchParamKey,
  serverSideSearchParams,
  sanitize,
  parse,
  validate,
  buildOnError,
  localOnError,
}: {
  searchParamKey: string;
  serverSideSearchParams: Options<TVal>["serverSideSearchParams"];
  sanitize: Required<Options<TVal>>["sanitize"];
  validate: Required<Options<TVal>>["validate"];
  buildOnError: Options<TVal>["onError"];
  localOnError: Options<TVal>["onError"];
  parse: Required<Options<TVal>>["parse"];
}) {
  try {
    let search: string | null;
    if (isWindowUndefined()) {
      if (typeof serverSideSearchParams === "string") {
        search = serverSideSearchParams;
      } else {
        search = null;
      }
    } else {
      search = window.location.search;
    }

    if (search === null) {
      return null;
    }

    const urlParams = new URLSearchParams(search);
    const rawSearchParamVal = urlParams.get(searchParamKey);
    if (rawSearchParamVal === null) {
      return null;
    }

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

function buildGetSearchParam(buildOptions: BuildOptions = {}) {
  return function getSearchParam<TVal>(
    /**
     * The name of the URL search param to read from and write to.
     *
     * See MDN's documentation on [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) for more info.
     */
    searchParamKey: string,
    /**
     * Options passed by a particular instance of `getSearchParam`.
     *
     * When an option is passed to both `getSearchParam` and `buildGetSearchParam`, only the option passed to `getSearchParam` is respected. The exception is an `onError` option passed to both, in which case both `onError`s are called.
     */
    localOptions: Options<TVal> = {},
  ) {
    const parse =
      localOptions.parse ??
      (buildOptions.parse as Options<TVal>["parse"]) ??
      (defaultParse as Required<Options<TVal>>["parse"]);
    const sanitize =
      localOptions.sanitize ??
      buildOptions.sanitize ??
      ((unsanitized: string) => unsanitized);
    const validate =
      localOptions.validate ?? ((unvalidated: unknown) => unvalidated as TVal);
    const { serverSideSearchParams } = localOptions;

    return maybeGetSearchParam({
      searchParamKey,
      serverSideSearchParams,
      sanitize,
      parse,
      validate,
      buildOnError: buildOptions.onError,
      localOnError: localOptions.onError,
    });
  };
}

const getSearchParam = buildGetSearchParam();

function buildUseSearchParam(buildOptions: BuildOptions = {}) {
  return function useSearchParam<TVal>(
    /**
     * The name of the URL search param to read from and write to.
     *
     * See MDN's documentation on [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) for more info.
     */
    searchParamKey: string,
    /**
     * Options passed by a particular instance of `useSearchParam`.
     *
     * When an option is passed to both `useSearchParam` and `buildUseSearchParam`, only the option passed to `useSearchParam` is respected. The exception is an `onError` option passed to both, in which case both `onError`s are called.
     */
    hookOptions: Options<TVal> = {},
  ) {
    const parseOption =
      hookOptions.parse ??
      (buildOptions.parse as Options<TVal>["parse"]) ??
      (defaultParse as Required<Options<TVal>>["parse"]);
    const sanitizeOption =
      hookOptions.sanitize ??
      buildOptions.sanitize ??
      ((unsanitized: string) => unsanitized);
    const validateOption =
      hookOptions.validate ?? ((unvalidated: unknown) => unvalidated as TVal);
    const { serverSideSearchParams } = hookOptions;

    const parseRef = React.useRef(parseOption);
    const sanitizeRef = React.useRef(sanitizeOption);
    const validateRef = React.useRef(validateOption);
    const buildOnErrorRef = React.useRef(buildOptions.onError);
    const hookOnErrorRef = React.useRef(hookOptions.onError);

    React.useEffect(() => {
      parseRef.current = parseOption;
      sanitizeRef.current = sanitizeOption;
      validateRef.current = validateOption;
      buildOnErrorRef.current = buildOptions.onError;
      hookOnErrorRef.current = hookOptions.onError;
    });

    React.useEffect(() => {
      const onEvent = () => {
        const newSearchParamVal = maybeGetSearchParam({
          searchParamKey,
          serverSideSearchParams,
          sanitize: sanitizeRef.current,
          parse: parseRef.current,
          validate: validateRef.current,
          buildOnError: buildOnErrorRef.current,
          localOnError: hookOnErrorRef.current,
        });

        setSearchParamVal(newSearchParamVal);
      };
      window.addEventListener("popstate", onEvent);
      return () => {
        window.removeEventListener("popstate", onEvent);
      };
    }, [searchParamKey, serverSideSearchParams]);

    const [searchParamVal, setSearchParamVal] = React.useState<TVal | null>(
      () =>
        maybeGetSearchParam({
          searchParamKey,
          serverSideSearchParams,
          sanitize: sanitizeRef.current,
          parse: parseRef.current,
          validate: validateRef.current,
          buildOnError: buildOptions.onError,
          localOnError: hookOptions.onError,
        }),
    );

    return searchParamVal;
  };
}

const useSearchParam = buildUseSearchParam();

export {
  useSearchParam,
  buildUseSearchParam,
  getSearchParam,
  buildGetSearchParam,
};
export type {
  UseSearchParamOptions,
  BuildUseSearchParamOptions,
  BuildOptions,
  Options,
};
