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
      value: { search: "" },
    });
  });

  describe("initial state", () => {
    describe("with window undefined", () => {
      beforeEach(() => {
        vi.spyOn(helpers, "isWindowUndefined").mockReturnValue(true);
      });

      it("with a serverSideSearchParams string option, it should dehydrate the search param", () => {
        const { result } = renderHook(() =>
          useSearchParam("counter", {
            serverSideSearchParams: "?counter=1",
          })
        );
        expect(result.current).toBe(1);
      });

      it("with a serverSideSearchParams class option, it should dehydrate the search param", () => {
        const { result } = renderHook(() =>
          useSearchParam("counter", {
            serverSideSearchParams: new URLSearchParams("?counter=1"),
          })
        );
        expect(result.current).toBe(1);
      });

      it("without a serverSideSearchParams, it should return null", () => {
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
        value: { search: "?counter=1" },
      });

      const { result } = renderHook(() => useSearchParam("counter"));
      expect(result.current).toBe(1);
    });

    describe("build options", () => {
      beforeEach(() => {
        Object.defineProperty(window, "location", {
          writable: true,
          value: { search: "?counter=1" },
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
          const onError = vi.fn();
          const useBuiltSearchParam = buildUseSearchParam({
            onError,
            sanitize: () => {
              throw new Error();
            },
          });
          const { result } = renderHook(() => useBuiltSearchParam("counter"));
          expect(onError).toHaveBeenCalledOnce();
          expect(result.current).toBe(null);
        });

        it("when pass an onError, it should call it on validation errors", () => {
          const onError = vi.fn();
          const error = new Error();
          const useBuiltSearchParam = buildUseSearchParam({
            onError,
          });
          const { result } = renderHook(() =>
            useBuiltSearchParam("counter", {
              validate: () => {
                throw error;
              },
            })
          );
          expect(onError).toHaveBeenCalledOnce();
          expect(onError).toHaveBeenCalledWith(error);
          expect(result.current).toBe(null);
        });

        it("when passed an onError from the hook options and build options, it should call both on error", () => {
          const buildOnError = vi.fn();
          const hookOnError = vi.fn();
          const useBuiltSearchParam = buildUseSearchParam({
            onError: buildOnError,
            sanitize: () => {
              throw new Error();
            },
          });
          const { result } = renderHook(() =>
            useBuiltSearchParam("counter", {
              onError: hookOnError,
            })
          );
          expect(buildOnError).toHaveBeenCalledOnce();
          expect(hookOnError).toHaveBeenCalledOnce();
          expect(result.current).toBe(null);
        });

        it("when passed an onError from the hook options and build options, it should call both on validation errors", () => {
          const buildOnError = vi.fn();
          const hookOnError = vi.fn();
          const error = new Error();

          const useBuiltSearchParam = buildUseSearchParam({
            onError: buildOnError,
          });
          const { result } = renderHook(() =>
            useBuiltSearchParam("counter", {
              onError: hookOnError,
              validate: () => {
                throw error;
              },
            })
          );
          expect(buildOnError).toHaveBeenCalledOnce();
          expect(hookOnError).toHaveBeenCalledOnce();
          expect(buildOnError).toHaveBeenCalledWith(error);
          expect(hookOnError).toHaveBeenCalledWith(error);
          expect(result.current).toBe(null);
        });
      });
    });

    describe("hook options", () => {
      beforeEach(() => {
        Object.defineProperty(window, "location", {
          writable: true,
          value: { search: "?counter=1" },
        });
      });

      describe("hyration options", () => {
        it("when passed a sanitize option, it should use it", () => {
          const { result } = renderHook(() =>
            useSearchParam("counter", {
              sanitize: (unsanitized) => `${unsanitized}2`,
            })
          );
          expect(result.current).toBe(12);
        });

        it("when passed a parse option, it should use it", () => {
          const { result } = renderHook(() =>
            useSearchParam("counter", {
              parse: (unparsed) => JSON.parse(unparsed) + 1,
            })
          );
          expect(result.current).toBe(2);
        });

        it("when passed a validate option, it should use it", () => {
          const { result } = renderHook(() =>
            useSearchParam("counter", {
              validate: (unvalidated) => (unvalidated as number) + 1,
            })
          );
          expect(result.current).toBe(2);
        });
      });

      describe("error options", () => {
        it("when passed an onError, it should call it on error", () => {
          const onError = vi.fn();
          const { result } = renderHook(() =>
            useSearchParam("counter", {
              onError,
              sanitize: () => {
                throw new Error();
              },
            })
          );
          expect(onError).toHaveBeenCalledOnce();
          expect(result.current).toBe(null);
        });

        it("when passed an onError, it should call it on validation error", () => {
          const onError = vi.fn();
          const error = new Error();
          const { result } = renderHook(() =>
            useSearchParam("counter", {
              onError,
              validate: () => {
                throw error;
              },
            })
          );
          expect(onError).toHaveBeenCalledOnce();
          expect(onError).toHaveBeenCalledWith(error);
          expect(result.current).toBe(null);
        });
      });
    });
  });

  describe.skip("on url changes", () => {
    // TODO
  });
});
