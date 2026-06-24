import { type CSSProperties, useState } from "react";
import { AddressInput } from "../components/AddressInput/index.js";
import { AddressTaxInput } from "../components/AddressTaxInput/index.js";
import type { AddressValue, ConsumptionTaxValue, TaxType } from "../types.js";
import {
	type ConsumptionTaxOutcome,
	computeConsumptionTaxOutcome,
	type TaxOutcomeFlags,
} from "../utils/tax.js";

// ---------------------------------------------------------------------------
// ConsumptionTaxPanel
// ---------------------------------------------------------------------------

/** Display-only categorization derived from the outcome flags. */
type TaxCategory =
	| "reverse-charge"
	| "standard"
	| "zero-rated"
	| "regional-us"
	| "regional-ca"
	| "outside"
	| "no-nexus"
	| "none";

function categorize(o: ConsumptionTaxOutcome): TaxCategory {
	if (o.taxSystem === null) return "none";
	if (o.taxSystem === "oss") {
		return o.flags.buyerSelfAccounts ? "reverse-charge" : "standard";
	}
	if (o.flags.invoiceAtZero && o.flags.buyerSelfAccounts) return "zero-rated";
	if (o.flags.localSurcharge) return "regional-us";
	if (o.flags.regionalRates) return "regional-ca";
	return "outside";
}

const COLORS: Record<
	TaxCategory,
	{ bg: string; border: string; text: string; badge: string }
> = {
	"reverse-charge": {
		bg: "#d1fae5",
		border: "#10b981",
		text: "#065f46",
		badge: "#059669",
	},
	standard: {
		bg: "#fef3c7",
		border: "#f59e0b",
		text: "#92400e",
		badge: "#d97706",
	},
	"zero-rated": {
		bg: "#dbeafe",
		border: "#3b82f6",
		text: "#1e40af",
		badge: "#2563eb",
	},
	"regional-us": {
		bg: "#f3f4f6",
		border: "#9ca3af",
		text: "#374151",
		badge: "#6b7280",
	},
	"regional-ca": {
		bg: "#f3f4f6",
		border: "#9ca3af",
		text: "#374151",
		badge: "#6b7280",
	},
	outside: {
		bg: "#f3f4f6",
		border: "#9ca3af",
		text: "#374151",
		badge: "#6b7280",
	},
	"no-nexus": {
		bg: "#fdf4ff",
		border: "#a855f7",
		text: "#6b21a8",
		badge: "#9333ea",
	},
	none: {
		bg: "#f9fafb",
		border: "#e5e7eb",
		text: "#9ca3af",
		badge: "#d1d5db",
	},
};

const FLAG_ROWS: { key: keyof TaxOutcomeFlags; label: string }[] = [
	{ key: "buyerSelfAccounts", label: "Buyer self-accounts" },
	{ key: "invoiceAtZero", label: "Invoice at 0%" },
	{ key: "regionalRates", label: "Regional rates" },
	{ key: "localSurcharge", label: "Local surcharge may apply" },
];

function formatRate(rate: number | null): string {
	if (rate === null) return "—";
	return `${rate}%`;
}

function buildHeadline(
	category: TaxCategory,
	o: ConsumptionTaxOutcome,
): string {
	const { taxName, effectiveTax: rate, state } = o;
	switch (category) {
		case "none":
			return "No country selected";
		case "no-nexus":
			return "No nexus — not collecting";
		case "reverse-charge":
			return "Reverse Charge";
		case "zero-rated":
			return "Zero-rated Export";
		case "standard":
			return `Standard ${taxName} — ${rate}%`;
		case "regional-us":
			if (!state) return "US Sales Tax — select state";
			if (rate === null) return `No ${taxName} — ${state}`;
			return `${taxName} — ${state} ${rate}%`;
		case "regional-ca":
			if (!state) return "Canadian GST/HST — select province";
			if (rate === null) return `${taxName} — ${state}`;
			return `${taxName} — ${state} ${rate}%`;
		default:
			if (!taxName) return "Outside EU";
			if (rate === null) return `Outside EU — ${taxName}`;
			return `Outside EU — ${taxName} ${rate}%`;
	}
}

