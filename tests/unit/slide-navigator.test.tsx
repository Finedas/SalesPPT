import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SlideNavigator } from "@/components/SlideNavigator";

describe("SlideNavigator", () => {
  it("changes slides when navigation buttons are clicked", () => {
    const onNavigate = vi.fn();
    render(<SlideNavigator slideCount={2} activeIndex={0} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /slide 2/i }));
    expect(onNavigate).toHaveBeenCalledWith(1);
  });
});
