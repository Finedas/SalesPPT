import { executiveSectionsJsonSchema } from "@/lib/schemas/sections.schema";
import type { ExecutiveSections } from "@/lib/types";
import { validateSections } from "@/lib/validation/sections";
import { getOpenAIClient, getOpenAIModel } from "@/server/openai/client";
import { buildRepairPrompt, buildSectionsUserPrompt, sectionsSystemPrompt } from "@/server/openai/prompts";
import { withRetry } from "@/server/openai/retry";

function extractOutputText(response: any): string {
  if (response.output_text) {
    return response.output_text;
  }

  for (const item of response.output || []) {
    if (item.type === "message") {
      for (const content of item.content || []) {
        if (content.type === "output_text") {
          return content.text;
        }
      }
    }
  }

  throw new Error("OpenAI response did not contain output text.");
}

async function requestSections(userPrompt: string): Promise<ExecutiveSections> {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: getOpenAIModel(),
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: sectionsSystemPrompt }]
      },
      {
        role: "user",
        content: [{ type: "input_text", text: userPrompt }]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "ExecutiveSections",
        strict: true,
        schema: executiveSectionsJsonSchema
      }
    }
  });

  return JSON.parse(extractOutputText(response)) as ExecutiveSections;
}

export async function generateExecutiveSections(transcript: string): Promise<ExecutiveSections> {
  const initialPrompt = buildSectionsUserPrompt(transcript);
  let prompt = initialPrompt;

  return withRetry(async () => {
    const sections = await requestSections(prompt);
    const validation = validateSections(sections);

    if (!validation.valid) {
      prompt = buildRepairPrompt(validation.issues, initialPrompt);
      throw new Error(`Sections validation failed: ${validation.issues.join(" ")}`);
    }

    return sections;
  });
}
