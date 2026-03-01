import type { ExecutiveSectionKey, LLMProviderName, ModelOption, OpenAIModel, OllamaModel, ProviderOption } from "@/lib/types";

export const SECTION_WORD_MIN = 120;
export const SECTION_WORD_MAX = 200;
export const SECTION_PARAGRAPH_MAX = 2;
export const TRANSCRIPT_CHAR_MAX = 30000;
export const ATTRIBUTION_LINE = "– Generated Executive Brief" as const;

export const SECTION_LABELS: Record<keyof import("./types").ExecutiveSections, string> = {
  companyBackground: "Company Background",
  solution: "The Solution",
  challenge: "The Challenge",
  summary: "Summary",
  implementation: "The Implementation",
  results: "The Results"
};

export const EXECUTIVE_SECTION_KEYS: ExecutiveSectionKey[] = [
  "companyBackground",
  "solution",
  "challenge",
  "summary",
  "implementation",
  "results"
];

export const PROVIDER_OPTIONS: readonly ProviderOption[] = [
  { value: "openai", label: "OpenAI", badge: "Remote API" },
  { value: "ollama", label: "Ollama", badge: "Local Model" }
] as const;

export const OPENAI_MODELS = ["gpt-4o", "gpt-4.1-mini", "gpt-4o-mini"] as const satisfies readonly OpenAIModel[];
export const OLLAMA_MODELS = ["llama3", "mistral", "mixtral", "phi3"] as const satisfies readonly OllamaModel[];

export const MODELS_BY_PROVIDER: Record<LLMProviderName, readonly string[]> = {
  openai: OPENAI_MODELS,
  ollama: OLLAMA_MODELS
};

export const MODEL_OPTIONS_BY_PROVIDER: Record<LLMProviderName, readonly ModelOption[]> = {
  openai: OPENAI_MODELS.map((value) => ({ value, label: value })),
  ollama: OLLAMA_MODELS.map((value) => ({ value, label: value }))
};

export const DEFAULT_MODELS: Record<LLMProviderName, OpenAIModel | OllamaModel> = {
  openai: "gpt-4.1-mini",
  ollama: "llama3"
};
