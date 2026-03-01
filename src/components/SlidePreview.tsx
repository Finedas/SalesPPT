"use client";

import { useEffect } from "react";
import type { ExecutiveSlide, ExecutiveSlidesResponse } from "@/lib/types";

type SlidePreviewProps = {
  slides: ExecutiveSlidesResponse;
  activeIndex: number;
  onNavigate: (index: number) => void;
};

function SectionBlock({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="slideSection">
      <div className="slideSectionHeadingWrap">
        <span className="slideSectionBar" />
        <h3 className="slideSectionHeading">{heading}</h3>
      </div>
      <p className="slideSectionBody">{body}</p>
    </section>
  );
}

function renderSlide(slide: ExecutiveSlide) {
  if (slide.variant === "two-column-summary") {
    return (
      <div className="slideLayout slideLayoutGrid">
        <header className="slideHeader">
          <h2 className="slideTitle">{slide.title}</h2>
        </header>
        <div className="slideColumns">
          <div className="slideColumn">
            {slide.leftColumn.map((item) => <SectionBlock key={item.heading} {...item} />)}
          </div>
          <div className="slideColumn">
            {slide.rightColumn.map((item) => <SectionBlock key={item.heading} {...item} />)}
          </div>
        </div>
      </div>
    );
  }

  if (slide.variant === "results-banner") {
    return (
      <div className="slideLayout slideLayoutResults">
        <header className="slideHeader">
          <h2 className="slideTitle">{slide.title}</h2>
        </header>
        <div className="resultsTop">
          <SectionBlock heading={slide.results.heading} body={slide.results.body} />
        </div>
        <div className="resultsBanner">
          <blockquote>{slide.executiveQuote}</blockquote>
          <p>{slide.attribution}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="slideLayout slideLayoutSingle">
      <header className="slideHeader">
        <h2 className="slideTitle">{slide.title}</h2>
      </header>
      <div className="slideColumns">
        <div className="slideColumn">
          {slide.leftColumn.map((item) => <SectionBlock key={item.heading} {...item} />)}
        </div>
        <div className="slideColumn">
          {slide.rightColumn.map((item) => <SectionBlock key={item.heading} {...item} />)}
        </div>
      </div>
      <div className="resultsBanner compactBanner">
        <blockquote>{slide.executiveQuote}</blockquote>
        <p>{slide.attribution}</p>
      </div>
    </div>
  );
}

export function SlidePreview({ slides, activeIndex, onNavigate }: SlidePreviewProps) {
  const deck = slides.slide2 ? [slides.slide1, slides.slide2] : [slides.slide1];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        onNavigate(Math.max(0, activeIndex - 1));
      }
      if (event.key === "ArrowRight") {
        onNavigate(Math.min(deck.length - 1, activeIndex + 1));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, deck.length, onNavigate]);

  return (
    <section className="previewShell">
      <div className="slideStage">
        {deck.map((slide, index) => (
          <article
            key={`${slide.variant}-${index}`}
            className={`slideCard ${index === activeIndex ? "isActive" : "isHidden"}`}
            aria-hidden={index !== activeIndex}
          >
            {renderSlide(slide)}
          </article>
        ))}
      </div>
    </section>
  );
}
