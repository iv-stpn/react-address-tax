// Pulls reference geo data from GeoNames and parses it into three JSON files:
//   data/countries.json -> list of countries (ISO alpha-2 + metadata)
//   data/level1-administrative-codes.json    -> level-1 administrative divisions, keyed by country
//   data/level2-administrative-codes.json    -> level-2 administrative divisions, keyed by country
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
const USER_AGENT = "react-address-tax-geonames-script/1.0 (data enrichment)";

// Defunct ISO 3166-1 alpha-2 codes still present in some GeoNames data that we
// exclude from output: AN (Netherlands Antilles), CS (Serbia and Montenegro).
const DEFUNCT_COUNTRY_CODES = new Set(["AN", "CS"]);

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
type DivisionLabel = { local: string | null; en: string | null };

type Country = {
  code: string;
  iso3: string;
  name: string;
  continent: string;
  currencyCode: string;
  currencyName: string;
  postalCodeRegex: string | null;
  languages: string[];
  administrativeLabels: {
    level1: DivisionLabel | null;
    level2: DivisionLabel | null;
  };
};

type AdministrativeDivision = {
  code: string;
  name: string;
  localNames: Record<string, string>;
  officialCode: string | null;
};

type Level2AdministrativeDivision = AdministrativeDivision & {
  level1AdminCode: string;
};

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

const wait = async (time: number) => new Promise((_) => setTimeout(_, time));

const sparqlHeaders = {
  Accept: "text/tab-separated-values",
  "User-Agent": USER_AGENT,
};

