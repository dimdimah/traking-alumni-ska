/**
 * Kuesioner (Tracer Study) Tests
 * ===============================
 * TC 2.1: Conditional render — banner warning when tracer_responses empty
 * TC 2.2: Multi-step form validation — detect empty fields before advancing
 */

import { describe, it, expect } from "@jest/globals"
import { z } from "zod"

// ──────────────────────────────────────────
// Zod schemas (mirroring lib/schemas/tracer-study.ts)
// ──────────────────────────────────────────

const personalInfoSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap wajib diisi"),
  graduation_year: z
    .string()
    .min(1, "Tahun lulus wajib diisi")
    .regex(/^\d{4}$/, "Format tahun tidak valid"),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  address: z.string().optional(),
})

const educationSchema = z.object({
  study_field_match: z.string().min(1, "Pilih kesesuaian bidang studi"),
  further_study: z.string().optional(),
  certification: z.string().optional(),
})

const employmentSchema = z.object({
  employment_status: z.string().min(1, "Pilih status pekerjaan"),
  job_search_duration: z.string().optional(),
  first_salary: z.string().optional(),
  company_type: z.string().optional(),
})

const suggestionSchema = z.object({
  suggestions: z.string().optional(),
})

const fullTracerStudySchema = z.object({
  personal_info: personalInfoSchema,
  education: educationSchema,
  employment: employmentSchema,
  suggestions: suggestionSchema,
})

type TracerStudyTab = "personal" | "education" | "employment" | "suggestions"

const tabSchemas: Record<TracerStudyTab, z.ZodSchema> = {
  personal: personalInfoSchema,
  education: educationSchema,
  employment: employmentSchema,
  suggestions: suggestionSchema,
}

// ──────────────────────────────────────────
// Multi-step validation logic
// ──────────────────────────────────────────

function validateTab(
  tab: TracerStudyTab,
  data: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const schema = tabSchemas[tab]
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((i) => i.message),
    }
  }
  return { valid: true, errors: [] }
}

// ──────────────────────────────────────────
// Conditional banner logic (TC 2.1)
// ──────────────────────────────────────────

function hasSubmittedTracerStudy(
  response: unknown,
): response is Record<string, unknown> {
  return response !== null && response !== undefined
}

function getDashboardBanner(
  hasTracerData: boolean,
): "warning" | "success" | null {
  if (!hasTracerData) return "warning"
  return null // hide banner if submitted
}

// ──────────────────────────────────────────
// Tests
// ──────────────────────────────────────────

describe("TC 2.1 — Conditional Render Banner Tracer Study", () => {
  it("should show warning banner when tracer_responses is empty (null)", () => {
    const banner = getDashboardBanner(false)
    expect(banner).toBe("warning")
  })

  it("should hide banner when tracer_responses data exists", () => {
    const banner = getDashboardBanner(true)
    expect(banner).toBeNull()
  })

  it("should return false for hasSubmittedTracerStudy when null", () => {
    expect(hasSubmittedTracerStudy(null)).toBe(false)
  })

  it("should return false for hasSubmittedTracerStudy when undefined", () => {
    expect(hasSubmittedTracerStudy(undefined)).toBe(false)
  })

  it("should return true for hasSubmittedTracerStudy when data exists", () => {
    expect(hasSubmittedTracerStudy({ id: "1" })).toBe(true)
  })
})

describe("TC 2.2 — Multi-step Form Validation per Tab", () => {
  // ── Personal Info Tab ──
  describe("Tab 1: Personal Info", () => {
    it("should detect empty full_name", () => {
      const result = validateTab("personal", {
        full_name: "",
        graduation_year: "2024",
        phone: "08123456789",
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Nama lengkap wajib diisi")
    })

    it("should detect invalid graduation_year format", () => {
      const result = validateTab("personal", {
        full_name: "Budi",
        graduation_year: "tahun2024",
        phone: "08123456789",
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("tahun"))).toBe(true)
    })

    it("should validate correct personal info", () => {
      const result = validateTab("personal", {
        full_name: "Budi Santoso",
        graduation_year: "2024",
        phone: "08123456789",
        address: "Jl. Merdeka No.1",
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  // ── Education Tab ──
  describe("Tab 2: Pendidikan", () => {
    it("should detect unselected study_field_match", () => {
      const result = validateTab("education", {
        study_field_match: "",
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Pilih kesesuaian bidang studi")
    })

    it("should validate correct education data", () => {
      const result = validateTab("education", {
        study_field_match: "sesuai",
        further_study: "S2 Teknik Informatika",
        certification: "AWS Certified",
      })
      expect(result.valid).toBe(true)
    })
  })

  // ── Employment Tab ──
  describe("Tab 3: Pekerjaan", () => {
    it("should detect unselected employment_status", () => {
      const result = validateTab("employment", {
        employment_status: "",
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Pilih status pekerjaan")
    })

    it("should validate correct employment data", () => {
      const result = validateTab("employment", {
        employment_status: "bekerja",
        job_search_duration: "1-3 bulan",
        first_salary: "3-5jt",
        company_type: "swasta",
      })
      expect(result.valid).toBe(true)
    })
  })

  // ── Suggestions Tab ──
  describe("Tab 4: Saran", () => {
    it("should always validate (optional field)", () => {
      const result = validateTab("suggestions", {
        suggestions: "Tingkatkan kurikulum",
      })
      expect(result.valid).toBe(true)
    })

    it("should validate even when empty (optional)", () => {
      const result = validateTab("suggestions", {})
      expect(result.valid).toBe(true)
    })
  })

  // ── Full form submission ──
  describe("Full Form Submission", () => {
    it("should reject incomplete form submission", () => {
      const result = fullTracerStudySchema.safeParse({
        personal_info: { full_name: "", graduation_year: "", phone: "" },
        education: { study_field_match: "" },
        employment: { employment_status: "" },
        suggestions: {},
      })
      expect(result.success).toBe(false)
    })

    it("should accept complete form submission", () => {
      const result = fullTracerStudySchema.safeParse({
        personal_info: {
          full_name: "Budi Santoso",
          graduation_year: "2024",
          phone: "08123456789",
        },
        education: {
          study_field_match: "sesuai",
        },
        employment: {
          employment_status: "bekerja",
          job_search_duration: "1-3 bulan",
        },
        suggestions: {
          suggestions: "Terima kasih",
        },
      })
      expect(result.success).toBe(true)
    })
  })
})
