import { ProviderResponseError } from "@/lib/llmProviders/errors";

const INVALID_STRUCTURED_OUTPUT_MESSAGE = "The selected model returned invalid structured output. Please try again.";

export function stripMarkdownCodeFences(input: string): string {
  const trimmed = input.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fencedMatch ? fencedMatch[1].trim() : trimmed;
}

export function extractFirstJSONObject(input: string): string | null {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }

      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
      continue;
    }

    if (char === "}") {
      if (depth === 0) {
        continue;
      }

      depth -= 1;
      if (depth === 0 && start !== -1) {
        return input.slice(start, index + 1);
      }
    }
  }

  return null;
}

export function parseOllamaJsonObject<T>(input: string): T {
  const candidates = [input, stripMarkdownCodeFences(input)];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      // Fall through to extraction.
    }
  }

  const extracted = extractFirstJSONObject(stripMarkdownCodeFences(input));
  if (extracted) {
    try {
      const parsed = JSON.parse(extracted) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      throw new ProviderResponseError(INVALID_STRUCTURED_OUTPUT_MESSAGE);
    }
  }

  throw new ProviderResponseError(INVALID_STRUCTURED_OUTPUT_MESSAGE);
}
