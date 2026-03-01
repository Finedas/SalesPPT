# Executive Pitch Generator

A local Next.js application that turns a pasted project transcript into an executive pitch workflow:

1. The user selects an LLM provider and model.
2. The user pastes a transcript and starts structured-content generation.
3. The app streams sections into Step 2 as they are produced.
4. The user edits the generated sections while remaining sections are still arriving.
5. The app generates a one-slide or two-slide executive pitch and renders it in-browser.

## What the Application Does

The application is built for executive-summary style pitch creation from free-form project transcripts.

It produces six structured sections:

- `companyBackground`
- `solution`
- `challenge`
- `summary`
- `implementation`
- `results`

Those sections are validated for:

- non-empty content
- `120-200` words per section
- no more than `2` paragraphs per section

After review and editing, the app generates an executive presentation preview that is rendered directly in the browser.

## User Journey

### Step 1: Configure the model

At the top of the homepage, the user chooses:

- provider
  - `OpenAI`
  - `Ollama`
- model
  - OpenAI:
    - `gpt-4o`
    - `gpt-4.1-mini`
    - `gpt-4o-mini`
  - Ollama:
    - `llama3`
    - `mistral`
    - `mixtral`
    - `phi3`

The selected provider and model are used for:

- section generation
- slide generation

### Step 2: Paste transcript

The user pastes a free-form transcript into the homepage textarea and clicks `Generate Structured Content`.

### Step 3: Progressive structured content generation

After clicking `Generate Structured Content`:

- the UI immediately moves into Step 2
- section generation begins
- section status is shown per section
- textareas populate progressively as each section completes
- the user can start editing completed sections before the remaining sections finish

Current section states shown in the UI:

- `Waiting`
- `Generating...`
- `Ready`
- `Failed`

If generation partially fails:

- already completed sections remain visible
- completed sections remain editable
- failed sections are marked inline
- the user can use `Retry Missing Sections`

The app does not allow slide generation until all six sections are complete and valid.

### Step 4: Edit sections

The user reviews and edits the generated section text directly in Step 2.

### Step 5: Generate executive pitch

Once all sections are present and valid, the user clicks `Generate Executive Pitch`.

The app then generates and renders:

- a one-slide executive brief, or
- a two-slide executive pitch

The result is rendered on screen with slide navigation and print/PDF-friendly styling.

## Application Behavior by Provider

### OpenAI

- Uses the OpenAI Responses API
- Uses strict JSON schema outputs
- Section generation is returned as a full object first, then exposed to the frontend through the same streaming event contract for UI consistency

### Ollama

- Uses local `POST /api/generate`
- Uses schema-constrained output via Ollama `format`
- Builds section content progressively
- Uses a reliability-first section workflow:
  - section planning
  - section-by-section generation
  - section-specific repair
  - section expansion for underlength output when appropriate

## Prerequisites

- Node.js `20+`
- npm `10+`
- OpenAI API key for OpenAI usage
- Ollama installed locally for local model usage

## Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

### Required for OpenAI

- `OPENAI_API_KEY`

### Optional

- `OPENAI_MODEL`
  - fallback default: `gpt-4.1-mini`
- `OPENAI_MAX_RETRIES`
  - default: `3`
- `OPENAI_RETRY_BASE_MS`
  - default: `500`
- `OLLAMA_BASE_URL`
  - default: `http://localhost:11434`
- `OLLAMA_TIMEOUT_MS`
  - generic fallback timeout
- `OLLAMA_SECTIONS_TIMEOUT_MS`
  - default: `120000`
- `OLLAMA_SLIDES_TIMEOUT_MS`
  - default: `60000`
- `NEXT_PUBLIC_APP_NAME`
  - default: `Executive Pitch Generator`
- `LOG_LEVEL`
  - default: `info`

## Setup

### Recommended bootstrap

```bash
npm run setup
```

What `npm run setup` does:

- runs `npm install`
- verifies the `ollama` CLI is available
- checks that Ollama is reachable at `OLLAMA_BASE_URL`
- checks which supported Ollama models are already installed
- pulls any missing supported models:
  - `llama3`
  - `mistral`
  - `mixtral`
  - `phi3`

