# useSearchParam

[![npm version](https://badge.fury.io/js/use-search-param.svg)](https://badge.fury.io/js/use-search-param)
<a href="https://pkg-size.dev/use-search-param?no-peers"><img src="https://pkg-size.dev/badge/install/10098" title="Install size for use-search-param"></a>
<a href="https://pkg-size.dev/use-search-param?no-peers"><img src="https://pkg-size.dev/badge/bundle/1046" title="Bundle size for use-search-param"></a>

`useSearchParam` provides a read-only interface to safely, reliably and easily interact with URL search params.

### Basic usage

```tsx
import { useSearchParam } from "use-search-param";

function Demo() {
  const counter = useSearchParam<number>("counter");
}
```

or

```tsx
import { useSearchParam } from "use-search-param";
import { z } from "zod";

function Demo() {
  const schema = z.number();
  const counter = useSearchParam<number>("counter", {
    validate: schema.parse,
  });
}
```

### Options

`useSearchParam` accepts the following options:

```tsx
interface UseSearchParamOptions<T> {
  sanitize?: (unsanitized: string) => string;
  parse?: (unparsed: string) => T;
  validate?: (unvalidated: unknown) => T;
  onError?: (e: unknown) => void;
  serverSideSearchParams?: string | URLSearchParams;
}
```

Note that `sanitize`, `parse`, and `validate` run in the following order:

```tsx
// simplified
function useSearchParam(searchParam, options) {
  const rawSearchParam = new URLSearchParams(window.location.search).get(
    searchParam
  );
  const sanitized = options.sanitize(rawSearchParam);
  const parsed = options.parse(sanitized);
  const validated = options.validate(parsed);

  return validated;
}
```

#### `sanitize`

A function with the following call signature: `(unsanitized: string) => string`.

`sanitize` is called with the raw string pulled from the URL search param.

`sanitize` can be passed directly to `useSearchParam`, or to `buildUseSearchParam`. When a `sanitize` option is passed to both, only the `sanitize` passed to `useSearchParam` will be called.

`sanitize` has no default value.

#### `parse`

A function with the following call signature: `(unparsed: string) => T`.

The result of `sanitize` is passed as the `unparsed` argument to `parse`.

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

#### `validate`

A function with the following call signature: `(unvalidated: unknown) => T`.

The result of `parse` is passed as the `unvalidated` argument to `validate`.

`validate` has no default value.

#### `onError`

A function with the following call signature: `(e: unknown) => void`.

Most actions in `useSearchParam` are wrapped in a `try` `catch` block - `onError` is called whenever the `catch` block is reached. This includes situations when `sanitize`, `parse`, or `validate` throw an error.

`onError` can be passed directly to `useSearchParam`, or to `buildUseSearchParam`. When an `onError` option is passed to both, both the functions will be called.

#### `serverSideSearchParams`

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

### "Building" `useSearchParam`

You can also build the hook yourself to implicitly pass `sanitize` and `onError` options to every instance of `useSearchParam`:

```tsx
import { buildUseSearchParam } from "use-search-param";

// import this instance of `useSearchParam` in your components
export const useSearchParam = buildUseSearchParam({
  sanitize: (unsanitized) => yourSanitizer(unsanitized),
});
```
