// Level-1 administrative division option lists, sourced from data/level1-administrative-codes.json
// via codegen (scripts/gen-level1-codes.ts). Each is a separate named export
// so the bundler tree-shakes away every country we don't import below — the
// full set of divisions never reaches the published build.

import type { ChangeEventHandler, ReactNode } from "react";
// Full country reference data (every country), generated from data/countries.json
// by scripts/gen-countries.ts. Source of postal-code patterns and level-1
// division labels below.
import { COUNTRY_CODES, COUNTRY_DATA, type CountryCode } from "../data/countries";
import type { AdministrativeDivisionOption } from "../data/level1-administrative-codes";
import {
  level1Admin_AU,
  level1Admin_CA,
  level1Admin_ES,
  level1Admin_GB,
  level1Admin_IT,
  level1Admin_JP,
  level1Admin_US,
} from "../data/level1-administrative-codes";
import { POSTAL_CODE_DATA } from "../data/postal-codes";

export type { CountryCode };
// Re-export the generated country code list and union type so consumers can
// import them from the address utilities alongside the address config helpers.
export { COUNTRY_CODES };

export interface AddressValue {
  line1: string;
  line2?: string;
  city: string;
  level1?: string;
  postalCode: string;
  country: string;
}

/** Controls which address fields are collected. */
export type AddressCollectionMode =
  /** Country only; region also for countries with per-region tax rules (US, CA); full address for EU countries. */
  | "minimal"
  /** Country + region always; full address for EU countries. */
  | "regionMinimal"
  /** Country + region only, always. */
  | "region"
  /** Full address, always. */
  | "full";

// ---------------------------------------------------------------------------
// Shared render-prop types (used by both AddressInput and AddressTaxInput).
// ---------------------------------------------------------------------------

export interface AddressInputClassNames {
  root: string;
  row: string;
  field: string;
  label: string;
  input: string;
  select: string;
  error: string;
}

export type AddressFieldKey = "line1" | "line2" | "city" | "level1" | "postalCode" | "country";

export interface CountryAddressConfig {
  code: CountryCode;
  name: string;
  /** Field keys in display order. Labels/required/options are resolved per key. */
  addressFields: AddressFieldKey[];
  /** Postal-code pattern, derived from COUNTRY_DATA (not hand-maintained). */
  postalCodePattern?: RegExp;
  /** When present, the level-1 field renders a <select> with these options. */
  level1Options?: ReadonlyArray<AdministrativeDivisionOption>;
}

// Default field labels and placeholders. Per-country overrides for the postal
// code and city fields live in POSTAL_CODE_DATA; the level-1 label is
// derived from COUNTRY_DATA. line1/line2 use the generic labels/placeholders
// below for every country except those listed in LINE_OVERRIDES.
const LINE1_LABEL_DEFAULT = "Address line 1";
const LINE2_LABEL_DEFAULT = "Address line 2";
const LINE1_PLACEHOLDER_DEFAULT = "Street address";
const LINE2_PLACEHOLDER_DEFAULT = "Apartment, unit number, building, floor, etc.";
const POSTAL_CODE_LABEL_DEFAULT = "Postal code";
const CITY_LABEL_DEFAULT = "City";

// Per-country overrides for the line1/line2 label and placeholder text. The
// label conveys what the field *is* (and often differs by locale convention);
// the placeholder gives an example of what to type (and differs where local
// addressing relies on landmarks, blocks, etc.). Any field left unset falls
// back to the generic default above.
interface LineOverrides {
  line1Label?: string;
  line2Label?: string;
  line1Placeholder?: string;
  line2Placeholder?: string;
}

