export type DirectoryEntry = {
  id: string;
  name: string;
  role: string;
  url: string;
  category: "CORE ROLE / SITE" | "STANDALONE APPLICATION";
  evidence: string;
  auditNote?: string;
};

export const CORE_DIRECTORY: DirectoryEntry[] = [
  { id: "root-gate", name: "ROOT-GATE", role: "Identity anchor / front door", url: "https://rootgate.manus.space", category: "CORE ROLE / SITE", evidence: "Owner-supplied role and URL; not cryptographically verified.", auditNote: "The audit observed only a partial HTML shell; product behavior and identity-anchor capability were not verified." },
  { id: "tesseract-terminus", name: "TESSERACT-TERMINUS", role: "Provenance / sovereign console", url: "https://universaltruth.life", category: "CORE ROLE / SITE", evidence: "Owner-supplied role and URL; not cryptographically verified.", auditNote: "Public frontend/source behavior was inspected; this does not establish an authoritative record store or trusted operator identity." },
  { id: "tesseract-mirror-site", name: "TESSERACT RECOVERY MIRROR SITE", role: "Recovery mirror website; separate from the Tesseract Mirror node identity endpoint", url: "https://tesseract.manus.space", category: "CORE ROLE / SITE", evidence: "Owner-supplied recovery-site URL; not a live node-health check.", auditNote: "The owner-designated node identity endpoint is https://tesseract.nexinus.net/.well-known/atmos-identity.json; a 2026-10-28 check observed a signed identity document there. This Manus URL is a separate web surface." },
  { id: "xinus-clarity", name: "XINUS-CLARITY", role: "XinUS Clarity Suite", url: "https://exonissuite-ceruhtwo.manus.space", category: "CORE ROLE / SITE", evidence: "Owner-supplied role and URL; not cryptographically verified.", auditNote: "The audit stopped at a crawl-policy response; application behavior was not inspected." },
  { id: "monarch-os", name: "MONARCH-OS", role: "Sovereign OS layer / Kether-Gate", url: "https://schedtool-7vbikw4h.manus.space", category: "CORE ROLE / SITE", evidence: "Owner-supplied role and URL; not cryptographically verified.", auditNote: "The audit inspected only the robots endpoint, not the application." },
  { id: "tesseract-mirror-node", name: "TESSERACT MIRROR", role: "Owner-designated mirror identity / recovery node; distinct from Tesseract-Terminus", url: "https://tesseract.nexinus.net/.well-known/atmos-identity.json", category: "CORE ROLE / SITE", evidence: "Owner-supplied role and machine-readable endpoint; TruthTalk does not run a live verifier or maintain a separate pinned trust root.", auditNote: "The 2026-10-28 audit verified served identity and health signatures against their associated keys; this did not establish independent key authority or active peer membership. The host root returned 404; this explicit identity-document path returned HTTP 200." },
  { id: "keira", name: "KEIRA", role: "Intelligence / Truth Analysis", url: "https://keira.nexinus.net", category: "CORE ROLE / SITE", evidence: "Owner-supplied role and URL; not cryptographically verified.", auditNote: "A public frontend and a client-side Merkle/Ed25519 verifier were inspected; its report supplies its own key, with no independent trusted-key pin." },
  { id: "valkyrie", name: "VALKYRIE", role: "Adjudication entity / Dark Mirror / VERDEX", url: "https://valkyrie.nexinus.net", category: "CORE ROLE / SITE", evidence: "Owner-supplied role and URL; not cryptographically verified.", auditNote: "Application routes and provenance behavior were not inspected; no live integration exists or is made by TruthTalk." },
  { id: "archangel", name: "ARCHANGEL", role: "Control plane / mesh governance; Tesseract-A Core verifier capability", url: "https://archangelcp-sbwmjhce.manus.space", category: "CORE ROLE / SITE", evidence: "Owner-supplied role and URL; not cryptographically verified.", auditNote: "Tesseract-A Core is a verification capability under Archangel, not a separate identity or signing authority. TruthTalk has no live integration." },
  { id: "project-reclaim", name: "PROJECT RECLAIM", role: "Field activation portal", url: "https://reclaimporta-gsio8jvp.manus.space", category: "CORE ROLE / SITE", evidence: "Owner-supplied role and URL; not cryptographically verified.", auditNote: "The audit stopped before application routes; role remains owner-supplied." },
  { id: "iwa-sage", name: "IWA SAGE", role: "Community wellness / service layer", url: "https://iwawellness-khqgjzqe.manus.space", category: "CORE ROLE / SITE", evidence: "Owner-supplied role and URL; not cryptographically verified.", auditNote: "The audit did not establish service health or backend behavior." },
  { id: "resonate-earth", name: "RESONATE EARTH", role: "Public front door / Nebula Mesh", url: "https://resonate-earth.live", category: "CORE ROLE / SITE", evidence: "Owner-supplied role and URL; not cryptographically verified.", auditNote: "The public-page review inspected its stated sitemap scope; this does not verify backend or mesh activity." },
];

export const APPLICATION_DIRECTORY: DirectoryEntry[] = [
  { id: "property-maintained", name: "PROPERTY MAINTAINED", role: "Maintenance documentation pilot", url: "https://propmaintain-2wv2njwj.manus.space", category: "STANDALONE APPLICATION", evidence: "Owner-supplied app and URL; not cryptographically verified.", auditNote: "The audit did not establish a separate custom domain, backend, or live service." },
  { id: "native-grounds", name: "NATIVE GROUNDS", role: "Wholesale coffee supply", url: "https://tribalcoff-y9afmafg.manus.space", category: "STANDALONE APPLICATION", evidence: "Owner-supplied separate app and URL; not cryptographically verified.", auditNote: "The owner’s correction lists this as a separate app, not as a Resonate Earth mirror." },
  { id: "xinus-portfolio", name: "XINUS PORTFOLIO", role: "Venture dashboard", url: "https://nexsens-3uimbss6.manus.space", category: "STANDALONE APPLICATION", evidence: "Owner-supplied app and URL; not cryptographically verified.", auditNote: "The public-page review inspected its stated sitemap scope; this does not authenticate the operator or backend." },
];

export type SupplementalReference = {
  id: string;
  name: string;
  url: string;
  status: string;
  note: string;
};

export const SUPPLEMENTAL_REFERENCES: SupplementalReference[] = [
  { id: "digital-ore", name: "Digital Ore", url: "https://universaltruth.life/digital-ore", status: "SELF-SUPPLIED REFERENCE, UNVERIFIED", note: "Use the corrected hyphenated path; /digitalore was reported as 404." },
  { id: "truth-substrate", name: "Truth Substrate", url: "https://universaltruth.life/sudo-coin", status: "SELF-SUPPLIED REFERENCE, UNVERIFIED", note: "Owner-supplied note: CURRENTLY UNAVAILABLE — ‘Failed to fetch’ observed on 2026-10-24. Public extraction also showed this error on 2026-10-26; this is not a live health check." },
  { id: "archangel-noop", name: "ARCHANGEL control plane", url: "https://archangelcp-sbwmjhce.manus.space", status: "NOOP_ONLY — external mutation disabled", note: "SELF-SUPPLIED REFERENCE, UNVERIFIED. TruthTalk does not call this host." },
];

export function isAsciiHttpsUrl(value: string): boolean {
  if (/[\u0080-\uFFFF]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password && !url.hash;
  } catch { return false; }
}
