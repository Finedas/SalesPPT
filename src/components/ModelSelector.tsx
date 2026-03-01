"use client";

import { MODEL_OPTIONS_BY_PROVIDER, PROVIDER_OPTIONS } from "@/lib/constants";
import type { LLMModel, LLMProviderName } from "@/lib/types";

type ModelSelectorProps = {
  provider: LLMProviderName;
  model: LLMModel;
  onProviderChange: (provider: LLMProviderName) => void;
  onModelChange: (model: LLMModel) => void;
};

export function ModelSelector({ provider, model, onProviderChange, onModelChange }: ModelSelectorProps) {
  const providerOption = PROVIDER_OPTIONS.find((option) => option.value === provider)!;
  const modelOptions = MODEL_OPTIONS_BY_PROVIDER[provider];
  const resolvedModel = modelOptions.some((option) => option.value === model) ? model : modelOptions[0]?.value;

  return (
    <section className="panel modelSelector">
      <div className="panelHeader compactHeader">
        <div>
          <p className="eyebrow">Model</p>
          <h2>Provider and model selection</h2>
        </div>
        <span className={`providerBadge ${provider === "openai" ? "remote" : "local"}`}>{providerOption.badge}</span>
      </div>

      <div className="selectorGrid">
        <label className="selectorField">
          <span>Provider</span>
          <select value={provider} onChange={(event) => onProviderChange(event.target.value as LLMProviderName)}>
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="selectorField">
          <span>Model</span>
          <select
            key={provider}
            value={resolvedModel}
            onChange={(event) => onModelChange(event.target.value as LLMModel)}
          >
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {provider === "ollama" ? (
        <p className="providerHint">Local model requires Ollama running at localhost:11434.</p>
      ) : null}
    </section>
  );
}
