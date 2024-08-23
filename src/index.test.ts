import { act, renderHook } from "@testing-library/react-hooks";
import { describe, expect, it, beforeEach } from "@jest/globals";
import * as helpers from "./utils";
import {
  type BuildOptions,
  type Options,
  buildGetSearchParam,
  buildUseSearchParam,
  useSearchParam,
} from "./index";
import { z } from "zod";

interface GetResultParams<T> {
  buildOptions?: BuildOptions;
  localOptions?: Options<T>;
}

function mockLocationSearch(search: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { search },
  });
}

function testExport(
  exportName: string,
  getResult: (params?: GetResultParams<number>) => number | null,
) {
  describe(exportName, () => {
    beforeEach(() => {
      jest.spyOn(helpers, "isWindowUndefined").mockReturnValue(false);
      mockLocationSearch("");
    });

    describe("initial state", () => {
      describe("with window undefined", () => {
        beforeEach(() => {
          jest.spyOn(helpers, "isWindowUndefined").mockReturnValue(true);
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
        mockLocationSearch("?counter=1");

        const result = getResult();
        expect(result).toBe(1);
      });

      describe("build options", () => {
        beforeEach(() => {
          mockLocationSearch("?counter=1");
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
                parse: (unparsed) => (JSON.parse(unparsed) as number) + 1,
              },
            });
            expect(result).toBe(2);
          });

          it("when passed a parse from the hook options and build options, it should call the hook option", () => {
            const result = getResult({
              buildOptions: {
                parse: (unparsed) => (JSON.parse(unparsed) as number) + 1,
              },
              localOptions: {
                parse: (unparsed) => (JSON.parse(unparsed) as number) + 2,
              },
            });
            expect(result).toBe(3);
          });
        });

        describe("error options", () => {
          it("when passed an onError, it should call it on error", () => {
            const onError = jest.fn();
            const result = getResult({
              buildOptions: {
                onError,
                sanitize: () => {
                  throw new Error();
                },
              },
            });
            expect(onError).toHaveBeenCalled();
            expect(result).toBe(null);
          });

          it("when pass an onError, it should call it on validation errors", () => {
            mockLocationSearch("?counter=asdf");
            const schema = z.number();
            const onError = jest.fn();
            const result = getResult({
              buildOptions: {
                onError,
              },
              localOptions: {
                validate: schema.parse,
              },
            });
            expect(onError).toHaveBeenCalled();
            expect(result).toBe(null);
          });

          it("when passed an onError from the hook options and build options, it should call both on error", () => {
            const buildOnError = jest.fn();
            const hookOnError = jest.fn();
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
            expect(buildOnError).toHaveBeenCalled();
            expect(hookOnError).toHaveBeenCalled();
            expect(result).toBe(null);
          });

          it("when passed an onError from the hook options and build options, it should call both on validation errors", () => {
            mockLocationSearch("?counter=asdf");
            const buildOnError = jest.fn();
            const localOnError = jest.fn();

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
            expect(buildOnError).toHaveBeenCalled();
            expect(localOnError).toHaveBeenCalled();
            expect(result).toBe(null);
          });
        });
      });

      describe("hook options", () => {
        beforeEach(() => {
          mockLocationSearch("?counter=1");
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
                parse: (unparsed) => (JSON.parse(unparsed) as number) + 1,
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
            const onError = jest.fn();
            const result = getResult({
              localOptions: {
                onError,
                sanitize: () => {
                  throw new Error();
                },
              },
            });
            expect(onError).toHaveBeenCalled();
            expect(result).toBe(null);
          });

          it("when passed an onError, it should call it on validation error", () => {
            mockLocationSearch("?counter=asdf");
            const onError = jest.fn();
            const schema = z.number();
            const result = getResult({
              localOptions: {
                onError,
                validate: schema.parse,
              },
            });
            expect(onError).toHaveBeenCalled();
            expect(result).toBe(null);
          });
        });
      });
    });
  });
}

describe("useSearchParam events", () => {
  beforeEach(() => {
    jest.spyOn(helpers, "isWindowUndefined").mockReturnValue(false);
  });

  it("should update the state on the popstate event", () => {
    mockLocationSearch("?counter=1");
    const { result } = renderHook(() => useSearchParam("counter"));
    expect(result.current).toBe(1);

    mockLocationSearch("?counter=2");
    act(() => {
      dispatchEvent(new Event("popstate"));
    });
    expect(result.current).toBe(2);
  });

  it.each(["pushState", "replaceState"] as const)(
    "should update the state on the %s event",
    (eventName) => {
      mockLocationSearch("?counter=1");
      const { result } = renderHook(() => useSearchParam("counter"));
      expect(result.current).toBe(1);

      mockLocationSearch("?counter=2");
      act(() => {
        history[eventName](null, "", "");
      });
      expect(result.current).toBe(2);
    },
  );
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
