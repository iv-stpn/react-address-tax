import { type ChangeEvent, type ChangeEventHandler, Fragment, type ReactNode, useCallback, useEffect, useState } from "react";
import type {
  AddressCollectionMode,
  AddressFieldKey,
  AddressInputClassNames,
  AddressValue,
  CountryAddressConfig,
} from "../../utils/address";
import { ALL_COUNTRY_OPTIONS, getCountryConfig, isEUCountry, resolveAddressField } from "../../utils/address";
import { hasRegionalTax } from "../../utils/tax";
import type { ValidationError } from "../../utils/validation";
import { validateAddress } from "../../utils/validation";

export interface RenderInputProps {
  id: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
}

export interface RenderSelectProps {
  id: string;
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  /** Text shown in the disabled empty option. */
  placeholder?: string;
}

export interface RenderCheckboxProps {
  id?: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  label: string;
  className?: string;
}

export interface RenderContainerProps {
  /** Matches the input element's id, for use in label's htmlFor. */
  id: string;
  fieldKey: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** A single rendered field, paired with its type, passed to `renderFields`. */
export interface RenderFieldEntry {
  /** The field's key: "country" or one of the address field keys (line1, line2, city, level1, postalCode). */
  type: string;
  node: ReactNode;
}

export interface AddressInputProps {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  onValidationChange?: (valid: boolean, errors: ValidationError[]) => void;
  /** Controls which fields are shown. Defaults to "full". */
  mode?: AddressCollectionMode;
  /**
   * When true, the fields are rendered directly (in a Fragment) instead of being
   * wrapped in a `rav-root` container. Use this when embedding AddressInput inside
   * another component that already provides the root wrapper, to avoid nesting two
   * `rav-root` elements. `className`/`classNames.root` are ignored in this mode.
   */
  inline?: boolean;
  /**
   * Whether the level-1 (state/province/region) field is required.
   * Defaults to false, in which case the field is omitted entirely — it is
   * never shown as optional. Set true to collect it as a required field,
   * e.g. where downstream logic needs it (AddressTaxInput requires it for
   * countries whose tax rate varies by region).
   */
  requireLevel1?: boolean;
  /** Pre-selects a country and moves the country selector to the bottom of the form. */
  defaultCountry?: string;
  /** Pre-selects a state/region. */
  defaultRegion?: string;
  /** Placeholder shown in the country selector's empty option. Defaults to "Select country". */
  countryPlaceholder?: string;
  /**
   * Placeholder shown in the level-1 (state/province/region) administrative
   * selector's empty option, as a function of the field's label.
   * Defaults to `(label) => \`Select ${label}\``.
   */
  level1AdministrativePlaceholder?: (label: string) => string;
  disabled?: boolean;
  className?: string;
  classNames?: Partial<AddressInputClassNames>;
  renderInput?: (props: RenderInputProps) => ReactNode;
  /** Custom renderer for the country selector. */
  renderCountrySelect?: (props: RenderSelectProps) => ReactNode;
  /** Custom renderer for the level-1 (state/province/region) administrative selector. */
  renderLevel1AdministrativeSelect?: (props: RenderSelectProps) => ReactNode;
  renderContainer?: (props: RenderContainerProps) => ReactNode;
  /**
   * Custom layout for the fields. Receives the list of rendered field nodes
   * (each tagged with its `type`) in display order, and returns the node to
   * render in place of the default inline layout. Use this to group fields onto
   * the same line or into separate containers. When undefined, fields render
   * inline as before.
   */
  renderFields?: (fields: RenderFieldEntry[]) => ReactNode;
}

const EMPTY_VALUE: AddressValue = {
  line1: "",
  line2: "",
  city: "",
  level1: "",
  postalCode: "",
  country: "",
};

function computeEffectiveFields(
  mode: AddressCollectionMode,
  country: string,
  countryConfig: CountryAddressConfig | undefined,
  requireLevel1 = false,
): AddressFieldKey[] {
  if (!country || !countryConfig) return [];
  const allFields = countryConfig.addressFields;

  // level1 is never optional: it is collected only when required, otherwise
  // it is omitted entirely. `withLevel1` enforces that invariant on a base
  // field list — adding level1 when required (even for countries whose config
  // lacks it), and stripping it otherwise.
  const withLevel1 = (base: AddressFieldKey[], required: boolean): AddressFieldKey[] => {
    if (required) {
      return base.includes("level1") ? base : [...base, "level1"];
    }
    return base.filter((f) => f !== "level1");
  };

  switch (mode) {
    case "full":
      return withLevel1(allFields, requireLevel1);
    case "region":
      return requireLevel1 ? ["level1"] : [];
    case "regionMinimal":
      return isEUCountry(country) ? withLevel1(allFields, requireLevel1) : requireLevel1 ? ["level1"] : [];
    case "minimal":
    default:
      if (isEUCountry(country)) return withLevel1(allFields, requireLevel1);
      if (hasRegionalTax(country)) return requireLevel1 ? ["level1"] : [];
      return [];
  }
}

export function AddressInput({
  value,
  onChange,
  onValidationChange,
  mode = "full",
  inline = false,
  requireLevel1 = false,
  disabled = false,
  className,
  classNames,
  defaultCountry,
  defaultRegion,
  countryPlaceholder = "Select country",
  level1AdministrativePlaceholder = (label) => `Select ${label}`,
  renderInput,
  renderCountrySelect,
  renderLevel1AdministrativeSelect,
  renderContainer,
  renderFields,
}: AddressInputProps) {
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const effectiveCountry = value.country || defaultCountry || "";
  const effectiveLevel1 = value.level1 || defaultRegion || "";
  const currentValue = {
    ...EMPTY_VALUE,
    ...value,
    country: effectiveCountry,
    level1: effectiveLevel1,
  };
  const countryConfig = getCountryConfig(currentValue.country);
  const countryAtBottom = !!defaultCountry;

  const runValidation = useCallback(
    (val: AddressValue) => {
      const result = validateAddress(val, { requireLevel1 });
      setErrors(result.errors);
      onValidationChange?.(result.valid, result.errors);
    },
    [onValidationChange, requireLevel1],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run on country change
  useEffect(() => {
    runValidation(currentValue);
  }, [currentValue.country]);

  function handleField(field: keyof AddressValue) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const next: AddressValue = { ...currentValue, [field]: e.target.value };
      if (field === "country") {
        next.level1 = "";
        next.postalCode = "";
      }
      onChange(next);
      setTouched((t) => ({ ...t, [field]: true }));
      runValidation(next);
    };
  }

