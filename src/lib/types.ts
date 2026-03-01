export type LLMProviderName = "openai" | "ollama";
export type OpenAIModel = "gpt-4o" | "gpt-4.1-mini" | "gpt-4o-mini";
export type OllamaModel = "llama3" | "mistral" | "mixtral" | "phi3";
export type LLMModel = OpenAIModel | OllamaModel;

export type ExecutiveSections = {
  companyBackground: string;
  solution: string;
  challenge: string;
  summary: string;
  implementation: string;
  results: string;
};

export type ExecutiveSectionKey = keyof ExecutiveSections;

export type OllamaSectionPlanEntry = {
  focus: string;
  constraints: string[];
  supportedFacts: string[];
  missingDataNotes: string[];
};

export type OllamaSectionPlan = Record<ExecutiveSectionKey, OllamaSectionPlanEntry>;

export type GenerateSectionsRequest = {
  transcript: string;
  provider: LLMProviderName;
  model: LLMModel;
};

export type GenerateSlidesRequest = {
  sections: ExecutiveSections;
  provider: LLMProviderName;
  model: LLMModel;
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

export type ProviderOption = {
  value: LLMProviderName;
  label: string;
  badge: "Remote API" | "Local Model";
};

export type ModelOption = {
  value: LLMModel;
  label: string;
};

export type ProviderGenerationOptions = {
  repair?: boolean;
  validationIssues?: string[];
};

export type SectionGenerationState = "idle" | "pending" | "complete" | "failed";

export type SectionGenerationEvent =
  | {
      type: "generation_started";
      sectionOrder: ExecutiveSectionKey[];
    }
  | {
      type: "section_started";
      sectionKey: ExecutiveSectionKey;
    }
  | {
      type: "section_completed";
      sectionKey: ExecutiveSectionKey;
      content: string;
    }
  | {
      type: "section_failed";
      sectionKey: ExecutiveSectionKey;
      error: string;
    }
  | {
      type: "generation_completed";
      sections: ExecutiveSections;
    }
  | {
      type: "generation_failed";
      error: string;
    };

export type SectionGenerationStatusMap = Record<ExecutiveSectionKey, {
  state: SectionGenerationState;
  error?: string;
}>;

export interface LLMProvider {
  generateSections(transcript: string, options?: ProviderGenerationOptions): Promise<ExecutiveSections>;
  generateSectionsStream(transcript: string, options?: ProviderGenerationOptions): AsyncGenerator<SectionGenerationEvent>;
  generateSlides(sections: ExecutiveSections, options?: ProviderGenerationOptions): Promise<ExecutiveSlidesResponse>;
}
