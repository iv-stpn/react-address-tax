// Public, component-free utility surface, importable from "react-address-tax/utils".
// Address config/types, tax computation, and validation helpers — everything in
// the library that doesn't pull in React.

export type {
  AddressCollectionMode,
  AddressFieldKey,
  AddressInputClassNames,
  AddressValue,
  CountryAddressConfig,
  CountryCode,
  ResolvedAddressField,
  ValidationMode,
} from "./utils/address";
export {
  ALL_COUNTRY_OPTIONS,
  addressFieldLabel,
  COUNTRIES_ADDRESSES,
  COUNTRIES_ADDRESSES as COUNTRIES,
  COUNTRY_CODES,
  COUNTRY_LIST,
  getConsumptionTaxLabel,
  getCountryConfig,
  isAddressFieldRequired,
  isEUCountry,
  resolveAddressField,
} from "./utils/address";
export type {
  ConsumptionTaxOutcome,
  ConsumptionTaxValue,
  CountryTaxEntry,
  TaxConfig,
  TaxOutcomeFlags,
  TaxSystem,
  TaxType,
} from "./utils/tax";
export {
  computeConsumptionTaxOutcome,
  getConsumptionTaxConfig,
  hasRegionalTax,
} from "./utils/tax";
export type { ValidationError, ValidationResult } from "./utils/validation";
export {
  computeEffectiveFields,
  isValidAddress,
  normalizeConsumptionTax,
  validateAddress,
  validateConsumptionTax,
  validatePostalCode,
} from "./utils/validation";
