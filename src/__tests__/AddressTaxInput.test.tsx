import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Ref, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AddressInputHandle } from "../components/AddressInput";
import { AddressTaxInput } from "../components/AddressTaxInput/AddressTaxInput";
import type { AddressValue } from "../utils/address";
import type { ConsumptionTaxValue } from "../utils/tax";

const baseAddress: AddressValue = {
  line1: "123 Main St",
  city: "New York",
  level1: "NY",
  postalCode: "10001",
  country: "US",
};

describe("AddressTaxInput", () => {
  it("renders address fields and business checkbox by default", () => {
    render(<AddressTaxInput addressValue={baseAddress} onAddressChange={() => {}} taxType="either" />);
    expect(screen.getByLabelText(/business account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
  });

  it("does not show business checkbox when taxType is business", () => {
    render(<AddressTaxInput addressValue={baseAddress} onAddressChange={() => {}} taxType="business" />);
    expect(screen.queryByLabelText(/business account/i)).not.toBeInTheDocument();
  });

  it("does not show business checkbox when taxType is individual", () => {
    render(<AddressTaxInput addressValue={baseAddress} onAddressChange={() => {}} taxType="individual" />);
    expect(screen.queryByLabelText(/business account/i)).not.toBeInTheDocument();
  });

  it("shows tax fields when taxType is business", () => {
    render(<AddressTaxInput addressValue={baseAddress} onAddressChange={() => {}} taxType="business" />);

    // Should show tax-related fields
    expect(screen.getByText(/I don't have a/i)).toBeInTheDocument();
    // Tax ID field - use more flexible selector
    const taxInputs = screen.getAllByRole("textbox");
    const taxIdInput = taxInputs.find((input) => input.getAttribute("id") === "rav-consumptionTaxId");
    expect(taxIdInput).toBeDefined();
  });

  it("does not show tax fields when taxType is individual", () => {
    render(<AddressTaxInput addressValue={baseAddress} onAddressChange={() => {}} taxType="individual" />);
    expect(screen.queryByText(/I don't have a/i)).not.toBeInTheDocument();
  });

  it("does not show tax fields when no country is set", () => {
    const emptyAddress = { ...baseAddress, country: "" };
    render(<AddressTaxInput addressValue={emptyAddress} onAddressChange={() => {}} taxType="business" />);
    expect(screen.queryByText(/I don't have a/i)).not.toBeInTheDocument();
  });

  it("only shows tax fields for countries in nexusList", () => {
    const { rerender } = render(
      <AddressTaxInput
        addressValue={{ ...baseAddress, country: "US" }}
        onAddressChange={() => {}}
        taxType="business"
        nexusList={["FR", "DE"]}
      />,
    );

    // US is not in nexus list, no tax fields
    expect(screen.queryByText(/I don't have a/i)).not.toBeInTheDocument();

    // Change to FR (in nexus list)
    rerender(
      <AddressTaxInput
        addressValue={{ ...baseAddress, country: "FR", level1: "", postalCode: "" }}
        onAddressChange={() => {}}
        taxType="business"
        nexusList={["FR", "DE"]}
      />,
    );

    expect(screen.getByText(/I don't have a/i)).toBeInTheDocument();
  });

  it("calls onBusinessChange when business checkbox is toggled", async () => {
    const onBusinessChange = vi.fn();
    render(
      <AddressTaxInput
        addressValue={baseAddress}
        onAddressChange={() => {}}
        taxType="either"
        onBusinessChange={onBusinessChange}
      />,
    );

    await userEvent.click(screen.getByLabelText(/business account/i));
    expect(onBusinessChange).toHaveBeenCalledWith(true);
  });

  it("calls onConsumptionTaxChange on mount", () => {
    const onConsumptionTaxChange = vi.fn();
    render(
      <AddressTaxInput
        addressValue={baseAddress}
        onAddressChange={() => {}}
        taxType="business"
        onConsumptionTaxChange={onConsumptionTaxChange}
      />,
    );

    // Should be called on mount with initial state
    expect(onConsumptionTaxChange).toHaveBeenCalled();
    const call = onConsumptionTaxChange.mock.calls[0][0];
    expect(call).toHaveProperty("hasIdentifier");
    expect(call).toHaveProperty("baseTax");
    expect(call).toHaveProperty("effectiveTax");
  });

  it("validates tax identifier format and shows error", async () => {
    render(
      <AddressTaxInput
        addressValue={{ ...baseAddress, country: "FR", level1: "", postalCode: "" }}
        onAddressChange={() => {}}
        taxType="business"
      />,
    );

    const input = document.getElementById("rav-consumptionTaxId") as HTMLInputElement;
    expect(input).not.toBeNull();
    await userEvent.type(input, "invalid");
    await userEvent.tab();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("shows country-specific tax label for EU countries", () => {
    render(
      <AddressTaxInput
        addressValue={{ ...baseAddress, country: "FR", level1: "", postalCode: "" }}
        onAddressChange={() => {}}
        taxType="business"
      />,
    );

    // France should show "VAT number" - check the input exists
    const input = document.getElementById("rav-consumptionTaxId") as HTMLInputElement;
    expect(input).not.toBeNull();
    // Check the label contains "VAT"
    const label = document.querySelector('label[for="rav-consumptionTaxId"]');
    expect(label?.textContent).toMatch(/VAT/i);
  });

  it("forwards ref to AddressInput", () => {
    const ref: Ref<AddressInputHandle> = { current: null };
    render(<AddressTaxInput ref={ref} addressValue={baseAddress} onAddressChange={() => {}} taxType="business" />);

    expect(ref.current).not.toBeNull();
    expect(ref.current).toHaveProperty("validate");
  });

  it("disables all fields when disabled prop is set", () => {
    render(<AddressTaxInput addressValue={baseAddress} onAddressChange={() => {}} taxType="either" disabled />);

    const businessCheckbox = screen.getByLabelText(/business account/i) as HTMLInputElement;
    expect(businessCheckbox.disabled).toBe(true);
  });

  it("uses controlled isBusiness prop when provided", () => {
    const { rerender } = render(
      <AddressTaxInput addressValue={baseAddress} onAddressChange={() => {}} taxType="either" isBusiness={true} />,
    );

    const checkbox = screen.getByLabelText(/business account/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    // Rerender with false
    rerender(<AddressTaxInput addressValue={baseAddress} onAddressChange={() => {}} taxType="either" isBusiness={false} />);

    expect(checkbox.checked).toBe(false);
  });

  it("uses controlled hasTaxIdentifier prop when provided", () => {
    render(<AddressTaxInput addressValue={baseAddress} onAddressChange={() => {}} taxType="business" hasTaxIdentifier={false} />);

    const checkbox = screen
      .getByText(/I don't have a/i)
      .closest("label")
      ?.querySelector("input") as HTMLInputElement;
    expect(checkbox.checked).toBe(true); // Note: checkbox is inverted
    expect(screen.queryByLabelText(/^tax id$/i)).not.toBeInTheDocument();
  });

  it("uses controlled taxIdentifier prop when provided", () => {
    render(
      <AddressTaxInput
        addressValue={{ ...baseAddress, country: "FR", level1: "", postalCode: "" }}
        onAddressChange={() => {}}
        taxType="business"
        taxIdentifier="FR12345678901"
      />,
    );

    const input = document.getElementById("rav-consumptionTaxId") as HTMLInputElement;
    expect(input.value).toBe("FR12345678901");
  });

  it("shows fullRegion mode for countries with regional tax", () => {
    render(
      <AddressTaxInput
        addressValue={{ ...baseAddress, country: "US" }}
        onAddressChange={() => {}}
        mode="full"
        taxType="individual"
      />,
    );

    // US has regional tax, so level1 (state) field should be shown even in "full" mode
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
  });

  it("marks tax identifier as required when consumptionTaxRequired is true", () => {
    render(
      <AddressTaxInput addressValue={baseAddress} onAddressChange={() => {}} taxType="business" consumptionTaxRequired={true} />,
    );

    const input = document.getElementById("rav-consumptionTaxId") as HTMLInputElement;
    expect(input).toBeRequired();
  });

  it("updates onConsumptionTaxChange when country changes", async () => {
    const onConsumptionTaxChange = vi.fn();
    const onAddressChange = vi.fn();

    render(
      <AddressTaxInput
        addressValue={baseAddress}
        onAddressChange={onAddressChange}
        taxType="business"
        onConsumptionTaxChange={onConsumptionTaxChange}
      />,
    );

    const initialCallCount = onConsumptionTaxChange.mock.calls.length;

    const countrySelect = screen.getByLabelText(/country/i);
    await userEvent.selectOptions(countrySelect, "FR");

    // Should trigger new tax calculation
    expect(onConsumptionTaxChange.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it("passes validationMode to AddressInput", () => {
    const onValidationChange = vi.fn();
    render(
      <AddressTaxInput
        addressValue={{ ...baseAddress, line1: "" }}
        onAddressChange={() => {}}
        validationMode="onSubmit"
        onValidationChange={onValidationChange}
        taxType="individual"
      />,
    );

    // In onSubmit mode, validation errors are not shown until validate() is called
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
