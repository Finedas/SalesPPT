import { z } from "zod";

export const executiveSectionsSchema = z.object({
  companyBackground: z.string().trim().min(1),
  solution: z.string().trim().min(1),
  challenge: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  implementation: z.string().trim().min(1),
  results: z.string().trim().min(1)
}).strict();

export const ollamaSectionPlanEntrySchema = z.object({
  focus: z.string().trim().min(1),
  constraints: z.array(z.string().trim().min(1)).min(1),
  supportedFacts: z.array(z.string().trim().min(1)).min(1),
  missingDataNotes: z.array(z.string().trim().min(1))
}).strict();

export const ollamaSectionPlanSchema = z.object({
  companyBackground: ollamaSectionPlanEntrySchema,
  solution: ollamaSectionPlanEntrySchema,
  challenge: ollamaSectionPlanEntrySchema,
  summary: ollamaSectionPlanEntrySchema,
  implementation: ollamaSectionPlanEntrySchema,
  results: ollamaSectionPlanEntrySchema
}).strict();

export const executiveSectionsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "companyBackground",
    "solution",
    "challenge",
    "summary",
    "implementation",
    "results"
  ],
  properties: {
    companyBackground: { type: "string", minLength: 1 },
    solution: { type: "string", minLength: 1 },
    challenge: { type: "string", minLength: 1 },
    summary: { type: "string", minLength: 1 },
    implementation: { type: "string", minLength: 1 },
    results: { type: "string", minLength: 1 }
  }
} as const;

export const ollamaSectionPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "companyBackground",
    "solution",
    "challenge",
    "summary",
    "implementation",
    "results"
  ],
  properties: {
    companyBackground: {
      type: "object",
      additionalProperties: false,
      required: ["focus", "constraints", "supportedFacts", "missingDataNotes"],
      properties: {
        focus: { type: "string", minLength: 1 },
        constraints: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        supportedFacts: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        missingDataNotes: { type: "array", items: { type: "string", minLength: 1 } }
      }
    },
    solution: {
      type: "object",
      additionalProperties: false,
      required: ["focus", "constraints", "supportedFacts", "missingDataNotes"],
      properties: {
        focus: { type: "string", minLength: 1 },
        constraints: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        supportedFacts: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        missingDataNotes: { type: "array", items: { type: "string", minLength: 1 } }
      }
    },
    challenge: {
      type: "object",
      additionalProperties: false,
      required: ["focus", "constraints", "supportedFacts", "missingDataNotes"],
      properties: {
        focus: { type: "string", minLength: 1 },
        constraints: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        supportedFacts: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        missingDataNotes: { type: "array", items: { type: "string", minLength: 1 } }
      }
    },
    summary: {
      type: "object",
      additionalProperties: false,
      required: ["focus", "constraints", "supportedFacts", "missingDataNotes"],
      properties: {
        focus: { type: "string", minLength: 1 },
        constraints: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        supportedFacts: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        missingDataNotes: { type: "array", items: { type: "string", minLength: 1 } }
      }
    },
    implementation: {
      type: "object",
      additionalProperties: false,
      required: ["focus", "constraints", "supportedFacts", "missingDataNotes"],
      properties: {
        focus: { type: "string", minLength: 1 },
        constraints: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        supportedFacts: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        missingDataNotes: { type: "array", items: { type: "string", minLength: 1 } }
      }
    },
    results: {
      type: "object",
      additionalProperties: false,
      required: ["focus", "constraints", "supportedFacts", "missingDataNotes"],
      properties: {
        focus: { type: "string", minLength: 1 },
        constraints: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        supportedFacts: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
        missingDataNotes: { type: "array", items: { type: "string", minLength: 1 } }
      }
    }
  }
} as const;
