import type { Story, StoryDefault } from "@ladle/react";
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { AddressInput } from "../components/AddressInput/index";
import { AddressTaxInput } from "../components/AddressTaxInput/index";
import type { AddressValue } from "../utils/address";
import type { ConsumptionTaxValue } from "../utils/tax";

import "./tailwind.css";

import type { RenderCheckboxProps, RenderContainerProps, RenderInputProps, RenderSelectProps } from "../components/AddressInput";

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

// ---------------------------------------------------------------------------
// Custom country dropdown — no native <select>.
//
// Renders a button + popup listbox styled with Tailwind, each option prefixed
// with its flag from purecatamphetamine.github.io/country-flag-icons. Country
// codes from the option list are ISO alpha-2, which is exactly what that flag
// CDN keys on. AddressInput's onChange only reads `event.target.value`, so we
// hand it a minimal synthetic event.
// ---------------------------------------------------------------------------

function flagUrl(code: string) {
  return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code.toUpperCase()}.svg`;
}

function Flag({ code, label }: { code: string; label: string }) {
  return (
    <img
      src={flagUrl(code)}
      alt=""
      aria-hidden="true"
      width={20}
      height={15}
      loading="lazy"
      className="h-3.75 w-5 shrink-0 rounded-xs object-cover ring-1 ring-slate-900/10"
      title={label}
    />
  );
}

function TailwindCountrySelect(props: RenderSelectProps & { placeholderOverride?: string }) {
  const { options, value, onChange, disabled } = props;
  const placeholder = props.placeholderOverride ?? props.placeholder;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, query]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // When opening, focus the search box and reset the highlighted row.
  // Keyed only on `open` so typing (which can produce a fresh `options`
  // reference from the parent) doesn't wipe the query on every keystroke.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on open transitions
  useEffect(() => {
    if (open) {
      setQuery("");
      const sel = options.findIndex((o) => o.value === value);
      setActiveIndex(sel >= 0 ? sel : 0);
      inputRef.current?.focus();
    }
  }, [open]);

  // Keep the highlighted row in view.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function commit(code: string) {
    onChange({
      target: { value: code },
    } as unknown as Parameters<typeof onChange>[0]);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (open && opt) commit(opt.value);
      else setOpen(true);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={props.id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-required={props.required}
        aria-invalid={props["aria-invalid"]}
        aria-describedby={props["aria-describedby"]}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/30"
      >
        {selected ? (
          <>
            <Flag code={selected.value} label={selected.label} />
            <span className="truncate">{selected.label}</span>
          </>
        ) : (
          <span className="truncate text-slate-400">{placeholder ?? "Select a country"}</span>
        )}
        <svg
          className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
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
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search countries…"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <ul ref={listRef} id={listboxId} role="listbox" aria-label="Country" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-400">No matches</li>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIndex;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(opt.value)}
                    className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm ${
                      isActive ? "bg-indigo-50" : ""
                    } ${isSelected ? "font-medium text-indigo-900" : "text-slate-700"}`}
                  >
                    <Flag code={opt.value} label={opt.label} />
                    <span className="truncate">{opt.label}</span>
                    {isSelected ? (
                      <svg className="ml-auto h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.29 6.8-6.79a1 1 0 0 1 1.4 0Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function TailwindSelect(props: RenderSelectProps) {
  const { options, value, onChange, disabled, placeholder } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, query]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // When opening, focus the search box and reset the highlighted row.
  // Keyed only on `open` so typing (which can produce a fresh `options`
  // reference from the parent) doesn't wipe the query on every keystroke.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on open transitions
  useEffect(() => {
    if (open) {
      setQuery("");
      const sel = options.findIndex((o) => o.value === value);
      setActiveIndex(sel >= 0 ? sel : 0);
      inputRef.current?.focus();
    }
  }, [open]);

  // Keep the highlighted row in view.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function commit(next: string) {
    onChange({
      target: { value: next },
    } as unknown as Parameters<typeof onChange>[0]);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (open && opt) commit(opt.value);
      else setOpen(true);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={props.id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-required={props.required}
        aria-invalid={props["aria-invalid"]}
        aria-describedby={props["aria-describedby"]}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/30"
      >
        {selected ? (
          <span className="truncate">{selected.label}</span>
        ) : (
          <span className="truncate text-slate-400">{placeholder ?? "Select an option"}</span>
        )}
        <svg
          className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
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
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search…"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <ul ref={listRef} id={listboxId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-400">No matches</li>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIndex;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(opt.value)}
                    className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm ${
                      isActive ? "bg-indigo-50" : ""
                    } ${isSelected ? "font-medium text-indigo-900" : "text-slate-700"}`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected ? (
                      <svg className="ml-auto h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.29 6.8-6.79a1 1 0 0 1 1.4 0Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
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
        <p id={`${props.id}-error`} role="alert" className="text-xs font-medium text-red-600">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}

const tailwindRenderers = {
  renderInput: TailwindInput,
  // Wrap the hook-bearing selects in JSX so AddressInput mounts them as their
  // own components. The selects are rendered conditionally, and AddressInput
  // invokes renderers as plain calls — returning elements keeps each select's
  // hooks in its own fiber instead of leaking into AddressInput's hook list.
  renderCountrySelect: (props: RenderSelectProps) => <TailwindCountrySelect {...props} />,
  renderLevel1AdministrativeSelect: (props: RenderSelectProps) => <TailwindSelect {...props} />,
  renderCheckbox: TailwindCheckbox,
  renderContainer: TailwindContainer,
} as const;

/**
 * Variant of the renderer set with a custom country-dropdown placeholder.
 * AddressInput hardcodes the select placeholder, so we override it here on the
 * way into the custom renderCountrySelect.
 */
function makeTailwindRenderers(countryPlaceholder: string) {
  return {
    ...tailwindRenderers,
    renderCountrySelect: (props: RenderSelectProps) => (
      <TailwindCountrySelect {...props} placeholderOverride={countryPlaceholder} />
    ),
  } as const;
}

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

function AccountTypeSwitch({ value, onChange }: { value: AccountType; onChange: (value: AccountType) => void }) {
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
                active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d={card.icon} />
              </svg>
            </span>
            <span className="flex flex-col">
              <span className={`text-sm font-semibold ${active ? "text-indigo-900" : "text-slate-800"}`}>{card.title}</span>
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
      <summary className="cursor-pointer font-medium text-slate-700">Form state</summary>
      <pre className="mt-3 overflow-x-auto text-xs text-slate-600">{JSON.stringify(state, null, 2)}</pre>
    </details>
  );
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
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
    <Shell title="Billing details" subtitle="A fully custom form built with Tailwind-styled render props.">
      <div className="flex flex-col gap-5">
        <AccountTypeSwitch value={account} onChange={setAccount} />
        <AddressTaxInput
          addressValue={addressValue}
          taxValue={taxValue}
          taxType={account}
          defaultCountry="DE"
          onAddressChange={setAddressValue}
          onConsumptionTaxChange={setTaxValue}
          countryPlaceholder="Choose your country"
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
  // Demonstrates a custom placeholder on the flag dropdown.
  const renderers = useMemo(() => makeTailwindRenderers("🌍 Where are we shipping?"), []);
  return (
    <Shell title="Shipping address" subtitle="Pick a country first — the fields adapt to it.">
      <AddressInput value={value} onChange={setValue} classNames={{ root: "flex flex-col gap-4" }} {...renderers} />
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
    <Shell title="Tax details" subtitle="Choose an account type, then pick a country to resolve the tax.">
      <div className="flex flex-col gap-5">
        <AccountTypeSwitch value={account} onChange={setAccount} />
        <AddressTaxInput
          addressValue={addressValue}
          taxValue={taxValue}
          taxType={account}
          onAddressChange={setAddressValue}
          onConsumptionTaxChange={setTaxValue}
          countryPlaceholder="Choose your country"
          classNames={{ root: "flex flex-col gap-4" }}
          {...tailwindRenderers}
        />
      </div>
      <StateDump state={{ account, addressValue, taxValue }} />
    </Shell>
  );
}
export const AddressForm: Story = () => <AddressFormDemo />;
AddressForm.storyName = "Address no country";

export const AddressTaxForm: Story = () => <AddressTaxFormDemo />;
AddressTaxForm.storyName = "Address tax no country";

export const AddressTaxFormGermany: Story = () => <BillingDemo />;
AddressTaxFormGermany.storyName = "Address tax with country";