// Run a SPARQL query against WDQS, returning data rows (TSV, header dropped).
// WDQS is flaky under load (502s / timeouts), so retry with backoff.
async function sparql(query: string): Promise<string[][]> {
  const url = `${WIKIDATA_SPARQL}?query=${encodeURIComponent(query)}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: sparqlHeaders });
      const text = await res.text();

      if (!res.ok || text.startsWith("<")) throw new Error(`status ${res.status}`);

      return text
        .split("\n")
        .slice(1)
        .filter((line) => line.length > 0)
        .map((line) => line.split("\t").map((v) => v.replace(/@[\w-]+$/, "").replace(/^"|"$/g, "")));
    } catch (err) {
      if (attempt >= 3) throw err;
      await wait(500 * 2 ** attempt);
    }
  }
}

// One Wikidata query maps every GeoNames id that has an ISO 3166-2 code:
//   P1566 = GeoNames ID, P300 = ISO 3166-2 code.
async function fetchOfficialCodes(): Promise<Map<string, string>> {
  const rows = await sparql(`SELECT ?gnid ?iso WHERE { ?item wdt:P300 ?iso ; wdt:P1566 ?gnid . }`);
  const map = new Map<string, string>();
  for (const [gnid, iso] of rows) {
    if (gnid && iso) map.set(gnid, iso);
  }
  return map;
}

// Structural / statistical classifier labels (English, lowercased substrings)
// that Wikidata stamps on subdivisions but which are not real-world category
// names. They rank high by coverage yet must be skipped in favour of the next
// candidate ("county", "province", ...).
const TYPE_BLOCKLIST = [
  "administrative territorial entity",
  "administrative division",
  "administrative unit",
  "administrative region",
  "administrative area",
  "second-level administrative",
  "first-level administrative",
  "third-level administrative",
  "political territorial entity",
  "political entity",
  "territorial entity",
  "geographic location",
  "geographic entity",
  "geographical feature",
  "geolocatable entity",
  "human-geographic",
  "abstract entity",
  "complex system",
  "census geographic unit",
  "census division",
  "statistical territorial",
  "nuts ",
  "former ",
  "big city",
  "city, town or village",
];

// Both admin-level labels (English + local) for a country, derived from the
// Wikidata P150 (contains administrative territorial entity) chain. level1AdministrativeLabel uses
// one hop (country → division), level2AdministrativeLabel uses two hops (country → a1 → division).
// Per level we read every division's P31 type, clean the qualifier off each
// label (so "county of Texas"/"county of California"/… → "County"), then GROUP
// BY the cleaned English label.

// level2AdministrativeLabel groups are ranked by how many distinct
// level1AdministrativeLabel parents they span — the level signal: France's department spans 13
// regions while its communes span only a handful, so department wins even though
// communes are more numerous. level1 has no parent to count, so it ranks by
// frequency. This keeps the generic term (FR → "Department", not ISO 3166-2's
// "Metropolitan department") without the sparse P1566-join problem.
async function fetchDivisionLabels(
  cc: string,
  lang: string,
  names: string[],
): Promise<{
  level1: DivisionLabel | null;
  level2: DivisionLabel | null;
}> {
  const a1 = await sparql(`SELECT ?en ?loc (COUNT(*) AS ?w) WHERE {
		?c wdt:P297 "${cc}" . ?c wdt:P150 ?div .
		?div wdt:P31 ?type .
		OPTIONAL { ?type rdfs:label ?en FILTER(LANG(?en)="en") }
		OPTIONAL { ?type rdfs:label ?loc FILTER(LANG(?loc)="${lang}") }
	} GROUP BY ?en ?loc ORDER BY DESC(?w) LIMIT 60`);

  // level2 selects two metrics: ?np = distinct level1 parents (the level signal,
  // ranked first client-side), ?n = raw count (tiebreak / local-label picker).
  // Order by frequency, not ?np: split per-region types (US "county of Texas")
  // each have ?np=1 but huge ?n, so frequency ordering keeps them in the window
  // to be regrouped, whereas ?np ordering would drop them past the limit.
  const a2 = await sparql(`SELECT ?en ?loc (COUNT(DISTINCT ?a1) AS ?np) (COUNT(*) AS ?n) WHERE {
		?c wdt:P297 "${cc}" . ?c wdt:P150 ?a1 . ?a1 wdt:P150 ?div .
		?div wdt:P31 ?type .
		OPTIONAL { ?type rdfs:label ?en FILTER(LANG(?en)="en") }
		OPTIONAL { ?type rdfs:label ?loc FILTER(LANG(?loc)="${lang}") }
	} GROUP BY ?en ?loc ORDER BY DESC(?n) LIMIT 200`);

  // Group rows by cleaned English label, summing both metrics; carry the local
  // label of the heaviest single row. Structural/statistical classifier labels
  // are skipped so the next real category wins. `rankCol` is the row column to
  // rank groups by (level2 → coverage 1, level1 → frequency 2).
  const pick = (rows: string[][], rankCol: number): DivisionLabel | null => {
    type G = {
      en: string | null;
      local: string | null;
      rank: number;
      top: number;
    };
    const groups = new Map<string, G>();
    for (const r of rows) {
      const enRaw = (r[0] ?? "").toLowerCase();
      if (enRaw && TYPE_BLOCKLIST.some((b) => enRaw.includes(b))) continue;
      const rank = Number(r[rankCol] ?? "0") || 0;
      const top = Number(r[r.length - 1] ?? "0") || 0; // last numeric = raw count
      const en = normalizeEnDivision(cleanLabel(r[0] ?? null, names));
      const local = cleanLabel(r[1] ?? null, names);
      if (!en && !local) continue;
      const key = (en ?? local ?? "").toLowerCase();
      const g = groups.get(key) ?? { en, local, rank: 0, top: 0 };
      g.rank += rank;
      if (top >= g.top) {
        g.top = top;
        g.local = local ?? g.local;
        g.en = en ?? g.en;
      }
      groups.set(key, g);
    }
    const best = [...groups.values()].sort((a, b) => b.rank - a.rank)[0];
    if (!best) return null;
    return best.en || best.local ? { en: best.en, local: best.local } : null;
  };
  return {
    level1: pick(a1, 2),
    level2: pick(a2, 1),
  };
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
const LEADING_DROP = new Set(["list", "lista", "liste", "قائمة", "فهرست", "لیست", "فهرست"]);

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
// code then admin level; each value replaces administrativeLabels.<level>.{en,local}.
// `local` is what automatic cleaning can't reach; `en` is for junk/plural ISO
// categories the English normalizer can't fix on its own.
type DivisionOverride = { en?: string; local?: string };
const DIVISION_OVERRIDES: Record<
  string,
  {
    level1?: DivisionOverride;
    level2?: DivisionOverride;
  }
> = {
  AE: { level1: { local: "إمارة" } }, // emirate (singular)
  AF: { level1: { local: "ولایت" } }, // province (Dari, singular)
  DZ: { level1: { local: "ولاية" } }, // strip nationality adjective "جزائرية"
  EG: { level1: { local: "محافظة" } }, // strip "مصرية"
  JO: { level1: { local: "محافظة" } }, // strip "أردنية"
  YE: { level1: { local: "محافظة" } }, // strip "يمنية"
  IQ: { level2: { local: "قضاء" } }, // strip "عراقي"
  KM: { level1: { local: "جزيرة" } }, // strip "بركانية" (volcanic)
  ME: { level1: { local: "Општина" } }, // strip "Црне Горе" (Cyrillic genitive)
  MN: { level1: { local: "Аймаг" } }, // province (singular)
  OM: { level1: { local: "محافظة" } }, // strip "مناطق و" / governorate
  PK: { level1: { local: "صوبہ" } }, // province (Urdu)
  RS: {
    level1: { local: "Округ" }, // district (strip "Србије")
    level2: {
      en: "Municipality / city",
      local: "Општина / град",
    },
  },
  // French overseas territories carry the nationality adjective "français" /
  // the "(avant 2015)" note, which doesn't match their own country name.
  GF: {
    level1: { local: "Arrondissement" },
    level2: { local: "Canton" },
  },
  RE: {
    level1: { local: "Arrondissement" },
    level2: { local: "Canton" },
  },
  GP: {
    level1: { local: "Commune" },
    level2: { local: "Canton" },
  },
  MQ: {
    level1: { local: "Commune" },
    level2: { local: "Canton" },
  },
  YT: {
    level1: { local: "Canton" },
    level2: { local: "Commune" },
  },
  // Wikidata returns the junk "Wikimedia list article" category for SA level-1 administrative code.
  SA: { level1: { en: "Province", local: "منطقة" } },
};

// Exact plural/qualified `local` strings → their singular form. Non-Latin
// morphology varies too much per script for rules, so this is a curated lookup
// applied to every administrativeLabels.local before DIVISION_OVERRIDES. Drops plural
// suffixes (Persian/Dari های, Bengali সমূহ, Nepali हरू, Mongolian -д), Arabic
// broken plurals (محافظات→محافظة, دوائر→دائرة), izafat endings (Tajik ҳои/и),
// "of <country>" qualifiers, and nationality adjectives (مصري, يمنية).
const LOCAL_SINGULAR: Record<string, string> = {
  "ولسوالی های": "ولسوالی", // AF district (Dari)
  বিভাগসমূহ: "বিভাগ", // BD division
  Κοινότητες: "Κοινότητα", // CY community
  دوائر: "دائرة", // DZ district
  "مركز مصري": "مركز", // EG markaz (strip "Egyptian")
  מחוזות: "מחוז", // IL district
  محافظات: "محافظة", // IQ/KW governorate
  استانهای: "استان", // IR province
  شهرستانهای: "شهرستان", // IR county
  පළාත්: "පළාත", // LK province
  "පරිපාලන දිස්ත්රික්ක": "පරිපාලන දිස්ත්රික්කය", // LK administrative district
  شعبيات: "شعبية", // LY district
  أقاليم: "إقليم", // MA province
  "Улсын сумд": "Сум", // MN district (sum)
  प्रदेशहरू: "प्रदेश", // NP province
  "کے ڈویژن": "ڈویژن", // PK division (strip "کے")
  "محافظات السلطة الوطنية الفلسطينية": "محافظة", // PS governorate
  بلديات: "بلدية", // QA municipality
  จังหวัดของประเทศไทย: "จังหวัด", // TH province (strip "of Thailand")
  Вилоятҳои: "Вилоят", // TJ region
  Ноҳияи: "Ноҳия", // TJ district
  "مديرية يمنية": "مديرية", // YE district (strip "Yemeni")
};

// Singularize the head noun of each conjunction-joined segment and rejoin with
// "Municipality / city" and "Autonomous communities" -> "Autonomous community".
function singularizeWord(w: string): string {
  if (/[a-z]ies$/i.test(w)) return w.slice(0, -3) + "y";
  if (/(ches|shes|sses|xes|zes)$/i.test(w)) return w.slice(0, -2);
  if (/[a-z]s$/i.test(w) && !/(ss|us|is)$/i.test(w)) return w.slice(0, -1);
  return w;
}
function normalizeEnDivision(raw: string | null): string | null {
  if (!raw) return raw;
  const segments = raw
    .split(/\s*(?:\/|,|&|\band\b)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((seg) => {
      const words = seg.split(/\s+/);
      words[words.length - 1] = singularizeWord(words[words.length - 1]!);
      return words.join(" ");
    });
  return segments.join(" / ");
}

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
function isCountryTok(tok: string, nameWords: Set<string>, leading: boolean): boolean {
  const f = fold(tok);
  for (const w of nameWords) {
    if (f === w) return true;
    if (leading) {
      // Derived form (magyarországi<-Magyarország) or a strong shared stem
      // (Lietuvos<-Lietuva, Slovenska<-Slovenija); >=5 avoids "unitary"<-"united".
      if (f.length > w.length && f.startsWith(w)) return true;
      if (f.length >= 6 && w.length >= 6 && commonPrefix(f, w) >= 5) return true;
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
    for (const w of words) if (!multi || !NAME_STOPWORDS.has(w)) nameWords.add(w);
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
  while (toks.length > 1 && LEADING_DROP_F.has(fold(toks[0]!))) toks = toks.slice(1);
  // Truncate at the first qualifier connector that still has tokens after it:
  // subdivision-type labels only carry a connector to introduce a place
  // qualifier, so "county OF Texas" -> "county", "regional district IN British
  // Columbia" -> "regional district", "city OF Japan" -> "city". This also
  // subsumes the country strip ("province of Italy" -> "province"). A connector
  // in first position is a leading article, not a qualifier, so it is skipped.
  for (let i = 1; i < toks.length - 1; i++) {
    if (CONNECTORS_F.has(fold(toks[i]!))) {
      toks = toks.slice(0, i);
      break;
    }
  }

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
      while (j < toks.length && (isCountryTok(toks[j]!, nameWords, false) || CONNECTORS_F.has(fold(toks[j]!)))) j++;
      kept = toks.slice(j);
    } else {
      kept = toks.slice(0, start);
    }
  }
  // Trim any dangling leading/trailing connector tokens ("Kanton zu" -> "Kanton").
  while (kept.length > 1 && CONNECTORS_F.has(fold(kept[kept.length - 1]!))) kept = kept.slice(0, -1);
  while (kept.length > 1 && CONNECTORS_F.has(fold(kept[0]!))) kept = kept.slice(1);

  const out = kept.join(" ").trim();
  return out ? capitalize(out) : capitalize(raw);
}

// alternateNames columns:
// 0 altId 1 geonameId 2 isolanguage 3 name 4 isPreferredName 5 isShortName
// 6 isColloquial 7 isHistoric 8 from 9 to
// We collapse these to: geonameId -> { lang -> best name } for the requested
// languages only, preferring short names, then official/preferred names.
type LocalNameMap = Map<string, Record<string, string>>;

async function fetchLocalNames(country: string, langs: Set<string>): Promise<LocalNameMap> {
  const result: LocalNameMap = new Map();
  if (langs.size === 0) return result;

  const res = await fetch(`${BASE}/alternatenames/${country}.zip`);
  if (res.status === 404) return result;
  if (!res.ok) {
    throw new Error(`failed to fetch alternatenames/${country}.zip: ${res.status}`);
  }

  // The per-country archive ships a single "<CC>.txt"; unzip it to stdout.
  const dir = await mkdtemp(join(tmpdir(), "geonames-"));
  const zipPath = join(dir, `${country}.zip`);
  try {
    await writeFile(zipPath, Buffer.from(await res.arrayBuffer()));
    const { stdout } = await execFileAsync("unzip", ["-p", zipPath, `${country}.txt`], {
      maxBuffer: 1024 * 1024 * 1024,
    });
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
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i] as T);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// APPEND_MAIN
async function main() {
  const [countryRows, level1AdminRows, level2AdminCodeRows, officialCodes] = await Promise.all([
    fetchTsv("countryInfo.txt"),
    fetchTsv("admin1CodesASCII.txt"),
    fetchTsv("admin2Codes.txt"),
    fetchOfficialCodes(),
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
      administrativeLabels: {
        level1: null,
        level2: null,
      },
    }))
    .filter((c) => c.code.length === 2)
    // Drop defunct ISO 3166-1 codes: AN (Netherlands Antilles), CS (Serbia and Montenegro).
    .filter((c) => !DEFUNCT_COUNTRY_CODES.has(c.code))
    .sort((a, b) => a.code.localeCompare(b.code));

  const langsByCountry = new Map(countries.map((c) => [c.code, baseLanguages(c.languages)]));

  // Parse admin files, keeping geonameId around long enough to join localized
  // names; it is stripped before the JSON is written. Codes are country-prefixed
  // (e.g. US-VA). officialCode comes from the Wikidata join on geonameId.
  type Pending = AdministrativeDivision & { geonameId: string };
  type Pending2 = Level2AdministrativeDivision & { geonameId: string };

  // admin1CodesASCII.txt columns: "CC.A1" \t name \t asciiName \t geonameid
  const level1: Record<string, Pending[]> = {};
  for (const [fullCode, name, , geonameId] of level1AdminRows) {
    if (!fullCode || !geonameId) continue;
    const [country, code] = fullCode.split(".");
    if (!country || !code) continue;
    (level1[country] ??= []).push({
      code: `${country}-${code}`,
      name: name ?? "",
      localNames: {},
      officialCode: officialCodes.get(geonameId) ?? null,
      geonameId,
    });
  }

  // admin2Codes.txt columns: "CC.A1.A2" \t name \t asciiName \t geonameid
  const level2: Record<string, Pending2[]> = {};
  for (const [fullCode, name, , geonameId] of level2AdminCodeRows) {
    if (!fullCode || !geonameId) continue;
    const [country, level1AdminCode, code] = fullCode.split(".");
    if (!country || !level1AdminCode || !code) continue;
    (level2[country] ??= []).push({
      level1AdminCode: `${country}-${level1AdminCode}`,
      code: `${country}-${code}`,
      name: name ?? "",
      localNames: {},
      officialCode: officialCodes.get(geonameId) ?? null,
      geonameId,
    });
  }

  // Fetch localized names per country (bounded concurrency) and fill them in.
  const countryCodes = [...new Set([...Object.keys(level1), ...Object.keys(level2)])];
  let done = 0;
  await mapPool(countryCodes, 8, async (country) => {
    const langs = new Set(langsByCountry.get(country) ?? []);
    const localNames = await fetchLocalNames(country, langs);
    for (const d of level1[country] ?? []) d.localNames = localNames.get(d.geonameId) ?? {};
    for (const d of level2[country] ?? []) d.localNames = localNames.get(d.geonameId) ?? {};
    done++;
    if (done % 25 === 0 || done === countryCodes.length) {
      console.log(`localized names: ${done}/${countryCodes.length} countries`);
    }
  });

  // Division-type labels per country via Wikidata P150 chain: one hop for
  // level1, two hops for level2. Yields the dominant type label in both English
  // and the country's primary language without ISO 3166-2's over-specificity.
  const countryByCode = new Map(countries.map((c) => [c.code, c]));
  let dt = 0;
  await mapPool(countryCodes, 4, async (country) => {
    const c = countryByCode.get(country);
    const lang = (langsByCountry.get(country) ?? [])[0] ?? "en";
    if (c) {
      const names = await fetchCountryName(country, lang);
      const { level1: a1, level2: a2 } = await fetchDivisionLabels(country, lang, names);
      c.administrativeLabels.level1 = a1;
      c.administrativeLabels.level2 = a2;
      // Singularize known plural/qualified local labels, then apply curated
      // overrides for labels automatic cleaning can't reach.
      for (const level of ["level1", "level2"] as const) {
        const t = c.administrativeLabels[level];
        if (t?.local && LOCAL_SINGULAR[t.local]) t.local = LOCAL_SINGULAR[t.local]!;
      }
      const ov = DIVISION_OVERRIDES[country];
      for (const level of ["level1", "level2"] as const) {
        const o = ov?.[level];
        if (!o) continue;
        const cur = c.administrativeLabels[level] ?? { en: null, local: null };
        if (o.en) cur.en = o.en;
        if (o.local) cur.local = o.local;
        c.administrativeLabels[level] = cur;
      }
    }
    dt++;
    if (dt % 25 === 0 || dt === countryCodes.length) {
      console.log(`division types: ${dt}/${countryCodes.length} countries`);
    }
  });

  const strip = <T extends AdministrativeDivision & { geonameId: string }>(list: T[]): Omit<T, "geonameId">[] =>
    list.map(({ geonameId: _omit, ...rest }) => rest).sort((a, b) => a.name.localeCompare(b.name));
  const level1AdministrativeCodesOut: Record<string, AdministrativeDivision[]> = {};
  const level2AdministrativeCodesOut: Record<string, Level2AdministrativeDivision[]> = {};
  for (const [country, list] of Object.entries(level1)) level1AdministrativeCodesOut[country] = strip(list);
  for (const [country, list] of Object.entries(level2)) level2AdministrativeCodesOut[country] = strip(list);

  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "countries.json"), `${JSON.stringify(countries, null, "\t")}\n`),
    writeFile(
      resolve(outDir, "level1-administrative-codes.json"),
      `${JSON.stringify(sortKeys(level1AdministrativeCodesOut), null, "\t")}\n`,
    ),
    writeFile(
      resolve(outDir, "level2-administrative-codes.json"),
      `${JSON.stringify(sortKeys(level2AdministrativeCodesOut), null, "\t")}\n`,
    ),
  ]);

  const level1AdminCodesTotal = Object.values(level1AdministrativeCodesOut).reduce((n, l) => n + l.length, 0);
  const level2AdminCodesTotal = Object.values(level2AdministrativeCodesOut).reduce((n, l) => n + l.length, 0);
  console.log(`countries.json: ${countries.length} countries`);
  console.log(
    `level1-administrative-codes.json:    ${level1AdminCodesTotal} divisions across ${Object.keys(level1AdministrativeCodesOut).length} countries`,
  );
  console.log(
    `level2-administrative-codes.json:    ${level2AdminCodesTotal} divisions across ${Object.keys(level2AdministrativeCodesOut).length} countries`,
  );
}

function sortKeys<T>(obj: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
