import { ATTRIBUTION_LINE, SECTION_PARAGRAPH_MAX, SECTION_WORD_MAX, SECTION_WORD_MIN } from "@/lib/constants";
import type { ExecutiveSectionKey, OllamaSectionPlanEntry } from "@/lib/types";

export const sectionsSystemPrompt = [
  "You are an executive communications specialist for B2B sales leadership.",
  "Transform the transcript into six sections: companyBackground, solution, challenge, summary, implementation, results.",
  `Each section must be ${SECTION_WORD_MIN}-${SECTION_WORD_MAX} words total and at most ${SECTION_PARAGRAPH_MAX} paragraphs.`,
  "Maintain a professional VP/Director-level tone.",
  "Do not fabricate facts, metrics, dates, customers, or outcomes.",
  "If data is missing, remain neutral and describe only what is supported by the transcript.",
  "Return strict JSON only."
].join(" ");

export function buildSectionsUserPrompt(transcript: string): string {
  return ["Transcript:", transcript, "Return only the structured sections JSON."].join("\n\n");
}

export const slidesSystemPrompt = [
  "You are designing a concise executive pitch presentation.",
  "Generate either one or two slides from the provided sections.",
  "Prefer two slides when the content clearly separates into executive summary and results.",
  "Use one slide only when a consolidated brief is materially clearer.",
  "Preserve only provided facts.",
  "The executive quote must be derived from the summary section, not invented independently.",
  `Attribution must be exactly: ${ATTRIBUTION_LINE}`,
  "Return strict JSON only."
].join(" ");

export function buildSlidesUserPrompt(sectionsJson: string): string {
  return ["Sections JSON:", sectionsJson, "Map the content into the slide schema only."].join("\n\n");
}

export function buildRepairPrompt(issues: string[], originalInput: string): string {
  return [
    "Your previous response failed validation.",
    "Fix the response to satisfy all issues below and return JSON only.",
    "Validation issues:",
    ...issues.map((issue) => `- ${issue}`),
    "Original input:",
    originalInput
  ].join("\n");
}

const jsonOnlyInstruction = [
  "Return only valid JSON.",
  "Your response must be a single JSON object.",
  "The first character must be { and the last character must be }.",
  "Use valid JSON with double quotes for all keys and string values.",
  "Do not wrap the JSON in backticks.",
  "Do not include markdown fences, comments, explanations, or any text before or after the JSON object."
].join(" ");

export const EXECUTIVE_SECTION_KEYS: ExecutiveSectionKey[] = [
  "companyBackground",
  "solution",
  "challenge",
  "summary",
  "implementation",
  "results"
];

export const OLLAMA_SECTION_PLAN_EXAMPLE_TRANSCRIPT = [
  "Example transcript:",
  "The team is outlining a commercial operations improvement initiative for a mid-market software company.",
  "Regional leaders report fragmented planning, inconsistent reporting, and handoff friction between sales, pre-sales, and customer success.",
  "The proposed response is a phased rollout built around standard workflows, lighter automation, and clearer ownership rather than a platform replacement.",
  "Specific ROI baselines and long-term cost assumptions are not stated, but leadership expects improved visibility, consistency, and pilot-led adoption."
].join(" ");

export const OLLAMA_SECTION_PLAN_EXAMPLE_OUTPUT = JSON.stringify({
  companyBackground: {
    focus: "Describe the operating context, maturity, and cross-functional environment without inventing company specifics.",
    constraints: ["Stay executive-level.", "Note that exact budget and baseline details are not provided."],
    supportedFacts: [
      "Mid-market software context",
      "Cross-functional sales, pre-sales, and customer success workflow",
      "Leadership is responding to operating friction"
    ],
    missingDataNotes: ["No formal budget is stated.", "No quantitative performance baseline is stated."]
  },
  solution: {
    focus: "Explain the proposed solution as a focused operating improvement rather than a full replacement.",
    constraints: ["Keep claims grounded in the transcript.", "Do not invent technical architecture."],
    supportedFacts: [
      "Shared workflow standardization",
      "Light automation",
      "Clearer stage ownership"
    ],
    missingDataNotes: ["Integration depth is not described."]
  },
  challenge: {
    focus: "Explain the execution problem created by fragmented planning and inconsistent handoffs.",
    constraints: ["Avoid fake metrics.", "State missing baselines neutrally."],
    supportedFacts: [
      "Fragmented planning",
      "Inconsistent reporting",
      "Handoff friction"
    ],
    missingDataNotes: ["No cycle-time or conversion baseline is provided."]
  },
  summary: {
    focus: "Give a balanced executive overview of why the initiative matters and how it is positioned.",
    constraints: ["Remain credible and measured.", "Avoid overstating proof."],
    supportedFacts: [
      "Practical transformation effort",
      "Pilot-led rollout",
      "Visibility and consistency are the intended gains"
    ],
    missingDataNotes: ["Long-term ROI is not yet validated."]
  },
  implementation: {
    focus: "Describe the phased rollout and governance expectations.",
    constraints: ["Emphasize sequencing and adoption.", "Do not invent staffing numbers."],
    supportedFacts: [
      "Pilot-led rollout",
      "Controlled adoption",
      "Leadership oversight"
    ],
    missingDataNotes: ["Timelines are not explicitly stated."]
  },
  results: {
    focus: "Describe expected outcomes neutrally and make clear that proof is still emerging.",
    constraints: ["Do not invent metrics.", "Keep language directional where evidence is incomplete."],
    supportedFacts: [
      "Leadership expects better visibility",
      "Leadership expects more consistent execution",
      "Commercial benefits need validation through rollout"
    ],
    missingDataNotes: ["No confirmed outcome metrics are stated."]
  }
}, null, 2);

