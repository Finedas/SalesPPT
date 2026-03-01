import { z } from "zod";
import { ATTRIBUTION_LINE } from "@/lib/constants";

const slideSectionBlockSchema = z.object({
  heading: z.string().trim().min(1),
  body: z.string().trim().min(1)
}).strict();

const twoColumnSummarySchema = z.object({
  variant: z.literal("two-column-summary"),
  title: z.string().trim().min(1),
  leftColumn: z.tuple([slideSectionBlockSchema, slideSectionBlockSchema]),
  rightColumn: z.tuple([slideSectionBlockSchema, slideSectionBlockSchema])
}).strict();

const resultsBannerSchema = z.object({
  variant: z.literal("results-banner"),
  title: z.string().trim().min(1),
  results: slideSectionBlockSchema,
  executiveQuote: z.string().trim().min(1),
  attribution: z.literal(ATTRIBUTION_LINE)
}).strict();

const singleSlideBriefSchema = z.object({
  variant: z.literal("single-slide-brief"),
  title: z.string().trim().min(1),
  leftColumn: z.tuple([slideSectionBlockSchema, slideSectionBlockSchema, slideSectionBlockSchema]),
  rightColumn: z.tuple([slideSectionBlockSchema, slideSectionBlockSchema, slideSectionBlockSchema]),
  executiveQuote: z.string().trim().min(1),
  attribution: z.literal(ATTRIBUTION_LINE)
}).strict();

export const executiveSlidesSchema = z.object({
  slideCount: z.union([z.literal(1), z.literal(2)]),
  slide1: z.union([twoColumnSummarySchema, singleSlideBriefSchema]),
  slide2: resultsBannerSchema.optional()
}).strict();

const slideSectionBlockJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["heading", "body"],
  properties: {
    heading: { type: "string", minLength: 1 },
    body: { type: "string", minLength: 1 }
  }
} as const;

const twoColumnSummaryJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["variant", "title", "leftColumn", "rightColumn"],
  properties: {
    variant: { type: "string", enum: ["two-column-summary"] },
    title: { type: "string", minLength: 1 },
    leftColumn: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: slideSectionBlockJsonSchema
    },
    rightColumn: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: slideSectionBlockJsonSchema
    }
  }
} as const;

const resultsBannerJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["variant", "title", "results", "executiveQuote", "attribution"],
  properties: {
    variant: { type: "string", enum: ["results-banner"] },
    title: { type: "string", minLength: 1 },
    results: slideSectionBlockJsonSchema,
    executiveQuote: { type: "string", minLength: 1 },
    attribution: { type: "string", enum: [ATTRIBUTION_LINE] }
  }
} as const;

const singleSlideBriefJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["variant", "title", "leftColumn", "rightColumn", "executiveQuote", "attribution"],
  properties: {
    variant: { type: "string", enum: ["single-slide-brief"] },
    title: { type: "string", minLength: 1 },
    leftColumn: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: slideSectionBlockJsonSchema
    },
    rightColumn: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: slideSectionBlockJsonSchema
    },
    executiveQuote: { type: "string", minLength: 1 },
    attribution: { type: "string", enum: [ATTRIBUTION_LINE] }
  }
} as const;

export const executiveSlidesJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["slideCount", "slide1"],
  properties: {
    slideCount: {
      type: "integer",
      enum: [1, 2]
    },
    slide1: {
      oneOf: [twoColumnSummaryJsonSchema, singleSlideBriefJsonSchema]
    },
    slide2: resultsBannerJsonSchema
  }
} as const;
