---
"react-address-tax": minor
---

Add a `validationMode` prop (`"onType"` | `"onBlur"` | `"onSubmit"`) to `AddressInput` and `AddressTaxInput` controlling when field errors are surfaced. In `"onSubmit"` mode, call the component's ref `validate()` handle (exposed via the new `AddressInputHandle` type) to reveal errors.

Validation now only gates on the fields actually collected for the active mode, so `minimal`/`regionMinimal` modes report valid as soon as the required field (country, or country + region) is provided.
