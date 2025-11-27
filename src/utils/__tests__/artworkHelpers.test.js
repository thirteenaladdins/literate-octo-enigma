import {
  belongsToCollection,
  sortArtworksByDate,
  getArtworkImageUrl,
  filterByTemplate,
  filterPublished,
} from "../artworkHelpers";

describe("artworkHelpers", () => {
  describe("belongsToCollection", () => {
    const artworkOld = { id: "001", date: "2025-11-27" };
    const artworkNew = { id: "002", date: "2025-11-28" };

    it("returns true for experiments collection with old date", () => {
      expect(belongsToCollection(artworkOld, "experiments")).toBe(true);
    });

    it("returns false for new collection with old date", () => {
      expect(belongsToCollection(artworkOld, "new")).toBe(false);
    });

    it("returns true for new collection with new date", () => {
      expect(belongsToCollection(artworkNew, "new")).toBe(true);
    });

    it("returns false for experiments collection with new date", () => {
      expect(belongsToCollection(artworkNew, "experiments")).toBe(false);
    });

    it("returns false for artwork without date", () => {
      expect(belongsToCollection({ id: "003" }, "experiments")).toBe(false);
    });
  });

  describe("sortArtworksByDate", () => {
    it("sorts artworks by date (newest first)", () => {
      const artworks = [
        { id: "001", date: "2025-01-01" },
        { id: "002", date: "2025-01-03" },
        { id: "003", date: "2025-01-02" },
      ];

      const sorted = [...artworks].sort(sortArtworksByDate);
      expect(sorted[0].id).toBe("002");
      expect(sorted[1].id).toBe("003");
      expect(sorted[2].id).toBe("001");
    });

    it("sorts by ID when dates are equal", () => {
      const artworks = [
        { id: "001", date: "2025-01-01" },
        { id: "003", date: "2025-01-01" },
        { id: "002", date: "2025-01-01" },
      ];

      const sorted = [...artworks].sort(sortArtworksByDate);
      expect(sorted[0].id).toBe("003");
      expect(sorted[1].id).toBe("002");
      expect(sorted[2].id).toBe("001");
    });
  });

  describe("getArtworkImageUrl", () => {
    it("returns thumbnailUrl for thumbnail type", () => {
      const artwork = {
        id: "001",
        thumbnailUrl: "https://example.com/thumb.png",
        imageUrl: "https://example.com/full.png",
      };
      expect(getArtworkImageUrl(artwork, "thumbnail")).toBe(
        "https://example.com/thumb.png"
      );
    });

    it("returns imageUrl for full type", () => {
      const artwork = {
        id: "001",
        thumbnailUrl: "https://example.com/thumb.png",
        imageUrl: "https://example.com/full.png",
      };
      expect(getArtworkImageUrl(artwork, "full")).toBe(
        "https://example.com/full.png"
      );
    });

    it("falls back to local path when URLs are missing", () => {
      const artwork = { id: "001", file: "001_ai_signal" };
      expect(getArtworkImageUrl(artwork, "thumbnail")).toBe(
        "/thumbnails/001_ai_signal.png"
      );
    });
  });

  describe("filterByTemplate", () => {
    it("filters artworks by template type", () => {
      const artworks = [
        { id: "001", template: "gridPattern" },
        { id: "002", template: "flowField" },
        { id: "003", template: "gridPattern" },
      ];

      const filtered = filterByTemplate(artworks, "gridPattern");
      expect(filtered).toHaveLength(2);
      expect(filtered.every((a) => a.template === "gridPattern")).toBe(true);
    });

    it("handles array of template types", () => {
      const artworks = [
        { id: "001", template: "gridPattern" },
        { id: "002", template: "gridPatternModular" },
        { id: "003", template: "flowField" },
      ];

      const filtered = filterByTemplate(artworks, [
        "gridPattern",
        "gridPatternModular",
      ]);
      expect(filtered).toHaveLength(2);
    });
  });

  describe("filterPublished", () => {
    it("filters only published artworks", () => {
      const artworks = [
        { id: "001", status: "published" },
        { id: "002", status: "draft" },
        { id: "003", status: "published" },
      ];

      const filtered = filterPublished(artworks);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((a) => a.status === "published")).toBe(true);
    });
  });
});