### Manual fallback

```bash
npm install
```

### Clean reinstall

For a fresh local rebuild:

```bash
npm run clean-install
```

What `npm run clean-install` does:

- removes generated artifacts:
  - `node_modules`
  - `.next`
  - `coverage`
  - `dist`
  - `build`
- preserves:
  - `.env`
  - `package-lock.json`
- runs `npm run setup`

## Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test and Verify

Run tests:

```bash
npm test
```

Run a production build check:

```bash
npm run build
```

## Local Ollama Setup

Install and run Ollama locally:

```bash
brew install ollama
ollama serve
ollama run llama3
```

You can then switch the app to `Ollama` from the provider selector.

Important:

- `npm run setup` does not start `ollama serve` for you
- the Ollama server being up does not mean models are installed

## Ollama Model Verification

Check installed models:

```bash
curl -sS http://localhost:11434/api/tags
```

If you see:

```json
{"models":[]}
```

then Ollama is running, but no local models are installed yet.

Install one:

```bash
ollama run llama3
```

## Example Ollama Curl Test

```bash
curl http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3",
    "prompt": "Return JSON only.",
    "stream": false
  }'
```

## Streaming Section Generation

`POST /api/generate-sections` now streams newline-delimited JSON events instead of returning a single JSON object.

This powers the Step 2 progressive UI.

Event types:

- `generation_started`
- `section_started`
- `section_completed`
- `section_failed`
- `generation_completed`
- `generation_failed`

Behavior:

- the UI enters Step 2 immediately
- sections populate one by one
- partial completion is preserved on failure
- retrying missing sections reuses the original transcript and filters updates client-side so completed sections are not discarded

## API Routes

### `POST /api/generate-sections`

Request body:

```json
{
  "transcript": "<project transcript>",
  "provider": "openai",
  "model": "gpt-4.1-mini"
}
```

Successful response:

- `200`
- `Content-Type: application/x-ndjson`
- body contains progressive section events

Validation failures before streaming starts still return normal JSON `4xx` responses.

### `POST /api/generate-slides`

Request body:

```json
{
  "sections": {
    "companyBackground": "...",
    "solution": "...",
    "challenge": "...",
    "summary": "...",
    "implementation": "...",
    "results": "..."
  },
  "provider": "ollama",
  "model": "llama3"
}
```

Successful response:

- slide payload used by the browser preview

## Troubleshooting

### Ollama is running but generation still fails

`http://localhost:11434` being available only proves the Ollama server is up.
It does not prove the selected model is installed.

Check installed models:

```bash
curl -sS http://localhost:11434/api/tags
```

If the selected model is missing, install it:

```bash
ollama run llama3
```

### Ollama request timed out

If local generation is slow, increase timeouts in `.env`:

```env
OLLAMA_SECTIONS_TIMEOUT_MS=120000
OLLAMA_SLIDES_TIMEOUT_MS=60000
```

If needed, raise them further for slower hardware.

### Section generation fails validation

The application intentionally keeps section requirements strict:

- `120-200` words
- maximum `2` paragraphs
- no empty fields

For Ollama, the app now:

- plans sections first
- generates each section independently
- retries invalid sections
- expands underlength sections when appropriate

If a section still fails, the error will identify the specific section.

### Partial section generation failure

If some sections finish and a later one fails:

- completed sections remain visible
- completed sections remain editable
- failed sections are marked inline
- `Retry Missing Sections` becomes available

### OpenAI vs Ollama expectations

OpenAI is usually more consistent for strict structured output.
Ollama is fully supported, but quality and latency depend on:

- installed model
- machine resources
- model warm-up state
- transcript length

## Notes

- OpenAI uses the Responses API with strict JSON schema outputs.
- Ollama calls `http://localhost:11434/api/generate` by default.
- Ollama models must be installed locally before use.
- The app renders slides directly in the browser.
- Slide output is print/PDF-friendly.