const LINE_OVERRIDES: Partial<Record<string, LineOverrides>> = {
  FR: { line1Label: "Address", line2Label: "Address details" },
  // Countries where landmark-based addressing is common.
  PH: {
    line1Label: "Address",
    line2Label: "Landmark/Unit details",
    line1Placeholder: "Street, road, block and lot number",
    line2Placeholder: "Near landmark or unit number, building, floor, etc.",
  },
  IN: {
    line1Label: "Address",
    line2Label: "Landmark/Unit details",
    line1Placeholder: "Street, road, block and lot number",
    line2Placeholder: "Near landmark or unit number, building, floor, etc.",
  },
};

// Suffix appended to the label of optional fields in the rendered UI.
const OPTIONAL_SUFFIX = " (optional)";

// ---------------------------------------------------------------------------
// Field metadata resolution
// ---------------------------------------------------------------------------

/**
 * Resolved, render-ready metadata for a single address field. Produced from a
 * {@link CountryAddressConfig} + field key so the config itself only has to
 * declare field order, not per-field labels/required/placeholder/options.
 */
export interface ResolvedAddressField {
  field: AddressFieldKey;
  /** Display label, including the " (optional)" suffix for optional fields. */
  label: string;
  required: boolean;
  placeholder?: string;
  /** When present, the field renders a <select> instead of an <input>. */
  options?: ReadonlyArray<AdministrativeDivisionOption>;
}

/** The base label for a field, before the optional suffix is applied. */
export function addressFieldLabel(code: string, key: AddressFieldKey): string {
  switch (key) {
    case "line1":
      return LINE_OVERRIDES[code]?.line1Label ?? LINE1_LABEL_DEFAULT;
    case "line2":
      return LINE_OVERRIDES[code]?.line2Label ?? LINE2_LABEL_DEFAULT;
    case "city":
      return POSTAL_CODE_DATA[code]?.cityLabel ?? CITY_LABEL_DEFAULT;
    case "postalCode":
      return POSTAL_CODE_DATA[code]?.label ?? POSTAL_CODE_LABEL_DEFAULT;
    case "level1":
      return COUNTRY_DATA[code as CountryCode]?.administrativeLabels.level1?.en ?? "Region";
    case "country":
      return "Country";
  }
}

/**
 * Whether a field is required. line1/city/postalCode are always required; line2
 * is always optional; the level-1 field is required only when {@link
 * requireLevel1} is set — otherwise it is omitted entirely rather than shown as
 * optional (see computeEffectiveFields).
 */
export function isAddressFieldRequired(key: AddressFieldKey, requireLevel1 = false): boolean {
  if (key === "level1") return requireLevel1;
  return key !== "line2";
}

export function resolveAddressField(code: string, key: AddressFieldKey, requireLevel1 = false): ResolvedAddressField {
  const required = isAddressFieldRequired(key, requireLevel1);
  const baseLabel = addressFieldLabel(code, key);
  const field: ResolvedAddressField = {
    field: key,
    label: required ? baseLabel : `${baseLabel}${OPTIONAL_SUFFIX}`,
    required,
  };
  if (key === "line1") {
    field.placeholder = LINE_OVERRIDES[code]?.line1Placeholder ?? LINE1_PLACEHOLDER_DEFAULT;
  }
  if (key === "line2") {
    field.placeholder = LINE_OVERRIDES[code]?.line2Placeholder ?? LINE2_PLACEHOLDER_DEFAULT;
  }
  if (key === "postalCode") {
    const placeholder = POSTAL_CODE_DATA[code]?.placeholder;
    if (placeholder) field.placeholder = placeholder;
  }
  if (key === "level1") {
    const options = LEVEL1_OPTIONS[code as CountryCode];
    if (options) field.options = options;
  }
  return field;
}

// ---------------------------------------------------------------------------
// Country configs
// ---------------------------------------------------------------------------

// Postal-code pattern, compiled from the GeoNames regex in COUNTRY_DATA.
function postalPattern(code: CountryCode): RegExp | undefined {
  const raw = COUNTRY_DATA[code]?.postalCodeRegex;
  if (!raw) return undefined;
  try {
    // GeoNames patterns are case-sensitive ASCII; alpha postcodes (GB, NL,
    // MT, …) are entered in either case, so match case-insensitively.
    return new RegExp(raw.trim(), "i");
  } catch {
    return undefined;
  }
}

