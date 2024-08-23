import { defaultParse } from "./utils";
import {
  _getProcessedSearchParamVal,
  _getRawSearchParamVal,
  Options,
} from "./shared";
import { useSyncExternalStore } from "use-sync-external-store/shim";

type BuildOptions = Pick<Options<unknown>, "sanitize" | "parse" | "onError">;

function buildGetSearchParam(buildOptions: BuildOptions = {}) {
  return function getSearchParam<TVal>(
    /**
     * The name of the URL search param to read from.
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

    const rawSearchParamVal = _getRawSearchParamVal({
      searchParamKey,
      serverSideSearchParams,
      buildOnError: buildOptions.onError,
      localOnError: localOptions.onError,
    });
    if (rawSearchParamVal === null) {
      return null;
    }

    return _getProcessedSearchParamVal({
      rawSearchParamVal,
      sanitize,
      parse,
      validate,
      buildOnError: buildOptions.onError,
      localOnError: localOptions.onError,
    });
  };
}

function buildUseSearchParam(buildOptions: BuildOptions = {}) {
  const customEventNames = ["pushState", "replaceState"] as const;
  const eventNames = ["popstate", ...customEventNames] as const;

  // from Wouter: https://github.com/molefrog/wouter/blob/110b6694a9b3220460eed32640fa4778d10bdf52/packages/wouter/src/use-browser-location.js#L57
  const patchKey = Symbol.for("use-search-param");
  if (
    typeof history !== "undefined" &&
    // @ts-expect-error type issues indexing with a symbol
    typeof window[patchKey] === "undefined"
  ) {
    for (const eventName of customEventNames) {
      const original = history[eventName];
      history[eventName] = function (...args) {
        dispatchEvent(new Event(eventName));
        return original.apply(this, args);
      };
    }
    Object.defineProperty(window, patchKey, { value: true });
  }

  const subscribeToEventUpdates = (callback: (event: Event) => void) => {
    for (const eventName of eventNames) {
      window.addEventListener(eventName, callback);
    }
    return () => {
      for (const eventName of eventNames) {
        window.removeEventListener(eventName, callback);
      }
    };
  };

  return function useSearchParam<TVal>(
    /**
     * The name of the URL search param to read from.
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

    const getSnapshot = () =>
      _getRawSearchParamVal({
        searchParamKey,
        serverSideSearchParams,
        buildOnError: buildOptions.onError,
        localOnError: hookOptions.onError,
      });
    const rawSearchParamVal = useSyncExternalStore<string | null>(
      subscribeToEventUpdates,
      getSnapshot,
      getSnapshot,
    );
    if (rawSearchParamVal === null) {
      return null;
    }

    return _getProcessedSearchParamVal({
      rawSearchParamVal,
      buildOnError: buildOptions.onError,
      localOnError: hookOptions.onError,
      parse: parseOption,
      sanitize: sanitizeOption,
      validate: validateOption,
    });
  };
}

const useSearchParam = buildUseSearchParam();
const getSearchParam = buildGetSearchParam();

export {
  useSearchParam,
  buildUseSearchParam,
  getSearchParam,
  buildGetSearchParam,
};

// TODO: deprecate next major version
type UseSearchParamOptions<TVal> = Options<TVal>;
// TODO: deprecate next major version
type BuildUseSearchParamOptions = BuildOptions;

export type {
  UseSearchParamOptions,
  BuildUseSearchParamOptions,
  BuildOptions,
  Options,
};
