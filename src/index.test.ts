import { renderHook, cleanup } from "@testing-library/react-hooks";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import * as helpers from "./helpers";
import {
  type BuildOptions,
  type Options,
  buildGetSearchParam,
  buildUseSearchParam,
  useSearchParam,
} from "./index";
import { z } from "zod";

afterEach(cleanup);

interface GetResultParams<T> {
  buildOptions?: BuildOptions;
  localOptions?: Options<T>;
}

function testExport(
  exportName: string,
  getResult: (params?: GetResultParams<number>) => number | null,
) {
  describe(exportName, () => {
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
          const result = getResult({
            localOptions: {
              serverSideSearchParams: "?counter=1",
            },
          });
          expect(result).toBe(1);
        });

        it("without a serverSideSearchParams option, it should return null", () => {
          const result = getResult();
          expect(result).toBe(null);
        });
      });

      it("with no search param in the url, it should return null", () => {
        const result = getResult();
        expect(result).toBe(null);
      });

      it("with a search param in the url, it should parse the search param", () => {
        Object.defineProperty(window, "location", {
          writable: true,
          value: { search: "?counter=1" },
        });

        const result = getResult();
        expect(result).toBe(1);
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
            const result = getResult({
              buildOptions: {
                sanitize: (unsanitized) => `${unsanitized}2`,
              },
            });
            expect(result).toBe(12);
          });

          it("when passed a sanitize from the hook options and build options, it should call the hook option", () => {
            const result = getResult({
              buildOptions: {
                sanitize: (unsanitized) => `${unsanitized}2`,
              },
              localOptions: {
                sanitize: (unsanitized) => `${unsanitized}1`,
              },
            });
            expect(result).toBe(11);
          });

          it("when passed a parse option, it should use it", () => {
            const result = getResult({
              buildOptions: {
                parse: (unparsed) => JSON.parse(unparsed) + 1,
              },
            });
            expect(result).toBe(2);
          });

          it("when passed a parse from the hook options and build options, it should call the hook option", () => {
            const result = getResult({
              buildOptions: {
                parse: (unparsed) => JSON.parse(unparsed) + 1,
              },
              localOptions: {
                parse: (unparsed) => JSON.parse(unparsed) + 2,
              },
            });
            expect(result).toBe(3);
          });
        });

        describe("error options", () => {
          it("when passed an onError, it should call it on error", () => {
            const onError = vi.fn();
            const result = getResult({
              buildOptions: {
                onError,
                sanitize: () => {
                  throw new Error();
                },
              },
            });
            expect(onError).toHaveBeenCalledOnce();
            expect(result).toBe(null);
          });

          it("when pass an onError, it should call it on validation errors", () => {
            Object.defineProperty(window, "location", {
              writable: true,
              value: { search: "?counter=asdf" },
            });
            const schema = z.number();
            const onError = vi.fn();
            const result = getResult({
              buildOptions: {
                onError,
              },
              localOptions: {
                validate: schema.parse,
              },
            });
            expect(onError).toHaveBeenCalledOnce();
            expect(result).toBe(null);
          });

          it("when passed an onError from the hook options and build options, it should call both on error", () => {
            const buildOnError = vi.fn();
            const hookOnError = vi.fn();
            const result = getResult({
              buildOptions: {
                onError: buildOnError,
                sanitize: () => {
                  throw new Error();
                },
              },
              localOptions: {
                onError: hookOnError,
              },
            });
            expect(buildOnError).toHaveBeenCalledOnce();
            expect(hookOnError).toHaveBeenCalledOnce();
            expect(result).toBe(null);
          });

          it("when passed an onError from the hook options and build options, it should call both on validation errors", () => {
            Object.defineProperty(window, "location", {
              writable: true,
              value: { search: "?counter=asdf" },
            });
            const buildOnError = vi.fn();
            const localOnError = vi.fn();

            const schema = z.number();
            const result = getResult({
              buildOptions: {
                onError: buildOnError,
              },
              localOptions: {
                onError: localOnError,
                validate: schema.parse,
              },
            });
            expect(buildOnError).toHaveBeenCalledOnce();
            expect(localOnError).toHaveBeenCalledOnce();
            expect(result).toBe(null);
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
            const result = getResult({
              localOptions: {
                sanitize: (unsanitized) => `${unsanitized}2`,
              },
            });
            expect(result).toBe(12);
          });

          it("when passed a parse option, it should use it", () => {
            const result = getResult({
              localOptions: {
                parse: (unparsed) => JSON.parse(unparsed) + 1,
              },
            });
            expect(result).toBe(2);
          });

          it("when passed a validate option, it should use it", () => {
            const result = getResult({
              localOptions: {
                validate: (unvalidated) => (unvalidated as number) + 1,
              },
            });
            expect(result).toBe(2);
          });
        });

        describe("error options", () => {
          it("when passed an onError, it should call it on error", () => {
            const onError = vi.fn();
            const result = getResult({
              localOptions: {
                onError,
                sanitize: () => {
                  throw new Error();
                },
              },
            });
            expect(onError).toHaveBeenCalledOnce();
            expect(result).toBe(null);
          });

          it("when passed an onError, it should call it on validation error", () => {
            Object.defineProperty(window, "location", {
              writable: true,
              value: { search: "?counter=asdf" },
            });
            const onError = vi.fn();
            const schema = z.number();
            const result = getResult({
              localOptions: {
                onError,
                validate: schema.parse,
              },
            });
            expect(onError).toHaveBeenCalledOnce();
            expect(result).toBe(null);
          });
        });
      });
    });
  });
}

describe("useSearchParam events", () => {
  beforeEach(() => {
    vi.spyOn(window.history, "pushState");
    vi.spyOn(helpers, "isWindowUndefined").mockReturnValue(false);
  });

  it("should update the state on the popstate event", () => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { search: "?counter=1" },
    });
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

testExport("useSearchParam", (options?: GetResultParams<number>) => {
  const useSearchParam = buildUseSearchParam(options?.buildOptions);
  const { result } = renderHook(() =>
    useSearchParam("counter", options?.localOptions),
  );
  return result.current;
});

testExport("getSearchParam", (options?: GetResultParams<number>) => {
  const getSearchParam = buildGetSearchParam(options?.buildOptions);
  return getSearchParam("counter", options?.localOptions);
});
