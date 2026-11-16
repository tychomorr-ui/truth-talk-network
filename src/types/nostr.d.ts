import type { NostrSigner } from "../lib/nostr";

declare global {
  interface Window {
    nostr?: NostrSigner;
  }
}

export {};
