import React from "react";
import { isWindowUndefined } from "./helpers";

interface UseSearchParamOptions<T> {
  sanitize?: (unsanitized: string) => string;
  parse?: (unparsed: string) => T;
  validate?: (unvalidated: unknown) => T;
  onValidateError?: (e: unknown) => void;
  onError?: (e: unknown) => void;
  serverSideHref?: string;
}

// TODO:
// 1. react to url changes
// 2. combine parse and validate? combine onValidateError and onError?
// 3. improve readme, demos etc

type BuildSearchParamOptions = Pick<
  UseSearchParamOptions<unknown>,
  "onError" | "sanitize" | "onValidateError"
>;

function buildUseSearchParam(buildOptions: BuildSearchParamOptions = {}) {
  return function useSearchParam<T>(
    searchParam: string,
    hookOptions: UseSearchParamOptions<T> = {}
  ) {
    const parse = hookOptions.parse ?? ((val: string) => JSON.parse(val) as T);
    const serverSideHref = hookOptions.serverSideHref;
    const sanitize = hookOptions.sanitize ?? buildOptions.sanitize;
    const { validate } = hookOptions;

    function getHref() {
      if (isWindowUndefined()) {
        return serverSideHref ?? null;
      }
      return window.location.href;
    }

    function wrappedValidate(val: unknown): T | null {
      try {
        return validate instanceof Function ? validate(val) : (val as T);
      } catch (e) {
        buildOptions?.onValidateError?.(e);
        hookOptions?.onValidateError?.(e);
        return null;
      }
    }

    function getSearchParamVal(): T | null {
      try {
        const href = getHref();
        if (href === null) {
          return null;
        }

        const url = new URL(href);
        const urlParams = url.searchParams;
        const initialParamVal = urlParams.get(searchParam);
        if (initialParamVal === null) {
          return null;
        }

        const sanitizedVal =
          sanitize instanceof Function
            ? sanitize(initialParamVal)
            : initialParamVal;
        const parsedVal = parse(sanitizedVal);
        const validatedVal = wrappedValidate(parsedVal);

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
