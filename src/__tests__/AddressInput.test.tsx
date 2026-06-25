import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type Ref, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { AddressInput, type AddressInputHandle } from "../components/AddressInput/AddressInput";
import type { AddressValue, ValidationMode } from "../utils/address";

const baseValue: AddressValue = {
  line1: "123 Main St",
  city: "New York",
  level1: "NY",
  postalCode: "10001",
  country: "US",
};

/** Stateful harness so typed values persist (a real controlled parent). */
function Harness({
  initial,
  validationMode,
  inputRef,
}: {
  initial: AddressValue;
  validationMode?: ValidationMode;
  inputRef?: Ref<AddressInputHandle>;
}) {
  const [value, setValue] = useState(initial);
  return <AddressInput ref={inputRef} value={value} onChange={setValue} validationMode={validationMode} />;
}

describe("AddressInput", () => {
  it("renders country selector", () => {
    render(<AddressInput value={baseValue} onChange={() => {}} />);
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
  });

  it("renders US address fields", () => {
    render(<AddressInput value={baseValue} onChange={() => {}} mode="fullRegion" />);
    expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
  });

  it("calls onChange when a field changes", async () => {
    const onChange = vi.fn();
    render(<AddressInput value={baseValue} onChange={onChange} />);
    const input = screen.getByLabelText(/address line 1/i);

    // Use fireEvent for better compatibility with Bun's test runner
    fireEvent.change(input, { target: { value: "456 Elm St" } });

    expect(onChange).toHaveBeenCalled();
  });

  it("shows validation error on blur when field is empty", async () => {
    render(<AddressInput value={{ ...baseValue, line1: "" }} onChange={() => {}} />);
    const input = screen.getByLabelText(/address line 1/i);
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("calls onValidationChange with validity", () => {
    const onValidationChange = vi.fn();
    render(<AddressInput value={baseValue} onChange={() => {}} onValidationChange={onValidationChange} />);
    expect(onValidationChange).toHaveBeenCalledWith(true, []);
  });

  it("resets postal code and level1 on country change", async () => {
    const onChange = vi.fn();
    render(<AddressInput value={baseValue} onChange={onChange} />);
    const select = screen.getByLabelText(/country/i);
    fireEvent.change(select, { target: { value: "DE" } });

    // Wait for the change to propagate
    await new Promise((resolve) => setTimeout(resolve, 0));

    const lastCall = onChange.mock.calls.at(-1)?.[0] as AddressValue;
    expect(lastCall?.postalCode).toBe("");
    expect(lastCall?.level1).toBe("");
  });

  it("renders DE address fields after switching country", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<AddressInput value={baseValue} onChange={onChange} />);
    rerender(<AddressInput value={{ ...baseValue, country: "DE", level1: "", postalCode: "" }} onChange={onChange} />);
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
    render(<AddressInput value={baseValue} onChange={() => {}} classNames={{ root: "my-root", field: "my-field" }} />);
    expect(document.querySelector(".my-root")).toBeInTheDocument();
  });

  it("shows only state field in minimal mode for US", () => {
    render(<AddressInput value={baseValue} onChange={() => {}} mode="minimal" />);
    expect(screen.queryByLabelText(/address line 1/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
  });

  it("shows no address fields in minimal mode for non-EU non-federal country", () => {
    render(
      <AddressInput value={{ ...baseValue, country: "JP", level1: "", postalCode: "" }} onChange={() => {}} mode="minimal" />,
    );
    expect(screen.queryByLabelText(/address line 1/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/prefecture/i)).not.toBeInTheDocument();
  });

  it("shows full address in minimal mode for EU country", () => {
    render(
      <AddressInput value={{ ...baseValue, country: "DE", level1: "", postalCode: "" }} onChange={() => {}} mode="minimal" />,
    );
    expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
  });

  it("uses defaultRegion to pre-fill state", () => {
    render(<AddressInput value={{ ...baseValue, level1: "" }} onChange={() => {}} defaultRegion="CA" mode="fullRegion" />);
    const stateSelect = screen.getByLabelText(/state/i) as HTMLSelectElement;
    expect(stateSelect.value).toBe("CA");
  });

  it("omits level1 in full mode and requires it in region/fullRegion modes", () => {
    const { rerender } = render(<AddressInput value={baseValue} onChange={() => {}} mode="full" />);
    // Absent in full mode — level1 is not included in full mode.
    expect(screen.queryByLabelText(/state/i)).not.toBeInTheDocument();

    rerender(<AddressInput value={baseValue} onChange={() => {}} mode="region" />);
    // Required in region mode: no "(optional)" suffix.
    expect(screen.queryByLabelText(/state \(optional\)/i)).not.toBeInTheDocument();
    const state = screen.getByLabelText(/state/i);
    expect(state).toBeInTheDocument();
    expect(state).toBeRequired();
  });

  it("shows level1 as required for a country without a level1 field in fullRegion mode", () => {
    // DE normally has no level1 field; fullRegion mode must surface it as a
    // required field rather than omitting it.
    render(
      <AddressInput value={{ ...baseValue, country: "DE", level1: "", postalCode: "" }} onChange={() => {}} mode="fullRegion" />,
    );
    const region = screen.getByLabelText(/federated state/i);
    expect(region).toBeInTheDocument();
    expect(region).toBeRequired();
    expect(screen.queryByLabelText(/federated state \(optional\)/i)).not.toBeInTheDocument();
  });

  it("reports valid in minimal mode once only the country is provided (non-regional, non-EU)", () => {
    const onValidationChange = vi.fn();
    // JP in minimal mode collects only the country: no other fields required.
    render(
      <AddressInput
        value={{ line1: "", city: "", level1: "", postalCode: "", country: "JP" }}
        onChange={() => {}}
        mode="minimal"
        onValidationChange={onValidationChange}
      />,
    );
    expect(onValidationChange).toHaveBeenLastCalledWith(true, []);
  });

  it("reports valid in minimal mode for the US once country and region are provided", () => {
    const onValidationChange = vi.fn();
    render(
      <AddressInput
        value={{ line1: "", city: "", level1: "NY", postalCode: "", country: "US" }}
        onChange={() => {}}
        mode="minimal"
        onValidationChange={onValidationChange}
      />,
    );
    expect(onValidationChange).toHaveBeenLastCalledWith(true, []);
  });

  it("onBlur mode hides errors until the field is blurred", async () => {
    render(<Harness initial={{ ...baseValue, line1: "" }} validationMode="onBlur" />);
    const input = screen.getByLabelText(/address line 1/i);
    await userEvent.type(input, "ab");
    await userEvent.clear(input);
    // Typing/clearing alone should not surface the error in onBlur mode.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.tab();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("onType mode reveals errors as the field is edited", async () => {
    render(<Harness initial={{ ...baseValue, line1: "x" }} validationMode="onType" />);
    const input = screen.getByLabelText(/address line 1/i);
    await userEvent.clear(input);
    // Editing to an empty value reveals the error immediately, without blur.
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("onSubmit mode hides errors until validate() is called via ref", async () => {
    const ref = createRef<AddressInputHandle>();
    render(<Harness initial={{ ...baseValue, line1: "" }} validationMode="onSubmit" inputRef={ref} />);
    const input = screen.getByLabelText(/address line 1/i);
    await userEvent.type(input, "ab");
    await userEvent.clear(input);
    await userEvent.tab();
    // Neither typing nor blur reveals errors in onSubmit mode.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    const result = ref.current?.validate();
    expect(result?.valid).toBe(false);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
