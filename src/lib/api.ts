import type { ApiError, ExecutiveSections, ExecutiveSlidesResponse } from "@/lib/types";

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(error.details || error.error || "Request failed.");
  }

  return data as T;
}

export async function generateSections(transcript: string): Promise<ExecutiveSections> {
  const response = await fetch("/api/generate-sections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ transcript })
  });

  return handleResponse<ExecutiveSections>(response);
}

export async function generateSlides(sections: ExecutiveSections): Promise<ExecutiveSlidesResponse> {
  const response = await fetch("/api/generate-slides", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sections })
  });

  return handleResponse<ExecutiveSlidesResponse>(response);
}
