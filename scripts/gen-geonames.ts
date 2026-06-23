// Pulls reference geo data from GeoNames and parses it into three JSON files:
//   data/countries.json -> list of countries (ISO alpha-2 + metadata)
//   data/admin1.json    -> level-1 administrative divisions, keyed by country
//   data/admin2.json    -> level-2 administrative divisions, keyed by country
//
// Each division is enriched with:
//   localNames   -> { <lang>: name } for the country's languages (GeoNames alternateNames)
//   officialCode -> ISO 3166-2 code used by the country (via Wikidata P1566<->P300), or null
//
// Run with: bun run scripts/gen-geonames.ts
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../data");

const BASE = "https://download.geonames.org/export/dump";
const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const ISO_3166_2 =
	"https://salsa.debian.org/iso-codes-team/iso-codes/-/raw/main/data/iso_3166-2.json";
const USER_AGENT = "react-address-tax-geonames-script/1.0 (data enrichment)";

// GeoNames files are tab-separated. countryInfo.txt carries leading comment
// lines starting with "#"; the admin files have no comments.
async function fetchTsv(file: string): Promise<string[][]> {
	const res = await fetch(`${BASE}/${file}`);
	if (!res.ok) {
		throw new Error(`failed to fetch ${file}: ${res.status} ${res.statusText}`);
	}
	const text = await res.text();
	return text
		.split("\n")
		.filter((line) => line.length > 0 && !line.startsWith("#"))
		.map((line) => line.split("\t"));
}

// Per-level subdivision type: English category from ISO 3166-2 (iso-codes),
// local name from the dominant Wikidata subdivision-type item. Either may be null.
type DivisionType = { local: string | null; en: string | null };

type Country = {
	code: string;
	iso3: string;
	name: string;
	continent: string;
	currencyCode: string;
	currencyName: string;
	postalCodeRegex: string | null;
	languages: string[];
	divisionTypes: { admin1: DivisionType | null; admin2: DivisionType | null };
};

type AdminDivision = {
	code: string;
	name: string;
	localNames: Record<string, string>;
	officialCode: string | null;
};

type Admin2Division = AdminDivision & { admin1Code: string };

// Reduce GeoNames' per-country language list (e.g. "de-CH,fr-CH,it-CH,rm") to a
// deduped set of base ISO-639 codes ("de","fr","it","rm"). GeoNames does not
// distinguish official from minority languages, so this is the best available
// signal for which localized names are worth keeping.
function baseLanguages(languages: string[]): string[] {
	const seen = new Set<string>();
	for (const lang of languages) {
		const base = (lang.split("-")[0] ?? "").toLowerCase().trim();
		if (base) seen.add(base);
	}
	return [...seen];
}

// Run a SPARQL query against WDQS, returning data rows (TSV, header dropped).
// WDQS is flaky under load (502s / timeouts), so retry with backoff.
async function sparql(query: string): Promise<string[][]> {
	const url = `${WIKIDATA_SPARQL}?query=${encodeURIComponent(query)}`;
	for (let attempt = 1; ; attempt++) {
		try {
			const res = await fetch(url, {
				headers: {
					Accept: "text/tab-separated-values",
					"User-Agent": USER_AGENT,
				},
			});
			const text = await res.text();
			if (!res.ok || text.startsWith("<"))
				throw new Error(`status ${res.status}`);
			return text
				.split("\n")
				.slice(1)
				.filter((line) => line.length > 0)
				.map((line) =>
					line
						.split("\t")
						.map((v) => v.replace(/@[\w-]+$/, "").replace(/^"|"$/g, "")),
				);
		} catch (err) {
			if (attempt >= 5) throw err;
			await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
		}
	}
}

// One Wikidata query maps every GeoNames id that has an ISO 3166-2 code:
//   P1566 = GeoNames ID, P300 = ISO 3166-2 code.
async function fetchOfficialCodes(): Promise<Map<string, string>> {
	const rows = await sparql(
		`SELECT ?gnid ?iso WHERE { ?item wdt:P300 ?iso ; wdt:P1566 ?gnid . }`,
	);
	const map = new Map<string, string>();
	for (const [gnid, iso] of rows) {
		if (gnid && iso) map.set(gnid, iso);
	}
	return map;
}

