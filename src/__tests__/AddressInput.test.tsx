import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddressInput } from "../components/AddressInput/AddressInput.js";
import type { AddressValue } from "../types.js";

const baseValue: AddressValue = {
	line1: "123 Main St",
	city: "New York",
	state: "NY",
	postalCode: "10001",
	country: "US",
};

describe("AddressInput", () => {
	it("renders country selector", () => {
		render(<AddressInput value={baseValue} onChange={() => {}} />);
		expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
	});

	it("renders US address fields", () => {
		render(<AddressInput value={baseValue} onChange={() => {}} />);
		expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
	});

	it("calls onChange when a field changes", async () => {
		const onChange = vi.fn();
		render(<AddressInput value={baseValue} onChange={onChange} />);
		await userEvent.clear(screen.getByLabelText(/address line 1/i));
		await userEvent.type(
			screen.getByLabelText(/address line 1/i),
			"456 Elm St",
		);
		expect(onChange).toHaveBeenCalled();
	});

	it("shows validation error on blur when field is empty", async () => {
		render(
			<AddressInput value={{ ...baseValue, line1: "" }} onChange={() => {}} />,
		);
		const input = screen.getByLabelText(/address line 1/i);
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

	it("resets postal code and state on country change", async () => {
		const onChange = vi.fn();
		render(<AddressInput value={baseValue} onChange={onChange} />);
		const select = screen.getByLabelText(/country/i);
		await userEvent.selectOptions(select, "DE");
		const lastCall = onChange.mock.calls.at(-1)?.[0] as AddressValue;
		expect(lastCall.postalCode).toBe("");
		expect(lastCall.state).toBe("");
	});

	it("renders DE address fields after switching country", async () => {
		const onChange = vi.fn();
		const { rerender } = render(
			<AddressInput value={baseValue} onChange={onChange} />,
		);
		rerender(
			<AddressInput
				value={{ ...baseValue, country: "DE", state: "", postalCode: "" }}
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
			<AddressInput value={baseValue} onChange={() => {}} mode="minimal" />,
		);
		expect(screen.queryByLabelText(/address line 1/i)).not.toBeInTheDocument();
		expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
	});

	it("shows no address fields in minimal mode for non-EU non-federal country", () => {
		render(
			<AddressInput
				value={{ ...baseValue, country: "JP", state: "", postalCode: "" }}
				onChange={() => {}}
				mode="minimal"
			/>,
		);
		expect(screen.queryByLabelText(/address line 1/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/prefecture/i)).not.toBeInTheDocument();
	});

	it("shows full address in minimal mode for EU country", () => {
		render(
			<AddressInput
				value={{ ...baseValue, country: "DE", state: "", postalCode: "" }}
				onChange={() => {}}
				mode="minimal"
			/>,
		);
		expect(
			screen.getByLabelText(/street and house number/i),
		).toBeInTheDocument();
	});

	it("uses defaultRegion to pre-fill state", () => {
		render(
			<AddressInput
				value={{ ...baseValue, state: "" }}
				onChange={() => {}}
				defaultRegion="CA"
			/>,
		);
		const stateSelect = screen.getByLabelText(/state/i) as HTMLSelectElement;
		expect(stateSelect.value).toBe("CA");
	});
});
