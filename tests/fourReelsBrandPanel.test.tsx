import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FourReelsBrandPanel } from "../src/components/FourReelsBrandPanel";

describe("4Reels brand panel", () => {
  it("renders the draft plan and copy templates without inserting posts or activity data", () => {
    const markup = renderToStaticMarkup(<FourReelsBrandPanel />);
    expect(markup).toContain("4Reels");
    expect(markup).toContain("Show the work. Keep the receipt.");
    expect(markup).toContain("STRATEGY DRAFT");
    expect(markup).toContain("NO DATES SET");
    expect(markup).toContain("Copy content template");
    expect(markup).toContain("No baseline or campaign data exists");
    expect(markup).not.toContain("verified creator");
    expect(markup).not.toContain("10,000 users");
    expect(markup).not.toContain("wss://");
  });
});
