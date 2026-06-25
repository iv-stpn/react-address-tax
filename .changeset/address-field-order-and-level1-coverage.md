---
"react-address-tax": major
---

Expand level-1 division coverage to all countries, improve address field ordering, and overhaul consumption tax labels

### Breaking changes

**`ConsumptionTaxOutcome.taxName` removed** — replaced by two separate fields:
- `consumptionTaxLabel: string | null` — English name of the tax (e.g. `"VAT"`, `"GST"`, `"Sales Tax"`)
- `localConsumptionTaxLabel: string | null` — Local-language name (e.g. `"TVA"`, `"MwSt"`, `"消費税"`)

**`TaxConfig.taxName` removed** — tax names are now sourced from the new `CONSUMPTION_TAX_LABELS` map instead of being embedded in each config entry.

### New exports (`tax.ts`)

- `getConsumptionTaxLabel(country, region?)` — English consumption tax name for a country/region
- `getLocalConsumptionTaxLabel(country, region?)` — Local-language consumption tax name
- `getBusinessTaxNumberLabel(country)` — Label for the business registration identifier (e.g. `"ABN"`, `"VAT Number"`, `"EIN"`, `"GSTIN"`)
- `ConsumptionTaxLabels` type

`getConsumptionTaxLabel` was previously exported from `address.ts`; it is now exported from `tax.ts` with an added optional `region` parameter. The public package entry point re-exports it unchanged.

### Address field ordering & level-1 coverage

**Level-1 coverage**: `LEVEL1_OPTIONS` now maps every country that has administrative division data (~200 countries, up from 7). `standardFieldOrder` automatically appends `level1` for any country registered there, so countries like ES and IT no longer need explicit `FIELD_ORDER_OVERRIDES` entries.

**Field order overrides** now only list countries whose layout genuinely differs from the default (`line1, line2, postalCode, city[, level1]`):
- *Postal-code-first* (JP-style): JP, KR, TW
- *City-before-postal-code* (level1 between city and postal code): AU, CA, GB, US — plus 25 newly added countries across the Americas (AR, BR, CL, CO, CR, DO, EC, MX, PE, PY, UY, VE), Europe/Middle East/Africa (IE, IL, NG, ZA), and Asia/Oceania (BD, CN, ID, IN, NZ, PH, PK, TH, VN)
