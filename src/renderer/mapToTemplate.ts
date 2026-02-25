import type { RenderedSlide, SlideContent } from "../types.js";

export function mapSlidesToRendererBindings(slideContent: SlideContent): RenderedSlide[] {
  return slideContent.slides.map((slide) => ({
    slide_number: slide.slide_number,
    placeholder_id: slide.placeholder_id,
    placeholders: {
      TITLE: slide.title,
      SUBTITLE: slide.subtitle,
      BULLET_1: slide.bullets[0] ?? "",
      BULLET_2: slide.bullets[1] ?? "",
      BULLET_3: slide.bullets[2] ?? "",
      PROOF_POINT: slide.proof_point,
      SPEAKER_NOTES: slide.speaker_notes,
      OPEN_QUESTIONS: slide.open_questions.join(" | ")
    }
  }));
}
