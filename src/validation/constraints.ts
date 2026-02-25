import type { PitchIngredients, Slide, SlideContent } from "../types.js";

const TITLE_MAX = 42;
const SUBTITLE_MAX = 70;
const BULLET_MAX = 90;
const BULLETS_MAX_COUNT = 3;
const SPEAKER_NOTES_MIN_WORDS = 60;
const SPEAKER_NOTES_MAX_WORDS = 120;

const PROOF_POINT_RE = /(\d|%|percent|case study|reference customer|pilot|benchmark|analyst|g2|forrester|gartner)/i;

function wordsCount(input: string): number {
  return input.trim().split(/\s+/).filter(Boolean).length;
}

function assertSlideRules(slide: Slide): void {
  if (slide.title.length > TITLE_MAX) {
    throw new Error(`Slide ${slide.slide_number}: title exceeds ${TITLE_MAX} chars`);
  }
  if (slide.subtitle.length > SUBTITLE_MAX) {
    throw new Error(`Slide ${slide.slide_number}: subtitle exceeds ${SUBTITLE_MAX} chars`);
  }
  if (slide.bullets.length > BULLETS_MAX_COUNT) {
    throw new Error(`Slide ${slide.slide_number}: bullets exceed ${BULLETS_MAX_COUNT} items`);
  }
  for (const bullet of slide.bullets) {
    if (bullet.length > BULLET_MAX) {
      throw new Error(`Slide ${slide.slide_number}: bullet exceeds ${BULLET_MAX} chars`);
    }
  }

  const noteWords = wordsCount(slide.speaker_notes);
  if (noteWords < SPEAKER_NOTES_MIN_WORDS || noteWords > SPEAKER_NOTES_MAX_WORDS) {
    throw new Error(
      `Slide ${slide.slide_number}: speaker_notes word count must be ${SPEAKER_NOTES_MIN_WORDS}-${SPEAKER_NOTES_MAX_WORDS}`
    );
  }

  if (!PROOF_POINT_RE.test(slide.proof_point)) {
    throw new Error(
      `Slide ${slide.slide_number}: proof_point must contain a metric or credible qualitative proof`
    );
  }
}

export function enforceTemplateConstraints(slideContent: SlideContent): SlideContent {
  if (slideContent.slides.length !== 8) {
    throw new Error("Template violation: exactly 8 slides are required");
  }

  slideContent.slides.forEach(assertSlideRules);
  return slideContent;
}

export function enforceOpenQuestionsIfMissingDetails(
  ingredients: PitchIngredients,
  slideContent: SlideContent
): SlideContent {
  if (ingredients.missing_details.length === 0) {
    return slideContent;
  }

  const hasOpenQuestions = slideContent.slides.some((slide) => slide.open_questions.length > 0);
  if (hasOpenQuestions) {
    return slideContent;
  }

  slideContent.slides[7].open_questions = ingredients.missing_details
    .slice(0, 5)
    .map((detail) => `Can we confirm: ${detail}?`);

  slideContent.slides[7].template_bindings.OPEN_QUESTIONS = slideContent.slides[7].open_questions.join(" | ");

  return slideContent;
}
