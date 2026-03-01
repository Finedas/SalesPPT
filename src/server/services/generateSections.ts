import { EXECUTIVE_SECTION_KEYS } from "@/server/prompts";
import type { ExecutiveSections, LLMModel, LLMProviderName, SectionGenerationEvent } from "@/lib/types";
import { createLLMProvider } from "@/lib/llmProviders";
import { validateSections } from "@/lib/validation/sections";

export async function generateExecutiveSections(
  transcript: string,
  provider: LLMProviderName,
  model: LLMModel
): Promise<ExecutiveSections> {
  const llmProvider = createLLMProvider({ provider, model });
  const sections = await llmProvider.generateSections(transcript, { repair: false, validationIssues: undefined });
  const validation = validateSections(sections);
  if (validation.valid) {
    return sections;
  }

  throw new Error(`Sections validation failed: ${validation.issues.join(" ")}`);
}

export async function* streamExecutiveSections(
  transcript: string,
  provider: LLMProviderName,
  model: LLMModel
): AsyncGenerator<SectionGenerationEvent> {
  const llmProvider = createLLMProvider({ provider, model });
  const sections = {} as ExecutiveSections;
  let emittedStarted = false;

  for await (const event of llmProvider.generateSectionsStream(transcript, { repair: false, validationIssues: undefined })) {
    if (event.type === "generation_started") {
      emittedStarted = true;
      yield event;
      continue;
    }

    if (!emittedStarted) {
      emittedStarted = true;
      yield {
        type: "generation_started",
        sectionOrder: EXECUTIVE_SECTION_KEYS
      };
    }

    if (event.type === "section_completed") {
      sections[event.sectionKey] = event.content;
      yield event;
      continue;
    }

    if (event.type === "generation_completed") {
      const validation = validateSections(event.sections);
      if (!validation.valid) {
        yield {
          type: "generation_failed",
          error: `Sections validation failed: ${validation.issues.join(" ")}`
        };
        return;
      }

      yield {
        type: "generation_completed",
        sections: event.sections
      };
      return;
    }

    yield event;

    if (event.type === "generation_failed") {
      return;
    }
  }
}
