import { access, rm } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const CLEAN_INSTALL_TARGETS = [
  "node_modules",
  ".next",
  "coverage",
  "dist",
  "build"
];

const ROOT_DIR = process.cwd();

function log(message) {
  console.log(`[clean-install] ${message}`);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env: process.env,
      cwd: ROOT_DIR
    });

    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const error = new Error(`Command failed: ${command} ${args.join(" ")}`);
      error.code = code;
      reject(error);
    });
  });
}

async function removeTarget(target) {
  const fullPath = path.join(ROOT_DIR, target);

  try {
    await access(fullPath);
  } catch {
    log(`${target} not present, skipping`);
    return;
  }

  try {
    await rm(fullPath, { recursive: true, force: true });
    log(`Removing ${target}...`);
  } catch {
    throw new Error(`Failed to remove '${target}'.`);
  }
}

async function main() {
  log("Starting clean install...");

  for (const target of CLEAN_INSTALL_TARGETS) {
    await removeTarget(target);
  }

  log("Running npm run setup...");

  try {
    await runCommand("npm", ["run", "setup"]);
  } catch {
    throw new Error("Clean install failed during setup.");
  }

  log("Clean install complete");
}

main().catch((error) => {
  console.error(`[clean-install] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
