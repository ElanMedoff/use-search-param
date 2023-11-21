import { renderHook, cleanup } from "@testing-library/react-hooks";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import * as helpers from "./helpers";
import { buildUseSearchParam, useSearchParam } from "./index";

afterEach(cleanup);

describe("useSearchParamState", () => {
  beforeEach(() => {
    vi.spyOn(window.history, "pushState");
    vi.spyOn(helpers, "isWindowUndefined").mockReturnValue(false);

    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "http://localhost:3000/" },
    });
  });

  describe("initial state", () => {
    describe("with window undefined", () => {
      beforeEach(() => {
        vi.spyOn(helpers, "isWindowUndefined").mockReturnValue(true);
      });

      it("with a serverSideHref, it should dehydrate the search param", () => {
        const { result } = renderHook(() =>
          useSearchParam("counter", {
            serverSideHref: "http://localhost:3000/?counter=1",
          }),
        );
        expect(result.current).toBe(1);
      });

      it("without a serverSideHref, it should return null", () => {
        const { result } = renderHook(() => useSearchParam("counter"));
        expect(result.current).toBe(null);
      });
    });

    it("with no search param in the url, it should return null", () => {
      const { result } = renderHook(() => useSearchParam("counter"));
      expect(result.current).toBe(null);
    });

    it("with a search param in the url, it should parse the search param", () => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: { href: "http://localhost:3000/?counter=1" },
      });

      const { result } = renderHook(() => useSearchParam("counter"));
      expect(result.current).toBe(1);
    });

    describe("build options", () => {
      beforeEach(() => {
        Object.defineProperty(window, "location", {
          writable: true,
          value: { href: "http://localhost:3000/?counter=1" },
        });
      });

      describe("hyration options", () => {
        it("when passed a sanitize option, it should use it", () => {
          const useBuiltSearchParam = buildUseSearchParam({
            sanitize: (unsanitized) => `${unsanitized}2`,
          });
          const { result } = renderHook(() => useBuiltSearchParam("counter"));
          expect(result.current).toBe(12);
        });
      });

      describe("error options", () => {
        it("when passed an onError, it should call it on error", () => {
          Object.defineProperty(window, "location", {
            writable: true,
            // cause JSON.parse to error
            value: { href: `http://localhost:3000/?counter='{name: ""}'` },
          });

          const onError = vi.fn();
          const useBuiltSearchParam = buildUseSearchParam({
            onError,
          });
          const { result } = renderHook(() => useBuiltSearchParam("counter"));
          expect(onError).toHaveBeenCalledOnce();
          expect(result.current).toBe(null);
        });

        it("when passed an onError from the hook options and build options, it should call both on error", () => {
          Object.defineProperty(window, "location", {
            writable: true,
            // cause JSON.parse to error
            value: { href: `http://localhost:3000/?counter='{name: ""}'` },
          });

          const buildOnError = vi.fn();
          const hookOnError = vi.fn();
          const useBuiltSearchParam = buildUseSearchParam({
            onError: buildOnError,
          });
          const { result } = renderHook(() =>
            useBuiltSearchParam("counter", {
              onError: hookOnError,
            }),
          );
          expect(buildOnError).toHaveBeenCalledOnce();
          expect(hookOnError).toHaveBeenCalledOnce();
          expect(result.current).toBe(null);
        });

        it("when passed an onValidateError, it should call it on validation error", () => {
          const onValidateError = vi.fn();
          const error = new Error();
          const useBuiltSearchParam = buildUseSearchParam({
            onValidateError,
          });
          const { result } = renderHook(() =>
            useBuiltSearchParam("counter", {
              validate: () => {
                throw error;
              },
            }),
          );
          expect(onValidateError).toHaveBeenCalledOnce();
          expect(onValidateError).toHaveBeenCalledWith(error);
          expect(result.current).toBe(null);
        });

        it("when passed an onValidateError from the hook options and build options, it should call both on validation error", () => {
          const buildOnValidateError = vi.fn();
          const hookOnValidateError = vi.fn();
          const error = new Error();

          const useBuiltSearchParam = buildUseSearchParam({
            onValidateError: buildOnValidateError,
          });
          const { result } = renderHook(() =>
            useBuiltSearchParam("counter", {
              onValidateError: hookOnValidateError,
              validate: () => {
                throw error;
              },
            }),
          );
          expect(buildOnValidateError).toHaveBeenCalledOnce();
          expect(hookOnValidateError).toHaveBeenCalledOnce();
          expect(buildOnValidateError).toHaveBeenCalledWith(error);
          expect(hookOnValidateError).toHaveBeenCalledWith(error);
          expect(result.current).toBe(null);
        });
      });
    });

    describe("hook options", () => {
      beforeEach(() => {
        Object.defineProperty(window, "location", {
          writable: true,
          value: { href: "http://localhost:3000/?counter=1" },
        });
      });

      describe("hyration options", () => {
        it("when passed a sanitize option, it should use it", () => {
          const { result } = renderHook(() =>
            useSearchParam("counter", {
              sanitize: (unsanitized) => `${unsanitized}2`,
            }),
          );
          expect(result.current).toBe(12);
        });

        it("when passed a parse option, it should use it", () => {
          const { result } = renderHook(() =>
            useSearchParam("counter", {
              parse: (unparsed) => JSON.parse(unparsed) + 1,
            }),
          );
          expect(result.current).toBe(2);
        });

        it("when passed a validate option, it should use it", () => {
          const { result } = renderHook(() =>
            useSearchParam("counter", {
              validate: (unvalidated) => (unvalidated as number) + 1,
            }),
          );
          expect(result.current).toBe(2);
        });
      });

      describe("error options", () => {
        it("when passed an onError, it should call it on error", () => {
          Object.defineProperty(window, "location", {
            writable: true,
            // cause JSON.parse to error
            value: { href: `http://localhost:3000/?counter='{name: ""}'` },
          });

          const onError = vi.fn();
          const { result } = renderHook(() =>
            useSearchParam("counter", { onError }),
          );
          expect(onError).toHaveBeenCalledOnce();
          expect(result.current).toBe(null);
        });

        it("when passed an onValidateError, it should call it on validation error", () => {
          const onValidateError = vi.fn();
          const error = new Error();
          const { result } = renderHook(() =>
            useSearchParam("counter", {
              onValidateError,
              validate: () => {
                throw error;
              },
            }),
          );
          expect(onValidateError).toHaveBeenCalledOnce();
          expect(onValidateError).toHaveBeenCalledWith(error);
          expect(result.current).toBe(null);
        });
      });
    });
  });

  describe.skip("on url changes", () => {
    // TODO
  });
});
