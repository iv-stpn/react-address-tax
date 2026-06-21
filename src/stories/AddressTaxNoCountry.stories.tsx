import type { Story, StoryDefault } from "@ladle/react";
import { AddressTaxWrapper } from "./_utils.js";

export default {
	title: "Address+Tax without Country",
} satisfies StoryDefault;

export const B2B: Story = () => <AddressTaxWrapper taxType="business" />;
B2B.storyName = "Business to business";

export const B2C: Story = () => <AddressTaxWrapper taxType="individual" />;
B2C.storyName = "Business to consumer";

export const Either: Story = () => <AddressTaxWrapper taxType="either" />;
Either.storyName = "Either";
