import { describe, expect, it } from "@jest/globals";
import { defaultParse } from "./utils";

describe("defaultParse", () => {
  it.each([
    ["", ""],
    ["undefined", undefined],
    ["null", null],
    ["true", true],
    ["false", false],
    ["123", 123],
    ["123.45", 123.45],
    ["0asdf", "0asdf"],
    [JSON.stringify([123]), [123]],
    ["[123", "[123"],
    ["hello", "hello"],
  ])("defaultParse(%s)", (a, b) => {
    expect(defaultParse(a)).toStrictEqual(b);
  });
});
