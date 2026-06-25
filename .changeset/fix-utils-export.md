---
"react-address-tax": patch
---

Add the `react-address-tax/utils` subpath export

Register `./utils` as a proper package entry point (ESM, CJS, and type declarations) so `import { isValidAddress } from "react-address-tax/utils"` resolves instead of failing with `Cannot find module 'react-address-tax/utils'` (ts2307). The entry exposes the library's component-free utility surface: address config/types, tax computation, and validation helpers.
