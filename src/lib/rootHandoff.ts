export const ROOT_HANDOFF_ISSUER_ORIGIN = "https://rootgate.manus.space";
export const ROOT_HANDOFF_VERSION = "ROOT_TRUTHTALK_HANDOFF/v1";

export const ROOT_HANDOFF_PUBLIC_KEY_B64 = "MCowBQYDK2VwAyEACeCx7LQnJcU25ijEZ8DkyKTelEE6KMNgOmMWkn/PnV8=";

export type RootHandoffEnvelope = {
  payload: {
    version: string;
    issuer: "ROOT";
    audience: "truth-talk";
    subject: string;
    displayName: string | null;
    scope: string[];
    jti: string;
    issuedAt: string;
    expiresAt: string;
  };
  signature: string;
  publicKey: string;
};

function canonicalPayload(payload: RootHandoffEnvelope["payload"]): string {
  return JSON.stringify({
    version: payload.version,
    issuer: payload.issuer,
    audience: payload.audience,
    subject: payload.subject,
    displayName: payload.displayName,
    scope: [...payload.scope],
    jti: payload.jti,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  });
}

function decodeBase64(value: string): ArrayBuffer {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

export function isRootHandoffMessage(value: unknown): value is { type: "ROOT_TRUTHTALK_HANDOFF"; envelope: RootHandoffEnvelope } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { type?: unknown; envelope?: unknown };
  return candidate.type === "ROOT_TRUTHTALK_HANDOFF" && Boolean(candidate.envelope);
}

export async function verifyRootHandoff(envelope: RootHandoffEnvelope, now = new Date()) {
  const payload = envelope.payload;
  if (envelope.publicKey !== ROOT_HANDOFF_PUBLIC_KEY_B64) throw new Error("ROOT handoff signer is not trusted.");
  if (payload.version !== ROOT_HANDOFF_VERSION || payload.issuer !== "ROOT" || payload.audience !== "truth-talk") throw new Error("ROOT handoff contract is unsupported.");
  if (!/^[a-f0-9]{32}$/.test(payload.jti) || !payload.subject || payload.scope.join(",") !== "member_code,display_name") throw new Error("ROOT handoff payload is malformed.");
  const issuedAt = Date.parse(payload.issuedAt);
  const expiresAt = Date.parse(payload.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt || now.getTime() < issuedAt - 30_000 || now.getTime() >= expiresAt) throw new Error("ROOT handoff is expired or not yet valid.");

  const key = await crypto.subtle.importKey("spki", decodeBase64(ROOT_HANDOFF_PUBLIC_KEY_B64), { name: "Ed25519" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("Ed25519", key, decodeBase64(envelope.signature), new TextEncoder().encode(canonicalPayload(payload)).buffer);
  if (!valid) throw new Error("ROOT handoff signature is invalid.");
  return { subject: payload.subject, displayName: payload.displayName, jti: payload.jti, expiresAt: payload.expiresAt };
}
