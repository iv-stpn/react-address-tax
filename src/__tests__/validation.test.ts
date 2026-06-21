import { describe, expect, it } from "vitest";
import type { AddressValue } from "../types.js";
import {
	normalizeConsumptionTax,
	validateAddress,
	validateConsumptionTax,
	validatePostalCode,
} from "../utils/validation.js";

describe("validateConsumptionTax", () => {
	it("validates German VAT numbers", () => {
		expect(validateConsumptionTax("DE123456789", "DE")).toBe(true);
		expect(validateConsumptionTax("DE12345678", "DE")).toBe(false);
		expect(validateConsumptionTax("123456789", "DE")).toBe(false);
	});

	it("validates French VAT numbers", () => {
		expect(validateConsumptionTax("FRXX123456789", "FR")).toBe(true);
		expect(validateConsumptionTax("FR12123456789", "FR")).toBe(true);
		expect(validateConsumptionTax("FR123456789", "FR")).toBe(false);
	});

	it("validates UK VAT numbers", () => {
		expect(validateConsumptionTax("GB123456789", "GB")).toBe(true);
		expect(validateConsumptionTax("GB123456789012", "GB")).toBe(true);
		expect(validateConsumptionTax("GBGD123", "GB")).toBe(true);
		expect(validateConsumptionTax("GB12345", "GB")).toBe(false);
	});

	it("validates Dutch VAT numbers", () => {
		expect(validateConsumptionTax("NL123456789B01", "NL")).toBe(true);
		expect(validateConsumptionTax("NL123456789B1", "NL")).toBe(false);
	});

	it("is case-insensitive and trims whitespace", () => {
		expect(validateConsumptionTax("  de123456789  ", "DE")).toBe(true);
		expect(validateConsumptionTax("de123456789", "DE")).toBe(true);
	});

	it("returns false for unknown country", () => {
		expect(validateConsumptionTax("XX123456789", "XX")).toBe(false);
	});
});

describe("validatePostalCode", () => {
	it("validates German postal codes", () => {
		expect(validatePostalCode("10115", "DE")).toBe(true);
		expect(validatePostalCode("1011", "DE")).toBe(false);
		expect(validatePostalCode("101155", "DE")).toBe(false);
	});

	it("validates UK postcodes", () => {
		expect(validatePostalCode("SW1A 1AA", "GB")).toBe(true);
		expect(validatePostalCode("SW1A1AA", "GB")).toBe(true);
		expect(validatePostalCode("EC1A 1BB", "GB")).toBe(true);
	});

	it("validates Dutch postal codes", () => {
		expect(validatePostalCode("1234 AB", "NL")).toBe(true);
		expect(validatePostalCode("1234AB", "NL")).toBe(true);
		expect(validatePostalCode("123 AB", "NL")).toBe(false);
	});

	it("returns true for unknown country (permissive)", () => {
		expect(validatePostalCode("anything", "XX")).toBe(true);
	});
});

describe("validateAddress", () => {
	const validUS: AddressValue = {
		line1: "123 Main St",
		city: "New York",
		state: "NY",
		postalCode: "10001",
		country: "US",
	};

	it("passes a valid US address", () => {
		const result = validateAddress(validUS);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("fails when required fields are missing", () => {
		const result = validateAddress({ ...validUS, line1: "", city: "" });
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.field === "line1")).toBe(true);
		expect(result.errors.some((e) => e.field === "city")).toBe(true);
	});

	it("fails with unknown country", () => {
		const result = validateAddress({ ...validUS, country: "ZZ" });
		expect(result.valid).toBe(false);
		expect(result.errors[0]?.field).toBe("country");
	});
});

describe("normalizeConsumptionTax", () => {
	it("uppercases and trims", () => {
		expect(normalizeConsumptionTax("  de123  ")).toBe("DE123");
	});

	it("removes spaces", () => {
		expect(normalizeConsumptionTax("DE 123 456 789")).toBe("DE123456789");
	});
});
