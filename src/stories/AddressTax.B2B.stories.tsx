import type { Story, StoryDefault } from "@ladle/react";
import { AddressTaxWrapper } from "./_utils.js";

export default {
	title: "Address+Tax / Business to business",
} satisfies StoryDefault;

export const AT: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="AT" />
);
AT.storyName = "Austria";

export const AU: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="AU" />
);
AU.storyName = "Australia";

export const BE: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="BE" />
);
BE.storyName = "Belgium";

export const CA: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="CA" />
);
CA.storyName = "Canada";

export const CH: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="CH" />
);
CH.storyName = "Switzerland";

export const DE: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="DE" />
);
DE.storyName = "Germany";

export const ES: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="ES" />
);
ES.storyName = "Spain";

export const FR: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="FR" />
);
FR.storyName = "France";

export const GB: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="GB" />
);
GB.storyName = "United Kingdom";

export const IT: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="IT" />
);
IT.storyName = "Italy";

export const JP: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="JP" />
);
JP.storyName = "Japan";

export const NL: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="NL" />
);
NL.storyName = "Netherlands";

export const PL: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="PL" />
);
PL.storyName = "Poland";

export const US: Story = () => (
	<AddressTaxWrapper taxType="business" defaultCountry="US" />
);
US.storyName = "United States";
