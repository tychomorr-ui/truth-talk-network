import { describe, expect, it } from "vitest";
import { canonicalizeJcs, codePointLength, parseCanonicalJcs } from "../src/lib/jcs";

describe("Truth-Talk RFC 8785 helpers", () => {
  it("sorts object keys deterministically while preserving array order", () => {
    expect(canonicalizeJcs({ z: 1, a: "x", nested: { y: true, b: null }, list: [3, 1, 2] })).toBe('{"a":"x","list":[3,1,2],"nested":{"b":null,"y":true},"z":1}');
    expect(parseCanonicalJcs('{"a":1,"b":2}')).toEqual({ a: 1, b: 2 });
  });

  it("rejects non-finite values, undefined, sparse arrays, cycles, non-plain objects, and lone surrogates", () => {
    expect(() => canonicalizeJcs({ value: Number.NaN })).toThrow("finite");
    expect(() => canonicalizeJcs({ value: undefined })).toThrow("I-JSON");
    expect(() => canonicalizeJcs([, 1])).toThrow("sparse array");
    const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic;
    expect(() => canonicalizeJcs(cyclic)).toThrow("circular");
    expect(() => canonicalizeJcs(new Date())).toThrow("plain JSON object");
    expect(() => canonicalizeJcs("\uD800")).toThrow("lone Unicode surrogate");
  });

  it("rejects non-canonical whitespace/key ordering and duplicate property names", () => {
    expect(() => parseCanonicalJcs('{ "a":1}')).toThrow("canonical");
    expect(() => parseCanonicalJcs('{"b":2,"a":1}')).toThrow("canonical");
    expect(() => parseCanonicalJcs('{"a":1,"a":2}')).toThrow("canonical");
  });

  it("counts Unicode code points rather than UTF-16 code units", () => {
    expect(codePointLength("A😀é")).toBe(3);
  });
});
