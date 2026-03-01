import { describe, expect, it } from "vitest";
import { CLEAN_INSTALL_TARGETS } from "@/lib/cleanInstall";

describe("clean install targets", () => {
  it("includes generated artifact directories", () => {
    expect(CLEAN_INSTALL_TARGETS).toContain("node_modules");
    expect(CLEAN_INSTALL_TARGETS).toContain(".next");
    expect(CLEAN_INSTALL_TARGETS).toContain("coverage");
    expect(CLEAN_INSTALL_TARGETS).toContain("dist");
    expect(CLEAN_INSTALL_TARGETS).toContain("build");
  });

  it("excludes env and lockfile", () => {
    expect(CLEAN_INSTALL_TARGETS).not.toContain(".env");
    expect(CLEAN_INSTALL_TARGETS).not.toContain("package-lock.json");
  });
});
