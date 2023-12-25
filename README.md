# use-search-param

A React hook to safely and easily read from URL search params.

[![npm](https://img.shields.io/npm/v/use-search-param)](https://www.npmjs.com/package/use-search-param)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/use-search-param)](https://bundlephobia.com/package/use-search-param)
[![npm](https://img.shields.io/npm/dw/use-search-param)](https://www.npmjs.com/package/use-search-param)
[![NPM](https://img.shields.io/npm/l/use-search-param)](https://github.com/ElanMedoff/use-search-param/blob/master/LICENSE)
[![Static Badge](https://img.shields.io/badge/dependencies%20-%200%20-%20green)](https://github.com/ElanMedoff/use-search-param/blob/master/package.json)

![image](https://elanmed.dev/npm-packages/use-search-param-logo.png)

## Basic usage

```tsx
import { useSearchParam } from "use-search-param";

function Demo() {
  const counter = useSearchParam<number>("c");
}
```

or

```tsx
import { useSearchParam } from "use-search-param";
import { z } from "zod";

function Demo() {
  const counter = useSearchParam<number>("c", {
    validate: z.number().parse,
  });
}
```

## Explanation

On the first render, `useSearchParam` will set `counter` to the value read from the `c` URL search param.

By default, the `c` search param is read using `window.location.search`. If the `window` object is `undefined`, `useSearchParam` will use the `serverSideSearchParams` instead to read from the URL. If `serverSideSearchParams` is also not provided, `counter` will be set to `null`.

If the `c` search param does not exist, `counter` will be set to `null`.

Once the `c` search param is accessed, the raw string is passed to `sanitize`, the output of `sanitize` is passed to `parse`, and finally the output of `parse` is passed to `validate`. Note that `useSearchParam` aims to return a _parsed_ value, not a _stringified_ value!

If `sanitize`, `parse`, or `validate` throw an error, the `onError` option is called, and `counterVal` is set to `null`. Additionally if `validate` returns `null`, `counter` will be set to `null`.

Otherwise, `counter` is set to the sanitized, parsed, and validated value in the `c` search param.

## Options

`useSearchParam` accepts the following options:

```tsx
interface UseSearchParamOptions<T> {
  sanitize?: (unsanitized: string) => string;
  parse?: (unparsed: string) => T;
  validate?: (unvalidated: unknown) => T | null;
  onError?: (error: unknown) => void;
  serverSideSearchParams?: string | URLSearchParams;
}
```

Note that `sanitize`, `parse`, and `validate` run in the following order:

```tsx
// simplified
const rawSearchParam = new URLSearchParams(window.location.search).get(
  searchParam,
);
const sanitized = options.sanitize(rawSearchParam);
const parsed = options.parse(sanitized);
const validated = options.validate(parsed);

return validated;
```

### `sanitize`

A function with the following type: `(unsanitized: string) => string`.

`sanitize` is called with the raw string pulled from the URL search param.

`sanitize` can be passed directly to `useSearchParam`, or to `buildUseSearchParam`. When a `sanitize` option is passed to both, only the `sanitize` passed to `useSearchParam` will be called.

`sanitize` has no default value.

### `parse`

A function with the following type: `(unparsed: string) => T`.

The result of `sanitize` is passed as the `unparsed` argument to `parse`.

`parse` can be passed directly to `useSearchParam`, or to `buildUseSearchParam`. When a `parse` option is passed to both, only the `parse` passed to `useSearchParam` will be called.

`parse` defaults to the following function:

```ts
export function defaultParse(unparsed: string) {
  if (unparsed === "null") return null;
  if (unparsed === "undefined") return undefined;
  if (unparsed === "true") return true;
  if (unparsed === "false") return false;

  const maybeNum = parseFloat(unparsed);
  if (!Number.isNaN(maybeNum)) return maybeNum;

  try {
    return JSON.parse(unparsed);
  } catch {
    return unparsed;
  }
}
```

### `validate`

A function with the following type: `(unvalidated: unknown) => T | null`.

The result of `parse` is passed as the `unvalidated` argument to `validate`.

`validate` is expected to validate and return the `unvalidated` argument passed to it (presumably of type `T`), explicitly return `null`, or throw an error. If an error is thrown, `onError` is called and `useSearchParam` returns `null`.

`validate` has no default value.

### `onError`

A function with the following type: `(error: unknown) => void`.

Most actions in `useSearchParam` are wrapped in a `try` `catch` block - `onError` is called whenever the `catch` block is reached. This includes situations when `sanitize`, `parse`, or `validate` throw an error.

`onError` can be passed directly to `useSearchParam`, or to `buildUseSearchParam`. When an `onError` option is passed to both, both the functions will be called.

### `serverSideSearchParams`

A value of type `string` or `URLSearchParams`.

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

## "Building" `useSearchParam`

You can also build the hook yourself to implicitly pass `sanitize` and `onError` options to every instance of `useSearchParam`:

```tsx
import { buildUseSearchParam } from "use-search-param";

// import this instance of `useSearchParam` in your components
export const useSearchParam = buildUseSearchParam({
  sanitize: (unsanitized) => yourSanitizer(unsanitized),
});
```
