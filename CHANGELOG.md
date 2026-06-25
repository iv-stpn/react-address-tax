# react-address-tax

## 0.3.0

### Minor Changes

- [`e7fbf16`](https://github.com/iv-stpn/react-address-tax/commit/e7fbf1610ccae7e84b09581f59fda2c4cc0fbdd0) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Expose `COUNTRY_CODES` (and the `CountryCode` type) at the `react-address-tax/codes` subpath so consumers can import the country code reference without pulling in the full component bundle.

- [`acf7228`](https://github.com/iv-stpn/react-address-tax/commit/acf72289aedaa0188c51e88d4b4670d5e5d06722) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Add a `validationMode` prop (`"onType"` | `"onBlur"` | `"onSubmit"`) to `AddressInput` and `AddressTaxInput` controlling when field errors are surfaced. In `"onSubmit"` mode, call the component's ref `validate()` handle (exposed via the new `AddressInputHandle` type) to reveal errors.

  Validation now only gates on the fields actually collected for the active mode, so `minimal`/`regionMinimal` modes report valid as soon as the required field (country, or country + region) is provided.

## 0.2.0

### Minor Changes

- [`89f300d`](https://github.com/iv-stpn/react-address-tax/commit/89f300d4a1e29a0e674cd0295284a09989fea58a) Thanks [@iv-stpn](https://github.com/iv-stpn)! - Add `inline` mode to `AddressInput` and a `renderFields` transform for customizing field rendering.
