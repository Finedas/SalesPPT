import { beforeEach, describe, expect, it, vi } from "vitest";
import validSlides from "./fixtures/slideContent.valid.json";
import validIngredients from "./fixtures/pitchIngredients.valid.json";

const generateStrictJsonMock = vi.fn();

vi.mock("../src/openai/client.js", () => ({
  generateStrictJson: generateStrictJsonMock
}));

describe("prompt -> schema pipeline", () => {
  beforeEach(() => {
    generateStrictJsonMock.mockReset();
  });

  it("runs two-stage generation and returns renderer payload", async () => {
    const ingredients = structuredClone(validIngredients);
    ingredients.missing_details = ["ROI baseline by region"];

    const slides = structuredClone(validSlides);
    slides.slides.forEach((slide) => {
      slide.open_questions = [];
      slide.template_bindings.OPEN_QUESTIONS = "";
    });

    generateStrictJsonMock.mockResolvedValueOnce(ingredients).mockResolvedValueOnce(slides);

    const { runDeckPipeline } = await import("../src/services/deckPipeline.js");
    const result = await runDeckPipeline("sample transcript text");

    expect(generateStrictJsonMock).toHaveBeenCalledTimes(2);
    expect(result.slide_content.slides).toHaveLength(8);
    expect(result.renderer_payload[0].placeholders.TITLE).toBe(result.slide_content.slides[0].title);
    expect(result.slide_content.slides[7].open_questions.length).toBeGreaterThan(0);
  });
});
