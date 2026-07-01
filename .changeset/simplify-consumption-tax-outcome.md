---
"react-address-tax": minor
---

Simplified ConsumptionTaxOutcome interface by removing redundant fields

**Breaking Changes:**
- Removed `hasNexus` field from `ConsumptionTaxOutcome` (mirrors input parameter)
- Removed `state` field from `ConsumptionTaxOutcome` (mirrors input parameter)
- Removed `collectionThreshold` field from `ConsumptionTaxOutcome` (use `getConsumptionTaxConfig()` instead)
- Removed `invoiceAtZero` flag from `TaxOutcomeFlags` (always equals `buyerSelfAccounts`)

**Improvements:**
- Simplified `computeConsumptionTaxOutcome` implementation - now checks business status first for clearer logic flow
- Reduced `ConsumptionTaxOutcome` from 9 fields to 6 fields
- Reduced `TaxOutcomeFlags` from 4 fields to 3 fields
- Interface now only contains computed outputs, not mirrored inputs
