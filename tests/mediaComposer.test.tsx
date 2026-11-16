import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MediaComposer } from "../src/components/MediaComposer";

describe("4Reels media URL guidance", () => {
  it("explains user-hosted direct links, local hashing, CORS/IP exposure, and the no-upload boundary", () => {
    const html = renderToStaticMarkup(createElement(MediaComposer, {
      record: async () => true,
      notify: () => undefined,
      onPrepare: () => undefined,
    }));

    expect(html).toContain("How do I get this URL?");
    expect(html).toContain("direct public HTTPS link");
    expect(html).toContain("TruthTalk does not upload or host it");
    expect(html).toContain("Hash selected file locally");
    expect(html).toContain("The host may see your IP address");
    expect(html).toContain("unverifiable");
    expect(html).toContain("Video preview additionally requires matching bytes");
  });
});
