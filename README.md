# use-search-param

A React hook to safely and easily read from URL search params.

[![version](https://img.shields.io/npm/v/use-search-param)](https://www.npmjs.com/package/use-search-param)
[![bundle size](https://img.shields.io/bundlephobia/minzip/use-search-param)](https://bundlephobia.com/package/use-search-param)
[![downloads per week](https://img.shields.io/npm/dw/use-search-param)](https://www.npmjs.com/package/use-search-param)
[![package quality](https://packagequality.com/shield/use-search-param.svg)](https://packagequality.com/#?package=use-search-param)
[![license](https://img.shields.io/npm/l/use-search-param)](https://github.com/ElanMedoff/use-search-param/blob/master/LICENSE)
[![dependencies](https://img.shields.io/badge/dependencies%20-%201%20-%20green)](https://github.com/ElanMedoff/use-search-param/blob/master/package.json)

<!-- a hack to get around github sanitizing styles from markdown -->
<br>
<p align="center">
    <img src="https://elanmed.dev/npm-packages/use-search-param-logo.png" width="500px" />
</p>

## Basic usage

```tsx
import { useSearchParam } from "use-search-param";

function Demo() {
  const counter = useSearchParam<number>("c");
  // ...
}
```

or

```tsx
import { useSearchParam } from "use-search-param";
import { z } from "zod";

function Demo() {
  const counter =
    useSearchParam("c", {
      validate: z.number().parse,
    }) ?? 0;
  // ...
}
```

## Explanation

On the first render, `useSearchParam` will read from the `c` URL search param.

By default, the `c` search param is read using `window.location.search`. If the `window` object is `undefined`, `useSearchParam` will use the `serverSideSearchParams` instead to read from the URL. If `serverSideSearchParams` is also not provided, `counter` will be set to `null`.

If the `c` search param does not exist (i.e. `URLSearchParams.get` returns `null`), `counter` will be set to `null`.

Once the `c` search param is accessed, the raw string is passed to `sanitize`, the output of `sanitize` is passed to `parse`, and finally the output of `parse` is passed to `validate`. Note that `useSearchParam` aims to return a _parsed_ value, not a _stringified_ value!

If `sanitize`, `parse`, or `validate` throw an error, the `onError` option is called, and `counterVal` is set to `null`. Additionally if `validate` returns `null`, `counter` will be set to `null`.

Otherwise, `counter` is set to the sanitized, parsed, and validated value in the `c` search param.

## Building your own `useSearchParam`

You can build `useSearchParam` yourself with `buildUseSearchParam` to implicitly pass `sanitize`, `parse`, and `onError` options to every instance of the created hook:

```tsx
import { buildUseSearchParam } from "use-search-param";

// import this instance of `useSearchParam` in your components
export const useSearchParam = buildUseSearchParam({
  sanitize: (unsanitized) => yourSanitizer(unsanitized),
});
```

## Imperative `getSearchParam`

For cases when you want to read from the search param outside a React component, two additional exports are provided: `getSearchParam` and `buildGetSearchParam`. Both have the same function signatures and behavior as their `useSearchParam` and `buildUseSearchParam` counterparts, with one exception: `getSearchParam` has no way to "react" to `popstate` events, unlike `useSearchParam`.

## Adapting `useSearchParam` for your own router

By default, `useSearchParam` will read from `window.location.search` and monkey-patch the global `history` to properly react to `pushState` and `replaceState` events (see the [wouter source code](https://github.com/molefrog/wouter/blob/110b6694a9b3220460eed32640fa4778d10bdf52/packages/wouter/src/use-browser-location.js#L57) for more info on this topic). If you'd rather avoid the monkey-patching and have your existing router trigger any rerenders on route events, you can use `getSearchParamFromSearchString` to build your own hook:

```tsx
// using wouter, for example:
import { useSearch } from "wouter";
import {
  getSearchParamFromSearchString,
  UseAdaptedSearchParamOptions,
} from "use-search-param/router-adapter";

export function useAdaptedSearchParam<TVal>(
  searchParamKey: string,
  options?: UseAdaptedSearchParamOptions<TVal> = {},
) {
  const searchString = useSearch();
  return getSearchParamFromSearchString<TVal>(searchParamKey, {
    searchString,
    ...options,
  });
}
```

## Options

`useSearchParam` accepts the following options:

```tsx
interface Options<TVal> {
  sanitize?: (unsanitized: string) => string;
  parse?: (unparsed: string) => TVal;
  validate?: (unvalidated: unknown) => TVal | null;
  onError?: (error: unknown) => void;
  serverSideSearchParams?: string;
}
```

Note that `sanitize`, `parse`, and `validate` run in the following order:

```tsx
// simplified
const rawSearchParam = new URLSearchParams(window.location.search).get(
  searchParamKey,
);
const sanitized = options.sanitize(rawSearchParam);
const parsed = options.parse(sanitized);
const validated = options.validate(parsed);

return validated;
```

### sanitize

A function with the following type: `(unsanitized: string) => string`.

`sanitize` is called with the raw string pulled from the URL search param.

`sanitize` can be passed directly to `useSearchParam`, or to `buildUseSearchParam`. When a `sanitize` option is passed to both, only the `sanitize` passed to `useSearchParam` will be called.

`sanitize` has no default value.

### parse

A function with the following type: `(unparsed: string) => TValue`.

The result of `sanitize` is passed as the `unparsed` argument to `parse`.

`parse` can be passed directly to `useSearchParam`, or to `buildUseSearchParam`. When a `parse` option is passed to both, only the `parse` passed to `useSearchParam` will be called.

`parse` defaults to the following function:

```ts
function defaultParse(unparsed: string) {
  // JSON.parse errors on "undefined"
  if (unparsed === "undefined") return undefined;

  // Number parses "" to 0
  if (unparsed === "") return "";

  // Number coerces bigints to numbers
  const maybeNum = Number(unparsed);
  if (!Number.isNaN(maybeNum)) return maybeNum;

  try {
    return JSON.parse(unparsed);
  } catch {
    return unparsed;
  }
}
```

### validate

A function with the following type: `(unvalidated: unknown) => TVal | null`.

The result of `parse` is passed as the `unvalidated` argument to `validate`.

`validate` is expected to validate and return the `unvalidated` argument passed to it (presumably of type `TVal`), explicitly return `null`, or throw an error. If an error is thrown, `onError` is called and `useSearchParam` returns `null`.

`validate` has no default value.

### onError

A function with the following type: `(error: unknown) => void`.

Most actions in `useSearchParam` are wrapped in a `try` `catch` block - `onError` is called whenever the `catch` block is reached. This includes situations when `sanitize`, `parse`, or `validate` throw an error.

`onError` can be passed directly to `useSearchParam`, or to `buildUseSearchParam`. When an `onError` option is passed to both, both the functions will be called.

### serverSideSearchParams

A value of type `string` - any valid `string` input to the `URLSearchParams` constructor.

When passed, `serverSideSearchParams` will be used when `window` is `undefined` to access the search params. This is useful for generating content on the server, i.e. with Next.js:

```tsx
import url from "url";

export const getServerSideProps: GetServerSideProps = ({ req }) => {
  const serverSideSearchParams = url.parse(req.url).query;

  return {
    props: { serverSideSearchParams },
  };
};

export default function Home({
  serverSideSearchParams,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const counter = useSearchParam<number>("counter", {
    serverSideSearchParams,
  });

  // has the correct value for `counter` when rendered on the server
  return <div>counter: {counter}</div>;
}
```

Note that if no `serverSideSearchParams` option is passed and `window` is `undefined`, you may encounter hydration errors.

## Testing

The best approach to test uses of `useSearchParam` / `getSearchParam` is by mocking the `window.location` property directly in your tests:

```ts
Object.defineProperty(window, "location", {
  writable: true,
  value: { search: "?counter=1" },
});
```

If you mutate `window.location` directly, i.e.

```ts
window.location = { search: "?counter=1" };
```

You may receive an error that `window.location` is read-only.

Alternatively, you could mock `useSearchParam`/`getSearchParam` itself:

```ts
import * as useSearchParamWrapper from "use-search-param";

jest.spyOn(useSearchParamWrapper, "useSearchParam").mockReturnValue(1);
jest.spyOn(useSearchParamWrapper, "getSearchParam").mockReturnValue(1);
```

But this shadows the actual behavior of `useSearchParam` / `getSearchParam` and any of the options passed, and it may lead to unexpected behavior.
