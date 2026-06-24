// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import type { SupportedCountryCode } from "./address.js";

/**
 * How a jurisdiction's consumption tax is collected:
 * - "oss": EU one-stop-shop — B2B with a valid tax id reverse-charges to 0%.
 * - "country-specific": a single rate (or per-region rate) applies locally.
 */
export type TaxSystem = "oss" | "country-specific";

export interface TaxConfig {
	taxName: string;
	/** Standard consumer-facing rate; null = no consumption tax in this jurisdiction. */
	baseConsumerTax: number | null;
	taxSystem: TaxSystem;
	/** 0 = no threshold (always collect); positive = registration threshold in local currency; null = seller never collects. */
	collectionThreshold: number | null;
	/** Sales to this country are zero-rated exports (UK): invoice at 0%, buyer self-accounts. */
	zeroRatedExport?: boolean;
	/** Local / municipal rates may stack on top of the headline rate (US sales tax). */
	localSurcharge?: boolean;
	/** Consumption tax identifier metadata (prefix/pattern/example) for supported countries. */
	consumptionTaxPrefix?: string;
	consumptionTaxPattern?: RegExp;
	consumptionTaxExample?: string;
}

/**
 * A country maps either to a single {@link TaxConfig}, or — for countries with
 * regional tax exceptions (US states, CA provinces) — to a record of region
 * code → config. Country-level fields are identical across a record's entries;
 * only `baseConsumerTax` varies by region.
 */
export type CountryTaxEntry = TaxConfig | Record<string, TaxConfig>;

export interface TaxOutcomeFlags {
	/** Buyer self-accounts via reverse charge or self-assessment. */
	buyerSelfAccounts: boolean;
	/** Invoice must be issued at 0%. */
	invoiceAtZero: boolean;
	/** Rate varies by state / province — needs regional selection. */
	regionalRates: boolean;
	/** Local / municipal rates may stack on top of the state rate (US). */
	localSurcharge: boolean;
}

