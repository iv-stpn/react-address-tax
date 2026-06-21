import type { Story, StoryDefault } from "@ladle/react";
import { AddressTaxWrapper } from "./_utils.js";

export default {
	title: "Address+Tax / Business to consumer",
} satisfies StoryDefault;

export const AT: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="AT" />
);
AT.storyName = "Austria";

export const AU: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="AU" />
);
AU.storyName = "Australia";

export const BE: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="BE" />
);
BE.storyName = "Belgium";

export const CA: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="CA" />
);
CA.storyName = "Canada";

export const CH: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="CH" />
);
CH.storyName = "Switzerland";

export const DE: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="DE" />
);
DE.storyName = "Germany";

export const ES: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="ES" />
);
ES.storyName = "Spain";

export const FR: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="FR" />
);
FR.storyName = "France";

export const GB: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="GB" />
);
GB.storyName = "United Kingdom";

export const IT: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="IT" />
);
IT.storyName = "Italy";

export const JP: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="JP" />
);
JP.storyName = "Japan";

export const NL: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="NL" />
);
NL.storyName = "Netherlands";

export const PL: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="PL" />
);
PL.storyName = "Poland";

export const US: Story = () => (
	<AddressTaxWrapper taxType="individual" defaultCountry="US" />
);
US.storyName = "United States";
