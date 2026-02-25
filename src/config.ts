import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  MAX_TRANSCRIPT_CHARS: z.coerce.number().int().positive().default(30000),
  OPENAI_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
  OPENAI_RETRY_BASE_MS: z.coerce.number().int().min(50).max(10000).default(500)
});

const envResult = EnvSchema.safeParse(process.env);

if (!envResult.success) {
  const errors = envResult.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${errors}`);
}

export const env = envResult.data;