const OLLAMA_SINGLE_SECTION_EXAMPLE: Record<ExecutiveSectionKey, string> = {
  companyBackground: [
    "The transcript indicates the company operates in a mid-market B2B software environment where commercial execution depends on coordination across sales, pre-sales, and customer success. Leadership appears to be addressing operating friction rather than pursuing a broad business model shift. The available detail suggests the organization has reached a scale where regional inconsistency now has visible consequences, yet the transcript does not provide a formal budget, a named transformation program, or a quantified performance baseline. Specific baselines are not stated, so the safest executive reading is that the business needs tighter operating discipline and clearer coordination without introducing unnecessary disruption.",
    "That context matters because the initiative should be framed as a controlled execution improvement. The team appears to value consistency, visibility, and adoption more than technical novelty. A VP or director audience would likely view this as a pragmatic attempt to standardize how customer-facing teams work together while preserving flexibility in how different regions implement the change."
  ].join("\n\n"),
  solution: [
    "The proposed solution is presented as a focused operating improvement rather than a large-scale platform replacement. The transcript suggests a combination of workflow standardization, lighter automation, and clearer ownership across stages of the commercial process. That matters because the underlying issue is inconsistency in how teams plan, report, and hand off work, not simply the absence of software. The available detail suggests the solution is intended to create more repeatable execution, faster alignment across teams, and better management visibility without forcing an unnecessary redesign of the broader go-to-market model.",
    "From an executive perspective, the solution should be described as a practical mechanism for improving operating discipline. Specific integration architecture, implementation cost, and tooling depth are not stated, so those points should remain neutral. What is supported is that leadership is trying to reduce fragmentation and create a more dependable operating cadence through targeted process improvement."
  ].join("\n\n"),
  challenge: [
    "The challenge described in the transcript is a commercial execution problem driven by fragmentation. Regional teams appear to be using different planning habits, inconsistent reporting approaches, and uneven handoff practices between functions. The transcript indicates those gaps create friction and make cross-functional coordination harder, but it does not provide a quantified baseline for productivity, conversion, or cost. Specific baselines are not stated, so the problem should be framed as a governance and visibility issue rather than a precisely measured efficiency shortfall. The available detail suggests leadership lacks a consistent view of execution quality and therefore has less confidence in where intervention is most needed.",
    "At an executive level, this challenge matters because inconsistency compounds across the revenue workflow. When teams do not work from the same process expectations, managers spend more effort reconciling activity and less effort improving outcomes. The transcript supports the conclusion that scaling becomes harder under that model, even if the exact economic impact has not yet been formally quantified."
  ].join("\n\n"),
  summary: [
    "The transcript indicates a practical transformation effort aimed at improving commercial coordination without overextending the organization. Leadership appears to have identified a repeatable operating problem: fragmented planning, unclear ownership, and inconsistent reporting create avoidable friction across teams. The proposed response is deliberately measured. Rather than promising wholesale reinvention, the initiative focuses on standardizing workflows, clarifying accountability, and introducing enough automation to improve visibility and consistency. That positioning is credible for an executive audience because it aligns the scope of the response with the level of evidence currently available.",
    "Specific baselines are not stated, so the strongest executive summary remains balanced rather than absolute. The available detail suggests the initiative can strengthen operating discipline and cross-functional execution if it begins with a focused rollout and visible sponsorship. The business case is therefore rooted in operating coherence first, with longer-term value to be validated as the pilot produces evidence."
  ].join("\n\n"),
  implementation: [
    "The transcript suggests implementation should be staged and operationally disciplined. The team appears to favor a pilot-led rollout, likely beginning in one region or segment before expanding more broadly. That approach fits the level of detail available because it creates room to test workflow changes, refine ownership boundaries, and confirm that frontline teams can adopt the process without creating unnecessary disruption. Specific implementation dates, staffing assumptions, and systems milestones are not stated, so the implementation narrative should avoid precision that the transcript does not support. What is clear is that leadership wants a controlled path to adoption rather than a high-risk, enterprise-wide launch.",
    "For an executive audience, the implementation story should emphasize sequencing, governance, and measurable checkpoints. The available detail suggests success depends less on technical novelty and more on shared process expectations across functions. A pilot therefore serves as both a change-management mechanism and an evidence-building step before broader deployment."
  ].join("\n\n"),
  results: [
    "The transcript does not provide confirmed outcome metrics, so the results section should remain disciplined and neutral. What the available detail suggests is directional intent rather than verified impact. Leadership expects improved visibility, more consistent execution, and smoother coordination across customer-facing teams if the initiative is adopted as described. Specific baselines are not stated, and no quantified gains are confirmed in the transcript. As a result, the most defensible executive framing is that the initiative is designed to improve operating consistency first, while measurable commercial benefits still need to be demonstrated through a pilot or early rollout review.",
    "That approach is still useful for senior stakeholders because it preserves credibility. The organization is not claiming proof it does not yet have. Instead, it is identifying the expected operating improvements and setting the conditions for later measurement. If the rollout confirms adoption and better visibility, those signals can then be translated into quantified business outcomes with greater confidence."
  ].join("\n\n")
};

