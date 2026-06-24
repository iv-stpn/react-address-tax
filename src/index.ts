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
	AddressFieldKey,
	CountryAddressConfig,
	SupportedCountryCode as CountryCode,
} from "./utils/address.js";
export {
	COUNTRIES_ADDRESSES as COUNTRIES,
	COUNTRY_LIST,
	getConsumptionTaxLabel,
	getCountryConfig,
	SUPPORTED_COUNTRY_CODES as COUNTRY_CODES,
} from "./utils/address.js";
export type { ValidationError, ValidationResult } from "./utils/validation.js";
export {
	normalizeConsumptionTax,
	validateAddress,
	validateConsumptionTax,
	validatePostalCode,
} from "./utils/validation.js";
