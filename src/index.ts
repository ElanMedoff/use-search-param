import React from "react";
import { defaultParse, isWindowUndefined } from "./helpers";

interface Options<T> {
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
   * A value of type `string` - any valid `string` input to the `URLSearchParams` constructor.
   *
   * When passed, `serverSideSearchParams` will be used when `window` is `undefined` to access the URL search param. This is useful for generating content on the server, i.e. with Next.js.
   */
  serverSideSearchParams?: string;
  /**
   * @param `error` The error caught in one of `useSearchParamState`'s `try` `catch` blocks.
   * @returns
   */
  onError?: (error: unknown) => void;
}
// to be deprecated next major version
type UseSearchParamOptions<T> = Options<T>;

type BuildOptions = Pick<Options<unknown>, "sanitize" | "parse" | "onError">;
// to be deprecated next major version
type BuildUseSearchParamOptions = BuildOptions;

function maybeGetSearchParam<T>({
  searchParam,
  serverSideSearchParams,
  sanitize,
  parse,
  validate,
  buildOnError,
  localOnError,
}: {
  searchParam: string;
  serverSideSearchParams: Options<T>["serverSideSearchParams"];
  sanitize: Options<T>["sanitize"];
  validate: Options<T>["validate"];
  buildOnError: Options<T>["onError"];
  localOnError: Options<T>["onError"];
  // required because it has a default value
  parse: Required<Options<T>>["parse"];
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
    const rawSearchParam = urlParams.get(searchParam);
    if (rawSearchParam === null) {
      return null;
    }

    const sanitized =
      sanitize instanceof Function ? sanitize(rawSearchParam) : rawSearchParam;
    const parsed = parse(sanitized);
    const validated = validate instanceof Function ? validate(parsed) : parsed;

    return validated;
  } catch (e) {
    buildOnError?.(e);
    localOnError?.(e);
    return null;
  }
}

function buildGetSearchParam(buildOptions: BuildOptions = {}) {
  return function getSearchParam<T>(
    /**
     * The name of the URL search param to read from and write to.
     *
     * See MDN's documentation on [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) for more info.
     */
    searchParam: string,
    /**
     * Options passed by a particular instance of `getSearchParam`.
     *
     * When an option is passed to both `getSearchParam` and `buildGetSearchParam`, only the option passed to `getSearchParam` is respected. The exception is an `onError` option passed to both, in which case both `onError`s are called.
     */
    localOptions: Options<T> = {},
  ) {
    const parse =
      localOptions.parse ??
      (buildOptions.parse as Options<T>["parse"]) ??
      (defaultParse as Required<Options<T>>["parse"]);
    const sanitize = localOptions.sanitize ?? buildOptions.sanitize;
    const { validate, serverSideSearchParams } = localOptions;

    return maybeGetSearchParam({
      buildOnError: buildOptions.onError,
      localOnError: localOptions.onError,
      parse,
      sanitize,
      searchParam,
      serverSideSearchParams,
      validate,
    });
  };
}

const getSearchParam = buildGetSearchParam();

function buildUseSearchParam(buildOptions: BuildOptions = {}) {
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
    hookOptions: Options<T> = {},
  ) {
    const parse =
      hookOptions.parse ??
      (buildOptions.parse as Options<T>["parse"]) ??
      (defaultParse as Required<Options<T>>["parse"]);
    const sanitize = hookOptions.sanitize ?? buildOptions.sanitize;
    const { validate, serverSideSearchParams } = hookOptions;

    React.useEffect(() => {
      const onEvent = () => {
        const newSearchParamVal = maybeGetSearchParam({
          searchParam,
          buildOnError: buildOptions.onError,
          localOnError: hookOptions.onError,
          parse,
          sanitize,
          serverSideSearchParams,
          validate,
        });

        setSearchParamVal(newSearchParamVal);
      };
      window.addEventListener("popstate", onEvent);
      return () => {
        window.removeEventListener("popstate", onEvent);
      };
    }, [searchParam, serverSideSearchParams]);

    const [searchParamVal, setSearchParamVal] = React.useState<T | null>(() =>
      maybeGetSearchParam({
        searchParam,
        buildOnError: buildOptions.onError,
        localOnError: hookOptions.onError,
        parse,
        sanitize,
        serverSideSearchParams,
        validate,
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