function ConsumptionTaxPanel({
	outcome,
	noNexus = false,
}: {
	outcome: ConsumptionTaxOutcome;
	noNexus?: boolean;
}) {
	const category: TaxCategory = noNexus ? "no-nexus" : categorize(outcome);
	const c = COLORS[category];
	return (
		<div
			style={{
				padding: "12px 16px",
				background: c.bg,
				border: `1px solid ${c.border}`,
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					marginBottom: 8,
				}}
			>
				<span
					style={{
						background: c.badge,
						color: "#fff",
						fontSize: 11,
						fontWeight: 700,
						padding: "2px 8px",
						letterSpacing: "0.04em",
						textTransform: "uppercase",
					}}
				>
					TAX
				</span>
				<span style={{ fontWeight: 600, color: c.text, fontSize: 14 }}>
					{buildHeadline(category, outcome)}
				</span>
				<span
					style={{
						marginLeft: "auto",
						fontWeight: 700,
						fontSize: 18,
						color: c.badge,
						fontVariantNumeric: "tabular-nums",
					}}
				>
					{formatRate(outcome.effectiveTax)}
				</span>
			</div>
			<table
				style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
			>
				<tbody>
					<tr style={{ borderTop: `1px solid ${c.border}40` }}>
						<td style={{ padding: "3px 0", color: c.text }}>
							Collection threshold
						</td>
						<td
							style={{
								textAlign: "right",
								fontWeight: 700,
								color: c.badge,
								fontVariantNumeric: "tabular-nums",
							}}
						>
							{outcome.collectionThreshold === null ? (
								<span style={{ color: `${c.text}60` }}>—</span>
							) : outcome.collectionThreshold === 0 ? (
								"None"
							) : (
								outcome.collectionThreshold.toLocaleString()
							)}
						</td>
					</tr>
					{FLAG_ROWS.map(({ key, label }) => {
						const on = outcome.flags[key];
						return (
							<tr key={key} style={{ borderTop: `1px solid ${c.border}40` }}>
								<td style={{ padding: "3px 0", color: c.text }}>{label}</td>
								<td
									style={{
										textAlign: "right",
										fontWeight: 700,
										color: on ? c.badge : `${c.text}60`,
									}}
								>
									{on ? "✓" : "✗"}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const containerStyle: CSSProperties = {
	maxWidth: 480,
	fontFamily: "system-ui, sans-serif",
	padding: 24,
};

const jsonStyle: CSSProperties = {
	background: "#f4f4f4",
	border: "1px solid #e5e7eb",
	padding: "10px 14px",
	fontSize: 12,
	lineHeight: 1.6,
	color: "#374151",
	overflowX: "auto",
};

const sectionLabelStyle: CSSProperties = {
	display: "block",
	marginTop: 16,
	marginBottom: 4,
	fontSize: 11,
	fontWeight: 700,
	letterSpacing: "0.06em",
	textTransform: "uppercase",
	color: "#9ca3af",
};

// ---------------------------------------------------------------------------
// AddressWrapper — demos for AddressInput
// ---------------------------------------------------------------------------

type AddressWrapperProps = { defaultCountry?: string };

export function AddressWrapper({ defaultCountry }: AddressWrapperProps) {
	const [value, setValue] = useState<AddressValue>({
		line1: "",
		line2: "",
		city: "",
		level1: "",
		postalCode: "",
		country: defaultCountry ?? "",
	});

	return (
		<div style={containerStyle}>
			<AddressInput
				value={value}
				onChange={setValue}
				defaultCountry={defaultCountry}
			/>
			<span style={sectionLabelStyle}>Address value</span>
			<pre style={jsonStyle}>{JSON.stringify(value, null, 2)}</pre>
		</div>
	);
}

// ---------------------------------------------------------------------------
// AddressTaxWrapper — demos for AddressTaxInput
// ---------------------------------------------------------------------------

type AddressTaxWrapperProps = { defaultCountry?: string; taxType: TaxType };

export function AddressTaxWrapper({
	defaultCountry,
	taxType,
}: AddressTaxWrapperProps) {
	const [addressValue, setAddressValue] = useState<AddressValue>({
		line1: "",
		line2: "",
		city: "",
		level1: "",
		postalCode: "",
		country: defaultCountry ?? "",
	});
	const [taxValue, setTaxValue] = useState<ConsumptionTaxValue>({});
	const [isBusiness, setIsBusiness] = useState(false);
	const [hasNexus, setHasNexus] = useState(true);

	const effectiveIsBusiness =
		taxType === "business"
			? true
			: taxType === "individual"
				? false
				: isBusiness;
	const hasConsumptionTaxId = taxValue.hasIdentifier ?? true;

	const nexusList = hasNexus ? undefined : [];

	const hasCountry = !!(addressValue.country || defaultCountry);
	const noNexus = !hasNexus && hasCountry;
	const outcome = computeConsumptionTaxOutcome(
		addressValue.country,
		effectiveIsBusiness,
		hasConsumptionTaxId,
		hasNexus,
		addressValue.level1,
	);

	return (
		<div style={containerStyle}>
			<AddressTaxInput
				addressValue={addressValue}
				taxValue={taxValue}
				taxType={taxType}
				isBusiness={taxType === "either" ? isBusiness : undefined}
				nexusList={nexusList}
				defaultCountry={defaultCountry}
				onAddressChange={setAddressValue}
				onConsumptionTaxChange={setTaxValue}
				onBusinessChange={taxType === "either" ? setIsBusiness : undefined}
			/>
			<div style={{ marginTop: 12 }}>
				<label
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						cursor: "pointer",
						fontSize: 13,
					}}
				>
					<input
						type="checkbox"
						checked={hasNexus}
						onChange={(e) => setHasNexus(e.target.checked)}
					/>
					Has nexus in selected country?
				</label>
			</div>
			<span style={sectionLabelStyle}>Tax to collect</span>
			<ConsumptionTaxPanel outcome={outcome} noNexus={noNexus} />
			<span style={sectionLabelStyle}>Address value</span>
			<pre style={jsonStyle}>{JSON.stringify(addressValue, null, 2)}</pre>
			<span style={sectionLabelStyle}>Tax value</span>
			<pre style={jsonStyle}>
				{JSON.stringify(
					{
						...taxValue,
						baseTax: outcome.baseTax,
						effectiveTax: outcome.effectiveTax,
						hasNexus: outcome.hasNexus,
					},
					null,
					2,
				)}
			</pre>
		</div>
	);
}
