import { type ChangeEvent, forwardRef, type ReactNode, useEffect, useState } from "react";
import type { AddressCollectionMode, AddressValue, ValidationMode } from "../../utils/address";
import type { TaxType, TaxValue } from "../../utils/tax";
import { computeTaxOutcome, getBusinessTaxNumberLabel, getTaxConfig, hasRegionalTax, isEUCountry } from "../../utils/tax";
import type { ValidationError } from "../../utils/validation";
import { normalizeTax, validateTax } from "../../utils/validation";
import type {
  AddressInputHandle,
  RenderCheckboxProps,
  RenderContainerProps,
  RenderFieldEntry,
  RenderInputProps,
  RenderSelectProps,
} from "../AddressInput";
import { AddressInput } from "../AddressInput/index";

export interface AddressTaxInputProps {
  addressValue: AddressValue;
  /**
   * Whether the payer is always a business, always an individual, or lets the user either.
   * - "business": treats as business with no toggle; shows tax identifier fields.
   * - "individual": treats as individual with no toggle; hides tax identifier fields.
   * - "either" (default): shows the Business account checkbox.
   */
  taxType?: TaxType;
  /** Controlled business state. Only meaningful when taxType is "either". When undefined, managed internally. */
  isBusiness?: boolean;
  /** Controlled "I have a tax identifier" state. When undefined, managed internally. */
  hasTaxIdentifier?: boolean;
  /** Controlled consumption tax identifier value. When undefined, managed internally. */
  taxIdentifier?: string;
  /**
   * Countries where you have a tax nexus and must collect consumption tax.
   * When provided, the tax identifier field is only shown for countries in this list.
   * When omitted, the tax identifier field is shown for all countries (when business).
   */
  nexusList?: string[];
  /** Whether the consumption tax identifier field is required. */
  taxRequired?: boolean;
  onAddressChange: (value: AddressValue) => void;
  onTaxChange?: (value: TaxValue) => void;
  onBusinessChange?: (isBusiness: boolean) => void;
  onHasTaxIdentifierChange?: (hasTaxIdentifier: boolean) => void;
  onTaxIdentifierChange?: (taxIdentifier: string) => void;
  onValidationChange?: (valid: boolean, errors: ValidationError[]) => void;
  mode?: AddressCollectionMode;
  /**
   * Controls when address validation errors become visible. Defaults to
   * "onType". With "onSubmit", call the component's ref `validate()` to reveal
   * errors. Forwarded to the underlying AddressInput.
   */
  validationMode?: ValidationMode;
  defaultCountry?: string;
  defaultRegion?: string;
  /** Placeholder shown in the country selector's empty option. Defaults to "Select country". */
  countryPlaceholder?: string;
  /** Placeholder shown in the level-1 administrative selector's empty option, as a function of the field's label. */
  level1AdministrativePlaceholder?: (label: string) => string;
  disabled?: boolean;
  className?: string;
  renderInput?: (props: RenderInputProps) => ReactNode;
  renderCheckbox?: (props: RenderCheckboxProps) => ReactNode;
  /** Custom renderer for the country selector. */
  renderCountrySelect?: (props: RenderSelectProps) => ReactNode;
  /** Custom renderer for the level-1 administrative selector. */
  renderLevel1AdministrativeSelect?: (props: RenderSelectProps) => ReactNode;
  /** Custom renderer for the container including the input, input label and field error. */
  renderContainer?: (props: RenderContainerProps) => ReactNode;
  /**
   * Custom layout for the fields. Receives the list of rendered field nodes
   * (each tagged with its `type`) in display order, and returns the node to
   * render in place of the default inline layout. Use this to group fields onto
   * the same line or into separate containers. When undefined, fields render
   * inline as before.
   *
   * The `type` is "business" for the Business account checkbox, "country" or an
   * address field key (line1, line2, city, level1, postalCode) for address
   * fields, "noTaxIdentifier" for the "I don't have a tax id" checkbox, and
   * "taxId" for the tax identifier input.
   */
  renderFields?: (fields: RenderFieldEntry[]) => ReactNode;
}

