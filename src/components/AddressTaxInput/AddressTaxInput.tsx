import { type ChangeEvent, useEffect, useState } from "react";
import type {
	AddressTaxInputProps,
	AddressValue,
	RenderCheckboxProps,
	RenderContainerProps,
	RenderInputProps,
} from "../../types.js";
import {
	getConsumptionTaxLabel,
	getCountryConfig,
} from "../../utils/countries.js";
import {
	normalizeConsumptionTax,
	validateConsumptionTax,
} from "../../utils/validation.js";
import { AddressInput } from "../AddressInput/index.js";

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
	disabled = false,
	className,
	classNames,
	renderInput,
	renderCheckbox,
	renderSelect,
	renderContainer,
}: AddressTaxInputProps) {
	const [internalIsBusiness, setInternalIsBusiness] = useState(false);
	const [internalHasTaxIdentifier, setInternalHasTaxIdentifier] =
		useState(true);
	const [taxTouched, setTaxTouched] = useState(false);

	const isBusiness =
		taxType === "business"
			? true
			: taxType === "individual"
				? false
				: isBusinessProp !== undefined
					? isBusinessProp
					: internalIsBusiness;
	const hasTaxIdentifier =
		hasTaxIdentifierProp !== undefined
			? hasTaxIdentifierProp
			: internalHasTaxIdentifier;

	const country = addressValue.country || defaultCountry || "";
	const countryConfig = getCountryConfig(country);
	const isInNexus = !nexusList || nexusList.includes(country);
	const showTaxFields = isBusiness && isInNexus && !!country;

	const consumptionTaxLabel = country
		? getConsumptionTaxLabel(country)
		: "Consumption Tax ID";

	const consumptionTaxId = taxValue.consumptionTaxId ?? "";
	const hasIdentifier = showTaxFields && hasTaxIdentifier;

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only — emit initial computed state; handlers cover subsequent changes
	useEffect(() => {
		if (hasIdentifier !== (taxValue.hasIdentifier ?? false)) {
			onConsumptionTaxChange?.({
				consumptionTaxId: consumptionTaxId || undefined,
				hasIdentifier,
			});
		}
	}, []);

	const consumptionTaxInvalid =
		taxTouched && !!consumptionTaxId
			? !validateConsumptionTax(consumptionTaxId, country)
			: false;
	const consumptionTaxError = consumptionTaxInvalid
		? `Invalid ${consumptionTaxLabel} format. Expected: ${countryConfig?.consumptionTaxExample ?? ""}.`
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
			});
		} else {
			const newHasIdentifier = isInNexus && !!country && hasTaxIdentifier;
			onConsumptionTaxChange?.({
				consumptionTaxId: consumptionTaxId || undefined,
				hasIdentifier: newHasIdentifier,
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
			});
		} else {
			onConsumptionTaxChange?.({
				consumptionTaxId: consumptionTaxId || undefined,
				hasIdentifier: showTaxFields,
			});
		}
	}

	function handleAddressChange(newAddress: AddressValue) {
		onAddressChange(newAddress);
		const newCountry = newAddress.country || defaultCountry || "";
		const newInNexus = !nexusList || nexusList.includes(newCountry);
		const newHasIdentifier =
			isBusiness && newInNexus && !!newCountry && hasTaxIdentifier;
		if (newHasIdentifier !== hasIdentifier) {
			onConsumptionTaxChange?.({
				consumptionTaxId: consumptionTaxId || undefined,
				hasIdentifier: newHasIdentifier,
			});
		}
	}

	function handleConsumptionTaxChange(e: ChangeEvent<HTMLInputElement>) {
		onConsumptionTaxChange?.({
			consumptionTaxId: e.target.value || undefined,
			hasIdentifier,
		});
		setTaxTouched(true);
	}

	function handleConsumptionTaxBlur() {
		const normalized = normalizeConsumptionTax(consumptionTaxId);
		if (normalized !== consumptionTaxId) {
			onConsumptionTaxChange?.({
				consumptionTaxId: normalized || undefined,
				hasIdentifier,
			});
		}
		setTaxTouched(true);
	}

	const cn = (base: string, custom?: string) =>
		[base, custom].filter(Boolean).join(" ");

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
				<input
					type="checkbox"
					checked={props.checked}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
				<span
					className={cn("rav-label", classNames?.label)}
					style={{ margin: 0 }}
				>
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
				defaultCountry={defaultCountry}
				defaultRegion={defaultRegion}
				disabled={disabled}
				classNames={classNames}
				renderInput={renderInput}
				renderSelect={renderSelect}
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
								placeholder: countryConfig?.consumptionTaxExample,
								disabled,
								required: consumptionTaxRequired,
								"aria-invalid": consumptionTaxInvalid,
								"aria-describedby": consumptionTaxError
									? `${consumptionTaxInputId}-error`
									: undefined,
								className: cn("rav-input", classNames?.input),
							}),
						})}
				</>
			)}
		</div>
	);
}
