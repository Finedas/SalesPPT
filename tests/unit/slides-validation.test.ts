import { describe, expect, it } from "vitest";
import { ATTRIBUTION_LINE } from "@/lib/constants";
import type { ExecutiveSlidesResponse, SlideSectionBlock } from "@/lib/types";
import { validateSlides } from "@/lib/validation/slides";

const block: SlideSectionBlock = {
  heading: "Heading",
  body: "Body copy"
};

describe("slides validation", () => {
  it("accepts a valid two-slide payload", () => {
    const payload: ExecutiveSlidesResponse = {
      slideCount: 2,
      slide1: {
        variant: "two-column-summary",
        title: "Executive Summary",
        leftColumn: [block, block],
        rightColumn: [block, block]
      },
      slide2: {
        variant: "results-banner",
        title: "Results",
        results: block,
        executiveQuote: "A concise quote",
        attribution: ATTRIBUTION_LINE
      }
    };

    expect(validateSlides(payload).valid).toBe(true);
  });

  it("accepts a valid one-slide payload", () => {
    const payload: ExecutiveSlidesResponse = {
      slideCount: 1,
      slide1: {
        variant: "single-slide-brief",
        title: "Executive Summary",
        leftColumn: [block, block, block],
        rightColumn: [block, block, block],
        executiveQuote: "A concise quote",
        attribution: ATTRIBUTION_LINE
      }
    };

    expect(validateSlides(payload).valid).toBe(true);
  });

  it("rejects slideCount 2 without slide2", () => {
    const payload = {
      slideCount: 2,
      slide1: {
        variant: "two-column-summary",
        title: "Executive Summary",
        leftColumn: [block, block],
        rightColumn: [block, block]
      }
    } as ExecutiveSlidesResponse;

    expect(validateSlides(payload).issues).toContain("slide2 is required when slideCount is 2.");
  });

  it("rejects slideCount 1 with slide2", () => {
    const payload: ExecutiveSlidesResponse = {
      slideCount: 1,
      slide1: {
        variant: "single-slide-brief",
        title: "Executive Summary",
        leftColumn: [block, block, block],
        rightColumn: [block, block, block],
        executiveQuote: "A concise quote",
        attribution: ATTRIBUTION_LINE
      },
      slide2: {
        variant: "results-banner",
        title: "Results",
        results: block,
        executiveQuote: "A concise quote",
        attribution: ATTRIBUTION_LINE
      }
    };

    expect(validateSlides(payload).issues).toContain("slide2 must be omitted when slideCount is 1.");
  });

  it("rejects missing attribution on banner slide", () => {
    const payload = {
      slideCount: 2,
      slide1: {
        variant: "two-column-summary",
        title: "Executive Summary",
        leftColumn: [block, block],
        rightColumn: [block, block]
      },
      slide2: {
        variant: "results-banner",
        title: "Results",
        results: block,
        executiveQuote: "A concise quote",
        attribution: "wrong"
      }
    } as unknown as ExecutiveSlidesResponse;

    expect(validateSlides(payload).issues).toContain("slide2 attribution is invalid.");
  });

  it("rejects empty quote", () => {
    const payload = {
      slideCount: 2,
      slide1: {
        variant: "two-column-summary",
        title: "Executive Summary",
        leftColumn: [block, block],
        rightColumn: [block, block]
      },
      slide2: {
        variant: "results-banner",
        title: "Results",
        results: block,
        executiveQuote: " ",
        attribution: ATTRIBUTION_LINE
      }
    } as unknown as ExecutiveSlidesResponse;

    expect(validateSlides(payload).issues).toContain("slide2 executiveQuote cannot be empty.");
  });
});
