import { type ChangeEvent, type ReactNode, useEffect, useState } from "react";
import type { AddressCollectionMode, AddressInputClassNames, AddressValue } from "../../utils/address";
import { getConsumptionTaxLabel } from "../../utils/address";
import type { ConsumptionTaxValue, TaxType } from "../../utils/tax";
import { computeConsumptionTaxOutcome, getConsumptionTaxConfig, hasRegionalTax } from "../../utils/tax";
import type { ValidationError } from "../../utils/validation";
import { normalizeConsumptionTax, validateConsumptionTax } from "../../utils/validation";
import type { RenderCheckboxProps, RenderContainerProps, RenderInputProps, RenderSelectProps } from "../AddressInput";
import { AddressInput } from "../AddressInput/index";

export interface AddressTaxInputProps {
  addressValue: AddressValue;
  taxValue?: ConsumptionTaxValue;
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
  /**
   * Countries where you have a tax nexus and must collect consumption tax.
   * When provided, the tax identifier field is only shown for countries in this list.
   * When omitted, the tax identifier field is shown for all countries (when business).
   */
  nexusList?: string[];
  /** Whether the consumption tax identifier field is required. */
  consumptionTaxRequired?: boolean;
  onAddressChange: (value: AddressValue) => void;
  onConsumptionTaxChange?: (value: ConsumptionTaxValue) => void;
  onBusinessChange?: (isBusiness: boolean) => void;
  onHasTaxIdentifierChange?: (hasTaxIdentifier: boolean) => void;
  onValidationChange?: (valid: boolean, errors: ValidationError[]) => void;
  mode?: AddressCollectionMode;
  defaultCountry?: string;
  defaultRegion?: string;
  /** Placeholder shown in the country selector's empty option. Defaults to "Select country". */
  countryPlaceholder?: string;
  /** Placeholder shown in the level-1 administrative selector's empty option, as a function of the field's label. */
  level1AdministrativePlaceholder?: (label: string) => string;
  disabled?: boolean;
  className?: string;
  classNames?: Partial<AddressInputClassNames>;
  renderInput?: (props: RenderInputProps) => ReactNode;
  renderCheckbox?: (props: RenderCheckboxProps) => ReactNode;
  /** Custom renderer for the country selector. */
  renderCountrySelect?: (props: RenderSelectProps) => ReactNode;
  /** Custom renderer for the level-1 administrative selector. */
  renderLevel1AdministrativeSelect?: (props: RenderSelectProps) => ReactNode;
  renderContainer?: (props: RenderContainerProps) => ReactNode;
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
): { baseTax: number; effectiveTax: number } {
  const outcome = computeConsumptionTaxOutcome(country, isBusiness, isBusiness && hasTaxIdentifier, isInNexus, level1);
  return {
    baseTax: outcome.baseTax ?? 0,
    effectiveTax: outcome.effectiveTax ?? 0,
  };
}

