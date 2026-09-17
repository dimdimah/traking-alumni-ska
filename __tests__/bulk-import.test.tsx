/**
 * Bulk Import Parsing Tests
 * ==========================
 * TC 3.1: Parse JSON array (simulated Excel) before executing bulk injection
 */

import { describe, it, expect } from "@jest/globals"
import { z } from "zod"

// ──────────────────────────────────────────
// Zod schema for bulk import validation
// ──────────────────────────────────────────

const bulkAlumniSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  full_name: z.string().min(1, "Nama lengkap wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  tanggal_lahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  phone: z.string().optional(),
  graduation_year: z
    .string()
    .regex(/^\d{4}$/, "Format tahun lulus tidak valid")
    .optional(),
})

const bulkImportSchema = z.array(bulkAlumniSchema).min(1, "Data alumni tidak boleh kosong")

// ──────────────────────────────────────────
// Bulk import logic (simulated server action)
// ──────────────────────────────────────────

interface ParsedAlumni {
  nim: string
  full_name: string
  email: string
  tanggal_lahir: string
  phone?: string
  graduation_year?: string
}

type BulkImportResult =
  | { success: true; data: ParsedAlumni[]; count: number }
  | { success: false; errors: string[]; rowErrors?: { row: number; errors: string[] }[] }

function parseBulkImport(jsonString: string): BulkImportResult {
  let data: unknown
  try {
    data = JSON.parse(jsonString)
  } catch {
    return { success: false, errors: ["Format JSON tidak valid"] }
  }

  if (!Array.isArray(data)) {
    return {
      success: false,
      errors: ["Data harus berupa array objek alumni"],
    }
  }

  if (data.length === 0) {
    return {
      success: false,
      errors: ["Data alumni tidak boleh kosong"],
    }
  }

  const rowErrors: { row: number; errors: string[] }[] = []
  const validData: ParsedAlumni[] = []

  data.forEach((item, index) => {
    const result = bulkAlumniSchema.safeParse(item)
    if (result.success) {
      validData.push(result.data)
    } else {
      rowErrors.push({
        row: index + 1,
        errors: result.error.issues.map((i) => `[${i.path.join(".")}] ${i.message}`),
      })
    }
  })

  if (rowErrors.length > 0) {
    return {
      success: false,
      errors: [`${rowErrors.length} baris data mengandung error`],
      rowErrors,
    }
  }

  return { success: true, data: validData, count: validData.length }
}

// ──────────────────────────────────────────
// Tests
// ──────────────────────────────────────────

describe("TC 3.1 — Bulk Import Parsing (Simulasi Excel)", () => {
  describe("Valid JSON Parsing", () => {
    it("should reject invalid JSON string", () => {
      const result = parseBulkImport("not json")
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toContain("Format JSON tidak valid")
      }
    })

    it("should reject non-array JSON", () => {
      const result = parseBulkImport('{"name": "test"}')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toContain("Data harus berupa array objek alumni")
      }
    })
  })

  describe("Row Validation", () => {
    const validRow = {
      nim: "A12345",
      full_name: "Budi Santoso",
      email: "a12345@amikomsolo.ac.id",
      tanggal_lahir: "01012000",
    }

    it("should validate a single valid row", () => {
      const data = JSON.stringify([validRow])
      const result = parseBulkImport(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.count).toBe(1)
        expect(result.data[0].nim).toBe("A12345")
      }
    })

    it("should detect missing NIM", () => {
      const data = JSON.stringify([{ ...validRow, nim: "" }])
      const result = parseBulkImport(data)
      expect(result.success).toBe(false)
      if (!result.success && result.rowErrors) {
        expect(result.rowErrors[0].errors.some((e) => e.includes("NIM"))).toBe(true)
      }
    })

    it("should detect missing full_name", () => {
      const data = JSON.stringify([{ ...validRow, full_name: "" }])
      const result = parseBulkImport(data)
      expect(result.success).toBe(false)
    })

    it("should detect invalid email format", () => {
      const data = JSON.stringify([{ ...validRow, email: "bukan-email" }])
      const result = parseBulkImport(data)
      expect(result.success).toBe(false)
      if (!result.success && result.rowErrors) {
        expect(result.rowErrors[0].errors.some((e) => e.includes("email"))).toBe(true)
      }
    })

    it("should detect missing tanggal_lahir", () => {
      const data = JSON.stringify([{ ...validRow, tanggal_lahir: "" }])
      const result = parseBulkImport(data)
      expect(result.success).toBe(false)
    })
  })

  describe("Multiple Rows", () => {
    it("should accept multiple valid rows", () => {
      const data = JSON.stringify([
        {
          nim: "A001",
          full_name: "User 1",
          email: "a001@amikomsolo.ac.id",
          tanggal_lahir: "01012000",
        },
        {
          nim: "A002",
          full_name: "User 2",
          email: "a002@amikomsolo.ac.id",
          tanggal_lahir: "02022000",
        },
        {
          nim: "A003",
          full_name: "User 3",
          email: "a003@amikomsolo.ac.id",
          tanggal_lahir: "03032000",
        },
      ])
      const result = parseBulkImport(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.count).toBe(3)
      }
    })

    it("should report errors for invalid rows while skipping them", () => {
      const data = JSON.stringify([
        {
          nim: "A001",
          full_name: "Valid User",
          email: "a001@amikomsolo.ac.id",
          tanggal_lahir: "01012000",
        },
        {
          nim: "",
          full_name: "Invalid User",
          email: "bad-email",
          tanggal_lahir: "",
        },
      ])
      const result = parseBulkImport(data)
      expect(result.success).toBe(false)
      if (!result.success && result.rowErrors) {
        expect(result.rowErrors).toHaveLength(1)
        expect(result.rowErrors[0].row).toBe(2)
      }
    })
  })

  describe("Optional Fields", () => {
    it("should accept rows without optional fields (phone, graduation_year)", () => {
      const data = JSON.stringify([
        {
          nim: "A001",
          full_name: "User",
          email: "a001@amikomsolo.ac.id",
          tanggal_lahir: "01012000",
        },
      ])
      const result = parseBulkImport(data)
      expect(result.success).toBe(true)
    })

    it("should accept rows with graduation_year", () => {
      const data = JSON.stringify([
        {
          nim: "A001",
          full_name: "User",
          email: "a001@amikomsolo.ac.id",
          tanggal_lahir: "01012000",
          graduation_year: "2024",
        },
      ])
      const result = parseBulkImport(data)
      expect(result.success).toBe(true)
    })

    it("should reject invalid graduation_year format", () => {
      const data = JSON.stringify([
        {
          nim: "A001",
          full_name: "User",
          email: "a001@amikomsolo.ac.id",
          tanggal_lahir: "01012000",
          graduation_year: "24",
        },
      ])
      const result = parseBulkImport(data)
      expect(result.success).toBe(false)
    })
  })

  describe("Empty Data", () => {
    it("should reject empty array", () => {
      const result = parseBulkImport("[]")
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.includes("kosong"))).toBe(true)
      }
    })
  })
})
