export type OllamaTagModel = {
  name?: string;
};

export type OllamaTagsResponse = {
  models?: OllamaTagModel[];
};

export function extractInstalledOllamaModelNames(payload: OllamaTagsResponse): string[] {
  if (!payload || !Array.isArray(payload.models)) {
    throw new Error("Could not parse installed Ollama models.");
  }

  return payload.models
    .map((model) => model.name?.trim())
    .filter((name): name is string => Boolean(name));
}

export function isOllamaModelInstalled(installedNames: string[], expectedModel: string): boolean {
  return installedNames.some((name) => name === expectedModel || name.startsWith(`${expectedModel}:`));
}

export function getMissingOllamaModels(installedNames: string[], requiredModels: string[]): string[] {
  return requiredModels.filter((model) => !isOllamaModelInstalled(installedNames, model));
}
