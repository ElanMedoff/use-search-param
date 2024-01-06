import React from "react";
import { defaultParse, isWindowUndefined } from "./helpers";

interface UseSearchParamOptions<T> {
  /**
   * @param `unsanitized` The raw string pulled from the URL search param.
   * @returns The sanitized string.
   */
  sanitize?: (unsanitized: string) => string;
  /**
   * @param `unparsed` The result of `sanitize` is passed as `unparsed`.
   * @returns A parsed value of the type `T`, i.e the type of `initialState`.
   */
  parse?: (unparsed: string) => T;
  /**
   * `validate` is expected to validate and return the `unvalidated` argument passed to it (presumably of type `T`), throw an error, or return null. If an error is thrown, `onError` is called and `useSearchParamState` returns the initial state.
   *
   * @param `unvalidated` The result of `parse` is passed as `unvalidated`.
   * @returns The `unvalidated` argument now validated as of type `T`, or `null`.
   */
  validate?: (unvalidated: unknown) => T | null;
  /**
   * A value of type `string` or `URLSearchParams`.
   *
   * When passed, `serverSideSearchParams` will be used when `window` is `undefined` to access the URL search param. This is useful for generating content on the server, i.e. with Next.js.
   */
  serverSideSearchParams?: string | URLSearchParams;
  /**
   * @param `error` The error caught in one of `useSearchParamState`'s `try` `catch` blocks.
   * @returns
   */
  onError?: (error: unknown) => void;
}

type BuildUseSearchParamOptions = Pick<
  UseSearchParamOptions<unknown>,
  "sanitize" | "parse" | "onError"
>;

function buildUseSearchParam(buildOptions: BuildUseSearchParamOptions = {}) {
  return function useSearchParam<T>(
    /**
     * The name of the URL search param to read from and write to.
     *
     * See MDN's documentation on [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) for more info.
     */
    searchParam: string,
    /**
     * Options passed by a particular instance of `useSearchParamState`.
     *
     * When an option is passed to both `useSearchParamState` and `buildUseSearchParam`, only the option passed to `useSearchParamState` is respected. The exception is an `onError` option passed to both, in which case both `onError`s are called.
     */
    hookOptions: UseSearchParamOptions<T> = {},
  ) {
    const parse =
      hookOptions.parse ??
      (buildOptions.parse as Required<UseSearchParamOptions<T>>["parse"]) ??
      (defaultParse as Required<UseSearchParamOptions<T>>["parse"]);
    const sanitize = hookOptions.sanitize ?? buildOptions.sanitize;
    const { validate, serverSideSearchParams } = hookOptions;

    const maybeGetSearch = React.useCallback(() => {
      if (isWindowUndefined()) {
        if (serverSideSearchParams instanceof URLSearchParams) {
          return serverSideSearchParams.toString();
        }
        if (typeof serverSideSearchParams === "string") {
          return serverSideSearchParams;
        }
        return null;
      }
      return window.location.search;
    }, [serverSideSearchParams]);

    const getSearchParam = React.useCallback((): T | null => {
      try {
        const search = maybeGetSearch();
        if (search === null) {
          return null;
        }

        const urlParams = new URLSearchParams(search);
        const rawSearchParam = urlParams.get(searchParam);
        if (rawSearchParam === null) {
          return null;
        }

        const sanitized =
          sanitize instanceof Function
            ? sanitize(rawSearchParam)
            : rawSearchParam;
        const parsed = parse(sanitized);
        const validated =
          validate instanceof Function ? validate(parsed) : parsed;

        return validated;
      } catch (e) {
        buildOptions.onError?.(e);
        hookOptions.onError?.(e);
        return null;
      }
    }, [maybeGetSearch, searchParam]);

    React.useEffect(() => {
      const onEvent = () => {
        setSearchParamVal(getSearchParam());
      };
      window.addEventListener("popstate", onEvent);
      return () => {
        window.removeEventListener("popstate", onEvent);
      };
    }, [getSearchParam]);

    const [searchParamVal, setSearchParamVal] = React.useState<T | null>(() =>
      getSearchParam(),
    );

    return searchParamVal;
  };
}

const useSearchParam = buildUseSearchParam();

export { useSearchParam, buildUseSearchParam };
export type { UseSearchParamOptions, BuildUseSearchParamOptions };
