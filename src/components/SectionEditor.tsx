"use client";

import { SECTION_LABELS } from "@/lib/constants";
import type { ExecutiveSectionKey, ExecutiveSections, SectionGenerationStatusMap } from "@/lib/types";
import { countParagraphs, countWords, validateSectionField } from "@/lib/validation/sections";

type SectionEditorProps = {
  sections: ExecutiveSections;
  sectionStatuses: SectionGenerationStatusMap;
  onChange: (next: ExecutiveSections) => void;
  onSubmit: () => void;
  onRetryMissing?: () => void;
  isSubmitting: boolean;
  isGeneratingSections: boolean;
};

export function SectionEditor({
  sections,
  sectionStatuses,
  onChange,
  onSubmit,
  onRetryMissing,
  isSubmitting,
  isGeneratingSections
}: SectionEditorProps) {
  const entries = Object.entries(sections) as [keyof ExecutiveSections, string][];
  const allSectionsComplete = entries.every(([key]) => sectionStatuses[key].state === "complete");
  const hasIssues = entries.some(([key, value]) => {
    if (sectionStatuses[key].state !== "complete") {
      return true;
    }
    return validateSectionField(SECTION_LABELS[key], value).length > 0;
  });
  const completedCount = entries.filter(([key]) => sectionStatuses[key].state === "complete").length;
  const hasRecoverableFailures = entries.some(([key]) => {
    const state = sectionStatuses[key].state;
    return state === "failed" || state === "idle";
  });

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Step 2</p>
          <h2>Review and edit structured content</h2>
          <p className="panelMeta sectionProgress">
            {isGeneratingSections
              ? `Generating structured content... ${completedCount} of ${entries.length} sections complete`
              : `${completedCount} of ${entries.length} sections complete`}
          </p>
        </div>
      </div>

      <div className="sectionGrid">
        {entries.map(([key, value]) => {
          const label = SECTION_LABELS[key];
          const issues = validateSectionField(label, value);
          const status = sectionStatuses[key];
          return (
            <article className="sectionCard" key={key}>
              <div className="sectionCardHeader">
                <div>
                  <h3>{label}</h3>
                  <span className={`sectionStatus ${status.state}`}>{status.state === "pending" ? "Generating..." : status.state === "complete" ? "Ready" : status.state === "failed" ? "Failed" : "Waiting"}</span>
                </div>
                <div className="sectionStats">
                  <span>{countWords(value)} words</span>
                  <span>{countParagraphs(value)} paragraphs</span>
                </div>
              </div>
              <textarea
                className="sectionEditor"
                value={value}
                rows={10}
                placeholder={status.state === "pending" && !value ? `Generating ${label}...` : `Edit ${label}`}
                onChange={(event) => onChange({ ...sections, [key]: event.target.value })}
              />
              {status.state === "failed" ? (
                <p className="fieldIssues">{status.error || `${label} failed to generate.`}</p>
              ) : status.state === "pending" && !value ? (
                <p className="fieldHint sectionPlaceholder">This section will populate as soon as it is generated.</p>
              ) : issues.length > 0 ? (
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
        {hasRecoverableFailures && onRetryMissing ? (
          <button className="secondaryButton" disabled={isGeneratingSections || isSubmitting} onClick={onRetryMissing} type="button">
            Retry Missing Sections
          </button>
        ) : null}
        <button className="primaryButton" disabled={hasIssues || isSubmitting} onClick={onSubmit} type="button">
          {isSubmitting ? "Generating..." : allSectionsComplete ? "Generate Executive Pitch" : "Generate Executive Pitch"}
        </button>
      </div>
    </section>
  );
}
