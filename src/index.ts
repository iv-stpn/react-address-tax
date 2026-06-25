export {
  AddressInput,
  type AddressInputHandle,
  type AddressInputProps,
} from "./components/AddressInput/index";
export {
  AddressTaxInput,
  type AddressTaxInputProps,
} from "./components/AddressTaxInput/index";
export type {
  AddressCollectionMode,
  AddressFieldKey,
  AddressInputClassNames,
  AddressValue,
  CountryAddressConfig,
  CountryCode,
  ValidationMode,
} from "./utils/address";
export {
  COUNTRIES_ADDRESSES as COUNTRIES,
  COUNTRY_CODES,
  COUNTRY_LIST,
  getConsumptionTaxLabel,
  getCountryConfig,
} from "./utils/address";
export type { ConsumptionTaxValue, TaxType } from "./utils/tax";
export type { ValidationError, ValidationResult } from "./utils/validation";
export {
  normalizeConsumptionTax,
  validateAddress,
  validateConsumptionTax,
  validatePostalCode,
} from "./utils/validation";
