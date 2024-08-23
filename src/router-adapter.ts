import { defaultParse } from "./utils";
import { _getProcessedSearchParamVal, Options } from "./shared";

type ProcessSearchParamValOptions<TVal> = Pick<
  Options<TVal>,
  "sanitize" | "parse" | "validate" | "onError"
>;

type GetSearchParamFromSearchStringOptions<TVal> =
  ProcessSearchParamValOptions<TVal> & {
    /**
     * The URL search string to read the search param from.
     *
     * Any valid input to the URLSearchParams constructor.
     *
     * See MDN's documentation on [URL.search](https://developer.mozilla.org/en-US/docs/Web/API/URL/search) for more info.
     */
    searchString: string;
  };
type UseAdaptedSearchParamOptions<TVal> = ProcessSearchParamValOptions<TVal>;

function getSearchParamFromSearchString<TVal>(
  /**
   * The name of the URL search param to read from.
   *
   * See MDN's documentation on [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) for more info.
   */
  searchParamKey: string,
  options: GetSearchParamFromSearchStringOptions<TVal>,
) {
  const parse =
    options.parse ?? (defaultParse as Required<Options<TVal>>["parse"]);
  const sanitize = options.sanitize ?? ((unsanitized: string) => unsanitized);
  const validate =
    options.validate ?? ((unvalidated: unknown) => unvalidated as TVal);
  const onError = options.onError ?? (() => {});

  const urlParams = new URLSearchParams(options.searchString);
  const rawSearchParamVal = urlParams.get(searchParamKey);
  if (rawSearchParamVal === null) {
    return null;
  }

  return _getProcessedSearchParamVal({
    rawSearchParamVal,
    sanitize,
    parse,
    validate,
    buildOnError: onError,
    localOnError: () => {},
  });
}

export { getSearchParamFromSearchString };
export type {
  GetSearchParamFromSearchStringOptions,
  UseAdaptedSearchParamOptions,
};
