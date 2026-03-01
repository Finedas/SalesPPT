import type { ExecutiveSections, ExecutiveSlidesResponse, OpenAIModel, ProviderGenerationOptions, SectionGenerationEvent } from "@/lib/types";
import { EXECUTIVE_SECTION_KEYS } from "@/server/prompts";
import { executiveSectionsJsonSchema } from "@/lib/schemas/sections.schema";
import { executiveSlidesJsonSchema } from "@/lib/schemas/slides.schema";
import { buildSectionsUserPrompt, buildSlidesUserPrompt, sectionsSystemPrompt, slidesSystemPrompt } from "@/server/prompts";
import { getOpenAIClient } from "@/server/openai/client";
import { ProviderResponseError, ProviderSelectionError, ProviderUnavailableError } from "@/lib/llmProviders/errors";

function extractOutputText(response: any): string {
  if (response.output_text) {
    return response.output_text;
  }

  for (const item of response.output || []) {
    if (item.type === "message") {
      for (const content of item.content || []) {
        if (content.type === "output_text") {
          return content.text;
        }
      }
    }
  }

  throw new Error("OpenAI response did not contain output text.");
}

function normalizeOpenAIError(error: unknown): Error {
  if (error instanceof ProviderSelectionError || error instanceof ProviderUnavailableError || error instanceof ProviderResponseError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (message.toLowerCase().includes("model")) {
    return new ProviderSelectionError(`OpenAI request failed: ${message}`);
  }

  if (message.toLowerCase().includes("context") || message.toLowerCase().includes("token")) {
    return new Error(`OpenAI request failed: ${message}`);
  }

  return new ProviderUnavailableError(`OpenAI request failed: ${message}`);
}

export class OpenAIProvider {
  constructor(private readonly model: OpenAIModel) {}

  async generateSections(transcript: string, _options?: ProviderGenerationOptions): Promise<ExecutiveSections> {
    try {
      const response = await getOpenAIClient().responses.create({
        model: this.model,
        input: [
          { role: "system", content: [{ type: "input_text", text: sectionsSystemPrompt }] },
          { role: "user", content: [{ type: "input_text", text: buildSectionsUserPrompt(transcript) }] }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "ExecutiveSections",
            strict: true,
            schema: executiveSectionsJsonSchema
          }
        }
      });

      try {
        return JSON.parse(extractOutputText(response)) as ExecutiveSections;
      } catch {
        throw new ProviderResponseError("The selected model returned invalid structured output. Please try again.");
      }
    } catch (error) {
      throw normalizeOpenAIError(error);
    }
  }

  async generateSlides(sections: ExecutiveSections, _options?: ProviderGenerationOptions): Promise<ExecutiveSlidesResponse> {
    try {
      const response = await getOpenAIClient().responses.create({
        model: this.model,
        input: [
          { role: "system", content: [{ type: "input_text", text: slidesSystemPrompt }] },
          { role: "user", content: [{ type: "input_text", text: buildSlidesUserPrompt(JSON.stringify(sections)) }] }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "ExecutiveSlidesResponse",
            strict: true,
            schema: executiveSlidesJsonSchema
          }
        }
      });

      try {
        return JSON.parse(extractOutputText(response)) as ExecutiveSlidesResponse;
      } catch {
        throw new ProviderResponseError("The selected model returned invalid structured output. Please try again.");
      }
    } catch (error) {
      throw normalizeOpenAIError(error);
    }
  }

  async *generateSectionsStream(transcript: string, options?: ProviderGenerationOptions): AsyncGenerator<SectionGenerationEvent> {
    yield {
      type: "generation_started",
      sectionOrder: EXECUTIVE_SECTION_KEYS
    };

    const sections = await this.generateSections(transcript, options);

    for (const sectionKey of EXECUTIVE_SECTION_KEYS) {
      yield { type: "section_started", sectionKey };
      yield { type: "section_completed", sectionKey, content: sections[sectionKey] };
    }

    yield {
      type: "generation_completed",
      sections
    };
  }
}
