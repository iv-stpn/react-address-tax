---
"react-address-tax": patch
---

Add `consumptionTaxLabel` and `localConsumptionTaxLabel` to `ConsumptionTaxValue`. The `onConsumptionTaxChange` callback now includes both the English tax label (e.g., "VAT", "GST", "Sales Tax") and the local language label (e.g., "TVA", "MwSt", "消費税"), making it easier to display localized tax information without additional lookups.
