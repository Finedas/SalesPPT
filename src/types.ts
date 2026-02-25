export type PitchIngredients = {
  product_name: string;
  audience: {
    buyer: string;
    user: string;
    segment: string;
  };
  problem_statement: string;
  value_proposition: string;
  differentiators: string[];
  proof_inputs: string[];
  business_impact: string[];
  objections?: string[];
  recommended_next_step: string;
  missing_details: string[];
};

export type TemplateBindingKeys = {
  TITLE: string;
  SUBTITLE: string;
  BULLET_1: string;
  BULLET_2: string;
  BULLET_3: string;
  PROOF_POINT: string;
  SPEAKER_NOTES: string;
  OPEN_QUESTIONS: string;
};

export type Slide = {
  slide_number: number;
  placeholder_id:
    | "SLIDE_01_EXEC_SUMMARY"
    | "SLIDE_02_PROBLEM"
    | "SLIDE_03_SOLUTION"
    | "SLIDE_04_DIFFERENTIATION"
    | "SLIDE_05_PROOF"
    | "SLIDE_06_BUSINESS_IMPACT"
    | "SLIDE_07_ROLLOUT"
    | "SLIDE_08_CLOSE_AND_QA";
  title: string;
  subtitle: string;
  bullets: string[];
  proof_point: string;
  speaker_notes: string;
  open_questions: string[];
  template_bindings: TemplateBindingKeys;
};

export type SlideContent = {
  deck_template_version: "SALES_PPT_V1";
  slides: Slide[];
};

export type RenderedSlide = {
  slide_number: number;
  placeholder_id: Slide["placeholder_id"];
  placeholders: TemplateBindingKeys;
};