export interface ConsumptionTaxOutcome {
	/** Collection system of the resolved country, or null when no country applies. */
	taxSystem: TaxSystem | null;
	/** Local name of the tax (e.g. "TVA", "GST"), or null when not applicable. */
	taxName: string | null;
	/**
	 * Consumption tax rate (%) that would apply if the seller had a nexus in the
	 * resolved jurisdiction — the headline rate for this transaction, reverse-
	 * charge aware (B2B with a valid ID, or a zero-rated export → 0) but NOT
	 * gated by nexus. null when the rate can't be resolved: no/unknown country,
	 * a regional country with no state selected, or a jurisdiction with no
	 * consumption tax.
	 */
	baseTax: number | null;
	/**
	 * Rate the seller actually charges: {@link baseTax} when {@link hasNexus}, 0
	 * otherwise. null only when {@link hasNexus} is true and {@link baseTax}
	 * itself can't be resolved.
	 */
	effectiveTax: number | null;
	/** Whether the seller has a nexus in the resolved country (mirrors the input). */
	hasNexus: boolean;
	/** Resolved state/province code, when one was supplied. */
	state: string | null;
	/** 0 = no threshold (always collect); positive = registration threshold in local currency; null = seller never collects. */
	collectionThreshold: number | null;
	flags: TaxOutcomeFlags;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** EU member state on the one-stop-shop system (standard VAT, B2B reverse charge). */
function eu(rate: number, taxName: string): TaxConfig {
	return {
		taxName,
		baseConsumerTax: rate,
		taxSystem: "oss",
		collectionThreshold: 0,
	};
}

/**
 * Flat-rate consumption tax outside the EU VAT area (a single rate applies to
 * everyone). Used for non-EU European countries and other developed economies.
 * `rate: null` models jurisdictions with no consumption tax at all.
 */
function flat(
	taxName: string,
	rate: number | null,
	collectionThreshold: number | null,
): TaxConfig {
	return {
		taxName,
		baseConsumerTax: rate,
		taxSystem: "country-specific",
		collectionThreshold,
	};
}

/**
 * Build a region record for a country whose rate varies by state/province.
 * Country-level fields come from `base`; each region's `baseConsumerTax` comes
 * from `rates` (null = no tax in that region).
 */
function regional(
	base: Omit<TaxConfig, "baseConsumerTax">,
	rates: Record<string, number | null>,
): Record<string, TaxConfig> {
	const out: Record<string, TaxConfig> = {};
	for (const [code, rate] of Object.entries(rates)) {
		out[code] = { ...base, baseConsumerTax: rate };
	}
	return out;
}

// ---------------------------------------------------------------------------
// Main tax config table
// ---------------------------------------------------------------------------

export const TAX_CONFIG: Record<SupportedCountryCode, CountryTaxEntry> = {
	// ---- EU member states (all 27, standard VAT rates as of 2025) -----------
	AT: {
		...eu(20, "MwSt"),
		consumptionTaxPrefix: "ATU",
		consumptionTaxPattern: /^ATU\d{8}$/,
		consumptionTaxExample: "ATU12345678",
	},
	BE: {
		...eu(21, "BTW/TVA"),
		consumptionTaxPrefix: "BE",
		consumptionTaxPattern: /^BE0\d{9}$/,
		consumptionTaxExample: "BE0123456789",
	},
	BG: eu(20, "DDS"),
	CY: eu(19, "FPA"),
	CZ: eu(21, "DPH"),
	DE: {
		...eu(19, "MwSt"),
		consumptionTaxPrefix: "DE",
		consumptionTaxPattern: /^DE\d{9}$/,
		consumptionTaxExample: "DE123456789",
	},
	DK: eu(25, "Moms"),
	EE: eu(22, "KM"),
	ES: {
		...eu(21, "IVA"),
		consumptionTaxPrefix: "ES",
		consumptionTaxPattern: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
		consumptionTaxExample: "ESA12345678",
	},
	FI: eu(25.5, "ALV"),
	FR: {
		...eu(20, "TVA"),
		consumptionTaxPrefix: "FR",
		consumptionTaxPattern: /^FR[A-Z0-9]{2}\d{9}$/,
		consumptionTaxExample: "FRXX123456789",
	},
	GR: eu(24, "FPA"),
	HR: eu(25, "PDV"),
	HU: eu(27, "ÁFA"),
	IE: eu(23, "VAT"),
	IT: {
		...eu(22, "IVA"),
		consumptionTaxPrefix: "IT",
		consumptionTaxPattern: /^IT\d{11}$/,
		consumptionTaxExample: "IT12345678901",
	},
	LT: eu(21, "PVM"),
	LU: eu(17, "TVA"),
	LV: eu(21, "PVN"),
	MT: eu(18, "VAT"),
	NL: {
		...eu(21, "BTW"),
		consumptionTaxPrefix: "NL",
		consumptionTaxPattern: /^NL\d{9}B\d{2}$/,
		consumptionTaxExample: "NL123456789B01",
	},
	PL: {
		...eu(23, "VAT"),
		consumptionTaxPrefix: "PL",
		consumptionTaxPattern: /^PL\d{10}$/,
		consumptionTaxExample: "PL1234567890",
	},
	PT: eu(23, "IVA"),
	RO: eu(19, "TVA"),
	SE: eu(25, "Moms"),
	SI: eu(22, "DDV"),
	SK: eu(23, "DPH"),

	// ---- United Kingdom -------------------------------------------------------
	// Post-Brexit: outside EU VAT area. B2B with a UK VAT number → zero-rated
	// export (reverse charge on buyer); B2C → also zero-rated (UK VAT buyer-side).
	GB: {
		taxName: "VAT",
		baseConsumerTax: 20,
		taxSystem: "country-specific",
		collectionThreshold: null,
		zeroRatedExport: true,
		consumptionTaxPrefix: "GB",
		consumptionTaxPattern: /^GB(\d{9}|\d{12}|(GD|HA)\d{3})$/,
		consumptionTaxExample: "GB123456789",
	},

	// ---- Switzerland ----------------------------------------------------------
	// Outside EU VAT area. Swiss MWST/TVA/IVA may apply on buyer's side.
	CH: {
		...flat("MWST/TVA/IVA", 8.1, 100_000),
		consumptionTaxPrefix: "CHE",
		consumptionTaxPattern: /^CHE-\d{3}\.\d{3}\.\d{3}(MWST|TVA|IVA)?$/,
		consumptionTaxExample: "CHE-123.456.789MWST",
	},

	// ---- United States --------------------------------------------------------
	// No federal sales tax. Rate varies by state; null = no state sales tax.
	US: regional(
		{
			taxName: "Sales Tax",
			taxSystem: "country-specific",
			collectionThreshold: null,
			localSurcharge: true,
			consumptionTaxPrefix: "",
			consumptionTaxPattern: /^\d{2}-\d{7}$/,
			consumptionTaxExample: "12-3456789",
		},
		{
			AL: 4,
			AK: null, // No state sales tax (local may apply)
			AZ: 5.6,
			AR: 6.5,
			CA: 7.25,
			CO: 2.9,
			CT: 6.35,
			DC: 6,
			DE: null, // No sales tax
			FL: 6,
			GA: 4,
			HI: 4, // General Excise Tax (GET), not a traditional sales tax
			ID: 6,
			IL: 6.25,
			IN: 7,
			IA: 6,
			KS: 6.5,
			KY: 6,
			LA: 4.45,
			ME: 5.5,
			MD: 6,
			MA: 6.25,
			MI: 6,
			MN: 6.875,
			MS: 7,
			MO: 4.225,
			MT: null, // No sales tax
			NE: 5.5,
			NV: 6.85,
			NH: null, // No sales tax
			NJ: 6.625,
			NM: 5,
			NY: 4,
			NC: 4.75,
			ND: 5,
			OH: 5.75,
			OK: 4.5,
			OR: null, // No sales tax
			PA: 6,
			RI: 7,
			SC: 6,
			SD: 4.5,
			TN: 7,
			TX: 6.25,
			UT: 4.85,
			VT: 6,
			VA: 5.3,
			WA: 6.5,
			WV: 6,
			WI: 5,
			WY: 4,
		},
	),

	// ---- Canada ---------------------------------------------------------------
	// GST (5%) + provincial HST or PST. Rate given is the combined effective rate.
	CA: regional(
		{
			taxName: "GST/HST",
			taxSystem: "country-specific",
			collectionThreshold: 30_000,
			consumptionTaxPrefix: "",
			consumptionTaxPattern: /^\d{9}RT\d{4}$/,
			consumptionTaxExample: "123456789RT0001",
		},
		{
			AB: 5, // GST only
			BC: 12, // 5% GST + 7% PST
			MB: 12, // 5% GST + 7% PST
			NB: 15, // 15% HST
			NL: 15, // 15% HST
			NS: 15, // 15% HST
			NT: 5, // GST only
			NU: 5, // GST only
			ON: 13, // 13% HST
			PE: 15, // 15% HST
			QC: 14.975, // 5% GST + 9.975% QST
			SK: 11, // 5% GST + 6% PST
			YT: 5, // GST only
		},
	),

	// ---- Australia ------------------------------------------------------------
	AU: {
		...flat("GST", 10, 75_000),
		consumptionTaxPrefix: "",
		consumptionTaxPattern: /^\d{11}$/,
		consumptionTaxExample: "12345678901",
	},

	// ---- Japan ----------------------------------------------------------------
	JP: {
		...flat("Consumption Tax", 10, 10_000_000),
		consumptionTaxPrefix: "T",
		consumptionTaxPattern: /^T\d{13}$/,
		consumptionTaxExample: "T1234567890123",
	},

	// ---- Other European countries (non-EU) ------------------------------------
	NO: flat("MVA", 25, 50_000), // Norway
	IS: flat("VSK", 24, 2_000_000), // Iceland
	LI: flat("MWST", 8.1, 100_000), // Liechtenstein (Swiss VAT union)
	AD: flat("IGI", 4.5, 40_000), // Andorra
	MC: flat("TVA", 20, 0), // Monaco (French VAT)
	SM: flat("Imposta", 17, 0), // San Marino
	AL: flat("TVSH", 20, 10_000_000), // Albania
	BA: flat("PDV", 17, 50_000), // Bosnia and Herzegovina
	GE: flat("DGhG", 18, 100_000), // Georgia
	MD: flat("TVA", 20, 1_200_000), // Moldova
	ME: flat("PDV", 21, 30_000), // Montenegro
	MK: flat("DDV", 18, 2_000_000), // North Macedonia
	RS: flat("PDV", 20, 8_000_000), // Serbia
	TR: flat("KDV", 20, 0), // Turkey (transcontinental)
	UA: flat("PDV", 20, 1_000_000), // Ukraine
	XK: flat("TVSH", 18, 30_000), // Kosovo

	// ---- Other developed economies --------------------------------------------
	NZ: flat("GST", 15, 60_000), // New Zealand
	KR: flat("VAT", 10, 0), // South Korea
	SG: flat("GST", 9, 1_000_000), // Singapore
	IL: flat("Ma'am", 18, 0), // Israel
	TW: flat("Business Tax", 5, 480_000), // Taiwan
	AE: flat("VAT", 5, 375_000), // United Arab Emirates
	HK: flat("No GST", null, null), // Hong Kong (no consumption tax)
	MO: flat("No GST", null, null), // Macao (no consumption tax)
};

// ---------------------------------------------------------------------------
// Entry resolution
// ---------------------------------------------------------------------------

/** A region record has no own `taxSystem` field; a plain TaxConfig does. */
function isRegional(
	entry: CountryTaxEntry,
): entry is Record<string, TaxConfig> {
	return !("taxSystem" in entry);
}

/** True when a country's tax rate varies by state/province. */
export function hasRegionalTax(country: string): boolean {
	const entry = TAX_CONFIG[country.toUpperCase() as SupportedCountryCode];
	return !!entry && isRegional(entry);
}

/**
 * Resolve a country to its (country-level) {@link TaxConfig}, exposing the
 * consumption-tax identifier metadata (prefix/pattern/example). For regional
 * countries these fields are identical across regions, so any entry serves.
 */
export function getConsumptionTaxConfig(
	country: string,
): TaxConfig | undefined {
	const entry = TAX_CONFIG[country.toUpperCase() as SupportedCountryCode];
	if (!entry) return undefined;
	return isRegional(entry) ? Object.values(entry)[0] : entry;
}

/**
 * Resolve a country (and optional region) to a single {@link TaxConfig}.
 * For regional countries, returns the matching region's config, or any entry
 * (for country-level fields) when no/unknown region is supplied.
 */
function resolveConfig(
	entry: CountryTaxEntry,
	state: string | undefined,
): { config: TaxConfig; regionResolved: boolean } {
	if (!isRegional(entry)) return { config: entry, regionResolved: false };

	if (state) {
		const match = entry[state.toUpperCase()];
		if (match) return { config: match, regionResolved: true };
	}
	// No region selected (or unknown): fall back to the first entry for
	// country-level fields. Its `baseConsumerTax` is not authoritative.
	// Region records are always non-empty (built via `regional`).
	const fallback = Object.values(entry)[0];
	return { config: fallback as TaxConfig, regionResolved: false };
}

// ---------------------------------------------------------------------------
// Outcome builder
// ---------------------------------------------------------------------------

const NO_FLAGS: TaxOutcomeFlags = {
	buyerSelfAccounts: false,
	invoiceAtZero: false,
	regionalRates: false,
	localSurcharge: false,
};

function makeFlags(partial: Partial<TaxOutcomeFlags>): TaxOutcomeFlags {
	return { ...NO_FLAGS, ...partial };
}

const EMPTY_OUTCOME: ConsumptionTaxOutcome = {
	taxSystem: null,
	taxName: null,
	baseTax: null,
	effectiveTax: 0,
	hasNexus: false,
	state: null,
	collectionThreshold: null,
	flags: NO_FLAGS,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function computeConsumptionTaxOutcome(
	country: string,
	isBusiness: boolean,
	hasConsumptionTaxId: boolean,
	hasNexus: boolean,
	state?: string,
): ConsumptionTaxOutcome {
	if (!country) return { ...EMPTY_OUTCOME, hasNexus };

	const entry = TAX_CONFIG[country.toUpperCase() as SupportedCountryCode];
	if (!entry) return { ...EMPTY_OUTCOME, hasNexus };

	const { config, regionResolved } = resolveConfig(entry, state);
	const base = {
		taxSystem: config.taxSystem,
		taxName: config.taxName,
		state: state ? state.toUpperCase() : null,
		hasNexus,
	} as const;

	// `effectiveTax` is `baseTax` when the seller has a nexus, else 0 — so the
	// seller only charges when they actually have a collection obligation.
	const effective = (b: number | null): number | null => (hasNexus ? b : 0);

	// OSS countries reverse-charge B2B sales to identifier holders (invoice at
	// 0%, buyer self-accounts), otherwise charge the standard rate.
	if (config.taxSystem === "oss") {
		if (isBusiness && hasConsumptionTaxId) {
			const baseTax = 0;
			return {
				...base,
				baseTax,
				effectiveTax: effective(baseTax),
				collectionThreshold: null,
				flags: makeFlags({ buyerSelfAccounts: true, invoiceAtZero: true }),
			};
		}
		const baseTax = config.baseConsumerTax;
		return {
			...base,
			baseTax,
			effectiveTax: effective(baseTax),
			collectionThreshold: config.collectionThreshold,
			flags: NO_FLAGS,
		};
	}

	// Zero-rated exports (UK): invoice at 0%, buyer self-accounts.
	if (config.zeroRatedExport) {
		const baseTax = 0;
		return {
			...base,
			baseTax,
			effectiveTax: effective(baseTax),
			collectionThreshold: null,
			flags: makeFlags({ buyerSelfAccounts: true, invoiceAtZero: true }),
		};
	}

	// Country-specific: rate comes from the resolved region (when applicable).
	const isRegionalCountry = isRegional(entry);
	const baseTax =
		regionResolved || !isRegionalCountry ? config.baseConsumerTax : null;
	return {
		...base,
		baseTax,
		effectiveTax: effective(baseTax),
		collectionThreshold: config.collectionThreshold,
		flags: makeFlags({
			regionalRates: isRegionalCountry,
			localSurcharge: !!config.localSurcharge,
		}),
	};
}
