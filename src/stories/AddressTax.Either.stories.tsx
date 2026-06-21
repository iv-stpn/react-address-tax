import type { Story, StoryDefault } from "@ladle/react";
import { AddressTaxWrapper } from "./_utils.js";

export default {
	title: "Address+Tax / Either",
} satisfies StoryDefault;

export const AT: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="AT" />
);
AT.storyName = "Austria";

export const AU: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="AU" />
);
AU.storyName = "Australia";

export const BE: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="BE" />
);
BE.storyName = "Belgium";

export const CA: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="CA" />
);
CA.storyName = "Canada";

export const CH: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="CH" />
);
CH.storyName = "Switzerland";

export const DE: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="DE" />
);
DE.storyName = "Germany";

export const ES: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="ES" />
);
ES.storyName = "Spain";

export const FR: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="FR" />
);
FR.storyName = "France";

export const GB: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="GB" />
);
GB.storyName = "United Kingdom";

export const IT: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="IT" />
);
IT.storyName = "Italy";

export const JP: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="JP" />
);
JP.storyName = "Japan";

export const NL: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="NL" />
);
NL.storyName = "Netherlands";

export const PL: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="PL" />
);
PL.storyName = "Poland";

export const US: Story = () => (
	<AddressTaxWrapper taxType="either" defaultCountry="US" />
);
US.storyName = "United States";
