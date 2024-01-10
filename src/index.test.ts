import { renderHook, cleanup } from "@testing-library/react-hooks";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import * as helpers from "./helpers";
import { buildUseSearchParam, useSearchParam } from "./index";
import { z } from "zod";

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

      it("with a serverSideSearchParams option, it should dehydrate the search param", () => {
        const { result } = renderHook(() =>
          useSearchParam("counter", {
            serverSideSearchParams: "?counter=1",
          }),
        );
        expect(result.current).toBe(1);
      });

      it("without a serverSideSearchParams option, it should return null", () => {
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

        it("when passed a sanitize from the hook options and build options, it should call the hook option", () => {
          const useBuiltSearchParam = buildUseSearchParam({
            sanitize: (unsanitized) => `${unsanitized}2`,
          });
          const { result } = renderHook(() =>
            useBuiltSearchParam("counter", {
              sanitize: (unsanitized) => `${unsanitized}1`,
            }),
          );
          expect(result.current).toBe(11);
        });

        it("when passed a parse option, it should use it", () => {
          const useBuiltSearchParam = buildUseSearchParam({
            parse: (unparsed) => JSON.parse(unparsed) + 1,
          });
          const { result } = renderHook(() => useBuiltSearchParam("counter"));
          expect(result.current).toBe(2);
        });

        it("when passed a parse from the hook options and build options, it should call the hook option", () => {
          const useBuiltSearchParam = buildUseSearchParam({
            parse: (unparsed) => JSON.parse(unparsed) + 1,
          });
          const { result } = renderHook(() =>
            useBuiltSearchParam("counter", {
              parse: (unparsed) => JSON.parse(unparsed) + 2,
            }),
          );
          expect(result.current).toBe(3);
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
          const schema = z.string();
          const onError = vi.fn();
          const useBuiltSearchParam = buildUseSearchParam({
            onError,
          });
          const { result } = renderHook(() =>
            useBuiltSearchParam("counter", {
              validate: schema.parse,
            }),
          );
          expect(onError).toHaveBeenCalledOnce();
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
            }),
          );
          expect(buildOnError).toHaveBeenCalledOnce();
          expect(hookOnError).toHaveBeenCalledOnce();
          expect(result.current).toBe(null);
        });

        it("when passed an onError from the hook options and build options, it should call both on validation errors", () => {
          const buildOnError = vi.fn();
          const hookOnError = vi.fn();

          const schema = z.string();
          const useBuiltSearchParam = buildUseSearchParam({
            onError: buildOnError,
          });
          const { result } = renderHook(() =>
            useBuiltSearchParam("counter", {
              onError: hookOnError,
              validate: schema.parse,
            }),
          );
          expect(buildOnError).toHaveBeenCalledOnce();
          expect(hookOnError).toHaveBeenCalledOnce();
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
          const onError = vi.fn();
          const { result } = renderHook(() =>
            useSearchParam("counter", {
              onError,
              sanitize: () => {
                throw new Error();
              },
            }),
          );
          expect(onError).toHaveBeenCalledOnce();
          expect(result.current).toBe(null);
        });

        it("when passed an onError, it should call it on validation error", () => {
          const onError = vi.fn();
          const schema = z.string();
          const { result } = renderHook(() =>
            useSearchParam("counter", {
              onError,
              validate: schema.parse,
            }),
          );
          expect(onError).toHaveBeenCalledOnce();
          expect(result.current).toBe(null);
        });
      });
    });
  });

  describe("events", () => {
    beforeEach(() => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: { search: "?counter=1" },
      });
    });

    it("should update the state on the popstate event", () => {
      const { result } = renderHook(() => useSearchParam("counter"));
      expect(result.current).toBe(1);

      Object.defineProperty(window, "location", {
        writable: true,
        value: { search: "?counter=2" },
      });
      dispatchEvent(new Event("popstate"));
      expect(result.current).toBe(2);
    });
  });
});
