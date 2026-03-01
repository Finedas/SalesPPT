"use client";

import { useCallback, useMemo, useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/LoadingState";
import { SectionEditor } from "@/components/SectionEditor";
import { SlideNavigator } from "@/components/SlideNavigator";
import { SlidePreview } from "@/components/SlidePreview";
import { TranscriptInput } from "@/components/TranscriptInput";
import { generateSections, generateSlides } from "@/lib/api";
import type { ExecutiveSections, ExecutiveSlidesResponse } from "@/lib/types";

const emptySections: ExecutiveSections = {
  companyBackground: "",
  solution: "",
  challenge: "",
  summary: "",
  implementation: "",
  results: ""
};

export function AppShell() {
  const [transcript, setTranscript] = useState("");
  const [sections, setSections] = useState<ExecutiveSections>(emptySections);
  const [slides, setSlides] = useState<ExecutiveSlidesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingSections, setIsGeneratingSections] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const slideCount = useMemo(() => slides?.slideCount ?? 0, [slides]);

  const handleGenerateSections = useCallback(async () => {
    setError(null);
    setIsGeneratingSections(true);
    setSlides(null);
    setActiveSlide(0);

    try {
      const nextSections = await generateSections(transcript);
      setSections(nextSections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate sections.");
    } finally {
      setIsGeneratingSections(false);
    }
  }, [transcript]);

  const handleGenerateSlides = useCallback(async () => {
    setError(null);
    setIsGeneratingSlides(true);
    setActiveSlide(0);

    try {
      const nextSlides = await generateSlides(sections);
      setSlides(nextSlides);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate slides.");
    } finally {
      setIsGeneratingSlides(false);
    }
  }, [sections]);

  return (
    <main className="appPage">
      <div className="appChrome">
        <div className="heroBlock">
          <p className="eyebrow">Executive Pitch Generator</p>
          <h1>Generate executive sales pitch presentations from raw transcripts.</h1>
          <p className="heroCopy">
            Create structured executive content, revise it directly, and render a one or two slide presentation in-browser.
          </p>
        </div>

        <ErrorBanner message={error} />

        <TranscriptInput
          transcript={transcript}
          isSubmitting={isGeneratingSections}
          onChange={setTranscript}
          onSubmit={handleGenerateSections}
        />

        {isGeneratingSections ? <LoadingState label="Generating structured content" /> : null}

        {Object.values(sections).some(Boolean) ? (
          <SectionEditor
            sections={sections}
            onChange={setSections}
            onSubmit={handleGenerateSlides}
            isSubmitting={isGeneratingSlides}
          />
        ) : null}

        {isGeneratingSlides ? <LoadingState label="Generating executive pitch" /> : null}

        {slides ? (
          <section className="panel previewPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Step 3</p>
                <h2>Executive pitch preview</h2>
              </div>
            </div>
            <SlideNavigator slideCount={slideCount as 1 | 2} activeIndex={activeSlide} onNavigate={setActiveSlide} />
            <SlidePreview slides={slides} activeIndex={activeSlide} onNavigate={setActiveSlide} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
