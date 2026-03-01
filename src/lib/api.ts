import type {
  ApiError,
  ExecutiveSections,
  ExecutiveSlidesResponse,
  LLMModel,
  LLMProviderName,
  SectionGenerationEvent
} from "@/lib/types";

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(error.details || error.error || "Request failed.");
  }

  return data as T;
}

export async function generateSectionsStream(params: {
  transcript: string;
  provider: LLMProviderName;
  model: LLMModel;
  onEvent: (event: SectionGenerationEvent) => void;
}): Promise<void> {
  const response = await fetch("/api/generate-sections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ transcript: params.transcript, provider: params.provider, model: params.model })
  });

  if (!response.ok) {
    await handleResponse<ExecutiveSections>(response);
    return;
  }

  if (!response.body) {
    throw new Error("Streaming response body was not available.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      params.onEvent(JSON.parse(trimmed) as SectionGenerationEvent);
    }
  }

  const trimmed = buffer.trim();
  if (trimmed) {
    params.onEvent(JSON.parse(trimmed) as SectionGenerationEvent);
  }
}

export async function generateSlides(
  sections: ExecutiveSections,
  provider: LLMProviderName,
  model: LLMModel
): Promise<ExecutiveSlidesResponse> {
  const response = await fetch("/api/generate-slides", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sections, provider, model })
  });

  return handleResponse<ExecutiveSlidesResponse>(response);
}