  function getError(field: string): string | undefined {
    if (!touched[field]) return undefined;
    return errors.find((e) => e.field === field)?.message;
  }

  const cn = (base: string, custom?: string) => [base, custom].filter(Boolean).join(" ");

  const effectiveFieldOrder = computeEffectiveFields(mode, currentValue.country, countryConfig, requireLevel1);

  // --- Default render helpers ---

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

  function defaultSelectEl(props: RenderSelectProps) {
    return (
      <select
        id={props.id}
        className={props.className}
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        disabled={props.disabled}
        aria-required={props.required}
        aria-invalid={props["aria-invalid"]}
        aria-describedby={props["aria-describedby"]}
      >
        <option value="" disabled>
          {props.placeholder ?? "Select"}
        </option>
        {props.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  function renderCountrySelectEl(props: RenderSelectProps) {
    if (renderCountrySelect) return renderCountrySelect(props);
    return defaultSelectEl(props);
  }

  function renderLevel1AdministrativeSelectEl(props: RenderSelectProps) {
    if (renderLevel1AdministrativeSelect) return renderLevel1AdministrativeSelect(props);
    return defaultSelectEl(props);
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

  // --- Country selector ---

  const countryId = "rav-country";
  const countryError = getError("country");

  const countrySelector = renderContainerEl({
    id: countryId,
    fieldKey: "country",
    label: "Country",
    required: true,
    error: countryError,
    className: classNames?.field,
    children: renderCountrySelectEl({
      id: countryId,
      value: currentValue.country,
      onChange: handleField("country"),
      disabled,
      required: true,
      "aria-invalid": countryError !== undefined,
      "aria-describedby": countryError ? `${countryId}-error` : undefined,
      className: cn("rav-select", classNames?.select),
      options: ALL_COUNTRY_OPTIONS.map((c) => ({ value: c.code, label: c.name })),
      placeholder: countryPlaceholder,
    }),
  });

  const fieldEntries: RenderFieldEntry[] = [];

  if (!countryAtBottom) fieldEntries.push({ type: "country", node: countrySelector });

  if (countryConfig) {
    for (const fieldKey of effectiveFieldOrder) {
      const fieldCfg = resolveAddressField(currentValue.country, fieldKey, requireLevel1);
      const error = getError(fieldKey);
      const inputId = `rav-${fieldKey}`;
      const currentFieldValue = (currentValue[fieldKey as keyof AddressValue] as string | undefined) ?? "";

      const inputElement = fieldCfg.options
        ? renderLevel1AdministrativeSelectEl({
            id: inputId,
            value: currentFieldValue,
            onChange: handleField(fieldKey),
            onBlur: () => setTouched((t) => ({ ...t, [fieldKey]: true })),
            disabled,
            required: fieldCfg.required,
            "aria-invalid": error !== undefined,
            "aria-describedby": error ? `${inputId}-error` : undefined,
            className: cn("rav-select", classNames?.select),
            options: fieldCfg.options,
            placeholder: level1AdministrativePlaceholder(fieldCfg.label),
          })
        : renderInputEl({
            id: inputId,
            value: currentFieldValue,
            onChange: handleField(fieldKey),
            onBlur: () => setTouched((t) => ({ ...t, [fieldKey]: true })),
            placeholder: fieldCfg.placeholder,
            disabled,
            required: fieldCfg.required,
            "aria-invalid": error !== undefined,
            "aria-describedby": error ? `${inputId}-error` : undefined,
            className: cn("rav-input", classNames?.input),
          });

      fieldEntries.push({
        type: fieldKey,
        node: (
          <Fragment key={fieldKey}>
            {renderContainerEl({
              id: inputId,
              fieldKey,
              label: fieldCfg.label,
              required: fieldCfg.required,
              error,
              className: classNames?.field,
              children: inputElement,
            })}
          </Fragment>
        ),
      });
    }
  }

  if (countryAtBottom) fieldEntries.push({ type: "country", node: countrySelector });

  const body = renderFields ? (
    renderFields(fieldEntries)
  ) : (
    <>
      {fieldEntries.map((entry) => (
        <Fragment key={entry.type}>{entry.node}</Fragment>
      ))}
    </>
  );

  if (inline) return body;

  return <div className={cn("rav-root", className ?? classNames?.root)}>{body}</div>;
}
