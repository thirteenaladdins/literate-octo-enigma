import React from "react";
import { render, screen } from "@testing-library/react";
import ArtworkViewer from "../ArtworkViewer";

const mockArtwork = {
  id: "001",
  title: "Test Artwork",
  description: "A test artwork description",
  date: "2025-01-01",
  status: "published",
  category: "generative",
  tags: ["test", "artwork"],
  file: "001_ai_signal",
  imageUrl: "https://example.com/image.png",
};

describe("ArtworkViewer", () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    mockOnBack.mockClear();
  });

  it("renders artwork title", () => {
    render(<ArtworkViewer artwork={mockArtwork} onBack={mockOnBack} />);
    expect(screen.getByText("Test Artwork")).toBeInTheDocument();
  });

  it("renders artwork description", () => {
    render(<ArtworkViewer artwork={mockArtwork} onBack={mockOnBack} />);
    expect(screen.getByText("A test artwork description")).toBeInTheDocument();
  });

  it("renders artwork ID", () => {
    render(<ArtworkViewer artwork={mockArtwork} onBack={mockOnBack} />);
    expect(screen.getByText("#001")).toBeInTheDocument();
  });

  it("renders back button", () => {
    render(<ArtworkViewer artwork={mockArtwork} onBack={mockOnBack} />);
    const backButton = screen.getByText(/back to gallery/i);
    expect(backButton).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", () => {
    render(<ArtworkViewer artwork={mockArtwork} onBack={mockOnBack} />);
    const backButton = screen.getByText(/back to gallery/i);
    backButton.click();
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("renders artwork tags", () => {
    render(<ArtworkViewer artwork={mockArtwork} onBack={mockOnBack} />);
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("artwork")).toBeInTheDocument();
  });
});

