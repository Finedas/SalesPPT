import { DEFAULT_MODELS } from "@/lib/constants";
import type { LLMModel, LLMProvider, LLMProviderName, OllamaModel, OpenAIModel } from "@/lib/types";
import { isValidModelForProvider } from "@/lib/validation/providerSelection";
import { OpenAIProvider } from "@/lib/llmProviders/openaiProvider";
import { OllamaProvider } from "@/lib/llmProviders/ollamaProvider";
import { ProviderSelectionError } from "@/lib/llmProviders/errors";

export function getDefaultModelForProvider(provider: LLMProviderName): LLMModel {
  return DEFAULT_MODELS[provider];
}

export function createLLMProvider(config: { provider: LLMProviderName; model: LLMModel }): LLMProvider {
  if (!isValidModelForProvider(config.provider, config.model)) {
    throw new ProviderSelectionError("Invalid model selection for provider.");
  }

  if (config.provider === "openai") {
    return new OpenAIProvider(config.model as OpenAIModel);
  }

  return new OllamaProvider(config.model as OllamaModel);
}
