"use client";

type SlideNavigatorProps = {
  slideCount: 1 | 2;
  activeIndex: number;
  onNavigate: (index: number) => void;
};

export function SlideNavigator({ slideCount, activeIndex, onNavigate }: SlideNavigatorProps) {
  return (
    <div className="slideNavigator">
      <button type="button" className="navButton" disabled={activeIndex === 0} onClick={() => onNavigate(activeIndex - 1)}>
        ← Slide 1
      </button>
      <span className="slideIndicator">Slide {activeIndex + 1} of {slideCount}</span>
      <button
        type="button"
        className="navButton"
        disabled={activeIndex >= slideCount - 1}
        onClick={() => onNavigate(activeIndex + 1)}
      >
        Slide 2 →
      </button>
    </div>
  );
}
