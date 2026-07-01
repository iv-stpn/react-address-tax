---
"react-address-tax": patch
---

Add `computeConsumerConsumptionTaxOutcome()` convenience wrapper for B2C transactions. This function wraps `computeConsumptionTaxOutcome()` with `isBusiness: false` and `hasConsumptionTaxId: false`, making it easier to compute taxes for consumer transactions.