export function AddressTaxInput({
  addressValue,
  taxValue = {},
  taxType = "either",
  isBusiness: isBusinessProp,
  hasTaxIdentifier: hasTaxIdentifierProp,
  nexusList,
  consumptionTaxRequired = false,
  onAddressChange,
  onConsumptionTaxChange,
  onBusinessChange,
  onHasTaxIdentifierChange,
  onValidationChange,
  mode,
  defaultCountry,
  defaultRegion,
  countryPlaceholder,
  level1AdministrativePlaceholder,
  disabled = false,
  className,
  classNames,
  renderInput,
  renderCheckbox,
  renderCountrySelect,
  renderLevel1AdministrativeSelect,
  renderContainer,
}: AddressTaxInputProps) {
  const [internalIsBusiness, setInternalIsBusiness] = useState(false);
  const [internalHasTaxIdentifier, setInternalHasTaxIdentifier] = useState(true);
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

  const country = addressValue.country || defaultCountry || "";
  const taxConfig = getConsumptionTaxConfig(country);
  const isInNexus = !nexusList || nexusList.includes(country);
  const showTaxFields = isBusiness && isInNexus && !!country;

  const consumptionTaxLabel = country ? getConsumptionTaxLabel(country) : "Consumption Tax ID";

  const consumptionTaxId = taxValue.consumptionTaxId ?? "";
  const hasIdentifier = showTaxFields && hasTaxIdentifier;

  const { baseTax, effectiveTax } = computeTaxRates(country, addressValue.level1, isBusiness, hasTaxIdentifier, isInNexus);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only — emit initial computed state; handlers cover subsequent changes
  useEffect(() => {
    if (
      hasIdentifier !== (taxValue.hasIdentifier ?? false) ||
      baseTax !== taxValue.baseTax ||
      effectiveTax !== taxValue.effectiveTax
    ) {
      onConsumptionTaxChange?.({
        consumptionTaxId: consumptionTaxId || undefined,
        hasIdentifier,
        baseTax,
        effectiveTax,
      });
    }
  }, []);

  const consumptionTaxInvalid = taxTouched && !!consumptionTaxId ? !validateConsumptionTax(consumptionTaxId, country) : false;
  const consumptionTaxError = consumptionTaxInvalid
    ? `Invalid ${consumptionTaxLabel} format. Expected: ${taxConfig?.consumptionTaxExample ?? ""}.`
    : undefined;

  function handleBusinessChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.checked;
    setInternalIsBusiness(val);
    onBusinessChange?.(val);
    if (!val) {
      setInternalHasTaxIdentifier(true);
      onHasTaxIdentifierChange?.(true);
      onConsumptionTaxChange?.({
        consumptionTaxId: consumptionTaxId || undefined,
        hasIdentifier: false,
        ...computeTaxRates(country, addressValue.level1, false, hasTaxIdentifier, isInNexus),
      });
    } else {
      const newHasIdentifier = isInNexus && !!country && hasTaxIdentifier;
      onConsumptionTaxChange?.({
        consumptionTaxId: consumptionTaxId || undefined,
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
      onConsumptionTaxChange?.({
        consumptionTaxId: undefined,
        hasIdentifier: false,
        ...computeTaxRates(country, addressValue.level1, isBusiness, false, isInNexus),
      });
    } else {
      onConsumptionTaxChange?.({
        consumptionTaxId: consumptionTaxId || undefined,
        hasIdentifier: showTaxFields,
        ...computeTaxRates(country, addressValue.level1, isBusiness, true, isInNexus),
      });
    }
  }

  function handleAddressChange(newAddress: AddressValue) {
    onAddressChange(newAddress);
    const newCountry = newAddress.country || defaultCountry || "";
    const newInNexus = !nexusList || nexusList.includes(newCountry);
    const newHasIdentifier = isBusiness && newInNexus && !!newCountry && hasTaxIdentifier;
    const rates = computeTaxRates(newCountry, newAddress.level1, isBusiness, hasTaxIdentifier, newInNexus);
    if (newHasIdentifier !== hasIdentifier || rates.baseTax !== baseTax || rates.effectiveTax !== effectiveTax) {
      onConsumptionTaxChange?.({
        consumptionTaxId: consumptionTaxId || undefined,
        hasIdentifier: newHasIdentifier,
        ...rates,
      });
    }
  }

  function handleConsumptionTaxChange(e: ChangeEvent<HTMLInputElement>) {
    onConsumptionTaxChange?.({
      consumptionTaxId: e.target.value || undefined,
      hasIdentifier,
      baseTax,
      effectiveTax,
    });
    setTaxTouched(true);
  }

  function handleConsumptionTaxBlur() {
    const normalized = normalizeConsumptionTax(consumptionTaxId);
    if (normalized !== consumptionTaxId) {
      onConsumptionTaxChange?.({
        consumptionTaxId: normalized || undefined,
        hasIdentifier,
        baseTax,
        effectiveTax,
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
        <span className={cn("rav-label", classNames?.label)} style={{ margin: 0 }}>
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
        <label className={cn("rav-label", classNames?.label)} htmlFor={containerProps.id}>
          {containerProps.label}
          {containerProps.required && <span aria-hidden="true"> *</span>}
        </label>
        {containerProps.children}
        {containerProps.error && (
          <span id={`${containerProps.id}-error`} className={cn("rav-error", classNames?.error)} role="alert">
            {containerProps.error}
          </span>
        )}
      </div>
    );
  }

  const consumptionTaxInputId = "rav-consumptionTaxId";

  return (
    <div className={cn("rav-root", className ?? classNames?.root)}>
      {taxType === "either" && (
        <div className={cn("rav-field", classNames?.field)}>
          {renderCheckboxEl({
            checked: isBusiness,
            onChange: handleBusinessChange,
            disabled,
            label: "Business account",
          })}
        </div>
      )}

      <AddressInput
        value={addressValue}
        onChange={handleAddressChange}
        onValidationChange={onValidationChange}
        mode={mode}
        requireLevel1={hasRegionalTax(country)}
        defaultCountry={defaultCountry}
        defaultRegion={defaultRegion}
        countryPlaceholder={countryPlaceholder}
        level1AdministrativePlaceholder={level1AdministrativePlaceholder}
        disabled={disabled}
        classNames={classNames}
        renderInput={renderInput}
        renderCountrySelect={renderCountrySelect}
        renderLevel1AdministrativeSelect={renderLevel1AdministrativeSelect}
        renderContainer={renderContainer}
      />

      {showTaxFields && (
        <>
          <div className={cn("rav-field", classNames?.field)}>
            {renderCheckboxEl({
              checked: !hasTaxIdentifier,
              onChange: handleHasTaxIdentifierChange,
              disabled,
              label: `I don't have a ${consumptionTaxLabel}`,
            })}
          </div>

          {hasTaxIdentifier &&
            renderContainerEl({
              id: consumptionTaxInputId,
              fieldKey: "consumptionTaxId",
              label: consumptionTaxLabel,
              required: consumptionTaxRequired,
              error: consumptionTaxError,
              className: classNames?.field,
              children: renderInputEl({
                id: consumptionTaxInputId,
                value: consumptionTaxId,
                onChange: handleConsumptionTaxChange,
                onBlur: handleConsumptionTaxBlur,
                placeholder: taxConfig?.consumptionTaxExample,
                disabled,
                required: consumptionTaxRequired,
                "aria-invalid": consumptionTaxInvalid,
                "aria-describedby": consumptionTaxError ? `${consumptionTaxInputId}-error` : undefined,
                className: cn("rav-input", classNames?.input),
              }),
            })}
        </>
      )}
    </div>
  );
}
