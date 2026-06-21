import type { Story, StoryDefault } from "@ladle/react";
import { AddressWrapper } from "./_utils.js";

export default {
	title: "Address",
} satisfies StoryDefault;

export const AT: Story = () => <AddressWrapper defaultCountry="AT" />;
AT.storyName = "Austria";

export const AU: Story = () => <AddressWrapper defaultCountry="AU" />;
AU.storyName = "Australia";

export const BE: Story = () => <AddressWrapper defaultCountry="BE" />;
BE.storyName = "Belgium";

export const CA: Story = () => <AddressWrapper defaultCountry="CA" />;
CA.storyName = "Canada";

export const CH: Story = () => <AddressWrapper defaultCountry="CH" />;
CH.storyName = "Switzerland";

export const DE: Story = () => <AddressWrapper defaultCountry="DE" />;
DE.storyName = "Germany";

export const ES: Story = () => <AddressWrapper defaultCountry="ES" />;
ES.storyName = "Spain";

export const FR: Story = () => <AddressWrapper defaultCountry="FR" />;
FR.storyName = "France";

export const GB: Story = () => <AddressWrapper defaultCountry="GB" />;
GB.storyName = "UnitedKingdom";

export const IT: Story = () => <AddressWrapper defaultCountry="IT" />;
IT.storyName = "Italy";

export const JP: Story = () => <AddressWrapper defaultCountry="JP" />;
JP.storyName = "Japan";

export const NL: Story = () => <AddressWrapper defaultCountry="NL" />;
NL.storyName = "Netherlands";

export const PL: Story = () => <AddressWrapper defaultCountry="PL" />;
PL.storyName = "Poland";

export const US: Story = () => <AddressWrapper defaultCountry="US" />;
US.storyName = "United States";
