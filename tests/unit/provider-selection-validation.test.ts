import { describe, expect, it } from "vitest";
import { isValidModelForProvider, isValidProvider } from "@/lib/validation/providerSelection";

describe("provider selection validation", () => {
  it("accepts valid providers", () => {
    expect(isValidProvider("openai")).toBe(true);
    expect(isValidProvider("ollama")).toBe(true);
  });

  it("accepts valid OpenAI model combinations", () => {
    expect(isValidModelForProvider("openai", "gpt-4o")).toBe(true);
    expect(isValidModelForProvider("openai", "gpt-4.1-mini")).toBe(true);
  });

  it("accepts valid Ollama model combinations", () => {
    expect(isValidModelForProvider("ollama", "llama3")).toBe(true);
    expect(isValidModelForProvider("ollama", "mixtral")).toBe(true);
  });

  it("rejects invalid cross-provider combinations", () => {
    expect(isValidModelForProvider("openai", "llama3")).toBe(false);
    expect(isValidModelForProvider("ollama", "gpt-4o")).toBe(false);
  });
});
