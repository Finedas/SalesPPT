# Executive Pitch Generator

A local Next.js application that converts a pasted project transcript into six executive sections, lets the user edit them, and renders a one or two slide executive pitch in-browser.

## Prerequisites

- Node.js 20+
- npm 10+
- OpenAI API key

## Environment Variables

Create `.env` from `.env.example`.

```bash
cp .env.example .env
```

Required:

- `OPENAI_API_KEY`

Optional:

- `OPENAI_MODEL` default: `gpt-4.1-mini`
- `OPENAI_MAX_RETRIES` default: `3`
- `OPENAI_RETRY_BASE_MS` default: `500`
- `NEXT_PUBLIC_APP_NAME` default: `Executive Pitch Generator`
- `LOG_LEVEL` default: `info`

## Setup

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test

```bash
npm test
```

## API Routes

### `POST /api/generate-sections`

Request:

```json
{
  "transcript": "<project transcript>"
}
```

Response:

```json
{
  "companyBackground": "...",
  "solution": "...",
  "challenge": "...",
  "summary": "...",
  "implementation": "...",
  "results": "..."
}
```

### `POST /api/generate-slides`

Request:

```json
{
  "sections": {
    "companyBackground": "...",
    "solution": "...",
    "challenge": "...",
    "summary": "...",
    "implementation": "...",
    "results": "..."
  }
}
```

Response:

```json
{
  "slideCount": 1,
  "slide1": {
    "variant": "single-slide-brief",
    "title": "Executive Summary"
  }
}
```

## Notes

- The app uses the OpenAI Responses API with strict JSON schema outputs for both generation stages.
- No mock mode is included. A real OpenAI API key is required.
- Slides render directly in the browser and are styled for print / PDF output.
