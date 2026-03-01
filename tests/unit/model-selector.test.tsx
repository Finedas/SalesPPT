import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModelSelector } from "@/components/ModelSelector";

const generateSectionsStreamMock = vi.fn();
const generateSlidesMock = vi.fn();

vi.mock("@/lib/api", () => ({
  generateSectionsStream: (...args: unknown[]) => generateSectionsStreamMock(...args),
  generateSlides: (...args: unknown[]) => generateSlidesMock(...args)
}));

describe("ModelSelector", () => {
  it("changes model list when provider changes", () => {
    const onProviderChange = vi.fn();
    const { rerender } = render(
      <ModelSelector provider="openai" model="gpt-4.1-mini" onProviderChange={onProviderChange} onModelChange={vi.fn()} />
    );

    const initialOptions = screen.getByLabelText(/model/i).querySelectorAll("option");
    expect(Array.from(initialOptions).map((option) => option.textContent)).toEqual(["gpt-4o", "gpt-4.1-mini", "gpt-4o-mini"]);

    fireEvent.change(screen.getByLabelText(/provider/i), { target: { value: "ollama" } });
    expect(onProviderChange).toHaveBeenCalledWith("ollama");

    rerender(<ModelSelector provider="ollama" model="llama3" onProviderChange={onProviderChange} onModelChange={vi.fn()} />);

    const ollamaOptions = screen.getByLabelText(/model/i).querySelectorAll("option");
    expect(Array.from(ollamaOptions).map((option) => option.textContent)).toEqual(["llama3", "mistral", "mixtral", "phi3"]);
  });

  it("updates provider badge between remote and local", () => {
    const { rerender } = render(
      <ModelSelector provider="openai" model="gpt-4.1-mini" onProviderChange={vi.fn()} onModelChange={vi.fn()} />
    );
    expect(screen.getByText(/remote api/i)).toBeInTheDocument();

    rerender(<ModelSelector provider="ollama" model="llama3" onProviderChange={vi.fn()} onModelChange={vi.fn()} />);
    expect(screen.getAllByText(/local model/i).length).toBeGreaterThan(0);
  });
});

describe("AppShell provider selection", () => {
  beforeEach(() => {
    generateSectionsStreamMock.mockReset();
    generateSlidesMock.mockReset();
  });

  it("sends selected provider and model in API calls", async () => {
    generateSectionsStreamMock.mockImplementation(async ({ onEvent }: { onEvent: (event: any) => void }) => {
      onEvent({
        type: "generation_started",
        sectionOrder: ["companyBackground", "solution", "challenge", "summary", "implementation", "results"]
      });
      onEvent({ type: "section_started", sectionKey: "companyBackground" });
      onEvent({ type: "section_completed", sectionKey: "companyBackground", content: "a ".repeat(130).trim() });
      onEvent({
        type: "generation_completed",
        sections: {
          companyBackground: "a ".repeat(130).trim(),
          solution: "b ".repeat(130).trim(),
          challenge: "c ".repeat(130).trim(),
          summary: "d ".repeat(130).trim(),
          implementation: "e ".repeat(130).trim(),
          results: "f ".repeat(130).trim()
        }
      });
    });

    const { AppShell } = await import("@/components/AppShell");
    render(<AppShell />);

    fireEvent.change(screen.getByLabelText(/provider/i), { target: { value: "ollama" } });
    const modelOptions = screen.getByLabelText(/model/i).querySelectorAll("option");
    expect(Array.from(modelOptions).map((option) => option.textContent)).toEqual(["llama3", "mistral", "mixtral", "phi3"]);
    fireEvent.change(screen.getByLabelText(/paste your project transcript/i), { target: { value: "transcript" } });
    fireEvent.click(screen.getByRole("button", { name: /generate structured content/i }));

    expect(generateSectionsStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({ transcript: "transcript", provider: "ollama", model: "llama3" })
    );
  });

  it("shows connectivity failure guidance for unreachable Ollama", async () => {
    generateSectionsStreamMock.mockRejectedValue(new Error("Ollama is not reachable at http://localhost:11434"));
    const { AppShell } = await import("@/components/AppShell");
    render(<AppShell />);

    fireEvent.change(screen.getByLabelText(/provider/i), { target: { value: "ollama" } });
    fireEvent.change(screen.getByLabelText(/paste your project transcript/i), { target: { value: "transcript" } });
    fireEvent.click(screen.getByRole("button", { name: /generate structured content/i }));

    expect(await screen.findByText(/start ollama locally and try again/i)).toBeInTheDocument();
  });

  it("shows missing model message verbatim", async () => {
    generateSectionsStreamMock.mockRejectedValue(new Error("Ollama model 'llama3' is not installed locally. Run 'ollama run llama3' first."));
    const { AppShell } = await import("@/components/AppShell");
    render(<AppShell />);

    fireEvent.change(screen.getByLabelText(/provider/i), { target: { value: "ollama" } });
    fireEvent.change(screen.getByLabelText(/paste your project transcript/i), { target: { value: "transcript" } });
    fireEvent.click(screen.getByRole("button", { name: /generate structured content/i }));

    expect(await screen.findByText(/not installed locally/i)).toBeInTheDocument();
  });

  it("shows timeout-specific message", async () => {
    generateSectionsStreamMock.mockRejectedValue(new Error("Ollama request timed out at http://localhost:11434"));
    const { AppShell } = await import("@/components/AppShell");
    render(<AppShell />);

    fireEvent.change(screen.getByLabelText(/provider/i), { target: { value: "ollama" } });
    fireEvent.change(screen.getByLabelText(/paste your project transcript/i), { target: { value: "transcript" } });
    fireEvent.click(screen.getByRole("button", { name: /generate structured content/i }));

    expect(await screen.findByText(/timed out/i)).toBeInTheDocument();
  });

  it("renders step 2 immediately and populates the first completed section while generation continues", async () => {
    generateSectionsStreamMock.mockImplementation(async ({ onEvent }: { onEvent: (event: any) => void }) => {
      onEvent({
        type: "generation_started",
        sectionOrder: ["companyBackground", "solution", "challenge", "summary", "implementation", "results"]
      });
      onEvent({ type: "section_started", sectionKey: "companyBackground" });
      onEvent({ type: "section_completed", sectionKey: "companyBackground", content: "a ".repeat(130).trim() });
    });

    const { AppShell } = await import("@/components/AppShell");
    render(<AppShell />);

    fireEvent.change(screen.getByLabelText(/paste your project transcript/i), { target: { value: "transcript" } });
    fireEvent.click(screen.getByRole("button", { name: /generate structured content/i }));

    expect(await screen.findByText(/review and edit structured content/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/a a a/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate executive pitch/i })).toBeDisabled();
  });
});
