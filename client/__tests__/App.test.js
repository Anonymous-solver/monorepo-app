import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import App from "../src/App";

test("renders app title", () => {
  render(<App />);
  expect(screen.getByText(/React \+ Express Monorepo/i)).toBeInTheDocument();
});
