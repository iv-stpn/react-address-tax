import type { AddressValue } from "../types.js";
import { getCountryConfig } from "./countries.js";

export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

export function validateConsumptionTax(
	consumptionTaxId: string,
	countryCode: string,
): boolean {
	const config = getCountryConfig(countryCode);
	if (!config) return false;
	const normalized = consumptionTaxId.trim().toUpperCase().replace(/\s/g, "");
	return config.consumptionTaxPattern.test(normalized);
}

export function validatePostalCode(
	postalCode: string,
	countryCode: string,
): boolean {
	const config = getCountryConfig(countryCode);
	if (!config?.postalCodePattern) return true;
	return config.postalCodePattern.test(postalCode.trim());
}

export function validateAddress(value: AddressValue): ValidationResult {
	const errors: ValidationError[] = [];
	const config = getCountryConfig(value.country);

	if (!config) {
		errors.push({
			field: "country",
			message: "Please select a valid country.",
		});
		return { valid: false, errors };
	}

	for (const fieldConfig of config.addressFields) {
		if (!fieldConfig.required) continue;
		const fieldValue = value[fieldConfig.field as keyof AddressValue];
		if (!fieldValue || String(fieldValue).trim() === "") {
			errors.push({
				field: fieldConfig.field,
				message: `${fieldConfig.label} is required.`,
			});
		}
	}

	if (
		value.postalCode &&
		!validatePostalCode(value.postalCode, value.country)
	) {
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
