import {
  isValidArtwork,
  isValidDate,
  isValidCollection,
  isValidTemplateType,
} from "../validation";

describe("validation", () => {
  describe("isValidArtwork", () => {
    it("returns true for valid artwork", () => {
      const artwork = {
        id: "001",
        title: "Test",
        date: "2025-01-01",
        status: "published",
      };
      expect(isValidArtwork(artwork)).toBe(true);
    });

    it("returns false for missing required fields", () => {
      expect(isValidArtwork({ id: "001" })).toBe(false);
      expect(isValidArtwork({ title: "Test" })).toBe(false);
      expect(isValidArtwork(null)).toBe(false);
      expect(isValidArtwork(undefined)).toBe(false);
    });
  });

  describe("isValidDate", () => {
    it("returns true for valid date format", () => {
      expect(isValidDate("2025-01-01")).toBe(true);
      expect(isValidDate("2025-12-31")).toBe(true);
    });

    it("returns false for invalid date format", () => {
      expect(isValidDate("01-01-2025")).toBe(false);
      expect(isValidDate("2025/01/01")).toBe(false);
      expect(isValidDate("invalid")).toBe(false);
      expect(isValidDate("")).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe("isValidCollection", () => {
    it("returns true for valid collection names", () => {
      expect(isValidCollection("experiments")).toBe(true);
      expect(isValidCollection("new")).toBe(true);
    });

    it("returns false for invalid collection names", () => {
      expect(isValidCollection("invalid")).toBe(false);
      expect(isValidCollection("")).toBe(false);
      expect(isValidCollection(null)).toBe(false);
    });
  });

  describe("isValidTemplateType", () => {
    it("returns true for valid template types", () => {
      expect(isValidTemplateType("gridPattern")).toBe(true);
      expect(isValidTemplateType("flowField")).toBe(true);
      expect(isValidTemplateType("other")).toBe(true);
    });

    it("returns false for invalid template types", () => {
      expect(isValidTemplateType("invalid")).toBe(false);
      expect(isValidTemplateType("")).toBe(false);
      expect(isValidTemplateType(null)).toBe(false);
    });
  });
});

