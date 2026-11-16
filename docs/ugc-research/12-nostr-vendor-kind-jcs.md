# Nostr vendor kinds and JCS

The official Nostr NIPs repository at commit `d47a2ec8aacb9d01ac00e6294ae77582f483ff68` contains no Markdown mention or assignment for event kinds `40001` or `40002`. The current NIP-01 text allows a kind integer from 0 through 65535, but its enumerated storage-class conventions do not classify either proposed value. This bounded repository check found no NIP assignment; it does not prove that no private, out-of-repository, or later proposal exists. Document both numbers as Truth-Talk vendor-specific kinds and test each selected relay’s actual acceptance. Do not claim universal relay support. [1] [2]

JCS applies to the JSON payload string stored in `event.content`. RFC 8785 requires I-JSON-compatible input, no duplicate object properties, deterministic primitive serialization, recursively sorted object properties, preserved array order, and UTF-8 output. Keep identifiers and other potentially long values as strings. The outer Nostr event ID remains a separate NIP-01 serialization of `[0, pubkey, created_at, kind, tags, content]`; do not run JCS over that array in place of NIP-01’s event-ID rules. [2] [3]

## References

[1]: https://github.com/nostr-protocol/nips/blob/d47a2ec8aacb9d01ac00e6294ae77582f483ff68/README.md "Official Nostr NIPs index at inspected commit"
[2]: https://github.com/nostr-protocol/nips/blob/d47a2ec8aacb9d01ac00e6294ae77582f483ff68/01.md "NIP-01 at inspected commit"
[3]: https://www.rfc-editor.org/rfc/rfc8785 "RFC 8785 JSON Canonicalization Scheme"
