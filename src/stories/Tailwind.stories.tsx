import type { Story, StoryDefault } from "@ladle/react";
import { type ReactNode, useState } from "react";
import { AddressInput } from "../components/AddressInput/index.js";
import { AddressTaxInput } from "../components/AddressTaxInput/index.js";
import type {
	AddressValue,
	ConsumptionTaxValue,
	RenderCheckboxProps,
	RenderContainerProps,
	RenderInputProps,
	RenderSelectProps,
} from "../types.js";
import "./tailwind.css";

export default {
	title: "Tailwind",
} satisfies StoryDefault;

// ---------------------------------------------------------------------------
// Tailwind-styled render functions
//
// Each one replaces the component's default element with a Tailwind-styled
// equivalent. They receive the same props the internal inputs would have used,
// so behavior (validation, ids, wiring) is identical — only the markup/CSS
// changes. This is the hook a consumer uses to drop the fields into their own
// design system.
// ---------------------------------------------------------------------------

function TailwindInput(props: RenderInputProps) {
	return (
		<input
			id={props.id}
			type="text"
			value={props.value}
			onChange={props.onChange}
			onBlur={props.onBlur}
			placeholder={props.placeholder}
			disabled={props.disabled}
			aria-required={props.required}
			aria-invalid={props["aria-invalid"]}
			aria-describedby={props["aria-describedby"]}
			className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/30"
		/>
	);
}

function TailwindSelect(props: RenderSelectProps) {
	return (
		<div className="relative">
			<select
				id={props.id}
				value={props.value}
				onChange={props.onChange}
				onBlur={props.onBlur}
				disabled={props.disabled}
				aria-required={props.required}
				aria-invalid={props["aria-invalid"]}
				aria-describedby={props["aria-describedby"]}
				className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
			>
				{props.placeholder ? (
					<option value="" disabled>
						{props.placeholder}
					</option>
				) : null}
				{props.options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
			<svg
				className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400"
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					fillRule="evenodd"
					d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
					clipRule="evenodd"
				/>
			</svg>
		</div>
	);
}

function TailwindCheckbox(props: RenderCheckboxProps) {
	return (
		<label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
			<input
				type="checkbox"
				checked={props.checked}
				onChange={props.onChange}
				disabled={props.disabled}
				className="h-4 w-4 rounded border-slate-300 text-indigo-600 shadow-sm transition focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
			/>
			<span>{props.label}</span>
		</label>
	);
}

function TailwindContainer(props: RenderContainerProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={props.id} className="text-sm font-medium text-slate-700">
				{props.label}
				{props.required ? <span className="text-red-500"> *</span> : null}
			</label>
			{props.children}
			{props.error ? (
				<p
					id={`${props.id}-error`}
					role="alert"
					className="text-xs font-medium text-red-600"
				>
					{props.error}
				</p>
			) : null}
		</div>
	);
}

const tailwindRenderers = {
	renderInput: TailwindInput,
	renderSelect: TailwindSelect,
	renderCheckbox: TailwindCheckbox,
	renderContainer: TailwindContainer,
} as const;

// ---------------------------------------------------------------------------
// Account-type switch — two selectable cards (Individual / Business)
//
// Drives the AddressTaxInput by flipping `taxType` between "individual" and
// "business". That suppresses the component's built-in business checkbox while
// still showing the tax-identifier fields when "business" is picked.
// ---------------------------------------------------------------------------

type AccountType = "individual" | "business";

const ACCOUNT_CARDS: {
	id: AccountType;
	title: string;
	desc: string;
	icon: string;
}[] = [
	{
		id: "individual",
		title: "Individual",
		desc: "Personal purchase, no tax ID.",
		icon: "M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 1.5c-2.9 0-6 1.45-6 3.5v1.5h12V15c0-2.05-3.1-3.5-6-3.5Z",
	},
	{
		id: "business",
		title: "Business",
		desc: "Company with a tax identifier.",
		icon: "M4 4h7v12H3V5a1 1 0 0 1 1-1Zm9 4h3a1 1 0 0 1 1 1v7h-4V8ZM5.5 6.5h3V8h-3V6.5Zm0 3h3V11h-3V9.5Z",
	},
];

