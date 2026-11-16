import { sha256 } from "@noble/hashes/sha2.js";

const encoder = new TextEncoder();

export function sha256HexBytes(value: Uint8Array): string {
  return Array.from(sha256(value), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function sha256HexText(value: string): string {
  return sha256HexBytes(encoder.encode(value));
}
