export { AddressInput } from "./components/AddressInput/index.js";
export { AddressTaxInput } from "./components/AddressTaxInput/index.js";
export type {
	AddressCollectionMode,
	AddressInputClassNames,
	AddressInputProps,
	AddressTaxInputProps,
	AddressValue,
	ConsumptionTaxValue,
	RenderCheckboxProps,
	RenderContainerProps,
	RenderInputProps,
	RenderSelectProps,
	TaxType,
} from "./types.js";
export type {
	AddressFieldConfig,
	AddressFieldKey,
	CountryConfig,
} from "./utils/countries.js";
export {
	COUNTRIES,
	COUNTRY_LIST,
	getConsumptionTaxLabel,
	getCountryConfig,
} from "./utils/countries.js";
export type { ValidationError, ValidationResult } from "./utils/validation.js";
export {
	normalizeConsumptionTax,
	validateAddress,
	validateConsumptionTax,
	validatePostalCode,
} from "./utils/validation.js";