// Level-1 <select> option lists. Only countries with a curated option list get
// a level-1 field; the rest use the standard layout with no level-1 field.
const LEVEL1_OPTIONS: Partial<Record<CountryCode, ReadonlyArray<AdministrativeDivisionOption>>> = {
  ES: level1Admin_ES,
  GB: level1Admin_GB,
  IT: level1Admin_IT,
  US: level1Admin_US,
  CA: level1Admin_CA,
  AU: level1Admin_AU,
  JP: level1Admin_JP,
};

// Curated field orders for countries whose layout differs from the standard
// (line1, line2, postalCode, city) — most often because a level-1 field is
// interleaved in a country-specific position. Countries not listed here use
// the standard order generated by standardConfig.
const CURATED_FIELD_ORDER: Partial<Record<CountryCode, AddressFieldKey[]>> = {
  ES: ["line1", "line2", "postalCode", "city", "level1"],
  GB: ["line1", "line2", "city", "level1", "postalCode"],
  IT: ["line1", "line2", "postalCode", "city", "level1"],
  US: ["line1", "line2", "city", "level1", "postalCode"],
  CA: ["line1", "line2", "city", "level1", "postalCode"],
  AU: ["line1", "line2", "city", "level1", "postalCode"],
  JP: ["postalCode", "level1", "city", "line1", "line2"],
};

function standardFieldOrder(code: CountryCode): AddressFieldKey[] {
  // Standard layout: street, optional second line, postal code (when the
  // country has one), city. No level-1 field — those countries are curated.
  const fields: AddressFieldKey[] = ["line1", "line2"];
  if (postalPattern(code)) fields.push("postalCode");
  fields.push("city");
  return fields;
}

function buildConfig(code: CountryCode): CountryAddressConfig {
  const data = COUNTRY_DATA[code];
  const pattern = postalPattern(code);
  const addressFields = CURATED_FIELD_ORDER[code] ?? standardFieldOrder(code);
  return {
    code,
    name: data?.name ?? code,
    addressFields,
    ...(pattern && { postalCodePattern: pattern }),
  };
}

// Every supported country gets a concrete config. Field order is curated where
// a bespoke layout is needed, otherwise generated from COUNTRY_DATA"; the
// postal-code pattern always comes from COUNTRY_DATA. Built as a typed Record
// so callers never have to handle a missing config for a supported code.
export const COUNTRIES_ADDRESSES = Object.fromEntries(COUNTRY_CODES.map((code) => [code, buildConfig(code)])) as Record<
  CountryCode,
  CountryAddressConfig
>;

export const COUNTRY_LIST = Object.values(COUNTRIES_ADDRESSES).sort((a, b) => a.name.localeCompare(b.name));

// Simple { code, name } list of every country GeoNames knows about, derived
// from the generated COUNTRY_DATA. Used to populate the country selector so
// users can pick any country, not just the curated subset that has a full
// address-field config.
export const ALL_COUNTRY_OPTIONS = Object.values(COUNTRY_DATA)
  .map((c) => ({ code: c.code, name: c.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getCountryConfig(code: string): CountryAddressConfig | undefined {
  return COUNTRIES_ADDRESSES[code.toUpperCase() as CountryCode];
}

// All 27 EU member states as of 2024.
const EU_COUNTRY_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
]);

export function isEUCountry(code: string): boolean {
  return EU_COUNTRY_CODES.has(code.toUpperCase());
}

export function getConsumptionTaxLabel(countryCode: string): string {
  const labels: Record<string, string> = {
    AU: "ABN",
    CA: "GST/HST Number",
    GB: "VAT Number",
    JP: "Qualified Invoice Issuer Number",
    US: "EIN (Employer Identification Number)",
  };
  return labels[countryCode] ?? "VAT Number";
}
