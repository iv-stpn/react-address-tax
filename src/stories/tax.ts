// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaxRegion = "eu" | "uk" | "ch" | "us" | "ca" | "au" | "jp" | "other";

export type ConsumptionTaxTreatment =
	| "reverse-charge"
	| "standard"
	| "zero-rated"
	| "outside-eu"
	| "no-nexus"
	| "no-country";

export interface TaxScenario {
	/** null = matches regardless of business status */
	isBusiness: boolean | null;
	/** null = matches regardless of identifier status */
	hasId: boolean | null;
	treatment: ConsumptionTaxTreatment;
	/** null = no fixed rate (e.g. US/CA regional, or not applicable) */
	rate: number | null;
}

export interface CountryTaxConfig {
	region: TaxRegion;
	taxName: string;
	/** Country-level standard rate, used for display in reverse-charge details. */
	standardRate?: number;
	/** Ordered rows — first match wins. */
	scenarios: TaxScenario[];
	/** State/province-level rates. null value = no tax in that region. */
	regionalRates?: Record<string, number | null>;
}

export interface ConsumptionTaxOutcome {
	treatment: ConsumptionTaxTreatment;
	headline: string;
	rate: number | null;
	detail: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function eu(rate: number, taxName: string): CountryTaxConfig {
	return {
		region: "eu",
		taxName,
		standardRate: rate,
		scenarios: [
			// | isBusiness | hasId | treatment      | rate |
			{ isBusiness: true, hasId: true, treatment: "reverse-charge", rate: 0 },
			{ isBusiness: true, hasId: false, treatment: "standard", rate },
			{ isBusiness: null, hasId: null, treatment: "standard", rate },
		],
	};
}

// ---------------------------------------------------------------------------
// Main tax config table
// ---------------------------------------------------------------------------

export const TAX_CONFIG: Record<string, CountryTaxConfig> = {
	// ---- EU member states (all 27, standard VAT rates as of 2025) -----------
	AT: eu(20, "MwSt"),
	BE: eu(21, "BTW/TVA"),
	BG: eu(20, "DDS"),
	CY: eu(19, "FPA"),
	CZ: eu(21, "DPH"),
	DE: eu(19, "MwSt"),
	DK: eu(25, "Moms"),
	EE: eu(22, "KM"),
	ES: eu(21, "IVA"),
	FI: eu(25.5, "ALV"),
	FR: eu(20, "TVA"),
	GR: eu(24, "FPA"),
	HR: eu(25, "PDV"),
	HU: eu(27, "ÁFA"),
	IE: eu(23, "VAT"),
	IT: eu(22, "IVA"),
	LT: eu(21, "PVM"),
	LU: eu(17, "TVA"),
	LV: eu(21, "PVN"),
	MT: eu(18, "VAT"),
	NL: eu(21, "BTW"),
	PL: eu(23, "VAT"),
	PT: eu(23, "IVA"),
	RO: eu(19, "TVA"),
	SE: eu(25, "Moms"),
	SI: eu(22, "DDV"),
	SK: eu(23, "DPH"),

	// ---- United Kingdom -------------------------------------------------------
	// Post-Brexit: outside EU VAT area.
	// B2B with UK VAT number → zero-rated export (reverse charge on buyer).
	// B2C or B2B without number → also zero-rated export (UK VAT on buyer's side).
	GB: {
		region: "uk",
		taxName: "VAT",
		standardRate: 20,
		scenarios: [
			// | isBusiness | hasId | treatment   | rate |
			{ isBusiness: true, hasId: true, treatment: "zero-rated", rate: 0 },
			{ isBusiness: null, hasId: null, treatment: "zero-rated", rate: 0 },
		],
	},

	// ---- Switzerland ----------------------------------------------------------
	// Outside EU VAT area. Swiss MWST/TVA/IVA may apply on buyer's side.
	CH: {
		region: "ch",
		taxName: "MWST/TVA/IVA",
		standardRate: 8.1,
		scenarios: [
			{ isBusiness: null, hasId: null, treatment: "outside-eu", rate: 8.1 },
		],
	},

	// ---- United States --------------------------------------------------------
	// No federal sales tax. Rate varies by state; null = no state sales tax.
	US: {
		region: "us",
		taxName: "Sales Tax",
		scenarios: [
			{ isBusiness: null, hasId: null, treatment: "outside-eu", rate: null },
		],
		// State-level rates (state rate only; local rates vary further).
		regionalRates: {
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
	},

	// ---- Canada ---------------------------------------------------------------
	// GST (5%) + provincial HST or PST. Rate given is the combined effective rate.
	CA: {
		region: "ca",
		taxName: "GST/HST",
		scenarios: [
			{ isBusiness: null, hasId: null, treatment: "outside-eu", rate: null },
		],
		// Province-level combined rates (GST + HST/PST/QST where applicable).
		regionalRates: {
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
	},

	// ---- Australia ------------------------------------------------------------
	AU: {
		region: "au",
		taxName: "GST",
		standardRate: 10,
		scenarios: [
			{ isBusiness: null, hasId: null, treatment: "outside-eu", rate: 10 },
		],
	},

	// ---- Japan ----------------------------------------------------------------
	JP: {
		region: "jp",
		taxName: "Consumption Tax",
		standardRate: 10,
		scenarios: [
			{ isBusiness: null, hasId: null, treatment: "outside-eu", rate: 10 },
		],
	},
};

// ---------------------------------------------------------------------------
// Scenario matching
// ---------------------------------------------------------------------------

function matchesScenario(
	s: TaxScenario,
	isBusiness: boolean,
	hasId: boolean,
): boolean {
	if (s.isBusiness !== null && s.isBusiness !== isBusiness) return false;
	if (s.hasId !== null && s.hasId !== hasId) return false;
	return true;
}

// ---------------------------------------------------------------------------
// Outcome builder
// ---------------------------------------------------------------------------

function buildOutcome(
	config: CountryTaxConfig,
	scenario: TaxScenario,
	country: string,
	rate: number | null,
	state: string | undefined,
): ConsumptionTaxOutcome {
	const { taxName, region, standardRate } = config;
	const { treatment } = scenario;

	switch (treatment) {
		case "reverse-charge":
			return {
				treatment,
				headline: "Reverse Charge",
				rate: 0,
				detail: `Intra-EU B2B. Customer self-accounts for ${taxName} (${standardRate}%) in their country. Invoice at 0%.`,
			};

		case "standard":
			return {
				treatment,
				headline: `Standard ${taxName} — ${rate}%`,
				rate,
				detail: `Apply ${country} ${taxName} at ${rate}%.`,
			};

		case "zero-rated":
			return {
				treatment,
				headline: "Zero-rated Export",
				rate: 0,
				detail: `Post-Brexit B2B export. UK VAT (${standardRate}%) self-accounted on the buyer's side. Invoice at 0%.`,
			};

		case "outside-eu": {
			if (region === "us") {
				if (!state) {
					return {
						treatment,
						headline: "US Sales Tax — select state",
						rate: null,
						detail: "Select a state to determine the applicable sales tax rate.",
					};
				}
				if (rate === null) {
					return {
						treatment,
						headline: `No ${taxName} — ${state}`,
						rate: null,
						detail: `${state} has no state-level sales tax.`,
					};
				}
				return {
					treatment,
					headline: `${taxName} — ${state} ${rate}%`,
					rate,
					detail: `${state} state-level sales tax at ${rate}%. Local rates may also apply.`,
				};
			}

			if (region === "ca") {
				if (!state) {
					return {
						treatment,
						headline: "Canadian GST/HST — select province",
						rate: null,
						detail: "Select a province or territory to determine the combined GST/HST/PST rate.",
					};
				}
				if (rate === null) {
					return {
						treatment,
						headline: `${taxName} — ${state}`,
						rate: null,
						detail: `${state}: rate not available.`,
					};
				}
				return {
					treatment,
					headline: `${taxName} — ${state} ${rate}%`,
					rate,
					detail: `${state} combined ${taxName} rate at ${rate}%.`,
				};
			}

			// All other outside-EU countries
			if (rate === null) {
				return {
					treatment,
					headline: `Outside EU — ${taxName}`,
					rate: null,
					detail: `Tax treatment for ${country} depends on local regulations.`,
				};
			}
			return {
				treatment,
				headline: `Outside EU — ${taxName} ${rate}%`,
				rate,
				detail: `${country} ${taxName} at ${rate}% may apply on the buyer's side.`,
			};
		}

		default:
			return { treatment, headline: taxName, rate, detail: "" };
	}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function computeConsumptionTaxOutcome(
	country: string,
	isBusiness: boolean,
	hasConsumptionTaxId: boolean,
	state?: string,
): ConsumptionTaxOutcome {
	if (!country) {
		return {
			treatment: "no-country",
			headline: "No country selected",
			rate: null,
			detail: "Select a country to see the applicable tax treatment.",
		};
	}

	const config = TAX_CONFIG[country.toUpperCase()];
	if (!config) {
		return {
			treatment: "outside-eu",
			headline: "Outside EU",
			rate: null,
			detail: "Tax treatment depends on local regulations of the destination country.",
		};
	}

	const scenario = config.scenarios.find((s) =>
		matchesScenario(s, isBusiness, hasConsumptionTaxId),
	);
	if (!scenario) {
		return {
			treatment: "outside-eu",
			headline: config.taxName,
			rate: null,
			detail: "",
		};
	}

	// For regional-tax countries, resolve the rate from state/province.
	let rate = scenario.rate;
	if (config.regionalRates && state) {
		const regionalRate = config.regionalRates[state.toUpperCase()];
		if (regionalRate !== undefined) {
			rate = regionalRate;
		}
	}

	return buildOutcome(config, scenario, country, rate, state);
}
