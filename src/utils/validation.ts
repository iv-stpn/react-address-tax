import { COUNTRY_DATA, type CountryCode } from "../data/countries";
import type { AddressCollectionMode, AddressFieldKey, AddressValue } from "./address";
import { addressFieldLabel, getCountryConfig, isAddressFieldRequired, isEUCountry } from "./address";
import { getConsumptionTaxConfig, hasRegionalTax } from "./tax";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateConsumptionTax(consumptionTaxId: string, countryCode: string): boolean {
  const config = getConsumptionTaxConfig(countryCode);
  if (!config?.consumptionTaxPattern) return false;
  const normalized = consumptionTaxId.trim().toUpperCase().replace(/\s/g, "");
  return config.consumptionTaxPattern.test(normalized);
}

export function validatePostalCode(postalCode: string, countryCode: string): boolean {
  const config = getCountryConfig(countryCode);
  if (!config?.postalCodePattern) return true;
  return config.postalCodePattern.test(postalCode.trim());
}

export function validateAddress(
  value: AddressValue,
  options?: { requireLevel1?: boolean; fields?: AddressFieldKey[] },
): ValidationResult {
  const errors: ValidationError[] = [];
  const requireLevel1 = options?.requireLevel1 ?? false;
  const config = getCountryConfig(value.country);

  // A country must be selected, and it must be a real country code. Countries
  // without a detailed address config are still valid — only the country is
  // collected for them — so we don't require a config here.
  const countryCode = value.country.trim().toUpperCase();
  if (!countryCode || !COUNTRY_DATA[countryCode as CountryCode]) {
    errors.push({
      field: "country",
      message: "Please select a country.",
    });
    return { valid: false, errors };
  }

  if (!config) {
    // Recognized country, but no detailed address fields to validate.
    return { valid: true, errors };
  }

  // Which fields are actually collected (and therefore validated). When the
  // caller restricts the set — e.g. AddressInput in minimal/region mode, where
  // only the country (and possibly the region) is collected — only those
  // fields gate validity. When omitted, the country's full field set is used.
  const fields = options?.fields ?? config.addressFields;

  for (const field of fields) {
    if (!isAddressFieldRequired(field, requireLevel1)) continue;
    const fieldValue = value[field as keyof AddressValue];
    if (!fieldValue || String(fieldValue).trim() === "") {
      errors.push({
        field,
        message: `${addressFieldLabel(value.country, field)} is required.`,
      });
    }
  }

  // level1 may not be part of a country's addressFields, but when it's
  // required it must still be collected and validated — never optional.
  if (requireLevel1 && !fields.includes("level1") && (!value.level1 || value.level1.trim() === "")) {
    errors.push({
      field: "level1",
      message: `${addressFieldLabel(value.country, "level1")} is required.`,
    });
  }

  if (value.postalCode && !validatePostalCode(value.postalCode, value.country)) {
    errors.push({
      field: "postalCode",
      message: "Invalid postal code format.",
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * The address fields actually collected for a given collection mode and country
 * — the same set the inputs render and gate validity on. Pure derivation of
 * {@link AddressCollectionMode} semantics:
 * - "full": the country's full field set.
 * - "region": only the level-1 region (when required), nothing else.
 * - "regionMinimal": full set for EU countries; otherwise just the region.
 * - "minimal": full set for EU countries; just the region for countries with
 *   per-region tax (US, CA); country only otherwise.
 *
 * `level1` is never optional: it is included only when {@link requireLevel1} is
 * set (added even for countries whose config lacks it), and stripped otherwise.
 * Returns an empty list when only the country is collected, or when the country
 * is empty/unrecognized.
 */
export function computeEffectiveFields(mode: AddressCollectionMode, country: string, requireLevel1 = false): AddressFieldKey[] {
  const countryConfig = getCountryConfig(country);
  if (!country || !countryConfig) return [];
  const allFields = countryConfig.addressFields;

  const withLevel1 = (base: AddressFieldKey[], required: boolean): AddressFieldKey[] => {
    if (required) {
      return base.includes("level1") ? base : [...base, "level1"];
    }
    return base.filter((f) => f !== "level1");
  };

  switch (mode) {
    case "full":
      return withLevel1(allFields, requireLevel1);
    case "region":
      return requireLevel1 ? ["level1"] : [];
    case "regionMinimal":
      return isEUCountry(country) ? withLevel1(allFields, requireLevel1) : requireLevel1 ? ["level1"] : [];
    default:
      if (isEUCountry(country)) return withLevel1(allFields, requireLevel1);
      if (hasRegionalTax(country)) return requireLevel1 ? ["level1"] : [];
      return [];
  }
}

/**
 * Whether an address is valid for a given collection mode. Only the fields
 * actually collected for that mode/country gate validity, so e.g. "minimal"
 * mode is valid as soon as a recognized country (and region, where required) is
 * present, even though "full" mode would also require the street, city, etc.
 *
 * The address only needs to contain a `country` at minimum; any other fields
 * default to empty. By default `level1` is optional; pass
 * `{ requireLevel1: true }` to require it (it is forced on automatically for
 * countries with per-region tax, mirroring the inputs).
 */
export function isValidAddress(
  value: Partial<AddressValue> & Pick<AddressValue, "country">,
  mode: AddressCollectionMode,
  options?: { requireLevel1?: boolean },
): boolean {
  const requireLevel1 = (options?.requireLevel1 ?? false) || hasRegionalTax(value.country);
  const fields = computeEffectiveFields(mode, value.country, requireLevel1);
  const full: AddressValue = {
    line1: value.line1 ?? "",
    line2: value.line2,
    city: value.city ?? "",
    level1: value.level1,
    postalCode: value.postalCode ?? "",
    country: value.country,
  };
  return validateAddress(full, { requireLevel1, fields }).valid;
}

export function normalizeConsumptionTax(consumptionTaxId: string): string {
  return consumptionTaxId.trim().toUpperCase().replace(/\s/g, "");
}
