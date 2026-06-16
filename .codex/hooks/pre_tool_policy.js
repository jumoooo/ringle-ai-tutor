"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const workspaceRoot = process.cwd();
const statePath = path.join(workspaceRoot, ".codex", "state", "active-handoff.json");

function normalize(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^[A-Za-z]:/i, "")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .toLowerCase();
}

function readState() {
  if (!fs.existsSync(statePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
    parsed.allowed_paths = Array.isArray(parsed.allowed_paths)
      ? parsed.allowed_paths.map(normalize)
      : [];
    return parsed;
  } catch {
    return null;
  }
}

function currentBranch() {
  try {
    return execSync("git branch --show-current", {
      cwd: workspaceRoot,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

function isStale(state) {
  const branch = currentBranch();
  if (state.branch && branch && state.branch !== branch) {
    return true;
  }

  const generatedAt = Date.parse(state.generated_at || "");
  if (Number.isFinite(generatedAt)) {
    return Date.now() - generatedAt > 48 * 60 * 60 * 1000;
  }

  return false;
}

function extractPaths(payload) {
  const toolName = String(payload.tool_name || payload.tool || "");
  const toolInput = payload.tool_input || {};

  if (toolName === "apply_patch") {
    return String(toolInput.patch || "")
      .split(/\r?\n/)
      .map((line) => {
        const match = /^\*\*\* (?:Update|Add|Delete) File: (.+)$/.exec(line);
        return match ? normalize(match[1]) : "";
      })
      .filter(Boolean);
  }

  if (toolName === "Edit" || toolName === "Write") {
    return [normalize(toolInput.file_path || toolInput.path || "")].filter(Boolean);
  }

  return [];
}

function isWriteTool(toolName) {
  return ["apply_patch", "Edit", "Write"].includes(toolName);
}

function isAllowed(touchedPath, allowedPaths) {
  return allowedPaths.some((allowed) => {
    if (!allowed) {
      return false;
    }

    if (allowed.endsWith("/")) {
      return touchedPath.startsWith(allowed);
    }

    return touchedPath === allowed;
  });
}

let input = "";
let finished = false;

function finalize() {
  if (finished) {
    return;
  }
  finished = true;

  try {
    const payload = JSON.parse(input || "{}");
    const toolName = String(payload.tool_name || payload.tool || "");

    if (!isWriteTool(toolName)) {
      process.exit(0);
      return;
    }

    const state = readState();
    if (!state || isStale(state)) {
      process.exit(0);
      return;
    }

    const touchedPaths = extractPaths(payload);
    for (const touchedPath of touchedPaths) {
      // allowed_paths에 없는 신규 파일 경로는 존재 여부와 무관하게 deny 해야 해요.
      // allowed_paths에 포함된 신규 파일 경로만 allow 되어 Work 범위를 유지해요.
      if (!isAllowed(touchedPath, state.allowed_paths)) {
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason:
                `SCOPE BLOCK: '${touchedPath}' is outside active handoff allowed_paths.`,
            },
          })
        );
        process.exit(0);
        return;
      }
    }
  } catch {
    process.exit(0);
    return;
  }

  process.exit(0);
}

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", finalize);
process.stdin.on("error", finalize);
setTimeout(finalize, 500);
