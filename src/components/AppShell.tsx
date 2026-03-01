"use client";

import { useCallback, useMemo, useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/LoadingState";
import { ModelSelector } from "@/components/ModelSelector";
import { SectionEditor } from "@/components/SectionEditor";
import { SlideNavigator } from "@/components/SlideNavigator";
import { SlidePreview } from "@/components/SlidePreview";
import { TranscriptInput } from "@/components/TranscriptInput";
import { DEFAULT_MODELS, EXECUTIVE_SECTION_KEYS, MODELS_BY_PROVIDER } from "@/lib/constants";
import { generateSectionsStream, generateSlides } from "@/lib/api";
import type {
  ExecutiveSectionKey,
  ExecutiveSections,
  ExecutiveSlidesResponse,
  LLMModel,
  LLMProviderName,
  SectionGenerationEvent,
  SectionGenerationStatusMap
} from "@/lib/types";

const emptySections: ExecutiveSections = {
  companyBackground: "",
  solution: "",
  challenge: "",
  summary: "",
  implementation: "",
  results: ""
};

function createInitialSectionStatuses(): SectionGenerationStatusMap {
  return {
    companyBackground: { state: "idle" },
    solution: { state: "idle" },
    challenge: { state: "idle" },
    summary: { state: "idle" },
    implementation: { state: "idle" },
    results: { state: "idle" }
  };
}

function normalizeUiError(message: string, provider: LLMProviderName): string {
  if (provider === "ollama") {
    if (message.includes("Ollama is not reachable")) {
      return "Ollama is not reachable. Start Ollama locally and try again.";
    }

    if (message.includes("timed out")) {
      return "Ollama request timed out. Verify the local model is loaded and try again.";
    }
  }

  return message;
}

export function AppShell() {
  const [transcript, setTranscript] = useState("");
  const [sections, setSections] = useState<ExecutiveSections>(emptySections);
  const [slides, setSlides] = useState<ExecutiveSlidesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingSections, setIsGeneratingSections] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<LLMProviderName>("openai");
  const [selectedModel, setSelectedModel] = useState<LLMModel>(DEFAULT_MODELS.openai);
  const [sectionStatuses, setSectionStatuses] = useState<SectionGenerationStatusMap>(createInitialSectionStatuses());
  const [didEnterStep2, setDidEnterStep2] = useState(false);
  const [touchedSections, setTouchedSections] = useState<Record<ExecutiveSectionKey, boolean>>({
    companyBackground: false,
    solution: false,
    challenge: false,
    summary: false,
    implementation: false,
    results: false
  });

  const slideCount = useMemo(() => slides?.slideCount ?? 0, [slides]);

  const handleProviderChange = useCallback((provider: LLMProviderName) => {
    setSelectedProvider(provider);
    setSelectedModel(DEFAULT_MODELS[provider]);
    setError(null);
    setSlides(null);
    setActiveSlide(0);
  }, []);

  const handleModelChange = useCallback((model: LLMModel) => {
    if (!MODELS_BY_PROVIDER[selectedProvider].includes(model)) {
      setSelectedModel(DEFAULT_MODELS[selectedProvider]);
      return;
    }

    setSelectedModel(model);
    setError(null);
    setSlides(null);
    setActiveSlide(0);
  }, [selectedProvider]);

  const applySectionEvent = useCallback((event: SectionGenerationEvent, acceptedKeys?: Set<ExecutiveSectionKey>) => {
    if (event.type === "generation_started") {
      setSectionStatuses((current) => {
        const next = { ...current };
        for (const key of event.sectionOrder) {
          if (!acceptedKeys || acceptedKeys.has(key)) {
            next[key] = { state: "idle" };
          }
        }
        return next;
      });
      return;
    }

    if (event.type === "section_started") {
      if (acceptedKeys && !acceptedKeys.has(event.sectionKey)) {
        return;
      }
      setSectionStatuses((current) => ({
        ...current,
        [event.sectionKey]: { state: "pending" }
      }));
      return;
    }

    if (event.type === "section_completed") {
      if (acceptedKeys && !acceptedKeys.has(event.sectionKey)) {
        return;
      }
      setSectionStatuses((current) => ({
        ...current,
        [event.sectionKey]: { state: "complete" }
      }));
      setSections((current) => {
        if (touchedSections[event.sectionKey]) {
          return current;
        }
        return {
          ...current,
          [event.sectionKey]: event.content
        };
      });
      return;
    }

    if (event.type === "section_failed") {
      if (acceptedKeys && !acceptedKeys.has(event.sectionKey)) {
        return;
      }
      setSectionStatuses((current) => ({
        ...current,
        [event.sectionKey]: { state: "failed", error: event.error }
      }));
      return;
    }

    if (event.type === "generation_failed") {
      setError(normalizeUiError(event.error, selectedProvider));
      return;
    }
  }, [selectedProvider, touchedSections]);

  const handleGenerateSections = useCallback(async () => {
    setError(null);
    setIsGeneratingSections(true);
    setSlides(null);
    setActiveSlide(0);
    setDidEnterStep2(true);
    setSections(emptySections);
    setTouchedSections({
      companyBackground: false,
      solution: false,
      challenge: false,
      summary: false,
      implementation: false,
      results: false
    });
    setSectionStatuses(createInitialSectionStatuses());

    try {
      await generateSectionsStream({
        transcript,
        provider: selectedProvider,
        model: selectedModel,
        onEvent: (event) => applySectionEvent(event)
      });
    } catch (err) {
      setError(normalizeUiError(err instanceof Error ? err.message : "Failed to generate sections.", selectedProvider));
    } finally {
      setIsGeneratingSections(false);
    }
  }, [applySectionEvent, selectedModel, selectedProvider, transcript]);

  const handleRetryMissingSections = useCallback(async () => {
    const acceptedKeys = new Set(
      EXECUTIVE_SECTION_KEYS.filter((key) => sectionStatuses[key].state !== "complete")
    );

    if (acceptedKeys.size === 0) {
      return;
    }

    setError(null);
    setIsGeneratingSections(true);

    try {
      await generateSectionsStream({
        transcript,
        provider: selectedProvider,
        model: selectedModel,
        onEvent: (event) => applySectionEvent(event, acceptedKeys)
      });
    } catch (err) {
      setError(normalizeUiError(err instanceof Error ? err.message : "Failed to generate sections.", selectedProvider));
    } finally {
      setIsGeneratingSections(false);
    }
  }, [applySectionEvent, sectionStatuses, selectedModel, selectedProvider, transcript]);

  const handleGenerateSlides = useCallback(async () => {
    setError(null);
    setIsGeneratingSlides(true);
    setActiveSlide(0);

    try {
      const nextSlides = await generateSlides(sections, selectedProvider, selectedModel);
      setSlides(nextSlides);
    } catch (err) {
      setError(normalizeUiError(err instanceof Error ? err.message : "Failed to generate slides.", selectedProvider));
    } finally {
      setIsGeneratingSlides(false);
    }
  }, [sections, selectedModel, selectedProvider]);

  const allSectionsComplete = useMemo(
    () => EXECUTIVE_SECTION_KEYS.every((key) => sectionStatuses[key].state === "complete"),
    [sectionStatuses]
  );

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

        <ModelSelector
          provider={selectedProvider}
          model={selectedModel}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
        />

        <TranscriptInput
          transcript={transcript}
          isSubmitting={isGeneratingSections}
          onChange={setTranscript}
          onSubmit={handleGenerateSections}
        />

        {didEnterStep2 ? (
          <SectionEditor
            sections={sections}
            sectionStatuses={sectionStatuses}
            onChange={(next) => {
              setSections(next);
              setTouchedSections((current) => {
                const nextTouched = { ...current };
                for (const key of EXECUTIVE_SECTION_KEYS) {
                  if (next[key] !== sections[key]) {
                    nextTouched[key] = true;
                  }
                }
                return nextTouched;
              });
            }}
            onSubmit={handleGenerateSlides}
            onRetryMissing={handleRetryMissingSections}
            isSubmitting={isGeneratingSlides}
            isGeneratingSections={isGeneratingSections}
          />
        ) : null}

        {isGeneratingSlides ? <LoadingState label={`Generating executive pitch with ${selectedModel}`} /> : null}

        {slides && allSectionsComplete ? (
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
