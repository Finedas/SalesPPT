import { describe, expect, it } from "vitest";
import { createLLMProvider, getDefaultModelForProvider } from "@/lib/llmProviders";
import { OpenAIProvider } from "@/lib/llmProviders/openaiProvider";
import { OllamaProvider, getOllamaBaseUrlForTests } from "@/lib/llmProviders/ollamaProvider";

describe("LLM provider factory", () => {
  it("returns the OpenAI provider implementation", () => {
    expect(createLLMProvider({ provider: "openai", model: "gpt-4o" })).toBeInstanceOf(OpenAIProvider);
  });

  it("returns the Ollama provider implementation", () => {
    expect(createLLMProvider({ provider: "ollama", model: "llama3" })).toBeInstanceOf(OllamaProvider);
  });

  it("rejects invalid cross-provider models", () => {
    expect(() => createLLMProvider({ provider: "openai", model: "llama3" as never })).toThrow(/Invalid model selection/);
  });

  it("returns provider defaults", () => {
    expect(getDefaultModelForProvider("openai")).toBe("gpt-4.1-mini");
    expect(getDefaultModelForProvider("ollama")).toBe("llama3");
  });

  it("uses localhost Ollama by default", () => {
    delete process.env.OLLAMA_BASE_URL;
    expect(getOllamaBaseUrlForTests()).toBe("http://localhost:11434");
  });
});
