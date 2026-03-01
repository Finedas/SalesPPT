import { describe, expect, it } from "vitest";
import { ollamaSectionPlanSchema } from "@/lib/schemas/sections.schema";

describe("ollamaSectionPlanSchema", () => {
  it("accepts a valid section plan object", () => {
    const value = {
      companyBackground: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
      solution: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
      challenge: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
      summary: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
      implementation: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
      results: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] }
    };

    expect(ollamaSectionPlanSchema.safeParse(value).success).toBe(true);
  });

  it("rejects missing keys", () => {
    const value = {
      companyBackground: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] }
    };

    expect(ollamaSectionPlanSchema.safeParse(value).success).toBe(false);
  });
});

