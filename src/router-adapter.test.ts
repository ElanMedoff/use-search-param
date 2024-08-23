import z from "zod";
import { getSearchParamFromSearchString } from "./router-adapter";

describe("getSearchParamFromSearchString", () => {
  const searchString = "?val=1";
  const searchParamKey = "val";

  it("when there is no search param, it should return null", () => {
    const result = getSearchParamFromSearchString({
      searchParamKey,
      searchString: "?counter=1",
    });
    expect(result).toBe(null);
  });

  it("when passed a sanitize option, it should use it", () => {
    const result = getSearchParamFromSearchString({
      searchParamKey,
      searchString,
      sanitize: (unsanitized) => `${unsanitized}2`,
    });
    expect(result).toBe(12);
  });

  it("when passed a parse option, it should use it", () => {
    const result = getSearchParamFromSearchString({
      searchParamKey,
      searchString,
      parse: (unparsed) => (JSON.parse(unparsed) as number) + 1,
    });
    expect(result).toBe(2);
  });

  it("when passed an onError, it should call it on error", () => {
    const onError = jest.fn();
    const result = getSearchParamFromSearchString({
      searchParamKey,
      searchString,
      onError,
      sanitize: () => {
        throw new Error();
      },
    });
    expect(onError).toHaveBeenCalled();
    expect(result).toBe(null);
  });

  it("when pass an onError, it should call it on validation errors", () => {
    const schema = z.number();
    const onError = jest.fn();
    const result = getSearchParamFromSearchString({
      searchParamKey,
      searchString: "?val=asdf",
      onError,
      validate: schema.parse,
    });
    expect(onError).toHaveBeenCalled();
    expect(result).toBe(null);
  });
});
