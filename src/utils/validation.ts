import { COUNTRY_DATA, type CountryCode } from "../data/countries";
import type { AddressValue } from "./address";
import { addressFieldLabel, getCountryConfig, isAddressFieldRequired } from "./address";
import { getConsumptionTaxConfig } from "./tax";

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

export function validateAddress(value: AddressValue, options?: { requireLevel1?: boolean }): ValidationResult {
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

  for (const field of config.addressFields) {
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
  if (requireLevel1 && !config.addressFields.includes("level1") && (!value.level1 || value.level1.trim() === "")) {
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

export function normalizeConsumptionTax(consumptionTaxId: string): string {
  return consumptionTaxId.trim().toUpperCase().replace(/\s/g, "");
}
