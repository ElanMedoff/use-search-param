import React from "react";
import { defaultParse, isWindowUndefined } from "./helpers";

interface UseSearchParamOptions<T, DefaultValue extends T | undefined = T> {
  /**
   * @param `unsanitized` The raw string pulled from the URL search param.
   * @returns The sanitized string.
   */
  sanitize?: (unsanitized: string) => string;
  /**
   * @param `unparsed` The result of `sanitize` is passed as `unparsed`.
   * @returns A parsed value of the type `T`, i.e the type returned by `useSearchParam`
   */
  parse?: (unparsed: string) => T;
  /**
   * `validate` is expected to validate and return the `unvalidated` argument passed to it (presumably of type `T`), throw an error, or return null. If an error is thrown, `onError` is called and `useSearchParamState` returns `defaultValue` - which itself defaults to `null`.
   *
   * @param `unvalidated` The result of `parse` is passed as `unvalidated`.
   * @returns The `unvalidated` argument now validated as of type `T`, or `null`.
   */
  validate?: (unvalidated: unknown) => T | null;
  /**
   * A value of type `T`, i.e. the type returned by `useSearchParam`.
   */
  defaultValue?: DefaultValue;
  /**
   * A value of type `string | URLSearchParams`.
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
  UseSearchParamOptions<unknown, unknown>,
  "sanitize" | "parse" | "onError" | "defaultValue"
>;

function buildUseSearchParam(buildOptions: BuildUseSearchParamOptions = {}) {
  return function useSearchParam<T, DefaultValue extends T | undefined = T>(
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
    hookOptions: UseSearchParamOptions<T, DefaultValue> = {},
  ) {
    type UseSearchParamReturn = () => DefaultValue extends undefined
      ? T | null
      : T;
    type UseSearchParamOptionsParse = Required<
      UseSearchParamOptions<T, DefaultValue>
    >["parse"];
    type UseSearchParamOptionsDefaultValue = Required<
      UseSearchParamOptions<T, DefaultValue>
    >["defaultValue"];

    const parse =
      hookOptions.parse ??
      (buildOptions.parse as UseSearchParamOptionsParse) ??
      (defaultParse as UseSearchParamOptionsParse);
    const sanitize = hookOptions.sanitize ?? buildOptions.sanitize;
    const defaultValue =
      hookOptions.defaultValue ??
      (buildOptions.defaultValue as UseSearchParamOptionsDefaultValue) ??
      null;
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

    const getSearchParam = React.useCallback(() => {
      try {
        const search = maybeGetSearch();
        if (search === null) {
          return defaultValue;
        }

        const urlParams = new URLSearchParams(search);
        const rawSearchParam = urlParams.get(searchParam);
        if (rawSearchParam === null) {
          return defaultValue;
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
        return defaultValue;
      }
      // avoid including non-primitives provided by the user since they're probably not referentially stable
    }, [maybeGetSearch, searchParam]) as () => UseSearchParamReturn;

    React.useEffect(() => {
      const onEvent = () => {
        setSearchParamVal(getSearchParam());
      };
      window.addEventListener("popstate", onEvent);
      return () => {
        window.removeEventListener("popstate", onEvent);
      };
    }, [getSearchParam]);

    const [searchParamVal, setSearchParamVal] =
      React.useState<UseSearchParamReturn>(() => getSearchParam());

    return searchParamVal;
  };
}

const useSearchParam = buildUseSearchParam();

export { useSearchParam, buildUseSearchParam };
export type { UseSearchParamOptions, BuildUseSearchParamOptions };
