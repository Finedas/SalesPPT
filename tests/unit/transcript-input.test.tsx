import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TranscriptInput } from "@/components/TranscriptInput";

describe("TranscriptInput", () => {
  it("disables submit for empty text", () => {
    render(<TranscriptInput transcript="" isSubmitting={false} onChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /generate structured content/i })).toBeDisabled();
  });

  it("calls onChange when textarea changes", () => {
    const onChange = vi.fn();
    render(<TranscriptInput transcript="hello" isSubmitting={false} onChange={onChange} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/paste your project transcript/i), { target: { value: "updated" } });
    expect(onChange).toHaveBeenCalledWith("updated");
  });
});
