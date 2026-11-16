import { canonicalizeEx } from "json-canonicalize";

const encoder = new TextEncoder();

export function codePointLength(value: string): number {
  return Array.from(value).length;
}

export function isLowerHex(value: unknown, length: number): value is string {
  return typeof value === "string" && new RegExp(`^[0-9a-f]{${length}}$`).test(value);
}

function hasLoneSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function assertJsonValue(value: unknown, path: string, seen: Set<object>): void {
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (hasLoneSurrogate(value)) throw new Error(`${path} contains an invalid lone Unicode surrogate.`);
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${path} must be a finite JSON number.`);
    return;
  }
  if (typeof value !== "object") throw new Error(`${path} is not an I-JSON value.`);
  if (seen.has(value)) throw new Error(`${path} contains a circular reference.`);
  seen.add(value);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) throw new Error(`${path}[${index}] is a sparse array slot.`);
      assertJsonValue(value[index], `${path}[${index}]`, seen);
    }
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error(`${path} must be a plain JSON object.`);
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => typeof key !== "string") || ownKeys.length !== Object.keys(value).length) {
      throw new Error(`${path} contains symbol or non-enumerable properties.`);
    }
    for (const key of Object.keys(value)) {
      if (hasLoneSurrogate(key)) throw new Error(`${path} contains a property name with an invalid Unicode surrogate.`);
      assertJsonValue((value as Record<string, unknown>)[key], `${path}.${key}`, seen);
    }
  }
  seen.delete(value);
}

export function canonicalizeJcs(value: unknown): string {
  assertJsonValue(value, "$", new Set());
  const canonical = canonicalizeEx(value, { strictUndefined: true });
  if (typeof canonical !== "string") throw new Error("RFC 8785 serialization did not produce a JSON string.");
  return canonical;
}

export function parseCanonicalJcs(input: string, maxBytes = 64_000): unknown {
  if (encoder.encode(input).byteLength > maxBytes) throw new Error(`Canonical JSON exceeds the ${maxBytes.toLocaleString()}-byte limit.`);
  let value: unknown;
  try { value = JSON.parse(input) as unknown; }
  catch { throw new Error("Content is not valid JSON."); }
  const canonical = canonicalizeJcs(value);
  if (canonical !== input) throw new Error("Content is valid JSON but is not the exact RFC 8785 canonical representation.");
  return value;
}

export function assertExactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): void {
  const allowed = new Set([...required, ...optional]);
  for (const key of required) if (!Object.hasOwn(value, key)) throw new Error(`Missing required property: ${key}.`);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`Unknown property: ${key}.`);
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
