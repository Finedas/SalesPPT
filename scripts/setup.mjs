import { spawn } from "node:child_process";

// Keep in sync with src/lib/constants.ts OLLAMA_MODELS.
const REQUIRED_OLLAMA_MODELS = ["llama3", "mistral", "mixtral", "phi3"];
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

function log(message) {
  console.log(`[setup] ${message}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.captureOutput ? ["ignore", "pipe", "pipe"] : "inherit",
      shell: false,
      env: process.env
    });

    let stdout = "";
    let stderr = "";

    if (options.captureOutput) {
      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const error = new Error(options.failureMessage || `${command} ${args.join(" ")} failed.`);
      error.code = code;
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });
  });
}

function extractInstalledOllamaModelNames(payload) {
  if (!payload || !Array.isArray(payload.models)) {
    throw new Error(`Could not parse installed Ollama models from ${OLLAMA_BASE_URL}/api/tags.`);
  }

  return payload.models
    .map((model) => (typeof model?.name === "string" ? model.name.trim() : ""))
    .filter(Boolean);
}

function isInstalled(installedNames, expectedModel) {
  return installedNames.some((name) => name === expectedModel || name.startsWith(`${expectedModel}:`));
}

function getMissingModels(installedNames) {
  return REQUIRED_OLLAMA_MODELS.filter((model) => !isInstalled(installedNames, model));
}

async function verifyOllamaCli() {
  try {
    await runCommand("ollama", ["--version"], {
      captureOutput: true,
      failureMessage: "Ollama CLI not found. Install Ollama before running setup."
    });
  } catch {
    throw new Error("Ollama CLI not found. Install Ollama before running setup.");
  }
}

async function fetchInstalledModels() {
  let response;
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
  } catch {
    throw new Error(`Ollama server is not reachable at ${OLLAMA_BASE_URL}. Start it with 'ollama serve'.`);
  }

  if (!response.ok) {
    const bodySnippet = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(
      `Ollama responded unexpectedly at ${OLLAMA_BASE_URL}. HTTP ${response.status}${bodySnippet ? `: ${bodySnippet}` : ""}`
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Could not parse installed Ollama models from ${OLLAMA_BASE_URL}/api/tags.`);
  }

  return extractInstalledOllamaModelNames(payload);
}

async function pullMissingModels(missingModels) {
  for (const model of missingModels) {
    log(`Pulling ${model}...`);
    try {
      await runCommand("ollama", ["pull", model]);
    } catch {
      throw new Error(`Failed to pull Ollama model '${model}'.`);
    }
  }
}

async function main() {
  log("Running npm install...");
  await runCommand("npm", ["install"]);
  log("npm install complete");

  await verifyOllamaCli();
  log("Ollama CLI detected");

  const installedNames = await fetchInstalledModels();
  log(`Ollama server reachable at ${OLLAMA_BASE_URL}`);
  log(`Installed Ollama models: ${installedNames.length > 0 ? installedNames.join(", ") : "none"}`);

  const missingModels = getMissingModels(installedNames);
  if (missingModels.length === 0) {
    log("All supported Ollama models are already installed.");
    log("Setup complete");
    return;
  }

  log(`Missing Ollama models: ${missingModels.join(", ")}`);
  await pullMissingModels(missingModels);
  log("Setup complete");
}

main().catch((error) => {
  console.error(`[setup] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
