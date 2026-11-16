import { describe, expect, it } from "vitest";
import { fourReelsBrand } from "../src/lib/fourReelsBrand";

describe("4Reels brand strategy", () => {
  it("uses the exact owner-requested name and a non-promissory primary line", () => {
    expect(fourReelsBrand.name).toBe("4Reels");
    expect(fourReelsBrand.primaryTagline).toBe("Show the work. Keep the receipt.");
    expect(fourReelsBrand.positioning).toContain("without pretending a signature proves truth or real-world identity");
  });

  it("states that the strategy is not a live campaign and contains no claimed results", () => {
    expect(fourReelsBrand.status).toContain("no campaign is running");
    expect(fourReelsBrand.measurementBoundary).toContain("No baseline or campaign data exists");
    expect(JSON.stringify(fourReelsBrand)).not.toMatch(/\b(10,000 users|1,000 posts|viral|verified real person)\b/i);
  });

  it("keeps all copy templates author-supplied and evidence-bounded", () => {
    expect(fourReelsBrand.templates.length).toBeGreaterThanOrEqual(4);
    expect(fourReelsBrand.templates.every((template) => template.includes("["))).toBe(true);
    expect(fourReelsBrand.taglines.length).toBeGreaterThanOrEqual(6);
  });
});
