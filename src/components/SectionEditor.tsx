"use client";

import { SECTION_LABELS } from "@/lib/constants";
import type { ExecutiveSections } from "@/lib/types";
import { countParagraphs, countWords, validateSectionField } from "@/lib/validation/sections";

type SectionEditorProps = {
  sections: ExecutiveSections;
  onChange: (next: ExecutiveSections) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function SectionEditor({ sections, onChange, onSubmit, isSubmitting }: SectionEditorProps) {
  const entries = Object.entries(sections) as [keyof ExecutiveSections, string][];
  const hasIssues = entries.some(([key, value]) => validateSectionField(SECTION_LABELS[key], value).length > 0);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Step 2</p>
          <h2>Review and edit structured content</h2>
        </div>
      </div>

      <div className="sectionGrid">
        {entries.map(([key, value]) => {
          const label = SECTION_LABELS[key];
          const issues = validateSectionField(label, value);
          return (
            <article className="sectionCard" key={key}>
              <div className="sectionCardHeader">
                <h3>{label}</h3>
                <div className="sectionStats">
                  <span>{countWords(value)} words</span>
                  <span>{countParagraphs(value)} paragraphs</span>
                </div>
              </div>
              <textarea
                className="sectionEditor"
                value={value}
                rows={10}
                onChange={(event) => onChange({ ...sections, [key]: event.target.value })}
              />
              {issues.length > 0 ? (
                <ul className="fieldIssues">
                  {issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              ) : (
                <p className="fieldHint">Ready for slide generation.</p>
              )}
            </article>
          );
        })}
      </div>

      <div className="panelActions">
        <button className="primaryButton" disabled={hasIssues || isSubmitting} onClick={onSubmit} type="button">
          {isSubmitting ? "Generating..." : "Generate Executive Pitch"}
        </button>
      </div>
    </section>
  );
}
