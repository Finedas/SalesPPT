"use client";

import { useMemo } from "react";

type TranscriptInputProps = {
  transcript: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function TranscriptInput({ transcript, isSubmitting, onChange, onSubmit }: TranscriptInputProps) {
  const isDisabled = useMemo(() => transcript.trim().length === 0 || isSubmitting, [transcript, isSubmitting]);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Step 1</p>
          <h1>Paste your project transcript</h1>
        </div>
        <p className="panelMeta">{transcript.length.toLocaleString()} characters</p>
      </div>

      <label className="fieldLabel" htmlFor="transcript-input">
        Paste your project transcript
      </label>
      <textarea
        id="transcript-input"
        className="transcriptArea"
        value={transcript}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste a free-form project transcript with context, challenge, implementation details, and outcomes."
        rows={14}
      />

      <div className="panelActions">
        <button className="primaryButton" disabled={isDisabled} onClick={onSubmit} type="button">
          {isSubmitting ? "Generating..." : "Generate Structured Content"}
        </button>
      </div>
    </section>
  );
}
