import pitchIngredientsSchema from "../schemas/pitchIngredients.schema.json";
import slideContentSchema from "../schemas/slideContent.schema.json";
import { generateStrictJson } from "../openai/client.js";
import { assertPitchIngredientsSchema, assertSlideContentSchema } from "../validation/schemaValidator.js";
import { enforceOpenQuestionsIfMissingDetails, enforceTemplateConstraints } from "../validation/constraints.js";
import { mapSlidesToRendererBindings } from "../renderer/mapToTemplate.js";
import type { PitchIngredients, SlideContent } from "../types.js";

const INGREDIENTS_SYSTEM_PROMPT =
  "You are a strict data transformer. Extract only evidence-backed sales facts from the transcript. " +
  "Return JSON only. If facts are missing, put concise gaps in missing_details. Do not invent any metrics.";

const SLIDES_SYSTEM_PROMPT =
  "You are a strict sales-deck formatter. Produce 8 slides for SALES_PPT_V1. " +
  "Respect all limits exactly. Keep claims grounded in the provided ingredients. " +
  "speaker_notes must be 60-120 words per slide. Return JSON only.";

export type DeckPipelineResult = {
  pitch_ingredients: PitchIngredients;
  slide_content: SlideContent;
  renderer_payload: ReturnType<typeof mapSlidesToRendererBindings>;
};

export async function runDeckPipeline(transcript: string): Promise<DeckPipelineResult> {
  const pitchIngredients = await generateStrictJson<PitchIngredients>({
    schemaName: "pitch_ingredients",
    schema: pitchIngredientsSchema as object,
    systemPrompt: INGREDIENTS_SYSTEM_PROMPT,
    userPrompt: `Transcript:\n${transcript}`,
    maxOutputTokens: 1800
  });

  assertPitchIngredientsSchema(pitchIngredients);

  const slideContent = await generateStrictJson<SlideContent>({
    schemaName: "slide_content",
    schema: slideContentSchema as object,
    systemPrompt: SLIDES_SYSTEM_PROMPT,
    userPrompt: `Pitch ingredients JSON:\n${JSON.stringify(pitchIngredients)}`,
    maxOutputTokens: 3800
  });

  assertSlideContentSchema(slideContent);
  enforceTemplateConstraints(slideContent);
  enforceOpenQuestionsIfMissingDetails(pitchIngredients, slideContent);

  const rendererPayload = mapSlidesToRendererBindings(slideContent);

  return {
    pitch_ingredients: pitchIngredients,
    slide_content: slideContent,
    renderer_payload: rendererPayload
  };
}
