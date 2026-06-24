# react-address-tax

**[Live demo (Ladle storybook) →](https://iv-stpn.github.io/react-address-tax/)**

> [!WARNING]
> **Work in progress — not production ready.** This project is under active
> development. The data (tax rates, address formats, VAT number patterns,
> administrative labels) is largely machine-generated and **not yet manually
> verified**. Do not rely on it for billing, tax compliance, or any
> production use. APIs, data shapes, and exports may change without notice.

A reusable React component for international structured address input with
consumption-tax (VAT/GST/sales tax) computation and business tax-ID validation.

## Install

```bash
bun install
```

## Develop

```bash
bun run ladle        # component playground / stories
bun run test         # run the test suite (vitest)
bun run typecheck    # type-check without emitting
bun run lint         # biome check
bun run build        # bundle with tsup
```

## Data generation

The reference data under `data/*.json` and the derived TypeScript in
`src/data/*` are generated from GeoNames, Wikidata, and curated tax tables.
Do not hand-edit the generated files — regenerate them instead:

```bash
bun run gen:geonames   # data/*.json from GeoNames + Wikidata
bun run gen:level1     # src/data/level1-administrative-codes.ts
bun run gen:countries  # src/data/countries.ts (COUNTRY_DATA, codes)
```

## Country coverage

The table below summarizes per-country support. It is generated from the
project data and is a starting point for manual verification.

Legend:
- ✅ supported / known
- ❌ not supported / not present
- ❓ unknown or unsure despite checking

Columns:
- **Last verified** — date a human last verified this row (`—` until reviewed).
- **Address format** — structured address layout supported.
- **Consumption tax** — standard consumption-tax rate (VAT/GST/sales tax).
- **Nexus minimum** — registration threshold above which a seller with nexus
  must collect the tax, in local currency. `Always` = no threshold (collect from
  the first sale); `Seller never collects` = the buyer always self-accounts.
- **VAT number** — business tax-ID validation: the local tax name and an
  example number, or ❌ when no format is curated.
- **Postal code** — postal-code pattern, with a generated example when supported.
- **Level 1 labels** — first-level administrative division label. ✅ only when
  both the English and local-language label are present; ❓ if either is missing.
- **Level 2 labels** — second-level administrative division label, same rule as
  Level 1.

Regional-tax countries (US, CA) list each state/province as a separate
`CC-REGION` row (e.g. `US-VA`) with its own rate; `↳` means the value is
inherited from the country row above. Regenerate the table with `bun run
gen:coverage`.

<!-- COVERAGE_TABLE_START -->

> ❗ next to a code means its data changed since it was last verified — the country/region should be reverified.

| Code | Country | Last verified | Address format | Consumption tax | Nexus minimum | VAT number | Postal code | Level 1 labels | Level 2 labels |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD | Andorra | — | ✅ | 4.5% ✅ | EUR 40,000 | ❌ | ✅ (AD500) | ✅ Parish / Parròquia | ✅ Settlement / Ciutat |
| AE | United Arab Emirates | — | ✅ | 5% ✅ | AED 375,000 | ❌ | ✅ (00000-00000) | ✅ Emirate / إمارة | ❌ |
| AF | Afghanistan | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ✅ Province / ولایت | ✅ District / ولسوالی |
| AG | Antigua and Barbuda | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Parish / Parish | ❌ |
| AI | Anguilla | — | ✅ | 13% ✅ | Always | ❌ | ✅ (AI-2640) | ❌ | ❌ |
| AL | Albania | — | ✅ | 20% ✅ | ALL 10,000,000 | ❌ | ✅ (1001) | ✅ County / Qarku | ✅ District / Rrethet |
| AM | Armenia | — | ✅ | 20% ✅ | Always | ❌ | ✅ (0010) | ✅ Province / Մարզ | ✅ Village / Գյուղ |
| AO | Angola | — | ✅ | 14% ✅ | Always | ❌ | ❌ | ✅ Province / Província | ✅ Municipality / Município |
| AQ | Antarctica | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ❌ | ❌ |
| AR | Argentina | — | ✅ | 21% ✅ | Always | ❌ | ✅ (C1000) | ✅ Province / Provincia | ✅ Department / Departamento |
| AS | American Samoa | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (96799) | ✅ District / District | ✅ County / County |
| AT | Austria | — | ✅ | 20% ✅ | Always | ✅ MwSt (ATU12345678) | ✅ (1010) | ✅ Federal state / Bundesland | ✅ District / Bezirk |
| AU | Australia | — | ✅ | 10% ✅ | AUD 75,000 | ✅ GST (12345678901) | ✅ (2600) | ✅ External territory / External territory | ✅ Local government area / Local government area |
| AW | Aruba | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ❌ | ❌ |
| AX | Aland Islands | — | ✅ | 25.5% ✅ | Always | ❌ | ✅ (22100) | ❌ | ❌ |
| AZ | Azerbaijan | — | ✅ | 18% ✅ | Always | ❌ | ✅ (AZ1000) | ✅ District / Rayonu | ❌ |
| BA | Bosnia and Herzegovina | — | ✅ | 17% ✅ | BAM 50,000 | ❌ | ✅ (71000) | ✅ Political division / Administrativna podjela | ✅ Region / Regije Republike Srpske |
| BB | Barbados | — | ✅ | 17.5% ✅ | Always | ❌ | ✅ (BB11000) | ✅ Parish / Parish | ❌ |
| BD | Bangladesh | — | ✅ | 15% ✅ | Always | ❌ | ✅ (1000) | ✅ Division / বিভাগ | ✅ District / জেলা |
| BE | Belgium | — | ✅ | 21% ✅ | Always | ✅ BTW/TVA (BE0123456789) | ✅ (1000) | ✅ Region / Gewest | ✅ Province / Provincie |
| BF | Burkina Faso | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ Region / Région | ✅ Province / Province |
| BG | Bulgaria | — | ✅ | 20% ✅ | Always | ❌ | ✅ (1000) | ✅ Oblast / Oбласт | ✅ Municipality / Община |
| BH | Bahrain | — | ✅ | 10% ✅ | Always | ❌ | ✅ (317) | ✅ Governorate / محافظة | ❌ |
| BI | Burundi | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ Province / Province | ✅ Commune / Commune |
| BJ | Benin | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ Department / Département | ✅ Commune / Commune |
| BL | Saint Barthelemy | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (97133) | ❌ | ❌ |
| BM | Bermuda | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (HM12) | ✅ Parish / Parish | ❌ |
| BN | Brunei | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (BS8711) | ✅ District / Daerah | ✅ Mukim / Mukim Negara |
| BO | Bolivia | — | ✅ | 13% ✅ | Always | ❌ | ❌ | ✅ Department / Departamento | ✅ Province / Provincia |
| BQ | Bonaire, Saint Eustatius and Saba  | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ❌ | ❌ |
| BR | Brazil | — | ✅ | 17% ✅ | Always | ❌ | ✅ (70040-010) | ✅ Federative unit / Unidade federativa | ✅ Municipality / Município |
| BS | Bahamas | — | ✅ | 10% ✅ | Always | ❌ | ❌ | ✅ District / District | ❌ |
| BT | Bhutan | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ✅ District / རྫོང་ཁག | ❓ Gewog (en only) |
| BV | Bouvet Island | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ❌ | ❌ |
| BW | Botswana | — | ✅ | 14% ✅ | Always | ❌ | ❌ | ✅ District / District | ❌ |
| BY | Belarus | — | ✅ | 20% ✅ | Always | ❌ | ✅ (220000) | ✅ Region / Вобласць | ✅ District / Раён |
| BZ | Belize | — | ✅ | 12.5% ✅ | Always | ❌ | ❌ | ✅ District / District | ❌ |
| CA | Canada | — | ✅ | 5–15% (regional) ✅ | CAD 30,000 | ✅ GST/HST (123456789RT0001) | ✅ (K1A 0B1) | ✅ Province / Province | ✅ Regional district / Regional district |
| CA-AB | Canada — Alberta | — | ↳ | 5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-BC | Canada — British Columbia | — | ↳ | 12% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-MB | Canada — Manitoba | — | ↳ | 12% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-NB | Canada — New Brunswick | — | ↳ | 15% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-NL | Canada — Newfoundland and Labrador | — | ↳ | 15% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-NS | Canada — Nova Scotia | — | ↳ | 15% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-NT | Canada — Northwest Territories | — | ↳ | 5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-NU | Canada — Nunavut | — | ↳ | 5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-ON | Canada — Ontario | — | ↳ | 13% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-PE | Canada — Prince Edward Island | — | ↳ | 15% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-QC | Canada — Quebec | — | ↳ | 14.975% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-SK | Canada — Saskatchewan | — | ↳ | 11% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CA-YT | Canada — Yukon | — | ↳ | 5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| CC | Cocos Islands | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (6799) | ❌ | ❌ |
| CD | Democratic Republic of the Congo | — | ✅ | 16% ✅ | Always | ❌ | ❌ | ✅ Province / Provinces | ✅ Commune / Commune |
| CF | Central African Republic | — | ✅ | 19% ✅ | Always | ❌ | ❌ | ✅ Prefecture / Préfecture | ❌ |
| CG | Republic of the Congo | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ Department / Département | ❌ |
| CH | Switzerland | — | ✅ | 8.1% ✅ | CHF 100,000 | ✅ MWST/TVA/IVA (CHE-123.456.789MWST) | ✅ (3000) | ✅ Canton / Kanton | ✅ Municipality / Gemeinde |
| CI | Ivory Coast | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ Region / Région | ❌ |
| CK | Cook Islands | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ❌ | ❌ |
| CL | Chile | — | ✅ | 19% ✅ | Always | ❌ | ✅ (8320000) | ✅ Region / Región | ✅ Province / Provincia |
| CM | Cameroon | — | ✅ | 19.25% ✅ | Always | ❌ | ❌ | ✅ Electoral unit / Electoral unit | ✅ Department / Department |
| CN | China | — | ✅ | 13% ✅ | Always | ❌ | ✅ (100000) | ✅ Province / 省 | ✅ Prefecture-level city / 地级市 |
| CO | Colombia | — | ✅ | 19% ✅ | Always | ❌ | ✅ (110111) | ✅ Department / Departamento | ✅ Municipality / Municipio |
| CR | Costa Rica | — | ✅ | 13% ✅ | Always | ❌ | ✅ (10101) | ✅ Electoral unit / Circunscripción electoral | ✅ Canton / Cantón |
| CU | Cuba | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (10400) | ✅ Province / Provincia | ✅ Municipality / Municipio |
| CV | Cabo Verde | — | ✅ | 15% ✅ | Always | ❌ | ✅ (7600) | ✅ Concelho / Municipio | ✅ Freguesia / Freguesia |
| CW | Curacao | — | ✅ | 6% ✅ | Always | ❌ | ❌ | ❌ | ❌ |
| CX | Christmas Island | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (6798) | ❌ | ❌ |
| CY | Cyprus | — | ✅ | 19% ✅ | Always | ❌ | ✅ (1010) | ✅ District / Επαρχία | ✅ Community / Κοινότητα |
| CZ | Czechia | — | ✅ | 21% ✅ | Always | ❌ | ✅ (110 00) | ✅ Region / Kraj | ✅ Municipal part / Část obce |
| DE | Germany | — | ✅ | 19% ✅ | Always | ✅ MwSt (DE123456789) | ✅ (10115) | ✅ Federated state / Bundesland | ✅ Urban municipality / Stadt |
| DJ | Djibouti | — | ✅ | 10% ✅ | Always | ❌ | ❌ | ✅ Region / Région | ✅ Sub-prefecture / Sous-préfecture |
| DK | Denmark | — | ✅ | 25% ✅ | Always | ❌ | ✅ (1050) | ✅ County / Dansk amt | ✅ Municipality / Kommune |
| DM | Dominica | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Parish / Parish | ❌ |
| DO | Dominican Republic | — | ✅ | 18% ✅ | Always | ❌ | ✅ (10101) | ✅ Province / Provincia | ❌ |
| DZ | Algeria | — | ✅ | 19% ✅ | Always | ❌ | ✅ (16000) | ✅ Province / ولاية | ✅ District / دائرة |
| EC | Ecuador | — | ✅ | 15% ✅ | Always | ❌ | ✅ (170150) | ✅ Province / Provincia | ✅ Canton / Cantón |
| EE | Estonia | — | ✅ | 22% ✅ | Always | ❌ | ✅ (10111) | ✅ County / Maakond | ❌ |
| EG | Egypt | — | ✅ | 14% ✅ | Always | ❌ | ✅ (11511) | ✅ Governorate / محافظة | ✅ Marka / مركز |
| EH | Western Sahara | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ❌ | ❌ |
| ER | Eritrea | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ❓ Region (en only) | ❌ |
| ES | Spain | — | ✅ | 21% ✅ | Always | ✅ IVA (ESA12345678) | ✅ (28001) | ✅ Autonomous community / Comunidad autónoma | ✅ Province / Provincia |
| ET | Ethiopia | — | ✅ | 15% ✅ | Always | ❌ | ✅ (1000) | ❓ Region (en only) | ❓ District (en only) |
| FI | Finland | — | ✅ | 25.5% ✅ | Always | ❌ | ✅ (00100) | ✅ Region / Maakunta | ✅ Municipality / Kunta |
| FJ | Fiji | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Division / Division | ❌ |
| FK | Falkland Islands | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (FIQQ 1ZZ) | ❌ | ❌ |
| FM | Micronesia | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (96941) | ✅ State / State | ❌ |
| FO | Faroe Islands | — | ✅ | 25% ✅ | Always | ❌ | ✅ (100) | ❌ | ❌ |
| FR | France | — | ✅ | 20% ✅ | Always | ✅ TVA (FRXX123456789) | ✅ (75001) | ✅ Region / Région | ✅ Department / Département |
| GA | Gabon | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ Province / Province | ❌ |
| GB | United Kingdom | — | ✅ | 20% ✅ | Seller never collects | ✅ VAT (GB123456789) | ✅ (SW1A 1AA) | ✅ Constituent country / Constituent country | ✅ Council area / Council area |
| GD | Grenada | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Parish / Parish | ❌ |
| GE | Georgia | — | ✅ | 18% ✅ | GEL 100,000 | ❌ | ✅ (0100) | ✅ Mkhare / Მხარე | ✅ Municipality / Მუნიციპალიტეტი |
| GF | French Guiana | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (97300) | ✅ Arrondissement / Arrondissement | ✅ Canton / Canton |
| GG | Guernsey | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (GY1 1AA) | ✅ Island / Island | ✅ Parish / Parish |
| GH | Ghana | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Region / Region | ✅ District / District |
| GI | Gibraltar | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (GX11 1AA) | ❌ | ❌ |
| GL | Greenland | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (3900) | ❓ Municipality (en only) | ❌ |
| GM | Gambia | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Region / Region | ❌ |
| GN | Guinea | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ Region / Région | ✅ Prefecture / Préfecture |
| GP | Guadeloupe | — | ✅ | 8.5% ✅ | Always | ❌ | ✅ (97100) | ✅ Commune / Commune | ✅ Canton / Canton |
| GQ | Equatorial Guinea | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Province / Provincia | ❌ |
| GR | Greece | — | ✅ | 24% ✅ | Always | ❌ | ✅ (10431) | ✅ Monastic community / Μοναστική κοινότητα | ✅ Regional unit / Περιφερειακή ενότητα |
| GS | South Georgia and the South Sandwich Islands | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (SIQQ 1ZZ) | ❌ | ❌ |
| GT | Guatemala | — | ✅ | 12% ✅ | Always | ❌ | ✅ (01001) | ✅ Department / Departamento | ✅ Municipality / Municipio |
| GU | Guam | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (96910) | ✅ Village / Village | ✅ Village / Village |
| GW | Guinea-Bissau | — | ✅ | 17% ✅ | Always | ❌ | ✅ (1000) | ✅ Region / Região | ❌ |
| GY | Guyana | — | ✅ | 14% ✅ | Always | ❌ | ❌ | ✅ Region / Region | ❌ |
| HK | Hong Kong | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (999077) | ✅ District / 香港政區 | ❌ |
| HM | Heard Island and McDonald Islands | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (7151) | ❌ | ❌ |
| HN | Honduras | — | ✅ | 15% ✅ | Always | ❌ | ✅ (11101) | ✅ Department / Departamento | ✅ Municipality / Municipio |
| HR | Croatia | — | ✅ | 25% ✅ | Always | ❌ | ✅ (10000) | ✅ County / Županija | ✅ Municipality / Općina |
| HT | Haiti | — | ✅ | 10% ✅ | Always | ❌ | ✅ (HT6110) | ✅ Department / Depatman | ✅ Arrondissement / Lis awondisman |
| HU | Hungary | — | ✅ | 27% ✅ | Always | ❌ | ✅ (1011) | ✅ County / Vármegye | ✅ District / Járás |
| ID | Indonesia | — | ✅ | 11% ✅ | Always | ❌ | ✅ (10110) | ✅ Province / Provinsi | ✅ Regency / Kabupaten |
| IE | Ireland | — | ✅ | 23% ✅ | Always | ❌ | ✅ (D02 AF30) | ✅ County / County | ✅ Municipal district / Municipal district |
| IL | Israel | — | ✅ | 18% ✅ | Always | ❌ | ✅ (9510001) | ✅ District / מחוז | ✅ Settlement / התנחלות |
| IM | Isle of Man | — | ✅ | 20% ✅ | Always | ❌ | ✅ (IM1 1AA) | ❌ | ❌ |
| IN | India | — | ✅ | 18% ✅ | INR 4,000,000 | ❌ | ✅ (110001) | ✅ State / State | ✅ District / District |
| IO | British Indian Ocean Territory | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (BBND 1ZZ) | ❌ | ❌ |
| IQ | Iraq | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (10001) | ✅ Governorate / محافظة | ✅ District / قضاء |
| IR | Iran | — | ✅ | 10% ✅ | Always | ❌ | ✅ (1418543931) | ✅ Province / استان | ✅ County / شهرستان |
| IS | Iceland | — | ✅ | 24% ✅ | ISK 2,000,000 | ❌ | ✅ (101) | ✅ Constituency / Kjördæmi | ❌ |
| IT | Italy | — | ✅ | 22% ✅ | Always | ✅ IVA (IT12345678901) | ✅ (00100) | ✅ Region / Regione | ✅ Province / Provincia |
| JE | Jersey | — | ✅ | 5% ✅ | Always | ❌ | ✅ (JE1 1AA) | ✅ Parish / Parish | ❌ |
| JM | Jamaica | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ County / County | ✅ Parish / Parish |
| JO | Jordan | — | ✅ | 16% ✅ | Always | ❌ | ✅ (11118) | ✅ Governorate / محافظة | ❌ |
| JP | Japan | — | ✅ | 10% ✅ | JPY 10,000,000 | ✅ Consumption Tax (T1234567890123) | ✅ (100-0001) | ✅ Prefecture / 都道府県 | ✅ City / 日本の市 |
| KE | Kenya | — | ✅ | 16% ✅ | Always | ❌ | ✅ (00100) | ✅ Province / Province | ❌ |
| KG | Kyrgyzstan | — | ✅ | 12% ✅ | Always | ❌ | ✅ (720000) | ❌ | ❌ |
| KH | Cambodia | — | ✅ | 10% ✅ | Always | ❌ | ✅ (12000) | ✅ Province / ខេត្តនៃកម្ពុជា | ❓ District (en only) |
| KI | Kiribati | — | ✅ | 12.5% ✅ | Always | ❌ | ❌ | ❌ | ❌ |
| KM | Comoros | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ✅ Volcanic island / جزيرة | ❌ |
| KN | Saint Kitts and Nevis | — | ✅ | 17% ✅ | Always | ❌ | ❌ | ✅ Parish / Parish | ❌ |
| KP | North Korea | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (950003) | ✅ Province / 도 | ✅ County / 군 |
| KR | South Korea | — | ✅ | 10% ✅ | Always | ❌ | ✅ (04524) | ✅ Metropolitan city / 광역시 | ✅ County / 군 |
| KW | Kuwait | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (13001) | ✅ Governorate / محافظة | ❌ |
| KY | Cayman Islands | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ❌ | ❌ |
| KZ | Kazakhstan | — | ✅ | 12% ✅ | Always | ❌ | ✅ (010000) | ✅ Region / Облыс | ❌ |
| LA | Laos | — | ✅ | 10% ✅ | Always | ❌ | ✅ (01000) | ✅ Province / ແຂວງຂອງປະເທດລາວ | ✅ District / ເມືອງ |
| LB | Lebanon | — | ✅ | 11% ✅ | Always | ❌ | ✅ (11072020) | ✅ Governorate / محافظة | ❌ |
| LC | Saint Lucia | — | ✅ | 12.5% ✅ | Always | ❌ | ❌ | ✅ Quarter / Quarter | ❌ |
| LI | Liechtenstein | — | ✅ | 8.1% ✅ | CHF 100,000 | ❌ | ✅ (9490) | ✅ Municipality / Gemeinde | ❌ |
| LK | Sri Lanka | — | ✅ | 18% ✅ | Always | ❌ | ✅ (00100) | ✅ Province / පළාත | ✅ District / පරිපාලන දිස්ත්රික්කය |
| LR | Liberia | — | ✅ | 10% ✅ | Always | ❌ | ✅ (1000) | ✅ County / County | ❌ |
| LS | Lesotho | — | ✅ | 15% ✅ | Always | ❌ | ✅ (100) | ✅ District / District | ❌ |
| LT | Lithuania | — | ✅ | 21% ✅ | Always | ❌ | ✅ (01001) | ✅ District municipality / Rajono savivaldybė | ✅ Eldership / Seniūnija |
| LU | Luxembourg | — | ✅ | 17% ✅ | Always | ❌ | ✅ (1009) | ✅ Canton / Kanton | ✅ Municipality / Gemeng |
| LV | Latvia | — | ✅ | 21% ✅ | Always | ❌ | ✅ (1010) | ✅ Municipality / Novads | ✅ Parish / Pagasts |
| LY | Libya | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ✅ District / شعبية | ❌ |
| MA | Morocco | — | ✅ | 20% ✅ | Always | ❌ | ✅ (10000) | ✅ Region / جهة | ✅ Province / إقليم |
| MC | Monaco | — | ✅ | 20% ✅ | Always | ❌ | ✅ (98000) | ✅ Commune / Commune | ❌ |
| MD | Moldova | — | ✅ | 20% ✅ | MDL 1,200,000 | ❌ | ✅ (MD-2001) | ✅ District / Raion | ✅ Village / Sat |
| ME | Montenegro | — | ✅ | 21% ✅ | EUR 30,000 | ❌ | ✅ (81000) | ✅ Municipality / Општина | ❌ |
| MF | Saint Martin | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (97150) | ❌ | ❌ |
| MG | Madagascar | — | ✅ | 20% ✅ | Always | ❌ | ✅ (101) | ✅ Province / Province | ✅ District / District |
| MH | Marshall Islands | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (96960-0001) | ❓ Reef island (en only) | ❌ |
| MK | North Macedonia | — | ✅ | 18% ✅ | MKD 2,000,000 | ❌ | ✅ (1000) | ✅ Municipality / Општина | ✅ Municipality / Општина |
| ML | Mali | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ Region / Régions | ✅ Human settlement / Établissement humain |
| MM | Myanmar | — | ✅ | 5% ✅ | Always | ❌ | ✅ (11181) | ✅ Region / တိုင်းဒေသကြီး | ❌ |
| MN | Mongolia | — | ✅ | 10% ✅ | Always | ❌ | ✅ (15160) | ✅ Province / Аймаг | ✅ District / Сум |
| MO | Macao | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (999078) | ❌ | ❌ |
| MP | Northern Mariana Islands | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (96950) | ❓ Municipality (en only) | ❌ |
| MQ | Martinique | — | ✅ | 8.5% ✅ | Always | ❌ | ✅ (97200) | ✅ Commune / Commune | ✅ Canton / Canton |
| MR | Mauritania | — | ✅ | 16% ✅ | Always | ❌ | ❌ | ✅ Region / ولاية | ✅ Department / مقاطعة |
| MS | Montserrat | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ❌ | ❌ |
| MT | Malta | — | ✅ | 18% ✅ | Always | ❌ | ✅ (VLT 1117) | ✅ Region / Reġjuni ta | ✅ Town / Raħal |
| MU | Mauritius | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ District / District | ❌ |
| MV | Maldives | — | ✅ | 8% ✅ | Always | ❌ | ✅ (20026) | ✅ Atoll / އަތޮޅުތައް | ❌ |
| MW | Malawi | — | ✅ | 16.5% ✅ | Always | ❌ | ✅ (207401) | ❓ Region (en only) | ✅ District / Madera |
| MX | Mexico | — | ✅ | 16% ✅ | Always | ❌ | ✅ (06000) | ✅ State / Estado | ✅ Municipality / Municipio |
| MY | Malaysia | — | ✅ | 8% ✅ | Always | ❌ | ✅ (50000) | ✅ State / Negeri | ✅ Division / Bahagian |
| MZ | Mozambique | — | ✅ | 16% ✅ | Always | ❌ | ✅ (1100) | ✅ Province / Província | ✅ District / Distritos |
| NA | Namibia | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Region / Region | ✅ Constituency / Constituency |
| NC | New Caledonia | — | ✅ | 11% ✅ | Always | ❌ | ✅ (98800) | ✅ Commune / Commune | ❌ |
| NE | Niger | — | ✅ | 19% ✅ | Always | ❌ | ✅ (8000) | ✅ Region / Région | ✅ Department / Département |
| NF | Norfolk Island | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (2899) | ❌ | ❌ |
| NG | Nigeria | — | ✅ | 7.5% ✅ | Always | ❌ | ✅ (900001) | ✅ State / State | ✅ Local government area / Local government area |
| NI | Nicaragua | — | ✅ | 15% ✅ | Always | ❌ | ✅ (11001) | ✅ Department / Departamento | ✅ Municipality / Municipio |
| NL | The Netherlands | — | ✅ | 21% ✅ | Always | ✅ BTW (NL123456789B01) | ✅ (1234 AB) | ✅ Country / Land | ✅ Province / Provincie |
| NO | Norway | — | ✅ | 25% ✅ | NOK 50,000 | ❌ | ✅ (0010) | ❓ County (en only) | ❓ Municipality (en only) |
| NP | Nepal | — | ✅ | 13% ✅ | Always | ❌ | ✅ (44600) | ✅ Province / प्रदेश | ❌ |
| NR | Nauru | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (NRU68) | ❓ District (en only) | ❌ |
| NU | Niue | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (9974) | ❌ | ❌ |
| NZ | New Zealand | — | ✅ | 15% ✅ | NZD 60,000 | ❌ | ✅ (6011) | ✅ Region / Region | ✅ District / District |
| OM | Oman | — | ✅ | 5% ✅ | Always | ❌ | ✅ (100) | ✅ Governorate / محافظة | ❌ |
| PA | Panama | — | ✅ | 7% ✅ | Always | ❌ | ✅ (0801) | ✅ Province / Provincia | ✅ District / Distrito |
| PE | Peru | — | ✅ | 18% ✅ | Always | ❌ | ✅ (15001) | ✅ Department / Departmento | ✅ Province / Provincia |
| PF | French Polynesia | — | ✅ | 16% ✅ | Always | ❌ | ✅ (98714) | ✅ Commune / Commune | ✅ Commune / Commune |
| PG | Papua New Guinea | — | ✅ | 10% ✅ | Always | ❌ | ✅ (111) | ✅ Province / Province | ✅ District / District |
| PH | Philippines | — | ✅ | 12% ✅ | PHP 3,000,000 | ❌ | ✅ (1000) | ✅ Region / Rehiyon | ✅ Province / Lalawigan |
| PK | Pakistan | — | ✅ | 18% ✅ | Always | ❌ | ✅ (44000) | ✅ Province / صوبہ | ✅ Division / ڈویژن |
| PL | Poland | — | ✅ | 23% ✅ | Always | ✅ VAT (PL1234567890) | ✅ (00-001) | ✅ Voivodeship / Województwo | ✅ Powiat / Powiat |
| PM | Saint Pierre and Miquelon | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (97500) | ✅ Commune / Commune | ✅ Island / Île |
| PN | Pitcairn | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (PCRN 1ZZ) | ❌ | ❌ |
| PR | Puerto Rico | — | ✅ | 11.5% ✅ | Always | ❌ | ✅ (00901) | ✅ Municipality / Municipality | ❌ |
| PS | Palestinian Territory | — | ✅ | 16% ✅ | Always | ❌ | ❌ | ✅ Governorate / محافظة | ✅ Governorate / محافظة |
| PT | Portugal | — | ✅ | 23% ✅ | Always | ❌ | ✅ (1000-001) | ✅ District / Distrito | ✅ Municipality / Município |
| PW | Palau | — | ✅ | 10% ✅ | Always | ❌ | ✅ (96940) | ❓ State (en only) | ❌ |
| PY | Paraguay | — | ✅ | 10% ✅ | Always | ❌ | ✅ (1101) | ✅ Department / Departamento | ✅ Municipality / Municipio |
| QA | Qatar | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ✅ Municipality / بلدية | ✅ Village / قرية |
| RE | Reunion | — | ✅ | 8.5% ✅ | Always | ❌ | ✅ (97400) | ✅ Arrondissement / Arrondissement | ✅ Canton / Canton |
| RO | Romania | — | ✅ | 19% ✅ | Always | ❌ | ✅ (010011) | ✅ County / Județ | ✅ Commune / Comună |
| RS | Serbia | — | ✅ | 20% ✅ | RSD 8,000,000 | ❌ | ✅ (11000) | ✅ District / Округ | ✅ Municipality / city / Општина / град |
| RU | Russia | — | ✅ | 20% ✅ | Always | ❌ | ✅ (101000) | ✅ Federal subject / Субъект | ✅ Municipal district / Муниципальный район |
| RW | Rwanda | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ Province / Intara | ✅ District / Uturere tw |
| SA | Saudi Arabia | — | ✅ | 15% ✅ | Always | ❌ | ✅ (11564) | ✅ Province / منطقة | ❌ |
| SB | Solomon Islands | — | ✅ | 10% ✅ | Always | ❌ | ❌ | ✅ Province / Province | ❌ |
| SC | Seychelles | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ District / District | ❌ |
| SD | Sudan | — | ✅ | 17% ✅ | Always | ❌ | ✅ (11111) | ✅ State / ولاية | ❌ |
| SE | Sweden | — | ✅ | 25% ✅ | Always | ❌ | ✅ (100 05) | ✅ County / Län | ✅ Municipality / Kommun |
| SG | Singapore | — | ✅ | 9% ✅ | SGD 1,000,000 | ❌ | ✅ (238801) | ❌ | ❌ |
| SH | Saint Helena | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (STHL1ZZ) | ✅ Island / Island | ❌ |
| SI | Slovenia | — | ✅ | 22% ✅ | Always | ❌ | ✅ (1000) | ✅ Municipality / Občina | ❌ |
| SJ | Svalbard and Jan Mayen | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (9170) | ❌ | ❌ |
| SK | Slovakia | — | ✅ | 23% ✅ | Always | ❌ | ✅ (811 01) | ✅ Region / Kraje | ✅ District / Okres |
| SL | Sierra Leone | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Province / Province | ❌ |
| SM | San Marino | — | ✅ | 17% ✅ | Always | ❌ | ✅ (47890) | ✅ Municipality / Castelli | ❌ |
| SN | Senegal | — | ✅ | 18% ✅ | Always | ❌ | ✅ (10000) | ✅ Region / Région | ✅ Department / Département |
| SO | Somalia | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (JH09010) | ✅ Region / Gobolada | ❓ District (en only) |
| SR | Suriname | — | ✅ | 10% ✅ | Always | ❌ | ❌ | ✅ District / District | ✅ Ressort / Ressort |
| SS | South Sudan | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ State / State | ❌ |
| ST | Sao Tome and Principe | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Electoral unit / Círculo eleitoral | ✅ District / Distritos |
| SV | El Salvador | — | ✅ | 13% ✅ | Always | ❌ | ✅ (1101) | ✅ Department / Departamento | ✅ Municipality / Municipio |
| SX | Sint Maarten | — | ✅ | 5% ✅ | Always | ❌ | ❌ | ❌ | ❌ |
| SY | Syria | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ✅ Governorate / محافظة | ✅ District / منطقة |
| SZ | Eswatini | — | ✅ | 15% ✅ | Always | ❌ | ✅ (H100) | ✅ Region / Region | ❌ |
| TC | Turks and Caicos Islands | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (TKCA 1ZZ) | ❌ | ❌ |
| TD | Chad | — | ✅ | 18% ✅ | Always | ❌ | ✅ (TKCA 1ZZ) | ✅ Province / Région | ✅ Department / Départements |
| TF | French Southern Territories | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ✅ District / District | ✅ Island / Île |
| TG | Togo | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ Region / Région | ✅ Prefecture / Préfecture |
| TH | Thailand | — | ✅ | 7% ✅ | Always | ❌ | ✅ (10200) | ✅ Province / จังหวัด | ✅ Amphoe / อำเภอ |
| TJ | Tajikistan | — | ✅ | 14% ✅ | Always | ❌ | ✅ (734000) | ✅ Region / Вилоят | ✅ District / Ноҳия |
| TK | Tokelau | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ❌ | ❌ |
| TL | Timor Leste | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ✅ Municipality / Munisipiu | ❌ |
| TM | Turkmenistan | — | ✅ | 15% ✅ | Always | ❌ | ✅ (744000) | ✅ Region / Welaýatlary | ✅ District / Etraplar we şäherler |
| TN | Tunisia | — | ✅ | 19% ✅ | Always | ❌ | ✅ (1000) | ✅ Governorate / ولاية | ✅ Delegation / معتمدية |
| TO | Tonga | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ❓ Division (en only) | ❌ |
| TR | Turkey | — | ✅ | 20% ✅ | Always | ❌ | ✅ (06010) | ✅ Province / Il | ✅ District / Ilçe |
| TT | Trinidad and Tobago | — | ✅ | 12.5% ✅ | Always | ❌ | ❌ | ✅ Regional corporation / Regional corporation | ❌ |
| TV | Tuvalu | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ❌ | ❌ |
| TW | Taiwan | — | ✅ | 5% ✅ | TWD 480,000 | ❌ | ✅ (10001) | ✅ City / 城市 | ✅ District / 區 |
| TZ | Tanzania | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ Region / Mikoa | ✅ District / Wilaya za |
| UA | Ukraine | — | ✅ | 20% ✅ | UAH 1,000,000 | ❌ | ✅ (01001) | ✅ Oblast / Область | ✅ Raion / Район |
| UG | Uganda | — | ✅ | 18% ✅ | Always | ❌ | ❌ | ✅ District / District | ❌ |
| UM | United States Minor Outlying Islands | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ✅ Insular area / Insular area | ❌ |
| US | United States | — | ✅ | 2.9–7.25% (regional) ✅ | Seller never collects | ✅ Sales Tax (12-3456789) | ✅ (10001) | ✅ State / State | ✅ County / County |
| US-AL | United States — Alabama | — | ↳ | 4% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-AK | United States — Alaska | — | ↳ | None ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-AZ | United States — Arizona | — | ↳ | 5.6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-AR | United States — Arkansas | — | ↳ | 6.5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-CA | United States — California | — | ↳ | 7.25% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-CO | United States — Colorado | — | ↳ | 2.9% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-CT | United States — Connecticut | — | ↳ | 6.35% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-DC | United States — District of Columbia | — | ↳ | 6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-DE | United States — Delaware | — | ↳ | None ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-FL | United States — Florida | — | ↳ | 6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-GA | United States — Georgia | — | ↳ | 4% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-HI | United States — Hawaii | — | ↳ | 4% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-ID | United States — Idaho | — | ↳ | 6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-IL | United States — Illinois | — | ↳ | 6.25% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-IN | United States — Indiana | — | ↳ | 7% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-IA | United States — Iowa | — | ↳ | 6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-KS | United States — Kansas | — | ↳ | 6.5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-KY | United States — Kentucky | — | ↳ | 6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-LA | United States — Louisiana | — | ↳ | 4.45% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-ME | United States — Maine | — | ↳ | 5.5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-MD | United States — Maryland | — | ↳ | 6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-MA | United States — Massachusetts | — | ↳ | 6.25% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-MI | United States — Michigan | — | ↳ | 6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-MN | United States — Minnesota | — | ↳ | 6.875% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-MS | United States — Mississippi | — | ↳ | 7% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-MO | United States — Missouri | — | ↳ | 4.225% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-MT | United States — Montana | — | ↳ | None ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-NE | United States — Nebraska | — | ↳ | 5.5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-NV | United States — Nevada | — | ↳ | 6.85% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-NH | United States — New Hampshire | — | ↳ | None ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-NJ | United States — New Jersey | — | ↳ | 6.625% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-NM | United States — New Mexico | — | ↳ | 5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-NY | United States — New York | — | ↳ | 4% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-NC | United States — North Carolina | — | ↳ | 4.75% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-ND | United States — North Dakota | — | ↳ | 5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-OH | United States — Ohio | — | ↳ | 5.75% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-OK | United States — Oklahoma | — | ↳ | 4.5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-OR | United States — Oregon | — | ↳ | None ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-PA | United States — Pennsylvania | — | ↳ | 6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-RI | United States — Rhode Island | — | ↳ | 7% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-SC | United States — South Carolina | — | ↳ | 6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-SD | United States — South Dakota | — | ↳ | 4.5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-TN | United States — Tennessee | — | ↳ | 7% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-TX | United States — Texas | — | ↳ | 6.25% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-UT | United States — Utah | — | ↳ | 4.85% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-VT | United States — Vermont | — | ↳ | 6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-VA | United States — Virginia | — | ↳ | 5.3% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-WA | United States — Washington | — | ↳ | 6.5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-WV | United States — West Virginia | — | ↳ | 6% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-WI | United States — Wisconsin | — | ↳ | 5% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| US-WY | United States — Wyoming | — | ↳ | 4% ✅ | ↳ | ↳ | ↳ | ↳ | ↳ |
| UY | Uruguay | — | ✅ | 22% ✅ | Always | ❌ | ✅ (11000) | ✅ Department / Departamento | ✅ Municipality / Municipio |
| UZ | Uzbekistan | — | ✅ | 12% ✅ | Always | ❌ | ✅ (100000) | ✅ Region / Viloyatlari | ✅ District / Tuman |
| VA | Vatican | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (00120) | ❌ | ❌ |
| VC | Saint Vincent and the Grenadines | — | ✅ | 16% ✅ | Always | ❌ | ❌ | ✅ Parish / Parish | ❌ |
| VE | Venezuela | — | ✅ | 16% ✅ | Always | ❌ | ✅ (1010) | ✅ State / Estado | ✅ Municipality / Municipio |
| VG | British Virgin Islands | — | ✅ | None ✅ | Seller never collects | ❌ | ❌ | ❌ | ❌ |
| VI | U.S. Virgin Islands | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (00802) | ❌ | ❌ |
| VN | Vietnam | — | ✅ | 10% ✅ | Always | ❌ | ✅ (100000) | ✅ Province / Tỉnh | ✅ Rural district / Huyện |
| VU | Vanuatu | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Province / Provens | ❌ |
| WF | Wallis and Futuna | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (98600) | ❓ Customary kingdom (en only) | ❌ |
| WS | Samoa | — | ✅ | 15% ✅ | Always | ❌ | ✅ (AS 96799) | ❓ District (en only) | ❌ |
| XK | Kosovo | — | ✅ | 18% ✅ | EUR 30,000 | ❌ | ❌ | ✅ Municipality / Komunat | ❌ |
| YE | Yemen | — | ✅ | 5% ✅ | Always | ❌ | ❌ | ✅ Governorate / محافظة | ✅ District / مديرية |
| YT | Mayotte | — | ✅ | None ✅ | Seller never collects | ❌ | ✅ (97600) | ✅ Canton / Canton | ✅ Commune / Commune |
| ZA | South Africa | — | ✅ | 15% ✅ | Always | ❌ | ✅ (0001) | ✅ Province / Izifundazwe zaseNingizimu | ❓ District municipality (en only) |
| ZM | Zambia | — | ✅ | 16% ✅ | Always | ❌ | ✅ (10101) | ✅ Province / Province | ❌ |
| ZW | Zimbabwe | — | ✅ | 15% ✅ | Always | ❌ | ❌ | ✅ Province / Province | ❌ |

<!-- COVERAGE_TABLE_END -->
