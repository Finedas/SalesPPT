# SalesPPT Backend Service

Production-ready backend module for generating an 8-slide sales deck JSON payload from a transcript.

## Features

- `POST /generate_deck` accepts transcript as JSON (`transcript`) or multipart (`transcript` field or `transcript_file` upload)
- Two OpenAI Responses API calls with strict JSON Schema output:
  - Transcript -> `PitchIngredients`
  - `PitchIngredients` -> fixed `SlideContent` (8 slides)
- Hard template validation:
  - 8 slides exactly
  - title <= 42 chars
  - subtitle <= 70 chars
  - max 3 bullets per slide, each <= 90 chars
  - speaker notes 60-120 words
  - proof point required with metric/credible proof signal
  - open questions enforced when details are missing
- Renderer mapping into exact placeholder keys:
  - `TITLE`, `SUBTITLE`, `BULLET_1`, `BULLET_2`, `BULLET_3`, `PROOF_POINT`, `SPEAKER_NOTES`, `OPEN_QUESTIONS`
- Retries, logging, and env validation

## Project Layout

- `/src/routes/generateDeck.ts` API endpoint
- `/src/services/deckPipeline.ts` two-stage LLM pipeline
- `/src/openai/client.ts` OpenAI Responses integration + retries
- `/src/validation/schemaValidator.ts` AJV schema checks
- `/src/validation/constraints.ts` hard template limit enforcement
- `/src/renderer/mapToTemplate.ts` PPT placeholder mapping
- `/src/schemas/pitchIngredients.schema.json` strict Pitch Ingredients schema
- `/src/schemas/slideContent.schema.json` strict Slide Content schema
- `/tests/*` schema, constraints, open-questions, and pipeline tests

## Environment

Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

Required:

- `OPENAI_API_KEY`

Optional:

- `OPENAI_MODEL` (default `gpt-4.1-mini`)
- `PORT` (default `3000`)
- `LOG_LEVEL` (default `info`)
- `MAX_TRANSCRIPT_CHARS` (default `30000`)
- `OPENAI_MAX_RETRIES` (default `3`)
- `OPENAI_RETRY_BASE_MS` (default `500`)

## Run

```bash
npm install
npm run dev
```

Server:

- `http://localhost:3000`
- Health check: `GET /health`

## Test

```bash
npm test
```

## Example Request

```bash
curl -X POST http://localhost:3000/generate_deck \
  -H "Content-Type: application/json" \
  -d '{"transcript":"<paste transcript>"}'
```

Multipart with file:

```bash
curl -X POST http://localhost:3000/generate_deck \
  -F "transcript_file=@./transcript.txt"
```
