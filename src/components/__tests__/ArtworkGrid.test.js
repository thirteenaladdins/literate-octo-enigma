import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ArtworkGrid from "../ArtworkGrid";

// Mock the artworks data
jest.mock("../../data/artworks.json", () => ({
  artworks: [
    {
      id: "001",
      title: "Test Artwork 1",
      description: "Test description",
      date: "2025-01-01",
      status: "published",
      category: "generative",
      tags: ["test", "artwork"],
      file: "001_ai_signal",
    },
    {
      id: "002",
      title: "Test Artwork 2",
      description: "Another test",
      date: "2025-01-02",
      status: "published",
      category: "generative",
      tags: ["test"],
      file: "002_ai_signal",
      template: "gridPattern",
    },
  ],
  categories: ["generative"],
}));

describe("ArtworkGrid", () => {
  const mockOnArtworkSelect = jest.fn();

  beforeEach(() => {
    mockOnArtworkSelect.mockClear();
  });

  it("renders loading state initially", async () => {
    render(<ArtworkGrid onArtworkSelect={mockOnArtworkSelect} />);
    // Component starts with loading: true, so loading text should appear
    // Use findByText to wait for async rendering instead of getByText
    const loadingElement = await screen.findByText(/loading artworks/i);
    expect(loadingElement).toBeInTheDocument();
  });

  it("renders artworks after loading", async () => {
    render(<ArtworkGrid onArtworkSelect={mockOnArtworkSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText("Test Artwork 1")).toBeInTheDocument();
    });
  });

  it("filters out artworks with templates", async () => {
    render(<ArtworkGrid onArtworkSelect={mockOnArtworkSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText("Test Artwork 1")).toBeInTheDocument();
    });
    
    expect(screen.queryByText("Test Artwork 2")).not.toBeInTheDocument();
  });

  it("displays artwork count", async () => {
    render(<ArtworkGrid onArtworkSelect={mockOnArtworkSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText(/1 of 1 artworks/i)).toBeInTheDocument();
    });
  });
});

