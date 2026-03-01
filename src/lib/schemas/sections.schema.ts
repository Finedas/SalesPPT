import { z } from "zod";

export const executiveSectionsSchema = z.object({
  companyBackground: z.string().trim().min(1),
  solution: z.string().trim().min(1),
  challenge: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  implementation: z.string().trim().min(1),
  results: z.string().trim().min(1)
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
