# useSearchParam

[![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/use-search-param)

⚠️ Warning: a work in progress! ⚠️

`useSearchParam` provides a read-only interface to safely, reliably and effortlessly interact with URL search params.

### Basic usage

```tsx
import { useSearchParam } from "use-search-param";

function Demo() {
  const counter = useSearchParam<number>("counter");
}
```

### Options

`useSearchParam` accepts the following options:

```tsx
interface UseSearchParamOptions<T> {
  sanitize?: (unsanitized: string) => string;
  parse?: (unparsed: string) => T;
  validate?: (unvalidated: unknown) => T;
  onError?: (e: Error) => void;
  serverSideSearchParams?: string | URLSearchParams;
}
```

For example:

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

Note that `validate` runs _after_ `parse` and expects an argument that's already been "hydrated" from the search param string. More specifically, `sanitize`, `parse`, and `validate` run in the following order:

```tsx
const sanitizedVal = sanitize(searchParam);
const parsedVal = parse(sanitizedVal);
const validatedVal = wrappedValidate(parsedVal);
```

Note that `sanitize` and `validate` have no default value, while `parse` defaults to the following function:

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

---

You can also "build" the hook yourself to implicitly pass `sanitized` and `onError` options to every instance of `useSearchParam`:

```tsx
import { buildUseSearchParam } from "use-search-param";

// import this instance of `useSearchParam` in your components
export const useSearchParam = buildUseSearchParam({
  onError: () => {
    // call sentry
  },
  sanitize: (unsanitized) => {
    return yourSanitizer(unsanitized);
  },
});
```

When `sanitize` is passed to `buildUseSearchParam` and `useSearchParam`, the option passed to `useSearchParam` takes precendence. However, when `onError` is passed to `buildUseSearchParam` and `useSearchParam`, both `onError`s are called.

### Running on the server

`useSearchParam` can be passed a `serverSideSearchParams` option to use when `window.location.search` is unavailable. This is useful for generating content on the server, i.e. with Next.js:

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