// ISO 3166-2 subdivision categories (English) from the iso-codes project (the
// data behind pycountry). Each entry has a `type`; entries with a `parent` are
// second-level, the rest first-level. The dominant type per level is the
// country's subdivision category, e.g. FR -> Metropolitan region / department.
type IsoCategories = { admin1: string | null; admin2: string | null };
async function fetchIsoCategories(): Promise<Map<string, IsoCategories>> {
	const res = await fetch(ISO_3166_2, {
		headers: { "User-Agent": USER_AGENT },
	});
	if (!res.ok)
		throw new Error(`failed to fetch iso_3166-2.json: ${res.status}`);
	const json = (await res.json()) as {
		"3166-2": { code: string; parent?: string; type?: string }[];
	};
	const entries = json["3166-2"];
	const tally = new Map<
		string,
		{ a1: Map<string, number>; a2: Map<string, number> }
	>();
	for (const e of entries) {
		const cc = e.code.slice(0, 2);
		const level = e.parent ? "a2" : "a1";
		const t = tally.get(cc) ?? { a1: new Map(), a2: new Map() };
		const counts = t[level];
		if (e.type) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
		tally.set(cc, t);
	}
	const dominant = (m: Map<string, number>): string | null =>
		[...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
	const result = new Map<string, IsoCategories>();
	for (const [cc, t] of tally) {
		result.set(cc, { admin1: dominant(t.a1), admin2: dominant(t.a2) });
	}
	return result;
}

// Local-language name of a level's subdivision type: the label (in `lang`) of
// the most common Wikidata P31 type among the given division geonameIds.
async function fetchTypeLocalLabel(
	geonameIds: string[],
	lang: string,
): Promise<string | null> {
	if (geonameIds.length === 0) return null;
	const values = geonameIds.map((id) => `"${id}"`).join(" ");
	const rows = await sparql(`SELECT ?loc (COUNT(*) AS ?n) WHERE {
		VALUES ?gn { ${values} }
		?item wdt:P1566 ?gn ; wdt:P31 ?type .
		?type rdfs:label ?loc FILTER(LANG(?loc)="${lang}")
	} GROUP BY ?loc ORDER BY DESC(?n) LIMIT 1`);
	return rows[0]?.[0] ?? null;
}

// A country's name in English and its primary language, used to strip country
// qualifiers out of the subdivision-type labels.
async function fetchCountryName(code: string, lang: string): Promise<string[]> {
	const rows = await sparql(`SELECT ?en ?loc WHERE {
		?c wdt:P297 "${code}" .
		OPTIONAL { ?c rdfs:label ?en FILTER(LANG(?en)="en") }
		OPTIONAL { ?c rdfs:label ?loc FILTER(LANG(?loc)="${lang}") }
	} LIMIT 1`);
	return (rows[0] ?? []).filter(Boolean);
}

// Connector/article words (multilingual) that join a category to its country,
// e.g. "department OF France", "regione D'Italia", "kraj V Česku", "Kanton ZU
// Lëtzebuerg", "Rehiyon NG Pilipinas", "Tỉnh CỦA Việt Nam".
const CONNECTORS = new Set([
	"of",
	"de",
	"del",
	"dela",
	"della",
	"dell",
	"dello",
	"dei",
	"degli",
	"delle",
	"da",
	"do",
	"dos",
	"das",
	"du",
	"des",
	"di",
	"d",
	"van",
	"von",
	"der",
	"den",
	"het",
	"the",
	"la",
	"le",
	"les",
	"el",
	"los",
	"i",
	"v",
	"u",
	"w",
	"na",
	"ve",
	"in",
	"en",
	"dans",
	"y",
	"a",
	"zu",
	"al",
	"ng",
	"ya",
	"din",
	"e",
	"та",
	"во",
	"της",
	"του",
	" της",
	"của",
	"republic",
	"republica",
	"republique",
	"republik",
	"democratic",
	"people",
	"peoples",
	"blong",
	"في",
	"دولة",
	"جمهورية",
	"ال",
]);

// List-prefix words ("LIST of provinces", "قائمة محافظات", "فهرست ولایتهای")
// dropped from the front of a label before processing.
const LEADING_DROP = new Set([
	"list",
	"lista",
	"liste",
	"قائمة",
	"فهرست",
	"لیست",
	"فهرست",
]);

// Generic structural nouns that appear in MULTI-WORD country names ("United
// STATES", "Czech REPUBLIC"); excluded from name matching so they don't collide
// with a category of the same word (category "state" vs country "States"). They
// are only dropped when the name has another significant word, so single-word
// names like "Ísland" (Iceland) keep matching.
const NAME_STOPWORDS = new Set([
	"state",
	"states",
	"country",
	"countries",
	"republic",
	"republics",
	"union",
	"federation",
	"kingdom",
	"emirates",
	"island",
	"islands",
	"province",
	"provinces",
	"region",
	"regions",
	"district",
	"districts",
	"territory",
	"territories",
]);

// Curated overrides for the local subdivision-type label where automatic
// cleaning cannot reach the correct native form (e.g. Arabic/Persian broken
// plurals that need singularizing, or irregular morphology). Keyed by country
// code then admin level; the value replaces divisionTypes.<level>.local.
const LOCAL_OVERRIDES: Record<string, { admin1?: string; admin2?: string }> = {
	AE: { admin1: "إمارة" }, // emirate (singular)
	AF: { admin1: "ولایت" }, // province (Dari, singular)
	DZ: { admin1: "ولاية" }, // strip nationality adjective "جزائرية"
	EG: { admin1: "محافظة" }, // strip "مصرية"
	JO: { admin1: "محافظة" }, // strip "أردنية"
	YE: { admin1: "محافظة" }, // strip "يمنية"
	IQ: { admin2: "قضاء" }, // strip "عراقي"
	KM: { admin1: "جزيرة" }, // strip "بركانية" (volcanic)
	ME: { admin1: "Општина" }, // strip "Црне Горе" (Cyrillic genitive)
	MN: { admin1: "Аймаг" }, // province (singular)
	OM: { admin1: "محافظة" }, // strip "مناطق و" / governorate
	PK: { admin1: "صوبہ" }, // province (Urdu)
	RS: { admin1: "Округ", admin2: "општине и градови" }, // district (strip "Србије")
};

const fold = (s: string) =>
	s
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.replace(/[._]/g, "")
		.toLowerCase();
// Sets are matched against fold(token), so fold their entries too — otherwise
// diacritic-bearing words (Vietnamese "của", Arabic "قائمة") never match.
const CONNECTORS_F = new Set([...CONNECTORS].map(fold));
const LEADING_DROP_F = new Set([...LEADING_DROP].map(fold));
const capitalize = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
const commonPrefix = (a: string, b: string) => {
	let i = 0;
	while (i < a.length && i < b.length && a[i] === b[i]) i++;
	return i;
};

// Does a token belong to the country name? Leading tokens must be an exact match
// or clearly derived (magyarországi <- Magyarország) to avoid false hits like
// "unitary" vs "united". Trailing tokens use a looser shared-prefix rule to catch
// adjectives/locatives (française<-France, Suomessa<-Suomi, Česku<-Česko).
function isCountryTok(
	tok: string,
	nameWords: Set<string>,
	leading: boolean,
): boolean {
	const f = fold(tok);
	for (const w of nameWords) {
		if (f === w) return true;
		if (leading) {
			// Derived form (magyarországi<-Magyarország) or a strong shared stem
			// (Lietuvos<-Lietuva, Slovenska<-Slovenija); >=5 avoids "unitary"<-"united".
			if (f.length > w.length && f.startsWith(w)) return true;
			if (f.length >= 6 && w.length >= 6 && commonPrefix(f, w) >= 5)
				return true;
		} else if (f.length >= 4 && w.length >= 4 && commonPrefix(f, w) >= 4) {
			return true;
		}
	}
	return false;
}

// Strip the country qualifier from a subdivision-type label so only the category
// noun remains: "departamento de Bolivia" -> "Departamento", "région française"
// -> "Région", "Azərbaycan rayonu" -> "Rayonu". Returns the capitalized result.
function cleanLabel(raw: string | null, names: string[]): string | null {
	if (!raw) return raw;
	const significant = (nm: string) =>
		fold(nm)
			.split(/\s+/)
			.filter((w) => w.length >= 3 && !CONNECTORS_F.has(w));
	const nameWords = new Set<string>();
	for (const nm of names) {
		const words = significant(nm);
		const multi = words.filter((w) => !NAME_STOPWORDS.has(w)).length > 0;
		// Keep generic-noun names (Ísland) when they are the only significant word.
		for (const w of words)
			if (!multi || !NAME_STOPWORDS.has(w)) nameWords.add(w);
	}
	// Acronym of the significant name words (United States -> "us") so an
	// abbreviated prefix like "U.S. state" is recognized and stripped.
	for (const nm of names) {
		const initials = significant(nm)
			.map((w) => w[0])
			.join("");
		if (initials.length >= 2 && initials.length <= 3) nameWords.add(initials);
	}
	if (nameWords.size === 0) return capitalize(raw);

	let toks = raw.replace(/['’ʼ]/g, " ").split(/\s+/).filter(Boolean);
	// Drop a leading list-word ("List of ...", "قائمة محافظات", "فهرست ولایتهای").
	while (toks.length > 1 && LEADING_DROP_F.has(fold(toks[0]!)))
		toks = toks.slice(1);

	let first = -1;
	for (let i = 0; i < toks.length; i++) {
		if (isCountryTok(toks[i]!, nameWords, i === 0)) {
			first = i;
			break;
		}
	}

	let kept: string[];
	if (first === -1) {
		kept = toks;
	} else {
		let start = first;
		while (start - 1 >= 0 && CONNECTORS_F.has(fold(toks[start - 1]!))) start--;
		if (start === 0) {
			// Country name leads: drop leading country/connector tokens, keep the rest.
			let j = first;
			while (
				j < toks.length &&
				(isCountryTok(toks[j]!, nameWords, false) ||
					CONNECTORS_F.has(fold(toks[j]!)))
			)
				j++;
			kept = toks.slice(j);
		} else {
			kept = toks.slice(0, start);
		}
	}
	// Trim any dangling leading/trailing connector tokens ("Kanton zu" -> "Kanton").
	while (kept.length > 1 && CONNECTORS_F.has(fold(kept[kept.length - 1]!)))
		kept = kept.slice(0, -1);
	while (kept.length > 1 && CONNECTORS_F.has(fold(kept[0]!)))
		kept = kept.slice(1);

	const out = kept.join(" ").trim();
	return out ? capitalize(out) : capitalize(raw);
}

// alternateNames columns:
// 0 altId 1 geonameId 2 isolanguage 3 name 4 isPreferredName 5 isShortName
// 6 isColloquial 7 isHistoric 8 from 9 to
// We collapse these to: geonameId -> { lang -> best name } for the requested
// languages only, preferring short names, then official/preferred names.
type LocalNameMap = Map<string, Record<string, string>>;

async function fetchLocalNames(
	country: string,
	langs: Set<string>,
): Promise<LocalNameMap> {
	const result: LocalNameMap = new Map();
	if (langs.size === 0) return result;

	const res = await fetch(`${BASE}/alternatenames/${country}.zip`);
	if (res.status === 404) return result;
	if (!res.ok) {
		throw new Error(
			`failed to fetch alternatenames/${country}.zip: ${res.status}`,
		);
	}

	// The per-country archive ships a single "<CC>.txt"; unzip it to stdout.
	const dir = await mkdtemp(join(tmpdir(), "geonames-"));
	const zipPath = join(dir, `${country}.zip`);
	try {
		await writeFile(zipPath, Buffer.from(await res.arrayBuffer()));
		const { stdout } = await execFileAsync(
			"unzip",
			["-p", zipPath, `${country}.txt`],
			{
				maxBuffer: 1024 * 1024 * 1024,
			},
		);
		// rank: short name (3) > preferred (2) > plain (1); higher wins, ties keep first.
		const rank: Map<string, number> = new Map();
		for (const line of stdout.split("\n")) {
			if (!line) continue;
			const cols = line.split("\t");
			const geonameId = cols[1];
			const lang = cols[2];
			const name = cols[3];
			if (!geonameId || !lang || !name) continue;
			if (!langs.has(lang)) continue;
			if (cols[6] === "1" || cols[7] === "1") continue; // skip colloquial/historic
			const score = cols[5] === "1" ? 3 : cols[4] === "1" ? 2 : 1;
			const key = `${geonameId}\t${lang}`;
			if (score <= (rank.get(key) ?? 0)) continue;
			rank.set(key, score);
			const names = result.get(geonameId) ?? {};
			names[lang] = name;
			result.set(geonameId, names);
		}
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
	return result;
}

// Run async tasks with a bounded number of workers to avoid hammering GeoNames.
async function mapPool<T, R>(
	items: T[],
	limit: number,
	fn: (item: T) => Promise<R>,
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let next = 0;
	async function worker() {
		while (next < items.length) {
			const i = next++;
			results[i] = await fn(items[i] as T);
		}
	}
	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, worker),
	);
	return results;
}

// APPEND_MAIN
async function main() {
	const [countryRows, admin1Rows, admin2Rows, officialCodes, isoCategories] =
		await Promise.all([
			fetchTsv("countryInfo.txt"),
			fetchTsv("admin1CodesASCII.txt"),
			fetchTsv("admin2Codes.txt"),
			fetchOfficialCodes(),
			fetchIsoCategories(),
		]);
	console.log(`wikidata: ${officialCodes.size} ISO 3166-2 codes`);

	// countryInfo.txt columns:
	// 0 ISO  1 ISO3  2 ISO-Numeric  3 fips  4 Country  5 Capital  6 Area
	// 7 Population  8 Continent  9 tld  10 CurrencyCode  11 CurrencyName
	// 12 Phone  13 Postal Code Format  14 Postal Code Regex  15 Languages
	// 16 geonameid  17 neighbours  18 EquivalentFipsCode
	const countries: Country[] = countryRows
		.map((c) => ({
			code: c[0] ?? "",
			iso3: c[1] ?? "",
			name: c[4] ?? "",
			continent: c[8] ?? "",
			currencyCode: c[10] ?? "",
			currencyName: c[11] ?? "",
			postalCodeRegex: c[14] ? c[14] : null,
			languages: c[15] ? c[15].split(",") : [],
			divisionTypes: { admin1: null, admin2: null },
		}))
		.filter((c) => c.code.length === 2)
		.sort((a, b) => a.code.localeCompare(b.code));

	const langsByCountry = new Map(
		countries.map((c) => [c.code, baseLanguages(c.languages)]),
	);

	// Parse admin files, keeping geonameId around long enough to join localized
	// names; it is stripped before the JSON is written. Codes are country-prefixed
	// (e.g. US-VA). officialCode comes from the Wikidata join on geonameId.
	type Pending = AdminDivision & { geonameId: string };
	type Pending2 = Admin2Division & { geonameId: string };

	// admin1CodesASCII.txt columns: "CC.A1" \t name \t asciiName \t geonameid
	const admin1: Record<string, Pending[]> = {};
	for (const [fullCode, name, , geonameId] of admin1Rows) {
		if (!fullCode || !geonameId) continue;
		const [country, code] = fullCode.split(".");
		if (!country || !code) continue;
		(admin1[country] ??= []).push({
			code: `${country}-${code}`,
			name: name ?? "",
			localNames: {},
			officialCode: officialCodes.get(geonameId) ?? null,
			geonameId,
		});
	}

	// admin2Codes.txt columns: "CC.A1.A2" \t name \t asciiName \t geonameid
	const admin2: Record<string, Pending2[]> = {};
	for (const [fullCode, name, , geonameId] of admin2Rows) {
		if (!fullCode || !geonameId) continue;
		const [country, admin1Code, code] = fullCode.split(".");
		if (!country || !admin1Code || !code) continue;
		(admin2[country] ??= []).push({
			admin1Code: `${country}-${admin1Code}`,
			code: `${country}-${code}`,
			name: name ?? "",
			localNames: {},
			officialCode: officialCodes.get(geonameId) ?? null,
			geonameId,
		});
	}

	// Fetch localized names per country (bounded concurrency) and fill them in.
	const countryCodes = [
		...new Set([...Object.keys(admin1), ...Object.keys(admin2)]),
	];
	let done = 0;
	await mapPool(countryCodes, 8, async (country) => {
		const langs = new Set(langsByCountry.get(country) ?? []);
		const localNames = await fetchLocalNames(country, langs);
		for (const d of admin1[country] ?? [])
			d.localNames = localNames.get(d.geonameId) ?? {};
		for (const d of admin2[country] ?? [])
			d.localNames = localNames.get(d.geonameId) ?? {};
		done++;
		if (done % 25 === 0 || done === countryCodes.length) {
			console.log(`localized names: ${done}/${countryCodes.length} countries`);
		}
	});

	// Division-type labels per country: English category from ISO 3166-2, local
	// name from the dominant Wikidata subdivision type. admin2 is only emitted for
	// countries where ISO 3166-2 defines a second level (avoids the noisy, often
	// per-region admin2 types in federal countries). Sampling a bounded, evenly
	// spread set of geonameIds is enough to find the dominant type.
	const sample = (list: { geonameId: string }[], cap: number): string[] => {
		if (list.length <= cap) return list.map((d) => d.geonameId);
		const step = list.length / cap;
		return Array.from(
			{ length: cap },
			(_, i) => list[Math.floor(i * step)]?.geonameId ?? "",
		).filter(Boolean);
	};
	const countryByCode = new Map(countries.map((c) => [c.code, c]));
	let dt = 0;
	await mapPool(countryCodes, 4, async (country) => {
		const c = countryByCode.get(country);
		const iso = isoCategories.get(country);
		const lang = (langsByCountry.get(country) ?? [])[0] ?? "en";
		if (c) {
			const names = await fetchCountryName(country, lang);
			const a1Local = cleanLabel(
				await fetchTypeLocalLabel(sample(admin1[country] ?? [], 80), lang),
				names,
			);
			if (iso?.admin1 || a1Local)
				c.divisionTypes.admin1 = { local: a1Local, en: iso?.admin1 ?? null };
			if (iso?.admin2) {
				const a2Local = cleanLabel(
					await fetchTypeLocalLabel(sample(admin2[country] ?? [], 80), lang),
					names,
				);
				c.divisionTypes.admin2 = { local: a2Local, en: iso.admin2 };
			}
			// Apply curated overrides for labels automatic cleaning can't reach.
			const ov = LOCAL_OVERRIDES[country];
			if (ov?.admin1 && c.divisionTypes.admin1)
				c.divisionTypes.admin1.local = ov.admin1;
			if (ov?.admin2 && c.divisionTypes.admin2)
				c.divisionTypes.admin2.local = ov.admin2;
		}
		dt++;
		if (dt % 25 === 0 || dt === countryCodes.length) {
			console.log(`division types: ${dt}/${countryCodes.length} countries`);
		}
	});

	const strip = <T extends AdminDivision & { geonameId: string }>(
		list: T[],
	): Omit<T, "geonameId">[] =>
		list
			.map(({ geonameId: _omit, ...rest }) => rest)
			.sort((a, b) => a.name.localeCompare(b.name));
	const admin1Out: Record<string, AdminDivision[]> = {};
	const admin2Out: Record<string, Admin2Division[]> = {};
	for (const [country, list] of Object.entries(admin1))
		admin1Out[country] = strip(list);
	for (const [country, list] of Object.entries(admin2))
		admin2Out[country] = strip(list);

	await mkdir(outDir, { recursive: true });
	await Promise.all([
		writeFile(
			resolve(outDir, "countries.json"),
			`${JSON.stringify(countries, null, "\t")}\n`,
		),
		writeFile(
			resolve(outDir, "admin1.json"),
			`${JSON.stringify(sortKeys(admin1Out), null, "\t")}\n`,
		),
		writeFile(
			resolve(outDir, "admin2.json"),
			`${JSON.stringify(sortKeys(admin2Out), null, "\t")}\n`,
		),
	]);

	const admin1Total = Object.values(admin1Out).reduce(
		(n, l) => n + l.length,
		0,
	);
	const admin2Total = Object.values(admin2Out).reduce(
		(n, l) => n + l.length,
		0,
	);
	console.log(`countries.json: ${countries.length} countries`);
	console.log(
		`admin1.json:    ${admin1Total} divisions across ${Object.keys(admin1Out).length} countries`,
	);
	console.log(
		`admin2.json:    ${admin2Total} divisions across ${Object.keys(admin2Out).length} countries`,
	);
}

function sortKeys<T>(obj: Record<string, T>): Record<string, T> {
	return Object.fromEntries(
		Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
