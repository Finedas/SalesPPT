import { describe, expect, it } from "vitest";
import validIngredients from "./fixtures/pitchIngredients.valid.json";
import validSlides from "./fixtures/slideContent.valid.json";
import { assertPitchIngredientsSchema, assertSlideContentSchema } from "../src/validation/schemaValidator.js";

describe("JSON schema conformance", () => {
  it("accepts valid Pitch Ingredients JSON", () => {
    expect(() => assertPitchIngredientsSchema(validIngredients)).not.toThrow();
  });

  it("accepts valid Slide Content JSON", () => {
    expect(() => assertSlideContentSchema(validSlides)).not.toThrow();
  });

  it("rejects invalid Slide Content JSON", () => {
    const invalid = structuredClone(validSlides);
    invalid.slides[0].placeholder_id = "BAD_PLACEHOLDER";
    expect(() => assertSlideContentSchema(invalid)).toThrow(/SlideContent schema validation failed/);
  });
});
