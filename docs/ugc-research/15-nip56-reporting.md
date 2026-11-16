# NIP-56 reporting event format

**Checked:** 2026-10-26 against the official Nostr NIPs repository. NIP-56 is optional. A report is a user-signed kind `1984` event that signals objectionable content; the report is subjective, and clients/relays decide independently whether to act. The NIP discourages relays from automatically moderating solely on reports.

A report MUST include a `p` tag for the reported public key. For a note, it MUST also include an `e` tag for the note ID. The report category appears as the third tag value on the `e`, `p`, or `x` tag being reported. Categories are `nudity`, `malware`, `profanity`, `illegal`, `spam`, `impersonation`, or `other`. Content may contain a short explanation. Truth-Talk should build a report only after a user action, show its exact tags and optional content, and require the normal NIP-07 signature/publish consent. A report is not a finding, takedown, deletion request, or network-wide enforcement.

Source: [NIP-56 Reporting](https://github.com/nostr-protocol/nips/blob/master/56.md).
