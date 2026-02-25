import { describe, expect, it } from "vitest";
import validSlides from "./fixtures/slideContent.valid.json";
import validIngredients from "./fixtures/pitchIngredients.valid.json";
import { enforceOpenQuestionsIfMissingDetails } from "../src/validation/constraints.js";

describe("missing details -> open_questions behavior", () => {
  it("injects open_questions when missing_details exists and no slide has open questions", () => {
    const ingredients = structuredClone(validIngredients);
    ingredients.missing_details = [
      "Current conversion rate by stage",
      "Median contract value in target segment"
    ];

    const slides = structuredClone(validSlides);
    slides.slides.forEach((slide) => {
      slide.open_questions = [];
      slide.template_bindings.OPEN_QUESTIONS = "";
    });

    const output = enforceOpenQuestionsIfMissingDetails(ingredients, slides);

    expect(output.slides[7].open_questions.length).toBeGreaterThan(0);
    expect(output.slides[7].template_bindings.OPEN_QUESTIONS).toContain("Can we confirm");
  });

  it("keeps existing open_questions untouched", () => {
    const ingredients = structuredClone(validIngredients);
    ingredients.missing_details = ["Win-rate baseline by region"];

    const slides = structuredClone(validSlides);
    slides.slides[3].open_questions = ["Do we have EMEA baseline data?"];

    const output = enforceOpenQuestionsIfMissingDetails(ingredients, slides);

    expect(output.slides[3].open_questions).toEqual(["Do we have EMEA baseline data?"]);
  });
});
