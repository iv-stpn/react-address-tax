// Regenerates the "Country coverage" table in README.md from the project data
// (data/countries.json + TAX_CONFIG + postal/level-1 metadata). Run with:
//
//   bun run gen:coverage
//
// The table lives between the COVERAGE_TABLE_START / COVERAGE_TABLE_END markers
// and is fully owned by this script. Human-entered "Last verified" dates are
// preserved across runs (keyed by row code). When a row's generated data
// differs from what is currently in the table, a ❗ is added next to its code
// to flag that it needs reverification; the ❗ is sticky until a human removes
// it (typically while setting a new "Last verified" date).

import countries from "../data/countries.json";
import { level1Admin_CA, level1Admin_US } from "../src/data/level1-administrative-codes";
import { POSTAL_CODE_DATA } from "../src/data/postal-codes";
import { getConsumptionTaxConfig, hasRegionalTax, TAX_CONFIG } from "../src/utils/tax";

const README = new URL("../README.md", import.meta.url).pathname;
const START = "<!-- COVERAGE_TABLE_START -->";
const END = "<!-- COVERAGE_TABLE_END -->";

const HEADERS = [
  "Code",
  "Country",
  "Last verified",
  "Address format",
  "Consumption tax",
  "Nexus minimum",
  "VAT number",
  "Postal code",
  "Level 1 labels",
  "Level 2 labels",
] as const;
// Columns that make up a row's data signature (everything a human verifies).
const DATA_COLS = HEADERS.slice(3);

const regionLabel = (cc: string, code: string): string => {
  const list = cc === "US" ? level1Admin_US : cc === "CA" ? level1Admin_CA : [];
  return list.find((o) => o.value === code)?.label ?? code;
};

function postalExample(code: string): string {
  return POSTAL_CODE_DATA[code]?.placeholder ?? "?";
}

function vatCell(code: string): string {
  const cfg = getConsumptionTaxConfig(code);
  if (!cfg?.consumptionTaxPattern) return "❌";
  const example = cfg.consumptionTaxExample ?? cfg.consumptionTaxPattern.source;
  return `✅ ${cfg.taxName} (${example})`;
}

// Registration threshold above which a seller must collect consumption tax in
// the country (the "nexus minimum"). collectionThreshold: 0 = always collect on
// nexus; positive = threshold in local currency; null = seller never collects.
function nexusCell(code: string, currencyCode: string | undefined): string {
  const t = getConsumptionTaxConfig(code)?.collectionThreshold;
  if (t === undefined) return "❌";
  if (t == null) return "Seller never collects";
  if (t === 0) return "Always";
  const amount = t.toLocaleString("en-US");
  return currencyCode ? `${currencyCode} ${amount}` : amount;
}

function levelCell(label: { en?: string; local?: string } | null | undefined): string {
  if (!label) return "❌";
  const en = label.en?.trim();
  const local = label.local?.trim();
  if (en && local) return `✅ ${en} / ${local}`;
  if (en) return `❓ ${en} (en only)`;
  if (local) return `❓ ${local} (local only)`;
  return "❓";
}

interface Row {
  code: string; // logical key (e.g. "US" or "US-VA"), no ❗
  cells: Record<(typeof HEADERS)[number], string>;
}

/** Build all rows (countries, plus per-region rows for regional-tax countries). */
function buildRows(): Row[] {
  const rows: Row[] = [];
  for (const c of countries as Array<Record<string, any>>) {
    const code: string = c.code;
    const entry = (TAX_CONFIG as Record<string, unknown>)[code];

    const addressFmt = "✅";
    const vat = vatCell(code);
    const postal = c.postalCodeRegex ? `✅ (${postalExample(code)})` : "❌";
    const l1 = levelCell(c.administrativeLabels?.level1);
    const l2 = levelCell(c.administrativeLabels?.level2);

    let tax: string;
    if (!entry) {
      tax = "❓";
    } else if (hasRegionalTax(code)) {
      const rates = Object.values(entry as Record<string, { baseConsumerTax: number | null }>)
        .map((r) => r.baseConsumerTax)
        .filter((r): r is number => r != null);
      tax = `${Math.min(...rates)}–${Math.max(...rates)}% (regional) ✅`;
    } else {
      const base = getConsumptionTaxConfig(code)?.baseConsumerTax;
      tax = base == null ? "None ✅" : `${base}% ✅`;
    }

    rows.push({
      code,
      cells: {
        Code: code,
        Country: c.name,
        "Last verified": "—",
        "Address format": addressFmt,
        "Consumption tax": tax,
        "Nexus minimum": nexusCell(code, c.currencyCode),
        "VAT number": vat,
        "Postal code": postal,
        "Level 1 labels": l1,
        "Level 2 labels": l2,
      },
    });

    // Per-region rows for countries whose rate varies by state/province.
    if (entry && hasRegionalTax(code)) {
      for (const [region, cfg] of Object.entries(entry as Record<string, { baseConsumerTax: number | null }>)) {
        const rate = cfg.baseConsumerTax;
        rows.push({
          code: `${code}-${region}`,
          cells: {
            Code: `${code}-${region}`,
            Country: `${c.name} — ${regionLabel(code, region)}`,
            "Last verified": "—",
            "Address format": "↳",
            "Consumption tax": rate == null ? "None ✅" : `${rate}% ✅`,
            "Nexus minimum": "↳",
            "VAT number": "↳",
            "Postal code": "↳",
            "Level 1 labels": "↳",
            "Level 2 labels": "↳",
          },
        });
      }
    }
  }
  return rows;
}