export function buildOllamaSectionPlanPrompt(transcript: string): string {
  return [
    sectionsSystemPrompt,
    jsonOnlyInstruction,
    "Build a concise planning object for the six section keys only.",
    "For each key, provide focus, constraints, supportedFacts, and missingDataNotes.",
    "Keep each field concise and factual. Do not draft the full section body yet.",
    OLLAMA_SECTION_PLAN_EXAMPLE_TRANSCRIPT,
    `Example planning JSON:\n${OLLAMA_SECTION_PLAN_EXAMPLE_OUTPUT}`,
    buildSectionsUserPrompt(transcript)
  ].join("\n\n");
}

export function buildOllamaSingleSectionPrompt(params: {
  sectionKey: ExecutiveSectionKey;
  transcript: string;
  sectionPlan: OllamaSectionPlanEntry;
  repair?: boolean;
  validationIssues?: string[];
}): string {
  const repairInstruction = params.repair
    ? [
        "Your previous section draft failed validation.",
        "Fix all of the following issues while preserving only transcript-supported claims.",
        params.validationIssues && params.validationIssues.length > 0 ? "Validation issues:" : null,
        ...(params.validationIssues ?? []).map((issue) => `- ${issue}`),
        `Keep ${params.sectionKey} between ${SECTION_WORD_MIN} and ${SECTION_WORD_MAX} words.`,
        `Keep ${params.sectionKey} to no more than ${SECTION_PARAGRAPH_MAX} paragraphs.`,
        "Do not add unsupported facts just to increase length."
      ].filter(Boolean).join("\n")
    : null;

  return [
    sectionsSystemPrompt,
    jsonOnlyInstruction,
    `Generate only the ${params.sectionKey} section.`,
    `The response must be a JSON object with exactly one key: "content".`,
    `The content must be ${SECTION_WORD_MIN}-${SECTION_WORD_MAX} words and no more than ${SECTION_PARAGRAPH_MAX} paragraphs.`,
    "Use executive tone and remain neutral where facts are incomplete.",
    `Section plan for ${params.sectionKey}:`,
    JSON.stringify(params.sectionPlan, null, 2),
    `Example ${params.sectionKey} section:`,
    OLLAMA_SINGLE_SECTION_EXAMPLE[params.sectionKey],
    repairInstruction,
    "Transcript:",
    params.transcript
  ].filter(Boolean).join("\n\n");
}

export function buildOllamaSectionExpansionPrompt(params: {
  sectionKey: ExecutiveSectionKey;
  transcript: string;
  sectionPlan: OllamaSectionPlanEntry;
  currentDraft: string;
  validationIssues: string[];
}): string {
  return [
    sectionsSystemPrompt,
    jsonOnlyInstruction,
    `Expand only the existing ${params.sectionKey} draft.`,
    `The response must be a JSON object with exactly one key: "content".`,
    `Expand the existing draft so it reaches ${SECTION_WORD_MIN}-${SECTION_WORD_MAX} words.`,
    `Keep the response focused only on the ${params.sectionKey} section.`,
    `Keep the final section to no more than ${SECTION_PARAGRAPH_MAX} paragraphs.`,
    "Do not introduce unsupported facts, metrics, names, dates, outcomes, or technical details.",
    "You may add executive framing, implications, and neutral context only when they are directly supported by the transcript and the section plan.",
    `Section plan for ${params.sectionKey}:`,
    JSON.stringify(params.sectionPlan, null, 2),
    "Current draft:",
    params.currentDraft,
    "Validation issues:",
    ...params.validationIssues.map((issue) => `- ${issue}`),
    "Transcript:",
    params.transcript
  ].join("\n\n");
}

export function buildOllamaPrompt(systemPrompt: string, userPrompt: string, options?: { repair?: boolean }): string {
  const repairInstruction = options?.repair
    ? "Your last response was not valid JSON. Correct that failure now and return only the JSON object."
    : null;

  return [
    systemPrompt,
    jsonOnlyInstruction,
    repairInstruction,
    userPrompt
  ]
    .filter(Boolean)
    .join("\n\n");
}
