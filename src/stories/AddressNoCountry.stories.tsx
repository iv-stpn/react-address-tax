import type { Story, StoryDefault } from "@ladle/react";
import { AddressWrapper } from "./_utils.js";

export default {
	title: "Address without Country",
} satisfies StoryDefault;

export const Default: Story = () => <AddressWrapper />;
Default.storyName = "Address without Country";
