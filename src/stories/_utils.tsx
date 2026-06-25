import { type CSSProperties, useRef, useState } from "react";
import { AddressInput, type AddressInputHandle } from "../components/AddressInput/index";
import { AddressTaxInput } from "../components/AddressTaxInput/index";
import type { AddressCollectionMode, AddressValue, ValidationMode } from "../utils/address";
import type { ConsumptionTaxValue, TaxType } from "../utils/tax";
import { type ConsumptionTaxOutcome, computeConsumptionTaxOutcome, type TaxOutcomeFlags } from "../utils/tax";
import type { ValidationError } from "../utils/validation";

// ---------------------------------------------------------------------------
// ConsumptionTaxPanel
// ---------------------------------------------------------------------------

/** Display-only categorization derived from the outcome flags. */
type TaxCategory = "reverse-charge" | "standard" | "zero-rated" | "regional-us" | "regional-ca" | "outside" | "no-nexus" | "none";

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

const COLORS: Record<TaxCategory, { bg: string; border: string; text: string; badge: string }> = {
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

function formatTaxLabel(o: ConsumptionTaxOutcome): string | null {
  const { consumptionTaxLabel: en, localConsumptionTaxLabel: local } = o;
  if (!en && !local) return null;
  if (!en) return local;
  if (!local || en === local) return en;
  return `${en} / ${local}`;
}

function buildHeadline(category: TaxCategory, o: ConsumptionTaxOutcome): string {
  const { consumptionTaxLabel: taxName, effectiveTax: rate, state } = o;
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

function ConsumptionTaxPanel({ outcome, noNexus = false }: { outcome: ConsumptionTaxOutcome; noNexus?: boolean }) {
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
        <span style={{ fontWeight: 600, color: c.text, fontSize: 14 }}>{buildHeadline(category, outcome)}</span>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 1,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              color: c.badge,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatRate(outcome.effectiveTax)}
          </span>
          {formatTaxLabel(outcome) && (
            <span style={{ fontSize: 10, fontWeight: 600, color: c.badge, opacity: 0.75, letterSpacing: "0.04em" }}>
              {formatTaxLabel(outcome)}
            </span>
          )}
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <tbody>
          <tr style={{ borderTop: `1px solid ${c.border}40` }}>
            <td style={{ padding: "3px 0", color: c.text }}>Collection threshold</td>
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
// Demo controls — radios/checkboxes to exercise every prop state
// ---------------------------------------------------------------------------

const controlsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px 20px",
  alignItems: "flex-start",
  padding: "12px 14px",
  marginBottom: 16,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
};

const controlGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const controlLegendStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#6b7280",
};

const controlOptionStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
};

function RadioGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div style={controlGroupStyle}>
      <span style={controlLegendStyle}>{legend}</span>
      {options.map((opt) => (
        <label key={opt} style={controlOptionStyle}>
          <input type="radio" name={legend} checked={value === opt} onChange={() => onChange(opt)} />
          {opt}
        </label>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label style={controlOptionStyle}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

const MODES: readonly AddressCollectionMode[] = ["minimal", "regionMinimal", "region", "full"];
const VALIDATION_MODES: readonly ValidationMode[] = ["onType", "onBlur", "onSubmit"];

/** Renders the live validity from onValidationChange. */
function ValidationStatus({ valid, errors }: { valid: boolean; errors: ValidationError[] }) {
  return (
    <>
      <span style={sectionLabelStyle}>Validation</span>
      <div
        style={{
          ...jsonStyle,
          background: valid ? "#d1fae5" : "#fee2e2",
          border: `1px solid ${valid ? "#10b981" : "#ef4444"}`,
          color: valid ? "#065f46" : "#991b1b",
          fontWeight: 600,
        }}
      >
        {valid ? "✓ valid" : `✗ invalid — ${errors.map((e) => e.field).join(", ")}`}
      </div>
    </>
  );
}

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
  const [mode, setMode] = useState<AddressCollectionMode>("full");
  const [validationMode, setValidationMode] = useState<ValidationMode>("onType");
  const [requireLevel1, setRequireLevel1] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [validity, setValidity] = useState<{ valid: boolean; errors: ValidationError[] }>({ valid: true, errors: [] });
  const inputRef = useRef<AddressInputHandle>(null);

  return (
    <div style={containerStyle}>
      <div style={controlsStyle}>
        <RadioGroup legend="mode" value={mode} options={MODES} onChange={setMode} />
        <RadioGroup legend="validationMode" value={validationMode} options={VALIDATION_MODES} onChange={setValidationMode} />
        <div style={controlGroupStyle}>
          <span style={controlLegendStyle}>flags</span>
          <Toggle label="requireLevel1" checked={requireLevel1} onChange={setRequireLevel1} />
          <Toggle label="disabled" checked={disabled} onChange={setDisabled} />
          {validationMode === "onSubmit" && (
            <button type="button" onClick={() => inputRef.current?.validate()} style={{ marginTop: 4, cursor: "pointer" }}>
              Validate
            </button>
          )}
        </div>
      </div>
      <AddressInput
        ref={inputRef}
        value={value}
        onChange={setValue}
        mode={mode}
        validationMode={validationMode}
        requireLevel1={requireLevel1}
        disabled={disabled}
        defaultCountry={defaultCountry}
        onValidationChange={(valid, errors) => setValidity({ valid, errors })}
      />
      <ValidationStatus valid={validity.valid} errors={validity.errors} />
      <span style={sectionLabelStyle}>Address value</span>
      <pre style={jsonStyle}>{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddressTaxWrapper — demos for AddressTaxInput
// ---------------------------------------------------------------------------

type AddressTaxWrapperProps = { defaultCountry?: string; taxType: TaxType };

export function AddressTaxWrapper({ defaultCountry, taxType }: AddressTaxWrapperProps) {
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
  const [mode, setMode] = useState<AddressCollectionMode>("full");
  const [validationMode, setValidationMode] = useState<ValidationMode>("onType");
  const [consumptionTaxRequired, setConsumptionTaxRequired] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [validity, setValidity] = useState<{ valid: boolean; errors: ValidationError[] }>({ valid: true, errors: [] });
  const inputRef = useRef<AddressInputHandle>(null);

  const effectiveIsBusiness = taxType === "business" ? true : taxType === "individual" ? false : isBusiness;
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
      <div style={controlsStyle}>
        <RadioGroup legend="mode" value={mode} options={MODES} onChange={setMode} />
        <RadioGroup legend="validationMode" value={validationMode} options={VALIDATION_MODES} onChange={setValidationMode} />
        <div style={controlGroupStyle}>
          <span style={controlLegendStyle}>flags</span>
          <Toggle label="consumptionTaxRequired" checked={consumptionTaxRequired} onChange={setConsumptionTaxRequired} />
          <Toggle label="has nexus in country" checked={hasNexus} onChange={setHasNexus} />
          <Toggle label="disabled" checked={disabled} onChange={setDisabled} />
          {validationMode === "onSubmit" && (
            <button type="button" onClick={() => inputRef.current?.validate()} style={{ marginTop: 4, cursor: "pointer" }}>
              Validate
            </button>
          )}
        </div>
      </div>
      <AddressTaxInput
        ref={inputRef}
        addressValue={addressValue}
        taxType={taxType}
        isBusiness={taxType === "either" ? isBusiness : undefined}
        nexusList={nexusList}
        mode={mode}
        validationMode={validationMode}
        consumptionTaxRequired={consumptionTaxRequired}
        disabled={disabled}
        defaultCountry={defaultCountry}
        onAddressChange={setAddressValue}
        onConsumptionTaxChange={setTaxValue}
        onBusinessChange={taxType === "either" ? setIsBusiness : undefined}
        onValidationChange={(valid, errors) => setValidity({ valid, errors })}
      />
      <ValidationStatus valid={validity.valid} errors={validity.errors} />
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
