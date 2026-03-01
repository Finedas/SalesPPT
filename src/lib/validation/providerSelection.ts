import { MODELS_BY_PROVIDER } from "@/lib/constants";
import type { LLMModel, LLMProviderName } from "@/lib/types";

export function isValidProvider(value: unknown): value is LLMProviderName {
  return value === "openai" || value === "ollama";
}

export function isValidModelForProvider(provider: LLMProviderName, model: unknown): model is LLMModel {
  return typeof model === "string" && MODELS_BY_PROVIDER[provider].includes(model);
}
