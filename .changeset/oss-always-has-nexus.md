---
"react-address-tax": patch
---

Fold the "OSS (EU) jurisdictions always carry a seller nexus" rule into
`computeTaxOutcome`. Previously callers had to OR `isEUCountry(country)` into the
`hasNexus` argument themselves, so `computeConsumerTaxOutcome("FR", false)`
returned `effectiveTax: 0` instead of the headline rate. OSS countries are now
treated as in-nexus regardless of the passed `hasNexus` flag; non-OSS
(country-specific) jurisdictions remain gated by `hasNexus` as before.
