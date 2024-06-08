# Change Log

<!-- ## 0.0.0 - yyyy-mm-dd -->
<!---->
<!-- ### Changed -->
<!---->
<!-- ### Added -->
<!---->
<!-- ### Fixed -->

## 2.2.0 - 2024-06-07

### Added

- Monkeypatch `history.pushState` and `history.replaceState` to properly react to `pushState` and `replaceState` events, see this Wouter [comment](https://github.com/molefrog/wouter/blob/e106a9dd27cde242b139e27fa8ac2fdb218fc523/packages/wouter/src/use-browser-location.js#L57) for more info
- Refactor to use `useSyncExternalStore`, removes need for `useStableCallback`
- Add 1 dependency, `use-sync-external-store`

## 2.1.5 - 2024-05-01

### Fixed

- Add `useStableCallback` hook to simpilify the ref-based solution introduced in 2.1.3.

## 2.1.4 - 2024-04-27

### Fixed

- Update vitest to jest, vite to tsup. Clean up eslint, prettier, and typescript options.

## 2.1.3 - 2024-04-26

### Fixed

- Add all functions passed by the consumer to the various dependency arrays. Uses a ref-based workaround to avoid adding and removing the `popstate` event listener every render.

## 2.1.2 - 2024-04-25

### Fixed

- Add github action to publish to npm with provenance.

## 2.1.1 - 2024-02-28

### Fixed

- Update `defaultParse` to use `Number` instead of `parseFloat`: was causing an issue where strings starting with a number were parsed as numbers.

## 2.1.0 - 2024-01-20

### Added

- Added `getSearchParam` and `buildGetSearchParam`.
- Added testing section, section on `getSearchParam` / `buildGetSearchParam` to the README.

## 2.0.1 - 2024-01-09

### Fixed

- Update `vitest` to version >`1.0.0`.
- Added known limitations section to the README.

## 2.0.0 - 2024-01-09

### Changed

- Update `serverSideSearchParams` type from `string | URLSearchParams` to `string` to maintain referential stability.

## 1.4.4 - 2024-01-05

### Fixed

- Remove unnecessary returns in `defaultParse`.
- Remove unnecessary even listeners - `pushstate` and `replacestate` events are not valid.

## 1.4.3 - 2024-01-05

### Fixed

- Fix images on the README on npm.

## 1.4.2 - 2023-12-26

### Fixed

- Added detailed explanation section to the README.

## 1.4.1 - 2023-12-25

### Fixed

- Wrote comments on types for editor intellisense.

## 1.4.0 - 2023-12-20

### Added

- Update `BuildSearchParamOptions` to `BuildUseSearchParamOptions`.

## 1.3.0 - 2023-12-18

### Added

- Re-read the search param and re-render the hook on `pushstate` and `replacestate` events.

## 1.2.0 - 2023-12-13

### Added

- Add `parse` as a build option.

## 1.1.3 - 2023-11-30

### Fixed

- Update `validate` option to return `T | null`.

## 1.1.2 - 2023-11-27

### Fixed

- Cleanup README styles.

## 1.1.1 - 2023-11-27

### Fixed

- Add documentation on options to the README.

## 1.1.0 - 2023-11-21

### Added

- Re-read the search param and re-render the hook on `popstate` events.

## 1.0.0 - 2023-11-21

### Changed

- Functioning hook!
