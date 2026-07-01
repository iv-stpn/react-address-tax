# react-address-tax

## 2.0.0

### Major Changes

- [`3cca36a`](https://github.com/iv-stpn/react-address-tax/commit/3cca36ae0e2d1cfbcc97d85c8b2bba5751c2cc81) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Rename `ConsumptionTax` to `Tax` across the public API to shorten names. This is
  a breaking change for consumers using the affected exports.

  Renamed functions:

  - `computeConsumptionTaxOutcome` → `computeTaxOutcome`
  - `computeConsumerConsumptionTaxOutcome` → `computeConsumerTaxOutcome`
  - `getConsumptionTaxLabel` → `getTaxLabel`
  - `getLocalConsumptionTaxLabel` → `getLocalTaxLabel`
  - `normalizeConsumptionTax` → `normalizeTax`
  - `validateConsumptionTax` → `validateTax`

  Renamed types:

  - `ConsumptionTaxLabels` → `TaxLabels`
  - `ConsumptionTaxValue` → `TaxValue`
  - `ConsumptionTaxOutcome` → `TaxOutcome`

  The `AddressTaxInput` `onConsumptionTaxChange` prop is now `onTaxChange`, and
  the emitted value fields `consumptionTaxLabel` / `localConsumptionTaxLabel` are
  now `taxLabel` / `localTaxLabel`. The rendered tax input DOM id changed from
  `rav-consumptionTaxId` to `rav-taxId`.

## 1.3.1

### Patch Changes

- [`cc890f0`](https://github.com/iv-stpn/react-address-tax/commit/cc890f0dbdc25096b405d5d885ba5d4884de6989) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Add `computeConsumerConsumptionTaxOutcome()` convenience wrapper for B2C transactions. This function wraps `computeConsumptionTaxOutcome()` with `isBusiness: false` and `hasConsumptionTaxId: false`, making it easier to compute taxes for consumer transactions.

## 1.3.0

### Minor Changes

- [`0dda096`](https://github.com/iv-stpn/react-address-tax/commit/0dda096b3620a4a5ed53b12074118147ea0b41f8) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Simplified ConsumptionTaxOutcome interface by removing redundant fields

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

## 1.2.1

### Patch Changes

- [`5f045a7`](https://github.com/iv-stpn/react-address-tax/commit/5f045a7f353ed4e48223c1d8b8eac34c4411c7c1) Thanks [@iv-stpn](https://github.com/iv-stpn)! - EU member states are now always counted as having a consumption-tax obligation, even when `nexusList` is empty or omits them.

  Previously, `isInNexus` was derived solely from `nexusList` (`!nexusList || nexusList.includes(country)`), so an empty list — or a list that didn't include an EU country — caused EU countries to be treated as out-of-nexus: tax identifier fields were hidden and `effectiveTax` fell back to 0. EU countries (OSS / one-stop-shop) always carry a collection obligation, so they are now treated as in-nexus regardless of the supplied list. Non-EU countries continue to follow `nexusList` as before.

  **New Features:**

  - Added exported `isEUCountry(country)` helper in `utils/tax`, returning `true` for countries whose tax system is OSS.

## 1.2.0

### Minor Changes

- [`b2fffae`](https://github.com/iv-stpn/react-address-tax/commit/b2fffaefdd350f0481a7ea57b31314420d9ae4e1) Thanks [@iv-stpn](https://github.com/iv-stpn)! - `validateAddress` now accepts a partial/nullable address: every field is optional and nullable except `country`, which is strictly required.

  **Breaking Changes:**

  - `validateAddress` first parameter is now `AddressValueInput` instead of `AddressValue`. Callers no longer need to default missing fields to empty strings before validating — a partial object (e.g. straight from a form) is accepted directly. `country` remains strictly required.

  **New Features:**

  - Added exported `AddressValueInput` type: an `AddressValue` where every field is optional and nullable except `country`.

  **Migration Guide:**

  Before:

  ```ts
  validateAddress(
    { line1: "", city: "", postalCode: "", country: "JP" },
    "minimal"
  );
  ```

  After:

  ```ts
  validateAddress({ country: "JP" }, "minimal");
  // null/undefined fields are treated as missing
  validateAddress({ country: "US", line1: null, city: null, postalCode: null });
  ```

## 1.1.0

### Minor Changes

- [`bac6d52`](https://github.com/iv-stpn/react-address-tax/commit/bac6d52dd3301eba8ccfa7a0af46d634add6b79a) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Replace `requireLevel1` prop with new `fullRegion` mode

  **Breaking Changes:**

  - Removed `requireLevel1` prop from `AddressInput` component
  - Updated `validateAddress` function signature - second parameter now accepts `AddressCollectionMode` instead of options object
  - Updated `computeEffectiveFields` function signature - removed `requireLevel1` parameter
  - Updated `isValidAddress` function signature - removed options parameter
  - Updated `resolveAddressField` function signature - replaced `requireLevel1` with `mode` parameter
  - Updated `isAddressFieldRequired` function signature - replaced `requireLevel1` with `mode` parameter

  **New Features:**

  - Added new `"fullRegion"` mode to `AddressCollectionMode` type - collects full address with level1 always required
  - `AddressTaxInput` now automatically uses `"fullRegion"` mode for countries with regional tax instead of passing `requireLevel1` prop

  **Migration Guide:**

  Before:

  ```tsx
  <AddressInput value={value} onChange={onChange} requireLevel1 />
  <AddressInput value={value} onChange={onChange} mode="full" requireLevel1 />
  ```

  After:

  ```tsx
  <AddressInput value={value} onChange={onChange} mode="fullRegion" />
  <AddressInput value={value} onChange={onChange} mode="fullRegion" />
  ```

  For validation functions:

  ```tsx
  // Before
  validateAddress(value, { requireLevel1: true });
  computeEffectiveFields(mode, country, true);

  // After
  validateAddress(value, "fullRegion");
  computeEffectiveFields("fullRegion", country);
  ```

  **Other Changes:**

  - Added `husky` dev dependency for git hooks
  - Added `prepare` script to initialize husky
  - Updated all tests to reflect the new API

## 1.0.1

### Patch Changes

- [`829a9cb`](https://github.com/iv-stpn/react-address-tax/commit/829a9cb784e57e842a793e30d0277ab4bad7019c) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Add `consumptionTaxLabel` and `localConsumptionTaxLabel` to `ConsumptionTaxValue`. The `onConsumptionTaxChange` callback now includes both the English tax label (e.g., "VAT", "GST", "Sales Tax") and the local language label (e.g., "TVA", "MwSt", "消費税"), making it easier to display localized tax information without additional lookups.

## 1.0.0

### Major Changes

- [`524ff86`](https://github.com/iv-stpn/react-address-tax/commit/524ff8650b1b0662cb13726d3297254a49a9eab3) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Expand level-1 division coverage to all countries, improve address field ordering, and overhaul consumption tax labels

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

  - _Postal-code-first_ (JP-style): JP, KR, TW
  - _City-before-postal-code_ (level1 between city and postal code): AU, CA, GB, US — plus 25 newly added countries across the Americas (AR, BR, CL, CO, CR, DO, EC, MX, PE, PY, UY, VE), Europe/Middle East/Africa (IE, IL, NG, ZA), and Asia/Oceania (BD, CN, ID, IN, NZ, PH, PK, TH, VN)

## 0.3.2

### Patch Changes

- [`6ab00cb`](https://github.com/iv-stpn/react-address-tax/commit/6ab00cb9239f837d41c471a9cfec2b513982c6ee) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Add the `react-address-tax/utils` subpath export

  Register `./utils` as a proper package entry point (ESM, CJS, and type declarations) so `import { isValidAddress } from "react-address-tax/utils"` resolves instead of failing with `Cannot find module 'react-address-tax/utils'` (ts2307). The entry exposes the library's component-free utility surface: address config/types, tax computation, and validation helpers.

## 0.3.1

### Patch Changes

- [`9cf2704`](https://github.com/iv-stpn/react-address-tax/commit/9cf27043e704d44e0c21cdf3b49f88935f794a40) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Add isValidAddress and computeEffectiveFields utilities

  Export two new validation utilities from react-address-tax/utils:

  - `isValidAddress(value, mode, options?)` - Validates whether an address is valid for a given collection mode. Only the fields actually collected for that mode/country gate validity, so minimal mode can be valid with just a country (or country + region for regional countries like US/CA).

  - `computeEffectiveFields(mode, country, requireLevel1?)` - Returns the address fields that are actually collected and validated for a given mode and country. Useful for building custom forms or understanding validation requirements.

  These functions share the same logic used internally by AddressInput and AddressTaxInput components.

## 0.3.0

### Minor Changes

- [`e7fbf16`](https://github.com/iv-stpn/react-address-tax/commit/e7fbf1610ccae7e84b09581f59fda2c4cc0fbdd0) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Expose `COUNTRY_CODES` (and the `CountryCode` type) at the `react-address-tax/codes` subpath so consumers can import the country code reference without pulling in the full component bundle.

- [`acf7228`](https://github.com/iv-stpn/react-address-tax/commit/acf72289aedaa0188c51e88d4b4670d5e5d06722) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Add a `validationMode` prop (`"onType"` | `"onBlur"` | `"onSubmit"`) to `AddressInput` and `AddressTaxInput` controlling when field errors are surfaced. In `"onSubmit"` mode, call the component's ref `validate()` handle (exposed via the new `AddressInputHandle` type) to reveal errors.

  Validation now only gates on the fields actually collected for the active mode, so `minimal`/`regionMinimal` modes report valid as soon as the required field (country, or country + region) is provided.

## 0.2.0

### Minor Changes

- [`89f300d`](https://github.com/iv-stpn/react-address-tax/commit/89f300d4a1e29a0e674cd0295284a09989fea58a) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Add `inline` mode to `AddressInput` and a `renderFields` transform for customizing field rendering.
