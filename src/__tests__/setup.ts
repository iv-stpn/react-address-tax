import "@testing-library/jest-dom";

// Suppress act() warnings - React Testing Library handles act() automatically
const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("An update to") &&
    args[0].includes("inside a test was not wrapped in act")
  ) {
    return;
  }
  originalError.call(console, ...args);
};
