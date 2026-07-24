import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };
const testWorkflow = readFileSync(
  new URL("../.github/workflows/test.yml", import.meta.url),
  "utf8",
);
const publishWorkflow = readFileSync(
  new URL("../.github/workflows/publish.yml", import.meta.url),
  "utf8",
);
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");

describe("release workflows", () => {
  it("pins the package to the intended patch release", () => {
    expect(packageJson.version).toBe("0.6.2");
  });

  it("documents the 0.6.2 candidate without calling it published", () => {
    expect(readme).toContain("## Release candidate: v0.6.2");
    expect(changelog).toContain("## 0.6.2 candidate (2026-07-23)");
    for (const field of [
      "error_code",
      "failure_stage",
      "platform_error_code",
      "is_retriable",
      "next_action",
    ]) {
      expect(readme).toContain(field);
      expect(changelog).toContain(field);
    }
  });

  it("runs the complete package checks on every supported Node version", () => {
    expect(testWorkflow).toContain("node-version: [18, 20, 22]");
    expect(testWorkflow).toContain("npm ci");
    expect(testWorkflow).toContain("npm run typecheck");
    expect(testWorkflow).toContain("npm test");
    expect(testWorkflow).toContain("npm run build");
    expect(testWorkflow).toContain("npm pack --dry-run --json");
  });

  it("validates the release tag and package before publishing", () => {
    expect(publishWorkflow).toContain("npm ci");
    expect(publishWorkflow).toContain("npm run typecheck");
    expect(publishWorkflow).toContain("npm test");
    expect(publishWorkflow).toContain("npm run build");
    expect(publishWorkflow).toContain("npm pack --dry-run --json");
    expect(publishWorkflow).toContain("GITHUB_REF_NAME");
    expect(publishWorkflow).toContain("require('./package.json').version");
    expect(publishWorkflow).toContain("npm publish --provenance --access public");
  });
});
