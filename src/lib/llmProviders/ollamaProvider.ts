import type {
  ExecutiveSectionKey,
  ExecutiveSections,
  ExecutiveSlidesResponse,
  OllamaModel,
  OllamaSectionPlan,
  ProviderGenerationOptions
} from "@/lib/types";
import type { SectionGenerationEvent } from "@/lib/types";
import { parseOllamaJsonObject } from "@/lib/ollamaJson";
import { executiveSectionsJsonSchema, ollamaSectionPlanJsonSchema } from "@/lib/schemas/sections.schema";
import { executiveSlidesJsonSchema } from "@/lib/schemas/slides.schema";
import {
  buildOllamaPrompt,
  buildOllamaSectionExpansionPrompt,
  buildOllamaSectionPlanPrompt,
  buildOllamaSingleSectionPrompt,
  buildSlidesUserPrompt,
  EXECUTIVE_SECTION_KEYS,
  slidesSystemPrompt
} from "@/server/prompts";
import { ProviderModelUnavailableError, ProviderResponseError, ProviderUnavailableError } from "@/lib/llmProviders/errors";
import { summarizeSectionValidationIssues, validateSingleSection } from "@/lib/validation/sections";

function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL || "http://localhost:11434";
}

type OllamaTask = "sections" | "slides";

function getOllamaTimeoutMs(task: OllamaTask): number {
  const taskSpecificTimeout =
    task === "sections"
      ? process.env.OLLAMA_SECTIONS_TIMEOUT_MS
      : process.env.OLLAMA_SLIDES_TIMEOUT_MS;

  if (taskSpecificTimeout) {
    return Number(taskSpecificTimeout);
  }

  if (process.env.OLLAMA_TIMEOUT_MS) {
    return Number(process.env.OLLAMA_TIMEOUT_MS);
  }

  return task === "sections" ? 120000 : 60000;
}

type OllamaResponse = {
  response?: string;
  error?: string;
};

const ollamaSingleSectionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["content"],
  properties: {
    content: { type: "string", minLength: 1 }
  }
} as const;

type OllamaSchema =
  | typeof executiveSectionsJsonSchema
  | typeof executiveSlidesJsonSchema
  | typeof ollamaSectionPlanJsonSchema
  | typeof ollamaSingleSectionJsonSchema;

function getErrorMessage(payload: unknown): string | null {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }

  return null;
}

function isModelMissingError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes("model") && (normalized.includes("not found") || normalized.includes("pull") || normalized.includes("missing"));
}

