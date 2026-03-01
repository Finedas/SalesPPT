import { executiveSlidesJsonSchema } from "@/lib/schemas/slides.schema";
import type { ExecutiveSections, ExecutiveSlidesResponse } from "@/lib/types";
import { validateSlidesAgainstSections } from "@/lib/validation/slides";
import { getOpenAIClient, getOpenAIModel } from "@/server/openai/client";
import { buildRepairPrompt, buildSlidesUserPrompt, slidesSystemPrompt } from "@/server/openai/prompts";
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

async function requestSlides(userPrompt: string): Promise<ExecutiveSlidesResponse> {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: getOpenAIModel(),
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: slidesSystemPrompt }]
      },
      {
        role: "user",
        content: [{ type: "input_text", text: userPrompt }]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "ExecutiveSlidesResponse",
        strict: true,
        schema: executiveSlidesJsonSchema
      }
    }
  });

  return JSON.parse(extractOutputText(response)) as ExecutiveSlidesResponse;
}

export async function generateExecutiveSlides(sections: ExecutiveSections): Promise<ExecutiveSlidesResponse> {
  const initialPrompt = buildSlidesUserPrompt(JSON.stringify(sections));
  let prompt = initialPrompt;

  return withRetry(async () => {
    const slides = await requestSlides(prompt);
    const validation = validateSlidesAgainstSections(slides, sections);

    if (!validation.valid) {
      prompt = buildRepairPrompt(validation.issues, initialPrompt);
      throw new Error(`Slides validation failed: ${validation.issues.join(" ")}`);
    }

    return slides;
  });
}
