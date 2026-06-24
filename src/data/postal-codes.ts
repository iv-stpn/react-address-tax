// Per-country overrides for the postal-code and city fields.
//
// The postal-code *pattern* itself is NOT stored here — it is pulled straight
// from the generated `COUNTRY_DATA` (data/countries.ts) so it always matches
// GeoNames. This file only holds the cosmetic metadata that GeoNames does not
// carry: the postal-code label (only when it differs from the default "Postal
// code"), the postal-code placeholder, and the city label (only when it differs
// from the default "City").

export interface PostalCodeOverrides {
	/** Postal-code field label; stored only when it differs from "Postal code". */
	label?: string;
	/** Postal-code field placeholder/example. */
	placeholder?: string;
	/** City field label; stored only when it differs from "City". */
	cityLabel?: string;
}

export const POSTAL_CODE_OVERRIDES: Partial<
	Record<string, PostalCodeOverrides>
> = {
	AT: { placeholder: "1010" },
	BE: { placeholder: "1000", cityLabel: "City/Municipality" },
	CH: { label: "Postal code (PLZ)", placeholder: "8001" },
	DE: { label: "Postal code (PLZ)", placeholder: "10115" },
	ES: { placeholder: "28001" },
	FR: { placeholder: "75001" },
	GB: { label: "Postcode", placeholder: "SW1A 1AA", cityLabel: "Town/City" },
	IT: { label: "Postal code (CAP)", placeholder: "00100" },
	NL: { placeholder: "1234 AB" },
	PL: { placeholder: "00-001" },
	US: { label: "ZIP code", placeholder: "10001" },
	CA: { placeholder: "K1A 0B1" },
	AU: { label: "Postcode", placeholder: "2000" },
	JP: { placeholder: "100-0001", cityLabel: "City/Ward/Town" },
};