async function callOllama(model: string, prompt: string, schema: OllamaSchema, task: OllamaTask): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getOllamaTimeoutMs(task));

  try {
    const response = await fetch(`${getOllamaBaseUrl()}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model, prompt, stream: false, format: schema }),
      signal: controller.signal
    });

    if (!response.ok) {
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        try {
          payload = await response.text();
        } catch {
          payload = null;
        }
      }

      const message = getErrorMessage(payload);
      if (message && isModelMissingError(message)) {
        throw new ProviderModelUnavailableError(`Ollama model '${model}' is not installed locally. Run 'ollama run ${model}' first.`);
      }

      if (message) {
        throw new ProviderResponseError(`Ollama request failed: ${message}`);
      }

      throw new ProviderResponseError("Ollama returned an empty response.");
    }

    const payload = (await response.json()) as OllamaResponse;
    if (!payload.response) {
      throw new ProviderResponseError("Ollama returned an empty response.");
    }

    return payload.response;
  } catch (error) {
    if (
      error instanceof ProviderUnavailableError ||
      error instanceof ProviderModelUnavailableError ||
      error instanceof ProviderResponseError
    ) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderUnavailableError(`Ollama request timed out at ${getOllamaBaseUrl()}`);
    }

    throw new ProviderUnavailableError(`Ollama is not reachable at ${getOllamaBaseUrl()}`);
  } finally {
    clearTimeout(timeout);
  }
}

export function getOllamaBaseUrlForTests(): string {
  return getOllamaBaseUrl();
}

function parseSingleSectionContent(raw: string): string {
  const parsed = parseOllamaJsonObject<{ content: string }>(raw);
  if (!parsed.content || typeof parsed.content !== "string") {
    throw new ProviderResponseError("The selected model returned invalid structured output. Please try again.");
  }
  return parsed.content;
}

function isExpansionCandidate(issues: string[]): boolean {
  const summary = summarizeSectionValidationIssues(issues);
  return summary.underWordMinimum && !summary.tooManyParagraphs;
}

export class OllamaProvider {
  constructor(private readonly model: OllamaModel) {}

  private async generateSectionPlan(transcript: string): Promise<OllamaSectionPlan> {
    const raw = await callOllama(
      this.model,
      buildOllamaSectionPlanPrompt(transcript),
      ollamaSectionPlanJsonSchema,
      "sections"
    );
    return parseOllamaJsonObject<OllamaSectionPlan>(raw);
  }

  private async generateSingleSection(params: {
    sectionKey: ExecutiveSectionKey;
    transcript: string;
    sectionPlan: OllamaSectionPlan[ExecutiveSectionKey];
  }): Promise<string> {
    const firstRaw = await callOllama(
      this.model,
      buildOllamaSingleSectionPrompt({
        sectionKey: params.sectionKey,
        transcript: params.transcript,
        sectionPlan: params.sectionPlan
      }),
      ollamaSingleSectionJsonSchema,
      "sections"
    );
    const firstContent = parseSingleSectionContent(firstRaw);
    const firstValidation = validateSingleSection(params.sectionKey, firstContent);
    if (firstValidation.valid) {
      return firstContent;
    }

    const retryRaw = await callOllama(
      this.model,
      buildOllamaSingleSectionPrompt({
        sectionKey: params.sectionKey,
        transcript: params.transcript,
        sectionPlan: params.sectionPlan,
        repair: true,
        validationIssues: firstValidation.issues
      }),
      ollamaSingleSectionJsonSchema,
      "sections"
    );
    const retryContent = parseSingleSectionContent(retryRaw);
    const retryValidation = validateSingleSection(params.sectionKey, retryContent);
    if (retryValidation.valid) {
      return retryContent;
    }

    if (isExpansionCandidate(retryValidation.issues)) {
      const expansionRaw = await callOllama(
        this.model,
        buildOllamaSectionExpansionPrompt({
          sectionKey: params.sectionKey,
          transcript: params.transcript,
          sectionPlan: params.sectionPlan,
          currentDraft: retryContent,
          validationIssues: retryValidation.issues
        }),
        ollamaSingleSectionJsonSchema,
        "sections"
      );
      const expansionContent = parseSingleSectionContent(expansionRaw);
      const expansionValidation = validateSingleSection(params.sectionKey, expansionContent);
      if (expansionValidation.valid) {
        return expansionContent;
      }

      throw new ProviderResponseError(`Sections validation failed after section-level retries: ${expansionValidation.issues.join(" ")}`);
    }

    throw new ProviderResponseError(`Sections validation failed after section-level retries: ${retryValidation.issues.join(" ")}`);
  }

  async generateSections(transcript: string, _options?: ProviderGenerationOptions): Promise<ExecutiveSections> {
    const sections = {} as ExecutiveSections;
    for await (const event of this.generateSectionsStream(transcript, _options)) {
      if (event.type === "section_completed") {
        sections[event.sectionKey] = event.content;
      }
      if (event.type === "section_failed") {
        throw new ProviderResponseError(event.error);
      }
      if (event.type === "generation_completed") {
        return event.sections;
      }
    }
    return sections;
  }

  async *generateSectionsStream(transcript: string, _options?: ProviderGenerationOptions): AsyncGenerator<SectionGenerationEvent> {
    yield {
      type: "generation_started",
      sectionOrder: EXECUTIVE_SECTION_KEYS
    };

    const sectionPlan = await this.generateSectionPlan(transcript);
    const sections = {} as ExecutiveSections;

    for (const sectionKey of EXECUTIVE_SECTION_KEYS) {
      yield { type: "section_started", sectionKey };

      try {
        const content = await this.generateSingleSection({
          sectionKey,
          transcript,
          sectionPlan: sectionPlan[sectionKey]
        });
        sections[sectionKey] = content;
        yield { type: "section_completed", sectionKey, content };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate section.";
        yield { type: "section_failed", sectionKey, error: message };
        yield { type: "generation_failed", error: message };
        return;
      }
    }

    yield {
      type: "generation_completed",
      sections
    };
  }

  async generateSlides(sections: ExecutiveSections, options?: ProviderGenerationOptions): Promise<ExecutiveSlidesResponse> {
    const raw = await callOllama(
      this.model,
      buildOllamaPrompt(slidesSystemPrompt, buildSlidesUserPrompt(JSON.stringify(sections)), options),
      executiveSlidesJsonSchema,
      "slides"
    );
    return parseOllamaJsonObject<ExecutiveSlidesResponse>(raw);
  }
}
