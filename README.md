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

> Docs for version 1.4.4 (the last version before version 2.0.0) can be viewed [here](https://github.com/ElanMedoff/use-search-param/tree/501b792de41de2158d07ebf01f67e6b88951581b)

---

## ⚠️ Warning: this package is deprecated! ⚠️

> Docs for version 2.3.0 (the last version before being deprecated) can be viewed [here](https://github.com/ElanMedoff/use-search-param/blob/1961af2fb42c95aeccf7b37102ba59df232462d2)

As an alternative, use [`use-search-param-state`](https://github.com/ElanMedoff/use-search-param-state):

```ts
import { useSearchParamState } from "use-search-param-state";

function Demo() {
  const [counter] = useSearchParamState("c", 0);
}
```

All of the options from `use-search-param`:

```ts
interface Options<TVal> {
  sanitize?: (unsanitized: string) => string;
  parse?: (unparsed: string) => TVal;
  validate?: (unvalidated: unknown) => TVal | null;
  onError?: (error: unknown) => void;
  serverSideSearchParams?: string;
}
```

are still supported, though note that `serverSideSearchParams` is updated to `serverSideURLSearchParams: URLSearchParams` in `use-search-param-state`

## Why deprecate?

Prior to `use-search-param-state` v3.0.0, `useSearchParamState` required being wrapped in a context provider: `SearchParamStateProvider`. For cases where setting the state wasn't necessary, `use-search-param` provided a simpler alternative with the same API - but without a provider wrapping your app.

In v3.0.0, `use-search-param-state` was refactored to remove the need for a context provider. Without a provider, there's no longer a significant difference between `use-search-param-state` and `use-search-param`, and no reason to maintain both libraries.
