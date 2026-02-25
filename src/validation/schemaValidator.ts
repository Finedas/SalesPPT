import Ajv2020, { type ValidateFunction } from "ajv/dist/2020.js";
import pitchIngredientsSchema from "../schemas/pitchIngredients.schema.json";
import slideContentSchema from "../schemas/slideContent.schema.json";
import type { PitchIngredients, SlideContent } from "../types.js";

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  removeAdditional: false
});

const validatePitchIngredients = ajv.compile<PitchIngredients>(pitchIngredientsSchema as object);
const validateSlideContent = ajv.compile<SlideContent>(slideContentSchema as object);

function formatAjvErrors(validateFn: ValidateFunction<unknown>): string {
  return (validateFn.errors ?? [])
    .map((err) => `${err.instancePath || "/"} ${err.message ?? "schema violation"}`.trim())
    .join("; ");
}

export function assertPitchIngredientsSchema(data: unknown): asserts data is PitchIngredients {
  if (!validatePitchIngredients(data)) {
    throw new Error(`PitchIngredients schema validation failed: ${formatAjvErrors(validatePitchIngredients)}`);
  }
}

export function assertSlideContentSchema(data: unknown): asserts data is SlideContent {
  if (!validateSlideContent(data)) {
    throw new Error(`SlideContent schema validation failed: ${formatAjvErrors(validateSlideContent)}`);
  }
}
