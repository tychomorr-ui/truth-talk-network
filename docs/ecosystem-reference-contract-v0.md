# Truth-Talk ecosystem reference contract — v0 draft

**Status:** documentation only. This contract is not implemented in Truth-Talk Phase 1. It creates no API, import route, resolver, adapter, or live connection to Digital Ore, Truth Substrate, ARCHANGEL, or VALKYRIE.

A future Truth-Talk reference to a Digital Ore record, a Truth Substrate CID, or an ARCHANGEL receipt is represented by an author-supplied reference object. Phase 1 must keep every such object unresolved:

```json
{
  "contractVersion": "v0.0-draft",
  "resolutionStatus": "UNRESOLVED",
  "referenceSource": "<exact URL pasted by the author>"
}
```

`referenceSource` is the URL the author pasted. The client does not fetch, import, resolve, or verify it. A future version that can report a resolved reference would require a signed export from the referenced system and independent verification against that system’s pinned public key. No Phase-1 code path may change `resolutionStatus` to `RESOLVED`.

> Any version of this contract that claims a reference is RESOLVED requires a signed export from the referenced system and independent verification against a pinned key. That system does not currently produce such exports. Therefore no reference is RESOLVED in any Phase 1 deployment.

Any future implementation requires a separate, versioned design and explicit operator approval. A connection to VALKYRIE additionally remains subject to the project’s independent versioned, operator-approved signed export/import boundary; this stub does not grant or implement that connection.
