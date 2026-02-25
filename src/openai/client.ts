import OpenAI from "openai";
import { env } from "../config.js";

export const openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });

type GenerateJsonParams = {
  model?: string;
  schemaName: string;
  schema: object;
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractOutputText(response: any): string {
  if (response.output_text && response.output_text.trim().length > 0) {
    return response.output_text;
  }

  for (const item of response.output) {
    if (item.type === "message") {
      for (const content of item.content) {
        if (content.type === "output_text") {
          return content.text;
        }
      }
    }
  }

  throw new Error("OpenAI response did not contain output text");
}

export async function generateStrictJson<T>(params: GenerateJsonParams): Promise<T> {
  const maxRetries = env.OPENAI_MAX_RETRIES;
  const baseDelay = env.OPENAI_RETRY_BASE_MS;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      const response = await openaiClient.responses.create({
        model: params.model ?? env.OPENAI_MODEL,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: params.systemPrompt
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: params.userPrompt
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: params.schemaName,
            strict: true,
            schema: params.schema
          }
        },
        max_output_tokens: params.maxOutputTokens ?? 2200
      });

      return JSON.parse(extractOutputText(response)) as T;
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }
      const backoffMs = baseDelay * 2 ** attempt;
      await sleep(backoffMs);
      attempt += 1;
    }
  }

  throw new Error(`OpenAI generation failed after ${maxRetries + 1} attempts: ${String(lastError)}`);
}