/**
 * Resolve the two tax-rate states for a given buyer/jurisdiction:
 * - `baseTax`: the rate that would apply if the seller had a nexus here (the
 *   headline rate for the buyer, accounting for B2B reverse charge).
 * - `effectiveTax`: `baseTax` when the seller actually has a nexus, else 0.
 *
 * The rate is computed under the hypothetical "seller has nexus" assumption, so
 * `hasTaxIdentifier` only gates the reverse-charge treatment — not collection.
 */
function computeTaxRates(
  country: string,
  level1: string | undefined,
  isBusiness: boolean,
  hasTaxIdentifier: boolean,
  isInNexus: boolean,
): { baseTax: number; effectiveTax: number; taxLabel: string | null; localTaxLabel: string | null } {
  const outcome = computeTaxOutcome({
    country,
    isBusiness,
    hasTaxId: isBusiness && hasTaxIdentifier,
    hasNexus: isInNexus,
    state: level1,
  });
  return {
    baseTax: outcome.baseTax ?? 0,
    effectiveTax: outcome.effectiveTax ?? 0,
    taxLabel: outcome.taxLabel,
    localTaxLabel: outcome.localTaxLabel,
  };
}

export const AddressTaxInput = forwardRef<AddressInputHandle, AddressTaxInputProps>(function AddressTaxInput(
  {
    addressValue,
    taxType = "either",
    isBusiness: isBusinessProp,
    hasTaxIdentifier: hasTaxIdentifierProp,
    taxIdentifier: taxIdentifierProp,
    nexusList,
    taxRequired = false,
    onAddressChange,
    onTaxChange,
    onBusinessChange,
    onHasTaxIdentifierChange,
    onTaxIdentifierChange,
    onValidationChange,
    mode,
    validationMode,
    defaultCountry,
    defaultRegion,
    countryPlaceholder,
    level1AdministrativePlaceholder,
    disabled = false,
    className,
    renderInput,
    renderCheckbox,
    renderCountrySelect,
    renderLevel1AdministrativeSelect,
    renderContainer,
    renderFields,
  }: AddressTaxInputProps,
  ref,
) {
  const [internalIsBusiness, setInternalIsBusiness] = useState(false);
  const [internalHasTaxIdentifier, setInternalHasTaxIdentifier] = useState(true);
  const [internalTaxIdentifier, setInternalTaxIdentifier] = useState("");
  const [taxTouched, setTaxTouched] = useState(false);

  const isBusiness =
    taxType === "business"
      ? true
      : taxType === "individual"
        ? false
        : isBusinessProp !== undefined
          ? isBusinessProp
          : internalIsBusiness;
  const hasTaxIdentifier = hasTaxIdentifierProp !== undefined ? hasTaxIdentifierProp : internalHasTaxIdentifier;
  const taxId = taxIdentifierProp !== undefined ? taxIdentifierProp : internalTaxIdentifier;
  const setTaxId = (value: string) => {
    setInternalTaxIdentifier(value);
    onTaxIdentifierChange?.(value);
  };

  const country = addressValue.country || defaultCountry || "";
  const taxConfig = getTaxConfig(country);
  // EU member states always carry a consumption-tax obligation, so they count
  // as in-nexus even when the nexus list is empty or omits them.
  const isInNexus = !nexusList || nexusList.includes(country) || isEUCountry(country);
  const showTaxFields = isBusiness && isInNexus && !!country;

  const businessTaxNumberLabel = (country ? getBusinessTaxNumberLabel(country) : null) ?? "Tax ID";

  const hasIdentifier = showTaxFields && hasTaxIdentifier;

  const { baseTax, effectiveTax, taxLabel, localTaxLabel } = computeTaxRates(
    country,
    addressValue.level1,
    isBusiness,
    hasTaxIdentifier,
    isInNexus,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only — emit initial computed state; handlers cover subsequent changes
  useEffect(() => {
    onTaxChange?.({
      taxId: taxId || undefined,
      hasIdentifier,
      baseTax,
      effectiveTax,
      taxLabel,
      localTaxLabel,
    });
  }, []);

  const taxInvalid = taxTouched && !!taxId ? !validateTax(taxId, country) : false;
  const taxError = taxInvalid ? `Invalid ${businessTaxNumberLabel} format. Expected: ${taxConfig?.taxExample ?? ""}.` : undefined;

  function handleBusinessChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.checked;
    setInternalIsBusiness(val);
    onBusinessChange?.(val);
    if (!val) {
      setInternalHasTaxIdentifier(true);
      onHasTaxIdentifierChange?.(true);
      onTaxChange?.({
        taxId: taxId || undefined,
        hasIdentifier: false,
        ...computeTaxRates(country, addressValue.level1, false, hasTaxIdentifier, isInNexus),
      });
    } else {
      const newHasIdentifier = isInNexus && !!country && hasTaxIdentifier;
      onTaxChange?.({
        taxId: taxId || undefined,
        hasIdentifier: newHasIdentifier,
        ...computeTaxRates(country, addressValue.level1, true, hasTaxIdentifier, isInNexus),
      });
    }
  }

  function handleHasTaxIdentifierChange(e: ChangeEvent<HTMLInputElement>) {
    const val = !e.target.checked;
    setInternalHasTaxIdentifier(val);
    onHasTaxIdentifierChange?.(val);
    if (!val) {
      setTaxId("");
      onTaxChange?.({
        taxId: undefined,
        hasIdentifier: false,
        ...computeTaxRates(country, addressValue.level1, isBusiness, false, isInNexus),
      });
    } else {
      onTaxChange?.({
        taxId: taxId || undefined,
        hasIdentifier: showTaxFields,
        ...computeTaxRates(country, addressValue.level1, isBusiness, true, isInNexus),
      });
    }
  }

  function handleAddressChange(newAddress: AddressValue) {
    onAddressChange(newAddress);
    const newCountry = newAddress.country || defaultCountry || "";
    const newInNexus = !nexusList || nexusList.includes(newCountry) || isEUCountry(newCountry);
    const newHasIdentifier = isBusiness && newInNexus && !!newCountry && hasTaxIdentifier;
    const rates = computeTaxRates(newCountry, newAddress.level1, isBusiness, hasTaxIdentifier, newInNexus);
    if (newHasIdentifier !== hasIdentifier || rates.baseTax !== baseTax || rates.effectiveTax !== effectiveTax) {
      onTaxChange?.({
        taxId: taxId || undefined,
        hasIdentifier: newHasIdentifier,
        ...rates,
      });
    }
  }

  function handleTaxChange(e: ChangeEvent<HTMLInputElement>) {
    setTaxId(e.target.value);
    onTaxChange?.({
      taxId: e.target.value || undefined,
      hasIdentifier,
      baseTax,
      effectiveTax,
      taxLabel,
      localTaxLabel,
    });
    setTaxTouched(true);
  }

  function handleTaxBlur() {
    const normalized = normalizeTax(taxId);
    if (normalized !== taxId) {
      setTaxId(normalized);
      onTaxChange?.({
        taxId: normalized || undefined,
        hasIdentifier,
        baseTax,
        effectiveTax,
        taxLabel,
        localTaxLabel,
      });
    }
    setTaxTouched(true);
  }

  const cn = (base: string, custom?: string) => [base, custom].filter(Boolean).join(" ");

  // --- Default render helpers ---

  function renderCheckboxEl(props: RenderCheckboxProps) {
    if (renderCheckbox) return renderCheckbox(props);
    return (
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
        }}
      >
        <input type="checkbox" checked={props.checked} onChange={props.onChange} disabled={props.disabled} />
        <span className="rav-label" style={{ margin: 0 }}>
          {props.label}
        </span>
      </label>
    );
  }

  function renderInputEl(props: RenderInputProps) {
    if (renderInput) return renderInput(props);
    return (
      <input
        id={props.id}
        type="text"
        className={props.className}
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        placeholder={props.placeholder}
        disabled={props.disabled}
        aria-required={props.required}
        aria-invalid={props["aria-invalid"]}
        aria-describedby={props["aria-describedby"]}
      />
    );
  }

  function renderContainerEl(containerProps: RenderContainerProps) {
    if (renderContainer) return renderContainer(containerProps);
    return (
      <div className={cn("rav-field", containerProps.className)}>
        <label className="rav-label" htmlFor={containerProps.id}>
          {containerProps.label}
          {containerProps.required && <span aria-hidden="true"> *</span>}
        </label>
        {containerProps.children}
        {containerProps.error && (
          <span id={`${containerProps.id}-error`} className="rav-error" role="alert">
            {containerProps.error}
          </span>
        )}
      </div>
    );
  }

  const taxInputId = "rav-taxId";

  const businessCheckboxNode =
    taxType === "either" ? (
      <div className="rav-field">
        {renderCheckboxEl({
          checked: isBusiness,
          onChange: handleBusinessChange,
          disabled,
          label: "Business account",
        })}
      </div>
    ) : null;

  const noTaxIdentifierNode = showTaxFields ? (
    <div className="rav-field">
      {renderCheckboxEl({
        checked: !hasTaxIdentifier,
        onChange: handleHasTaxIdentifierChange,
        disabled,
        label: `I don't have a ${businessTaxNumberLabel}`,
      })}
    </div>
  ) : null;

  const taxIdNode =
    showTaxFields && hasTaxIdentifier
      ? renderContainerEl({
          id: taxInputId,
          fieldKey: "taxId",
          label: businessTaxNumberLabel,
          required: taxRequired,
          error: taxError,
          children: renderInputEl({
            id: taxInputId,
            value: taxId,
            onChange: handleTaxChange,
            onBlur: handleTaxBlur,
            placeholder: taxConfig?.taxExample,
            disabled,
            required: taxRequired,
            "aria-invalid": taxInvalid,
            "aria-describedby": taxError ? `${taxInputId}-error` : undefined,
            className: "rav-input",
          }),
        })
      : null;

  // Entries that bracket the address fields, in display order.
  const beforeEntries: RenderFieldEntry[] = businessCheckboxNode ? [{ type: "business", node: businessCheckboxNode }] : [];
  const afterEntries: RenderFieldEntry[] = [];
  if (noTaxIdentifierNode) afterEntries.push({ type: "noTaxIdentifier", node: noTaxIdentifierNode });
  if (taxIdNode) afterEntries.push({ type: "taxId", node: taxIdNode });

  return (
    <div className={cn("rav-root", className)}>
      {!renderFields && businessCheckboxNode}

      <AddressInput
        ref={ref}
        value={addressValue}
        onChange={handleAddressChange}
        onValidationChange={onValidationChange}
        mode={hasRegionalTax(country) && mode !== "region" ? "fullRegion" : mode}
        validationMode={validationMode}
        inline
        defaultCountry={defaultCountry}
        defaultRegion={defaultRegion}
        countryPlaceholder={countryPlaceholder}
        level1AdministrativePlaceholder={level1AdministrativePlaceholder}
        disabled={disabled}
        renderInput={renderInput}
        renderCountrySelect={renderCountrySelect}
        renderLevel1AdministrativeSelect={renderLevel1AdministrativeSelect}
        renderContainer={renderContainer}
        renderFields={
          renderFields ? (addressEntries) => renderFields([...beforeEntries, ...addressEntries, ...afterEntries]) : undefined
        }
      />

      {!renderFields && showTaxFields && (
        <>
          {noTaxIdentifierNode}
          {taxIdNode}
        </>
      )}
    </div>
  );
});
