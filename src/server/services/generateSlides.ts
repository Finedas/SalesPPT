import type { ExecutiveSections, ExecutiveSlidesResponse, LLMModel, LLMProviderName } from "@/lib/types";
import { createLLMProvider } from "@/lib/llmProviders";
import { validateSlidesAgainstSections } from "@/lib/validation/slides";

export async function generateExecutiveSlides(
  sections: ExecutiveSections,
  provider: LLMProviderName,
  model: LLMModel
): Promise<ExecutiveSlidesResponse> {
  const llmProvider = createLLMProvider({ provider, model });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const slides = await llmProvider.generateSlides(sections);
    const validation = validateSlidesAgainstSections(slides, sections);
    if (validation.valid) {
      return slides;
    }

    if (attempt === 1) {
      throw new Error(`Slides validation failed: ${validation.issues.join(" ")}`);
    }
  }

  throw new Error("Slides generation failed.");
}
