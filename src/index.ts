import React from "react";
import { defaultParse, isWindowUndefined } from "./helpers";

interface UseSearchParamOptions<T> {
  sanitize?: (unsanitized: string) => string;
  parse?: (unparsed: string) => T;
  validate?: (unvalidated: unknown) => T;
  onError?: (e: Error) => void;
  serverSideSearchParams?: string | URLSearchParams;
}

// TODO:
// 1. react to url changes
// 2. combine parse and validate? combine onValidateError and onError?
// 3. improve readme, demos etc

type BuildSearchParamOptions = Pick<
  UseSearchParamOptions<unknown>,
  "onError" | "sanitize"
>;

function buildUseSearchParam(buildOptions: BuildSearchParamOptions = {}) {
  return function useSearchParam<T>(
    searchParam: string,
    hookOptions: UseSearchParamOptions<T> = {}
  ) {
    const parse =
      hookOptions.parse ?? (defaultParse as (unparsed: string) => T);
    const { serverSideSearchParams } = hookOptions;
    const sanitize = hookOptions.sanitize ?? buildOptions.sanitize;
    const { validate } = hookOptions;

    function getSearch() {
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
    }

    function getSearchParamVal(): T | null {
      try {
        const search = getSearch();
        if (search === null) {
          return null;
        }

        const urlParams = new URLSearchParams(search);
        const initialParamVal = urlParams.get(searchParam);
        if (initialParamVal === null) {
          return null;
        }

        const sanitizedVal =
          sanitize instanceof Function
            ? sanitize(initialParamVal)
            : initialParamVal;
        const parsedVal = parse(sanitizedVal);
        const validatedVal =
          validate instanceof Function ? validate(parsedVal) : parsedVal;

        return validatedVal;
      } catch (e) {
        buildOptions.onError?.(e);
        hookOptions.onError?.(e);
        return null;
      }
    }

    const [searchParamVal] = React.useState<T | null>(() =>
      getSearchParamVal()
    );

    return searchParamVal;
  };
}

const useSearchParam = buildUseSearchParam();

export { useSearchParam, buildUseSearchParam };
export type { UseSearchParamOptions, BuildSearchParamOptions };
