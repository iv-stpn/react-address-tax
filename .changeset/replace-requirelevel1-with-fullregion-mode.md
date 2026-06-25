---
"react-address-tax": minor
---

Replace `requireLevel1` prop with new `fullRegion` mode

**Breaking Changes:**
- Removed `requireLevel1` prop from `AddressInput` component
- Updated `validateAddress` function signature - second parameter now accepts `AddressCollectionMode` instead of options object
- Updated `computeEffectiveFields` function signature - removed `requireLevel1` parameter
- Updated `isValidAddress` function signature - removed options parameter
- Updated `resolveAddressField` function signature - replaced `requireLevel1` with `mode` parameter
- Updated `isAddressFieldRequired` function signature - replaced `requireLevel1` with `mode` parameter

**New Features:**
- Added new `"fullRegion"` mode to `AddressCollectionMode` type - collects full address with level1 always required
- `AddressTaxInput` now automatically uses `"fullRegion"` mode for countries with regional tax instead of passing `requireLevel1` prop

**Migration Guide:**

Before:
```tsx
<AddressInput value={value} onChange={onChange} requireLevel1 />
<AddressInput value={value} onChange={onChange} mode="full" requireLevel1 />
```

After:
```tsx
<AddressInput value={value} onChange={onChange} mode="fullRegion" />
<AddressInput value={value} onChange={onChange} mode="fullRegion" />
```

For validation functions:
```tsx
// Before
validateAddress(value, { requireLevel1: true })
computeEffectiveFields(mode, country, true)

// After
validateAddress(value, "fullRegion")
computeEffectiveFields("fullRegion", country)
```

**Other Changes:**
- Added `husky` dev dependency for git hooks
- Added `prepare` script to initialize husky
- Updated all tests to reflect the new API
