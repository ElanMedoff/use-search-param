import { defaultParse } from "./utils";
import { _getProcessedSearchParamVal, Options } from "./shared";

type GetSearchParamFromSearchStringOptions<TVal> = Pick<
  Options<TVal>,
  "sanitize" | "parse" | "validate" | "onError"
> & {
  /**
   * The URL search string to read the search param from.
   *
   * Any valid input to the URLSearchParams constructor.
   *
   * See MDN's documentation on [URL.search](https://developer.mozilla.org/en-US/docs/Web/API/URL/search) for more info.
   */
  searchString: string;
  /**
   * The name of the URL search param to read from.
   *
   * See MDN's documentation on [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) for more info.
   */
  searchParamKey: string;
};

function getSearchParamFromSearchString<TVal>(
  args: GetSearchParamFromSearchStringOptions<TVal>,
) {
  const parse =
    args.parse ?? (defaultParse as Required<Options<TVal>>["parse"]);
  const sanitize = args.sanitize ?? ((unsanitized: string) => unsanitized);
  const validate =
    args.validate ?? ((unvalidated: unknown) => unvalidated as TVal);
  const onError = args.onError ?? (() => {});

  const urlParams = new URLSearchParams(args.searchString);
  const rawSearchParamVal = urlParams.get(args.searchParamKey);
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
export type { GetSearchParamFromSearchStringOptions };
