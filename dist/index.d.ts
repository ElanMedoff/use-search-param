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
type UseSearchParamOptions<TVal> = Options<TVal>;
type BuildOptions = Pick<Options<unknown>, "sanitize" | "parse" | "onError">;
type BuildUseSearchParamOptions = BuildOptions;
declare function buildGetSearchParam(buildOptions?: BuildOptions): <TVal>(searchParamKey: string, localOptions?: Options<TVal>) => TVal | null;
declare const getSearchParam: <TVal>(searchParamKey: string, localOptions?: Options<TVal>) => TVal | null;
declare function buildUseSearchParam(buildOptions?: BuildOptions): <TVal>(searchParamKey: string, hookOptions?: Options<TVal>) => TVal | null;
declare const useSearchParam: <TVal>(searchParamKey: string, hookOptions?: Options<TVal>) => TVal | null;
export { useSearchParam, buildUseSearchParam, getSearchParam, buildGetSearchParam, };
export type { UseSearchParamOptions, BuildUseSearchParamOptions, BuildOptions, Options, };
