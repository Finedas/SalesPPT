export type ExecutiveSections = {
  companyBackground: string;
  solution: string;
  challenge: string;
  summary: string;
  implementation: string;
  results: string;
};

export type GenerateSectionsRequest = {
  transcript: string;
};

export type GenerateSlidesRequest = {
  sections: ExecutiveSections;
};

export type ApiError = {
  error: string;
  details: string;
  issues?: string[];
};

export type SlideSectionBlock = {
  heading: string;
  body: string;
};

export type TwoColumnSummarySlide = {
  variant: "two-column-summary";
  title: string;
  leftColumn: [SlideSectionBlock, SlideSectionBlock];
  rightColumn: [SlideSectionBlock, SlideSectionBlock];
};

export type ResultsBannerSlide = {
  variant: "results-banner";
  title: string;
  results: SlideSectionBlock;
  executiveQuote: string;
  attribution: "– Generated Executive Brief";
};

export type SingleSlideBrief = {
  variant: "single-slide-brief";
  title: string;
  leftColumn: [SlideSectionBlock, SlideSectionBlock, SlideSectionBlock];
  rightColumn: [SlideSectionBlock, SlideSectionBlock, SlideSectionBlock];
  executiveQuote: string;
  attribution: "– Generated Executive Brief";
};

export type ExecutiveSlide = TwoColumnSummarySlide | ResultsBannerSlide | SingleSlideBrief;

export type ExecutiveSlidesResponse = {
  slideCount: 1 | 2;
  slide1: TwoColumnSummarySlide | SingleSlideBrief;
  slide2?: ResultsBannerSlide;
};

export type ValidationResult = {
  valid: boolean;
  issues: string[];
};
