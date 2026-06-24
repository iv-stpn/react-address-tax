import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddressInput } from "../components/AddressInput/AddressInput.js";
import type { AddressValue } from "../types.js";

const baseValue: AddressValue = {
	line1: "123 Main St",
	city: "New York",
	level1: "NY",
	postalCode: "10001",
	country: "US",
};

describe("AddressInput", () => {
	it("renders country selector", () => {
		render(<AddressInput value={baseValue} onChange={() => {}} />);
		expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
	});

	it("renders US address fields", () => {
		render(
			<AddressInput value={baseValue} onChange={() => {}} requireLevel1 />,
		);
		expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
	});

	it("calls onChange when a field changes", async () => {
		const onChange = vi.fn();
		render(<AddressInput value={baseValue} onChange={onChange} />);
		await userEvent.clear(screen.getByLabelText(/street address/i));
		await userEvent.type(
			screen.getByLabelText(/street address/i),
			"456 Elm St",
		);
		expect(onChange).toHaveBeenCalled();
	});

	it("shows validation error on blur when field is empty", async () => {
		render(
			<AddressInput value={{ ...baseValue, line1: "" }} onChange={() => {}} />,
		);
		const input = screen.getByLabelText(/street address/i);
		fireEvent.blur(input);
		expect(await screen.findByRole("alert")).toBeInTheDocument();
	});

	it("calls onValidationChange with validity", () => {
		const onValidationChange = vi.fn();
		render(
			<AddressInput
				value={baseValue}
				onChange={() => {}}
				onValidationChange={onValidationChange}
			/>,
		);
		expect(onValidationChange).toHaveBeenCalledWith(true, []);
	});

	it("resets postal code and level1 on country change", async () => {
		const onChange = vi.fn();
		render(<AddressInput value={baseValue} onChange={onChange} />);
		const select = screen.getByLabelText(/country/i);
		await userEvent.selectOptions(select, "DE");
		const lastCall = onChange.mock.calls.at(-1)?.[0] as AddressValue;
		expect(lastCall.postalCode).toBe("");
		expect(lastCall.level1).toBe("");
	});

	it("renders DE address fields after switching country", async () => {
		const onChange = vi.fn();
		const { rerender } = render(
			<AddressInput value={baseValue} onChange={onChange} />,
		);
		rerender(
			<AddressInput
				value={{ ...baseValue, country: "DE", level1: "", postalCode: "" }}
				onChange={onChange}
			/>,
		);
		expect(screen.getByLabelText(/postal code \(plz\)/i)).toBeInTheDocument();
	});

	it("is disabled when disabled prop is set", () => {
		render(<AddressInput value={baseValue} onChange={() => {}} disabled />);
		const inputs = screen.getAllByRole("textbox");
		for (const input of inputs) {
			expect(input).toBeDisabled();
		}
	});

	it("accepts custom classNames", () => {
		render(
			<AddressInput
				value={baseValue}
				onChange={() => {}}
				classNames={{ root: "my-root", field: "my-field" }}
			/>,
		);
		expect(document.querySelector(".my-root")).toBeInTheDocument();
	});

	it("shows only state field in minimal mode for US", () => {
		render(
			<AddressInput
				value={baseValue}
				onChange={() => {}}
				mode="minimal"
				requireLevel1
			/>,
		);
		expect(screen.queryByLabelText(/street address/i)).not.toBeInTheDocument();
		expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
	});

	it("shows no address fields in minimal mode for non-EU non-federal country", () => {
		render(
			<AddressInput
				value={{ ...baseValue, country: "JP", level1: "", postalCode: "" }}
				onChange={() => {}}
				mode="minimal"
			/>,
		);
		expect(screen.queryByLabelText(/street address/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/prefecture/i)).not.toBeInTheDocument();
	});

	it("shows full address in minimal mode for EU country", () => {
		render(
			<AddressInput
				value={{ ...baseValue, country: "DE", level1: "", postalCode: "" }}
				onChange={() => {}}
				mode="minimal"
			/>,
		);
		expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
	});

	it("uses defaultRegion to pre-fill state", () => {
		render(
			<AddressInput
				value={{ ...baseValue, level1: "" }}
				onChange={() => {}}
				defaultRegion="CA"
				requireLevel1
			/>,
		);
		const stateSelect = screen.getByLabelText(/state/i) as HTMLSelectElement;
		expect(stateSelect.value).toBe("CA");
	});

	it("omits level1 by default and requires it when requireLevel1 is set", () => {
		const { rerender } = render(
			<AddressInput value={baseValue} onChange={() => {}} mode="region" />,
		);
		// Absent by default — level1 is never optional.
		expect(screen.queryByLabelText(/state/i)).not.toBeInTheDocument();

		rerender(
			<AddressInput
				value={baseValue}
				onChange={() => {}}
				mode="region"
				requireLevel1
			/>,
		);
		// Required when requireLevel1 is set: no "(optional)" suffix.
		expect(
			screen.queryByLabelText(/state \(optional\)/i),
		).not.toBeInTheDocument();
		const state = screen.getByLabelText(/state/i);
		expect(state).toBeInTheDocument();
		expect(state).toBeRequired();
	});

	it("shows level1 as required for a country without a level1 field when requireLevel1 is set", () => {
		// DE normally has no level1 field; requireLevel1 must surface it as a
		// required field rather than omitting it.
		render(
			<AddressInput
				value={{ ...baseValue, country: "DE", level1: "", postalCode: "" }}
				onChange={() => {}}
				requireLevel1
			/>,
		);
		const region = screen.getByLabelText(/federated state/i);
		expect(region).toBeInTheDocument();
		expect(region).toBeRequired();
		expect(
			screen.queryByLabelText(/federated state \(optional\)/i),
		).not.toBeInTheDocument();
	});
});
