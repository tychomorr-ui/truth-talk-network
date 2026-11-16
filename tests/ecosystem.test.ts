import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EcosystemReferencePanel } from "../src/components/EcosystemReferencePanel";
import { APPLICATION_DIRECTORY, CORE_DIRECTORY, SUPPLEMENTAL_REFERENCES } from "../src/lib/ecosystem";

describe("owner-corrected Sovereign Mesh directory", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("contains exactly twelve core role entries and three separately categorized applications", () => {
    expect(CORE_DIRECTORY).toHaveLength(12);
    expect(APPLICATION_DIRECTORY).toHaveLength(3);
    expect(CORE_DIRECTORY.every((entry) => entry.category === "CORE ROLE / SITE")).toBe(true);
    expect(APPLICATION_DIRECTORY.every((entry) => entry.category === "STANDALONE APPLICATION")).toBe(true);
  });

  it("uses the corrected Keira and Valkyrie domains and the separate Native Grounds app URL", () => {
    expect(CORE_DIRECTORY.find((entry) => entry.name === "KEIRA")?.url).toBe("https://keira.nexinus.net");
    expect(CORE_DIRECTORY.find((entry) => entry.name === "VALKYRIE")?.url).toBe("https://valkyrie.nexinus.net");
    expect(APPLICATION_DIRECTORY.find((entry) => entry.name === "NATIVE GROUNDS")?.url).toBe("https://tribalcoff-y9afmafg.manus.space");
    expect(CORE_DIRECTORY.some((entry) => entry.url === "https://sovereignapp-hkcgwye7.manus.space" || entry.url === "https://xinusdash-doy5g86k.manus.space")).toBe(false);
    expect(CORE_DIRECTORY.find((entry) => entry.id === "tesseract-mirror-node")).toMatchObject({
      name: "TESSERACT MIRROR",
      url: "https://tesseract.nexinus.net/.well-known/atmos-identity.json",
    });
    expect(CORE_DIRECTORY.find((entry) => entry.id === "tesseract-mirror-site")).toMatchObject({
      name: "TESSERACT RECOVERY MIRROR SITE",
      url: "https://tesseract.manus.space",
    });
    expect(CORE_DIRECTORY.find((entry) => entry.id === "archangel")?.role).toContain("Tesseract-A Core verifier capability");
  });

  it("keeps all external reference categories visibly unresolved", () => {
    expect(SUPPLEMENTAL_REFERENCES.map((reference) => reference.id)).toEqual(["digital-ore", "truth-substrate", "archangel-noop"]);
    expect(SUPPLEMENTAL_REFERENCES.every((reference) => reference.status.includes("UNVERIFIED") || reference.status.includes("NOOP_ONLY"))).toBe(true);
  });

  it("renders the static directory without making a network request", () => {
    const fetch = vi.fn(() => { throw new Error("Directory rendering must not fetch external sites."); });
    vi.stubGlobal("fetch", fetch);
    const markup = renderToStaticMarkup(createElement(EcosystemReferencePanel));
    expect(markup).toContain("12 core role / site references");
    expect(markup).toContain("KEIRA");
    expect(markup).toContain("https://valkyrie.nexinus.net");
    expect(markup).toContain("NATIVE GROUNDS");
    expect(fetch).not.toHaveBeenCalled();
  });
});
