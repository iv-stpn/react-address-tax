import { type CSSProperties, useState } from "react";
import { AddressInput } from "../components/AddressInput/index.js";
import { AddressTaxInput } from "../components/AddressTaxInput/index.js";
import type { AddressValue, ConsumptionTaxValue, TaxType } from "../types.js";
import {
	type ConsumptionTaxOutcome,
	type ConsumptionTaxTreatment,
	computeConsumptionTaxOutcome,
} from "./tax.js";

// ---------------------------------------------------------------------------
// ConsumptionTaxPanel
// ---------------------------------------------------------------------------

const COLORS: Record<
	ConsumptionTaxTreatment,
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
	"outside-eu": {
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
	"no-country": {
		bg: "#f9fafb",
		border: "#e5e7eb",
		text: "#9ca3af",
		badge: "#d1d5db",
	},
};

function formatRate(rate: number | null): string {
	if (rate === null) return "—";
	return `${rate}%`;
}

function ConsumptionTaxPanel({ outcome }: { outcome: ConsumptionTaxOutcome }) {
	const c = COLORS[outcome.treatment];
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
					marginBottom: 6,
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
					{outcome.headline}
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
					{formatRate(outcome.rate)}
				</span>
			</div>
			<p style={{ margin: 0, fontSize: 12, color: c.text, lineHeight: 1.5 }}>
				{outcome.detail}
			</p>
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
		state: "",
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
		state: "",
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

	const outcome =
		!hasNexus && (addressValue.country || defaultCountry)
			? {
					treatment: "no-nexus" as const,
					headline: "No nexus — not collecting",
					rate: null,
					detail:
						"You have no tax nexus in this country. No consumption tax collection is required from your side.",
				}
			: computeConsumptionTaxOutcome(
					addressValue.country,
					effectiveIsBusiness,
					hasConsumptionTaxId,
					addressValue.state,
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
			<ConsumptionTaxPanel outcome={outcome} />
			<span style={sectionLabelStyle}>Address value</span>
			<pre style={jsonStyle}>{JSON.stringify(addressValue, null, 2)}</pre>
			<span style={sectionLabelStyle}>Tax value</span>
			<pre style={jsonStyle}>
				{JSON.stringify({ ...taxValue, rate: outcome.rate }, null, 2)}
			</pre>
		</div>
	);
}
