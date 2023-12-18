import React from "react";
import { defaultParse, isWindowUndefined } from "./helpers";

interface UseSearchParamOptions<T> {
  sanitize?: (unsanitized: string) => string;
  parse?: (unparsed: string) => T;
  validate?: (unvalidated: unknown) => T | null;
  serverSideSearchParams?: string | URLSearchParams;
  onError?: (e: unknown) => void;
}

type BuildSearchParamOptions = Pick<
  UseSearchParamOptions<unknown>,
  "sanitize" | "parse" | "onError"
>;

function buildUseSearchParam(buildOptions: BuildSearchParamOptions = {}) {
  return function useSearchParam<T>(
    searchParam: string,
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
      const reactToPopState = () => {
        setSearchParamVal(getSearchParam());
      };

      window.addEventListener("popstate", reactToPopState);
      window.addEventListener("pushstate", reactToPopState);
      window.addEventListener("replacestate", reactToPopState);

      return () => {
        window.removeEventListener("popstate", reactToPopState);
        window.removeEventListener("pushstate", reactToPopState);
        window.removeEventListener("replacestate", reactToPopState);
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
export type { UseSearchParamOptions, BuildSearchParamOptions };