const sigOver = (cells: Record<string, string>, cols: readonly string[]) => cols.map((c) => cells[c] ?? "").join("§");

interface PrevRow {
  lastVerified: string;
  signature: string;
  hadBang: boolean;
}

/**
 * Parse the existing managed table so we can preserve dates and detect diffs.
 * Returns the parsed rows plus the subset of DATA_COLS that were present in the
 * previous table — diffs are computed only over those, so adding a brand-new
 * column never spuriously flags every row.
 */
function parsePrev(block: string): { map: Map<string, PrevRow>; dataCols: string[] } {
  const map = new Map<string, PrevRow>();
  const lines = block.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return { map, dataCols: [...DATA_COLS] };
  const cols = lines[0]
    .split("|")
    .slice(1, -1)
    .map((s) => s.trim());
  const idx = (name: string) => cols.indexOf(name);
  const codeI = idx("Code");
  const dateI = idx("Last verified");
  const dataCols = DATA_COLS.filter((c) => idx(c) >= 0);
  if (codeI < 0) return { map, dataCols };
  for (const line of lines.slice(2)) {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((s) => s.trim());
    if (cells.length !== cols.length) continue;
    const rawCode = cells[codeI];
    const hadBang = rawCode.includes("❗");
    const code = rawCode.replace("❗", "").trim();
    const signature = dataCols.map((c) => cells[idx(c)]).join("§");
    map.set(code, { lastVerified: dateI >= 0 ? cells[dateI] : "—", signature, hadBang });
  }
  return { map, dataCols };
}

function renderTable(rows: Row[], prev: Map<string, PrevRow>, dataCols: string[], bootstrap: boolean): string {
  const header = `| ${HEADERS.join(" | ")} |`;
  const divider = `| ${HEADERS.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => {
    const before = prev.get(r.code);
    if (before) r.cells["Last verified"] = before.lastVerified;
    const changed = !before || before.signature !== sigOver(r.cells, dataCols);
    // ❗ is sticky: keep an existing flag, and raise a new one when data changed
    // (but never on the initial bootstrap run — there is nothing to diff against).
    const bang = bootstrap ? false : (before?.hadBang ?? false) || changed;
    const codeCell = bang ? `${r.cells.Code} ❗` : r.cells.Code;
    const ordered = HEADERS.map((h) => (h === "Code" ? codeCell : r.cells[h]));
    return `| ${ordered.join(" | ")} |`;
  });
  return [header, divider, ...body].join("\n");
}

const NOTE = "> ❗ next to a code means its data changed since it was last verified — the country/region should be reverified.";

function main() {
  let md = require("node:fs").readFileSync(README, "utf8") as string;
  const rows = buildRows();

  let prevBlock = "";
  let bootstrap = false;
  const startsAt = md.indexOf(START);
  const endsAt = md.indexOf(END);
  if (startsAt >= 0 && endsAt > startsAt) {
    prevBlock = md.slice(startsAt + START.length, endsAt);
  } else {
    // Bootstrap: no markers yet. Capture the legacy table (by its header row)
    // to preserve dates, strip it, and drop the obsolete "Verified" bullet.
    bootstrap = true;
    const hdrMatch = md.match(/^\| Code \| Country \|.*$/m);
    if (hdrMatch) {
      const hdrStart = md.indexOf(hdrMatch[0]);
      const tail = md.slice(hdrStart);
      const tableLines = tail.split("\n");
      let last = 0;
      while (last < tableLines.length && tableLines[last].trim().startsWith("|")) last++;
      prevBlock = tableLines.slice(0, last).join("\n");
      md = md.slice(0, hdrStart).replace(/^- \*\*Verified\*\* —.*\n/m, "") + tableLines.slice(last).join("\n");
    }
    md = md.replace(/\n+$/, "\n");
  }

  const { map: prev, dataCols } = parsePrev(prevBlock);
  const table = renderTable(rows, prev, dataCols, bootstrap);
  const block = `${START}\n\n${NOTE}\n\n${table}\n\n${END}`;

  if (startsAt >= 0 && endsAt > startsAt) {
    md = md.slice(0, startsAt) + block + md.slice(endsAt + END.length);
  } else {
    md = `${md.replace(/\n+$/, "\n")}\n${block}\n`;
  }

  require("node:fs").writeFileSync(README, md);
  const flagged = rows.filter(
    (r) => prev.get(r.code)?.hadBang || (!bootstrap && prev.get(r.code)?.signature !== sigOver(r.cells, dataCols)),
  );
  console.log(`Wrote ${rows.length} rows${bootstrap ? " (bootstrap, no flags)" : `, ${flagged.length} flagged ❗`}.`);
}

main();
