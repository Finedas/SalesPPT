import { describe, expect, it } from "vitest";
import {
  extractInstalledOllamaModelNames,
  getMissingOllamaModels,
  isOllamaModelInstalled
} from "@/lib/ollamaSetup";

describe("ollama setup helpers", () => {
  it("returns all required models as missing when tags are empty", () => {
    const installed = extractInstalledOllamaModelNames({ models: [] });
    expect(getMissingOllamaModels(installed, ["llama3", "mistral", "mixtral", "phi3"])).toEqual([
      "llama3",
      "mistral",
      "mixtral",
      "phi3"
    ]);
  });

  it("treats tagged variants as installed", () => {
    const installed = extractInstalledOllamaModelNames({
      models: [{ name: "llama3:latest" }, { name: "mistral:7b" }]
    });

    expect(isOllamaModelInstalled(installed, "llama3")).toBe(true);
    expect(isOllamaModelInstalled(installed, "mistral")).toBe(true);
  });

  it("returns only missing models for partial installed list", () => {
    const installed = extractInstalledOllamaModelNames({
      models: [{ name: "llama3:latest" }, { name: "phi3:latest" }]
    });

    expect(getMissingOllamaModels(installed, ["llama3", "mistral", "mixtral", "phi3"])).toEqual([
      "mistral",
      "mixtral"
    ]);
  });
});
