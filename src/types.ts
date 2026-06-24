import type { ChangeEventHandler, ReactNode } from "react";

export interface AddressValue {
	line1: string;
	line2?: string;
	city: string;
	level1?: string;
	postalCode: string;
	country: string;
}

/** Controls which address fields are collected. */
export type AddressCollectionMode =
	/** Country only; region also for countries with per-region tax rules (US, CA); full address for EU countries. */
	| "minimal"
	/** Country + region always; full address for EU countries. */
	| "regionMinimal"
	/** Country + region only, always. */
	| "region"
	/** Full address, always. */
	| "full";

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

export interface AddressInputClassNames {
	root: string;
	row: string;
	field: string;
	label: string;
	input: string;
	select: string;
	error: string;
}

export interface AddressInputProps {
	value: AddressValue;
	onChange: (value: AddressValue) => void;
	onValidationChange?: (
		valid: boolean,
		errors: import("./utils/validation.js").ValidationError[],
	) => void;
	/** Controls which fields are shown. Defaults to "full". */
	mode?: AddressCollectionMode;
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
	disabled?: boolean;
	className?: string;
	classNames?: Partial<AddressInputClassNames>;
	renderInput?: (props: RenderInputProps) => ReactNode;
	renderCheckbox?: (props: RenderCheckboxProps) => ReactNode;
	renderSelect?: (props: RenderSelectProps) => ReactNode;
	renderContainer?: (props: RenderContainerProps) => ReactNode;
}

export interface ConsumptionTaxValue {
	consumptionTaxId?: string;
	/** True when the business is presumed to hold a valid consumption tax identifier. */
	hasIdentifier?: boolean;
	/**
	 * Consumption tax rate (%) that would apply if the seller had a nexus in the
	 * resolved country/region — i.e. the headline rate for the buyer (accounting
	 * for B2B reverse charge), ignoring whether the seller actually collects.
	 */
	baseTax?: number;
	/**
	 * Rate actually collectable: {@link baseTax} when the seller has a nexus in
	 * the resolved country, 0 otherwise.
	 */
	effectiveTax?: number;
}

export type TaxType = "business" | "individual" | "either";

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
	onValidationChange?: (
		valid: boolean,
		errors: import("./utils/validation.js").ValidationError[],
	) => void;
	mode?: AddressCollectionMode;
	defaultCountry?: string;
	defaultRegion?: string;
	disabled?: boolean;
	className?: string;
	classNames?: Partial<AddressInputClassNames>;
	renderInput?: (props: RenderInputProps) => ReactNode;
	renderCheckbox?: (props: RenderCheckboxProps) => ReactNode;
	renderSelect?: (props: RenderSelectProps) => ReactNode;
	renderContainer?: (props: RenderContainerProps) => ReactNode;
}
