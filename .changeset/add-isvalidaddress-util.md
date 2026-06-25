---
"react-address-tax": patch
---

Add isValidAddress and computeEffectiveFields utilities

Export two new validation utilities from react-address-tax/utils:

- `isValidAddress(value, mode, options?)` - Validates whether an address is valid for a given collection mode. Only the fields actually collected for that mode/country gate validity, so minimal mode can be valid with just a country (or country + region for regional countries like US/CA).

- `computeEffectiveFields(mode, country, requireLevel1?)` - Returns the address fields that are actually collected and validated for a given mode and country. Useful for building custom forms or understanding validation requirements.

These functions share the same logic used internally by AddressInput and AddressTaxInput components.
