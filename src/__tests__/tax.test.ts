import { describe, expect, it } from "vitest";
import { computeConsumerTaxOutcome, computeTaxOutcome } from "../utils/tax";

describe("computeTaxOutcome — OSS (EU) always has nexus", () => {
  it("charges the headline rate for EU consumers even without a passed nexus", () => {
    // FR is OSS: effectiveTax must equal baseTax regardless of hasNexus=false.
    const outcome = computeConsumerTaxOutcome({ country: "FR" });
    expect(outcome.taxSystem).toBe("oss");
    expect(outcome.baseTax).toBe(20);
    expect(outcome.effectiveTax).toBe(20);
  });

  it("matches when nexus is explicitly passed for an EU country", () => {
    const withNexus = computeConsumerTaxOutcome({ country: "DE", hasNexus: true });
    const withoutNexus = computeConsumerTaxOutcome({ country: "DE" });
    expect(withoutNexus.effectiveTax).toBe(19);
    expect(withoutNexus.effectiveTax).toBe(withNexus.effectiveTax);
  });

  it("applies to B2B without a tax ID (standard rate, still collected)", () => {
    const outcome = computeTaxOutcome({ country: "ES", isBusiness: true, hasTaxId: false });
    expect(outcome.baseTax).toBe(21);
    expect(outcome.effectiveTax).toBe(21);
  });

  it("still reverse-charges B2B with a valid tax ID (0%)", () => {
    const outcome = computeTaxOutcome({ country: "IT", isBusiness: true, hasTaxId: true });
    expect(outcome.baseTax).toBe(0);
    expect(outcome.effectiveTax).toBe(0);
    expect(outcome.flags.buyerSelfAccounts).toBe(true);
  });
});

describe("computeTaxOutcome — non-OSS still gated by nexus", () => {
  it("collects nothing for a country-specific country without nexus", () => {
    // JP is country-specific: no nexus → effectiveTax 0, baseTax still resolved.
    const outcome = computeConsumerTaxOutcome({ country: "JP" });
    expect(outcome.taxSystem).toBe("country-specific");
    expect(outcome.baseTax).toBe(10);
    expect(outcome.effectiveTax).toBe(0);
  });

  it("collects the headline rate for a country-specific country with nexus", () => {
    const outcome = computeConsumerTaxOutcome({ country: "JP", hasNexus: true });
    expect(outcome.baseTax).toBe(10);
    expect(outcome.effectiveTax).toBe(10);
  });
});
