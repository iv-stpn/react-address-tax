---
"react-address-tax": minor
---

`validateAddress` now accepts a partial/nullable address: every field is optional and nullable except `country`, which is strictly required.

**Breaking Changes:**
- `validateAddress` first parameter is now `AddressValueInput` instead of `AddressValue`. Callers no longer need to default missing fields to empty strings before validating — a partial object (e.g. straight from a form) is accepted directly. `country` remains strictly required.

**New Features:**
- Added exported `AddressValueInput` type: an `AddressValue` where every field is optional and nullable except `country`.

**Migration Guide:**

Before:
```ts
validateAddress({ line1: "", city: "", postalCode: "", country: "JP" }, "minimal");
```

After:
```ts
validateAddress({ country: "JP" }, "minimal");
// null/undefined fields are treated as missing
validateAddress({ country: "US", line1: null, city: null, postalCode: null });
```
