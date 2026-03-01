export const SECTION_WORD_MIN = 120;
export const SECTION_WORD_MAX = 200;
export const SECTION_PARAGRAPH_MAX = 2;
export const TRANSCRIPT_CHAR_MAX = 30000;
export const ATTRIBUTION_LINE = "– Generated Executive Brief" as const;

export const SECTION_LABELS: Record<keyof import("./types").ExecutiveSections, string> = {
  companyBackground: "Company Background",
  solution: "The Solution",
  challenge: "The Challenge",
  summary: "Summary",
  implementation: "The Implementation",
  results: "The Results"
};
