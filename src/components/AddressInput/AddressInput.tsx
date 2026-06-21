import {
	type ChangeEvent,
	Fragment,
	useCallback,
	useEffect,
	useState,
} from "react";
import type {
	AddressCollectionMode,
	AddressInputProps,
	AddressValue,
	RenderContainerProps,
	RenderInputProps,
	RenderSelectProps,
} from "../../types.js";
import type {
	AddressFieldConfig,
	CountryConfig,
} from "../../utils/countries.js";
import {
	COUNTRY_LIST,
	getCountryConfig,
	isEUCountry,
} from "../../utils/countries.js";
import type { ValidationError } from "../../utils/validation.js";
import { validateAddress } from "../../utils/validation.js";

const EMPTY_VALUE: AddressValue = {
	line1: "",
	line2: "",
	city: "",
	state: "",
	postalCode: "",
	country: "",
};

function computeEffectiveFields(
	mode: AddressCollectionMode,
	country: string,
	countryConfig: CountryConfig | undefined,
): AddressFieldConfig[] {
	if (!country || !countryConfig) return [];
	const allFields = countryConfig.addressFields;

	switch (mode) {
		case "full":
			return allFields;
		case "region":
			return allFields.filter((f) => f.field === "state");
		case "regionMinimal":
			return isEUCountry(country)
				? allFields
				: allFields.filter((f) => f.field === "state");
		case "minimal":
		default:
			if (isEUCountry(country)) return allFields;
			if (countryConfig.hasRegionalTax)
				return allFields.filter((f) => f.field === "state");
			return [];
	}
}

export function AddressInput({
	value,
	onChange,
	onValidationChange,
	mode = "full",
	disabled = false,
	className,
	classNames,
	defaultCountry,
	defaultRegion,
	renderInput,
	renderCheckbox: _renderCheckbox,
	renderSelect,
	renderContainer,
}: AddressInputProps) {
	const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
	const [errors, setErrors] = useState<ValidationError[]>([]);

	const effectiveCountry = value.country || defaultCountry || "";
	const effectiveState = value.state || defaultRegion || "";
	const currentValue = {
		...EMPTY_VALUE,
		...value,
		country: effectiveCountry,
		state: effectiveState,
	};
	const countryConfig = getCountryConfig(currentValue.country);
	const countryAtBottom = !!defaultCountry;

	const runValidation = useCallback(
		(val: AddressValue) => {
			const result = validateAddress(val);
			setErrors(result.errors);
			onValidationChange?.(result.valid, result.errors);
		},
		[onValidationChange],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-run on country change
	useEffect(() => {
		runValidation(currentValue);
	}, [currentValue.country]);

	function handleField(field: keyof AddressValue) {
		return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			const next: AddressValue = { ...currentValue, [field]: e.target.value };
			if (field === "country") {
				next.state = "";
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

	const cn = (base: string, custom?: string) =>
		[base, custom].filter(Boolean).join(" ");

	const effectiveFieldOrder = computeEffectiveFields(
		mode,
		currentValue.country,
		countryConfig,
	);

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

	function renderSelectEl(props: RenderSelectProps) {
		if (renderSelect) return renderSelect(props);
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
					{props.placeholder ?? "— Select —"}
				</option>
				{props.options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		);
	}

	function renderContainerEl(containerProps: RenderContainerProps) {
		if (renderContainer) return renderContainer(containerProps);
		return (
			<div className={cn("rav-field", containerProps.className)}>
				<label
					className={cn("rav-label", classNames?.label)}
					htmlFor={containerProps.id}
				>
					{containerProps.label}
					{containerProps.required && <span aria-hidden="true"> *</span>}
				</label>
				{containerProps.children}
				{containerProps.error && (
					<span
						id={`${containerProps.id}-error`}
						className={cn("rav-error", classNames?.error)}
						role="alert"
					>
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
		children: renderSelectEl({
			id: countryId,
			value: currentValue.country,
			onChange: handleField("country"),
			disabled,
			required: true,
			"aria-invalid": countryError !== undefined,
			"aria-describedby": countryError ? `${countryId}-error` : undefined,
			className: cn("rav-select", classNames?.select),
			options: COUNTRY_LIST.map((c) => ({ value: c.code, label: c.name })),
			placeholder: "— Select a country —",
		}),
	});

	return (
		<div className={cn("rav-root", className ?? classNames?.root)}>
			{!countryAtBottom && countrySelector}

			{countryConfig &&
				effectiveFieldOrder.map((fieldCfg) => {
					const fieldKey = fieldCfg.field as keyof AddressValue;
					const error = getError(fieldCfg.field);
					const inputId = `rav-${fieldCfg.field}`;
					const currentFieldValue =
						(currentValue[fieldKey] as string | undefined) ?? "";

					const inputElement = fieldCfg.options
						? renderSelectEl({
								id: inputId,
								value: currentFieldValue,
								onChange: handleField(fieldKey),
								onBlur: () =>
									setTouched((t) => ({ ...t, [fieldCfg.field]: true })),
								disabled,
								required: fieldCfg.required,
								"aria-invalid": error !== undefined,
								"aria-describedby": error ? `${inputId}-error` : undefined,
								className: cn("rav-select", classNames?.select),
								options: fieldCfg.options,
								placeholder: `— Select ${fieldCfg.label} —`,
							})
						: renderInputEl({
								id: inputId,
								value: currentFieldValue,
								onChange: handleField(fieldKey),
								onBlur: () =>
									setTouched((t) => ({ ...t, [fieldCfg.field]: true })),
								placeholder: fieldCfg.placeholder,
								disabled,
								required: fieldCfg.required,
								"aria-invalid": error !== undefined,
								"aria-describedby": error ? `${inputId}-error` : undefined,
								className: cn("rav-input", classNames?.input),
							});

					return (
						<Fragment key={fieldCfg.field}>
							{renderContainerEl({
								id: inputId,
								fieldKey: fieldCfg.field,
								label: fieldCfg.label,
								required: fieldCfg.required,
								error,
								className: classNames?.field,
								children: inputElement,
							})}
						</Fragment>
					);
				})}

			{countryAtBottom && countrySelector}
		</div>
	);
}
