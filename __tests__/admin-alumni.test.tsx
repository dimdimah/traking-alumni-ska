/**
 * Admin Alumni Management Tests
 * ==============================
 * TC 3.2: Search/filter table alumni by name or NIM
 */

import { describe, it, expect } from "@jest/globals"

// ──────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────

interface Alumni {
  id: string
  nim: string
  full_name: string
  email: string
  graduation_year: string
  phone: string
}

const mockAlumni: Alumni[] = [
  { id: "1", nim: "A123", full_name: "Budi Santoso", email: "a123@amikomsolo.ac.id", graduation_year: "2024", phone: "08123456789" },
  { id: "2", nim: "A456", full_name: "Siti Rahmawati", email: "a456@amikomsolo.ac.id", graduation_year: "2023", phone: "08123456780" },
  { id: "3", nim: "B789", full_name: "Ahmad Syarif", email: "b789@amikomsolo.ac.id", graduation_year: "2024", phone: "08123456781" },
  { id: "4", nim: "B012", full_name: "Dewi Sartika", email: "b012@amikomsolo.ac.id", graduation_year: "2022", phone: "08123456782" },
  { id: "5", nim: "C345", full_name: "Budi Prasetyo", email: "c345@amikomsolo.ac.id", graduation_year: "2024", phone: "08123456783" },
]

// ──────────────────────────────────────────
// Search/filter logic
// ──────────────────────────────────────────

function searchAlumni(query: string): Alumni[] {
  const q = query.toLowerCase().trim()
  if (!q) return mockAlumni
  return mockAlumni.filter(
    (a) =>
      a.full_name.toLowerCase().includes(q) ||
      a.nim.toLowerCase().includes(q),
  )
}

function filterByGraduationYear(year: string): Alumni[] {
  if (!year) return mockAlumni
  return mockAlumni.filter((a) => a.graduation_year === year)
}

// ──────────────────────────────────────────
// Tests
// ──────────────────────────────────────────

describe("TC 3.2 — Data Table Search & Filter Alumni", () => {
  describe("Search by Name", () => {
    it("should return 2 alumni when searching 'Budi'", () => {
      const results = searchAlumni("Budi")
      expect(results).toHaveLength(2)
      expect(results.map((a) => a.full_name)).toContain("Budi Santoso")
      expect(results.map((a) => a.full_name)).toContain("Budi Prasetyo")
    })

    it("should return 1 alumni when searching 'Siti'", () => {
      const results = searchAlumni("Siti")
      expect(results).toHaveLength(1)
      expect(results[0].full_name).toBe("Siti Rahmawati")
    })

    it("should be case insensitive", () => {
      const results = searchAlumni("budi")
      expect(results).toHaveLength(2)
    })
  })

  describe("Search by NIM", () => {
    it("should return 1 alumni when searching 'A123'", () => {
      const results = searchAlumni("A123")
      expect(results).toHaveLength(1)
      expect(results[0].nim).toBe("A123")
    })

    it("should return 1 alumni when searching 'b789' (case insensitive)", () => {
      const results = searchAlumni("b789")
      expect(results).toHaveLength(1)
      expect(results[0].full_name).toBe("Ahmad Syarif")
    })
  })

  describe("Search Edge Cases", () => {
    it("should return all alumni when query is empty", () => {
      const results = searchAlumni("")
      expect(results).toHaveLength(5)
    })

    it("should return empty array for non-existent name", () => {
      const results = searchAlumni("Zzzz")
      expect(results).toHaveLength(0)
    })

    it("should return empty array for non-existent NIM", () => {
      const results = searchAlumni("Z999")
      expect(results).toHaveLength(0)
    })

    it("should handle partial NIM match", () => {
      // "A4" is specific enough to match NIM A456 without matching names
      const results = searchAlumni("A4")
      expect(results).toHaveLength(1)
      expect(results[0].nim).toBe("A456")
    })
  })

  describe("Filter by Graduation Year", () => {
    it("should return 3 alumni for 2024", () => {
      const results = filterByGraduationYear("2024")
      expect(results).toHaveLength(3)
    })

    it("should return 1 alumni for 2022", () => {
      const results = filterByGraduationYear("2022")
      expect(results).toHaveLength(1)
      expect(results[0].full_name).toBe("Dewi Sartika")
    })

    it("should return empty array for non-existent year", () => {
      const results = filterByGraduationYear("2010")
      expect(results).toHaveLength(0)
    })
  })
})
