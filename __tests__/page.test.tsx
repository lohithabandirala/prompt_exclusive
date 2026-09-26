import { render, screen } from "@testing-library/react";
import Home from "../src/app/page";

describe("Home", () => {
  it("renders the main heading", () => {
    render(<Home />);
    
    // Check if the Aura Legal heading is present
    const heading = screen.getByText(/Aura Legal/i);
    expect(heading).toBeInTheDocument();
  });

  it("renders the upload button", () => {
    render(<Home />);
    
    // The label for the file upload should exist
    const uploadLabel = screen.getByText(/Click to select a PDF contract/i);
    expect(uploadLabel).toBeInTheDocument();
  });

  it("renders the chat input", () => {
    render(<Home />);
    
    // The placeholder text should be visible indicating it expects document first
    const chatInput = screen.getByPlaceholderText(/Upload a document first.../i);
    expect(chatInput).toBeInTheDocument();
    // It should be disabled initially
    expect(chatInput).toBeDisabled();
  });
});
