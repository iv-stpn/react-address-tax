---
"react-address-tax": patch
---

EU member states are now always counted as having a consumption-tax obligation, even when `nexusList` is empty or omits them.

Previously, `isInNexus` was derived solely from `nexusList` (`!nexusList || nexusList.includes(country)`), so an empty list — or a list that didn't include an EU country — caused EU countries to be treated as out-of-nexus: tax identifier fields were hidden and `effectiveTax` fell back to 0. EU countries (OSS / one-stop-shop) always carry a collection obligation, so they are now treated as in-nexus regardless of the supplied list. Non-EU countries continue to follow `nexusList` as before.

**New Features:**
- Added exported `isEUCountry(country)` helper in `utils/tax`, returning `true` for countries whose tax system is OSS.
