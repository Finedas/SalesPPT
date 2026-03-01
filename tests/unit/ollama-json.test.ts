import { describe, expect, it } from "vitest";
import { extractFirstJSONObject, parseOllamaJsonObject, stripMarkdownCodeFences } from "@/lib/ollamaJson";

describe("ollamaJson", () => {
  it("parses a direct JSON object", () => {
    expect(parseOllamaJsonObject<{ key: string }>('{"key":"value"}')).toEqual({ key: "value" });
  });

  it("strips fenced json blocks", () => {
    expect(stripMarkdownCodeFences("```json\n{\"key\":\"value\"}\n```")).toBe('{"key":"value"}');
    expect(parseOllamaJsonObject<{ key: string }>("```json\n{\"key\":\"value\"}\n```")).toEqual({ key: "value" });
  });

  it("extracts an embedded JSON object from surrounding text", () => {
    const raw = 'Here is the JSON you requested:\n{"key":"value","nested":{"count":2}}\nThanks.';
    expect(extractFirstJSONObject(raw)).toBe('{"key":"value","nested":{"count":2}}');
    expect(parseOllamaJsonObject<{ key: string; nested: { count: number } }>(raw)).toEqual({
      key: "value",
      nested: { count: 2 }
    });
  });

  it("rejects input with no object", () => {
    expect(() => parseOllamaJsonObject("no json here")).toThrow(/invalid structured output/i);
  });

  it("rejects malformed objects with unmatched braces", () => {
    expect(() => parseOllamaJsonObject('prefix {"key":"value" suffix')).toThrow(/invalid structured output/i);
  });
});
