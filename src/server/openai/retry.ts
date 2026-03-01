export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function getRetryConfig() {
  return {
    maxRetries: Number(process.env.OPENAI_MAX_RETRIES || 3),
    baseDelayMs: Number(process.env.OPENAI_RETRY_BASE_MS || 500)
  };
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>
): Promise<T> {
  const { maxRetries, baseDelayMs } = getRetryConfig();
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }

      const jitter = Math.floor(Math.random() * 100);
      const delay = baseDelayMs * 2 ** attempt + jitter;
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenAI request failed.");
}