function AccountTypeSwitch({
	value,
	onChange,
}: {
	value: AccountType;
	onChange: (value: AccountType) => void;
}) {
	return (
		<fieldset className="grid grid-cols-2 gap-3">
			<legend className="sr-only">Account type</legend>
			{ACCOUNT_CARDS.map((card) => {
				const active = value === card.id;
				return (
					<button
						key={card.id}
						type="button"
						aria-pressed={active}
						onClick={() => onChange(card.id)}
						className={`flex items-start gap-3 rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
							active
								? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20"
								: "border-slate-200 bg-white hover:border-slate-300"
						}`}
					>
						<span
							className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
								active
									? "bg-indigo-600 text-white"
									: "bg-slate-100 text-slate-500"
							}`}
						>
							<svg
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d={card.icon} />
							</svg>
						</span>
						<span className="flex flex-col">
							<span
								className={`text-sm font-semibold ${active ? "text-indigo-900" : "text-slate-800"}`}
							>
								{card.title}
							</span>
							<span className="text-xs text-slate-500">{card.desc}</span>
						</span>
					</button>
				);
			})}
		</fieldset>
	);
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

const EMPTY_ADDRESS: AddressValue = {
	line1: "",
	line2: "",
	city: "",
	level1: "",
	postalCode: "",
	country: "",
};

function StateDump({ state }: { state: unknown }) {
	return (
		<details className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
			<summary className="cursor-pointer font-medium text-slate-700">
				Form state
			</summary>
			<pre className="mt-3 overflow-x-auto text-xs text-slate-600">
				{JSON.stringify(state, null, 2)}
			</pre>
		</details>
	);
}

function Shell({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle: string;
	children: ReactNode;
}) {
	return (
		<div className="mx-auto max-w-xl p-6 font-sans text-slate-900">
			<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
				<h1 className="mb-1 text-lg font-semibold">{title}</h1>
				<p className="mb-6 text-sm text-slate-500">{subtitle}</p>
				{children}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Demos
// ---------------------------------------------------------------------------

/** Full billing form: account-type cards + address + tax, prefilled country. */
function BillingDemo() {
	const [addressValue, setAddressValue] = useState<AddressValue>(EMPTY_ADDRESS);
	const [taxValue, setTaxValue] = useState<ConsumptionTaxValue>({});
	const [account, setAccount] = useState<AccountType>("individual");

	return (
		<Shell
			title="Billing details"
			subtitle="A fully custom form built with Tailwind-styled render props."
		>
			<div className="flex flex-col gap-5">
				<AccountTypeSwitch value={account} onChange={setAccount} />
				<AddressTaxInput
					addressValue={addressValue}
					taxValue={taxValue}
					taxType={account}
					defaultCountry="DE"
					onAddressChange={setAddressValue}
					onConsumptionTaxChange={setTaxValue}
					classNames={{ root: "flex flex-col gap-4" }}
					{...tailwindRenderers}
				/>
			</div>
			<StateDump state={{ account, addressValue, taxValue }} />
		</Shell>
	);
}

/** AddressInput only, no country preselected. */
function AddressFormDemo() {
	const [value, setValue] = useState<AddressValue>(EMPTY_ADDRESS);
	return (
		<Shell
			title="Shipping address"
			subtitle="Pick a country first — the fields adapt to it."
		>
			<AddressInput
				value={value}
				onChange={setValue}
				classNames={{ root: "flex flex-col gap-4" }}
				{...tailwindRenderers}
			/>
			<StateDump state={value} />
		</Shell>
	);
}

/** AddressTaxInput with account-type cards, no country preselected. */
function AddressTaxFormDemo() {
	const [addressValue, setAddressValue] = useState<AddressValue>(EMPTY_ADDRESS);
	const [taxValue, setTaxValue] = useState<ConsumptionTaxValue>({});
	const [account, setAccount] = useState<AccountType>("individual");

	return (
		<Shell
			title="Tax details"
			subtitle="Choose an account type, then pick a country to resolve the tax."
		>
			<div className="flex flex-col gap-5">
				<AccountTypeSwitch value={account} onChange={setAccount} />
				<AddressTaxInput
					addressValue={addressValue}
					taxValue={taxValue}
					taxType={account}
					onAddressChange={setAddressValue}
					onConsumptionTaxChange={setTaxValue}
					classNames={{ root: "flex flex-col gap-4" }}
					{...tailwindRenderers}
				/>
			</div>
			<StateDump state={{ account, addressValue, taxValue }} />
		</Shell>
	);
}

export const Billing: Story = () => <BillingDemo />;
Billing.storyName = "Billing form (Germany)";

export const AddressForm: Story = () => <AddressFormDemo />;
AddressForm.storyName = "Address form (no country)";

export const AddressTaxForm: Story = () => <AddressTaxFormDemo />;
AddressTaxForm.storyName = "Address+Tax form (no country)";
