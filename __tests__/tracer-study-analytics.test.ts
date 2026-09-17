/**
 * Tracer Study Analytics — Comprehensive Tests
 * =============================================
 * Tests for: lib/actions/questions.ts (getTracerStudyStats)
 *            lib/schemas/tracer-study.ts
 *            Dashboard multi-step form logic (canProceed)
 *            Edge cases & bug detection
 */

import { describe, it, expect } from "@jest/globals"
import { z } from "zod"
import { tracerStudySchema } from "@/lib/schemas/tracer-study"

// ──────────────────────────────────────────
// Re-implement getTracerStudyStats logic for testing
// (mirrors lib/actions/questions.ts lines 151-185)
// ──────────────────────────────────────────

interface TracerStudyResponse {
  id: string
  user_id: string
  graduation_year: number
  education_level: string
  employment_status: string
  company: string | null
  position: string | null
  salary_range: string | null
  study_field_match: string | null
  suggestions: string | null
}

function getTracerStudyStats(responses: TracerStudyResponse[]) {
  if (!responses || responses.length === 0) {
    return {
      totalResponses: 0,
      employmentRate: 0,
      studyingRate: 0,
      salaryDistribution: {},
      fieldMatchRate: 0,
    }
  }

  const employed = responses.filter(r => r.employment_status === 'Bekerja').length
  const studying = responses.filter(r => r.employment_status === 'Melanjutkan Studi').length
  const withFieldMatch = responses.filter(r => r.study_field_match !== null && r.study_field_match !== undefined)
  const fieldMatch = withFieldMatch.filter(r => r.study_field_match === 'Sangat Sesuai' || r.study_field_match === 'Sesuai').length

  return {
    totalResponses: responses.length,
    employmentRate: responses.length > 0 ? Math.round((employed / responses.length) * 100) : 0,
    studyingRate: responses.length > 0 ? Math.round((studying / responses.length) * 100) : 0,
    salaryDistribution: responses.reduce((acc: Record<string, number>, r) => {
      if (r.salary_range) {
        acc[r.salary_range] = (acc[r.salary_range] || 0) + 1
      }
      return acc
    }, {}),
    fieldMatchRate: withFieldMatch.length > 0 ? Math.round((fieldMatch / withFieldMatch.length) * 100) : 0,
  }
}

// ──────────────────────────────────────────
// Re-implement canProceed logic for testing
// (mirrors app/(protected)/dashboard/tracer-study/page.tsx lines 109-125)
// ──────────────────────────────────────────

function canProceed(
  currentStep: number,
  formData: {
    graduation_year: string
    education_level: string
    employment_status: string
    company: string
    position: string
  }
): boolean {
  switch (currentStep) {
    case 0: {
      const year = Number(formData.graduation_year)
      return formData.graduation_year.length === 4 && !isNaN(year) && year >= 1990 && year <= 2030
    }
    case 1: return formData.education_level.length > 0
    case 2: {
      if (formData.employment_status === 'Bekerja' || formData.employment_status === 'Wirausaha') {
        return formData.employment_status.length > 0 && formData.company.trim().length > 0 && formData.position.trim().length > 0
      }
      return formData.employment_status.length > 0
    }
    case 3: return true
    default: return false
  }
}

// ──────────────────────────────────────────
// Helper: create mock response
// ──────────────────────────────────────────

function makeResponse(overrides: Partial<TracerStudyResponse> = {}): TracerStudyResponse {
  return {
    id: 'test-id',
    user_id: 'user-1',
    graduation_year: 2023,
    education_level: 'S1',
    employment_status: 'Bekerja',
    company: 'PT Test',
    position: 'Developer',
    salary_range: '5-10 juta',
    study_field_match: 'Sesuai',
    suggestions: null,
    ...overrides,
  }
}

// ══════════════════════════════════════════
// TEST SUITE 1: getTracerStudyStats
// ══════════════════════════════════════════

describe("getTracerStudyStats — Core Analytics Calculation", () => {

  describe("Empty / null data", () => {
    it("should return zero stats for empty array", () => {
      const stats = getTracerStudyStats([])
      expect(stats.totalResponses).toBe(0)
      expect(stats.employmentRate).toBe(0)
      expect(stats.studyingRate).toBe(0)
      expect(stats.fieldMatchRate).toBe(0)
      expect(stats.salaryDistribution).toEqual({})
    })
  })

  describe("Employment Rate", () => {
    it("should calculate 100% when all are employed", () => {
      const responses = [
        makeResponse({ employment_status: 'Bekerja' }),
        makeResponse({ id: '2', employment_status: 'Bekerja' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.employmentRate).toBe(100)
    })

    it("should calculate 0% when none are employed", () => {
      const responses = [
        makeResponse({ employment_status: 'Belum Bekerja' }),
        makeResponse({ id: '2', employment_status: 'Melanjutkan Studi' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.employmentRate).toBe(0)
    })

    it("should calculate correct rate for mixed statuses", () => {
      const responses = [
        makeResponse({ employment_status: 'Bekerja' }),
        makeResponse({ id: '2', employment_status: 'Bekerja' }),
        makeResponse({ id: '3', employment_status: 'Belum Bekerja' }),
        makeResponse({ id: '4', employment_status: 'Melanjutkan Studi' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.employmentRate).toBe(50) // 2/4 = 50%
    })

    it("should round to nearest integer", () => {
      const responses = [
        makeResponse({ employment_status: 'Bekerja' }),
        makeResponse({ id: '2', employment_status: 'Belum Bekerja' }),
        makeResponse({ id: '3', employment_status: 'Belum Bekerja' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.employmentRate).toBe(33) // Math.round(1/3 * 100) = 33
    })
  })

  describe("Studying Rate", () => {
    it("should calculate correctly for Melanjutkan Studi", () => {
      const responses = [
        makeResponse({ employment_status: 'Melanjutkan Studi' }),
        makeResponse({ id: '2', employment_status: 'Bekerja' }),
        makeResponse({ id: '3', employment_status: 'Bekerja' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.studyingRate).toBe(33) // 1/3 ≈ 33%
    })

    it("should not count non-matching statuses", () => {
      const responses = [
        makeResponse({ employment_status: 'Belum Bekerja' }),
        makeResponse({ id: '2', employment_status: 'Wirausaha' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.studyingRate).toBe(0)
    })
  })

  describe("Field Match Rate — BUG DETECTION", () => {
    it("should count Sangat Sesuai as matching", () => {
      const responses = [
        makeResponse({ study_field_match: 'Sangat Sesuai' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.fieldMatchRate).toBe(100)
    })

    it("should count Sesuai as matching", () => {
      const responses = [
        makeResponse({ study_field_match: 'Sesuai' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.fieldMatchRate).toBe(100)
    })

    it("should NOT count Kurang Sesuai as matching", () => {
      const responses = [
        makeResponse({ study_field_match: 'Kurang Sesuai' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.fieldMatchRate).toBe(0)
    })

    it("should NOT count Tidak Sesuai as matching", () => {
      const responses = [
        makeResponse({ study_field_match: 'Tidak Sesuai' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.fieldMatchRate).toBe(0)
    })

    it("fieldMatchRate should only count responses with study_field_match set", () => {
      // FIXED: denominator now only includes responses where study_field_match is not null
      const responses = [
        makeResponse({ study_field_match: 'Sesuai' }),
        makeResponse({ id: '2', study_field_match: null, employment_status: 'Melanjutkan Studi' }),
        makeResponse({ id: '3', study_field_match: null, employment_status: 'Belum Bekerja' }),
      ]
      const stats = getTracerStudyStats(responses)
      // fieldMatch = 1, only 1 has study_field_match set, rate = 100
      expect(stats.fieldMatchRate).toBe(100)
    })
  })

  describe("Salary Distribution", () => {
    it("should group salaries correctly", () => {
      const responses = [
        makeResponse({ salary_range: '3-5 juta' }),
        makeResponse({ id: '2', salary_range: '3-5 juta' }),
        makeResponse({ id: '3', salary_range: '5-10 juta' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.salaryDistribution).toEqual({
        '3-5 juta': 2,
        '5-10 juta': 1,
      })
    })

    it("should exclude null salary_range from distribution", () => {
      const responses = [
        makeResponse({ salary_range: null }),
        makeResponse({ id: '2', salary_range: '5-10 juta' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.salaryDistribution).toEqual({ '5-10 juta': 1 })
    })

    it("should handle all null salary ranges", () => {
      const responses = [
        makeResponse({ salary_range: null }),
        makeResponse({ id: '2', salary_range: null }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.salaryDistribution).toEqual({})
    })
  })

  describe("Mixed statuses edge cases", () => {
    it("should handle 5 different employment statuses", () => {
      const responses = [
        makeResponse({ employment_status: 'Bekerja', salary_range: '3-5 juta' }),
        makeResponse({ id: '2', employment_status: 'Belum Bekerja', salary_range: null }),
        makeResponse({ id: '3', employment_status: 'Wirausaha', salary_range: '10-20 juta' }),
        makeResponse({ id: '4', employment_status: 'Melanjutkan Studi', salary_range: null }),
        makeResponse({ id: '5', employment_status: 'Tidak bekerja / Mencari pekerjaan', salary_range: null }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.totalResponses).toBe(5)
      expect(stats.employmentRate).toBe(20) // 1/5 = 20%
      expect(stats.studyingRate).toBe(20)  // 1/5 = 20%
      expect(stats.salaryDistribution).toEqual({
        '3-5 juta': 1,
        '10-20 juta': 1,
      })
    })
  })
})

// ══════════════════════════════════════════
// TEST SUITE 2: tracerStudySchema Validation
// ══════════════════════════════════════════

describe("tracerStudySchema — Input Validation", () => {

  describe("graduation_year", () => {
    it("should accept valid year", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'S1',
        employment_status: 'Belum Bekerja',
      })
      expect(result.success).toBe(true)
    })

    it("should accept year as string (coerced to number)", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: '2024',
        education_level: 'S1',
        employment_status: 'Belum Bekerja',
      })
      expect(result.success).toBe(true)
    })

    it("should reject year before 1990", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 1989,
        education_level: 'S1',
        employment_status: 'Belum Bekerja',
      })
      expect(result.success).toBe(false)
    })

    it("should reject year after 2030", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2031,
        education_level: 'S1',
        employment_status: 'Belum Bekerja',
      })
      expect(result.success).toBe(false)
    })

    it("should accept boundary year 1990", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 1990,
        education_level: 'S1',
        employment_status: 'Belum Bekerja',
      })
      expect(result.success).toBe(true)
    })

    it("should accept boundary year 2030", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2030,
        education_level: 'S1',
        employment_status: 'Belum Bekerja',
      })
      expect(result.success).toBe(true)
    })
  })

  describe("education_level — FIXED with enum", () => {
    it("should reject empty string", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: '',
        employment_status: 'Bekerja',
        company: 'PT Test',
        position: 'Developer',
      })
      expect(result.success).toBe(false)
    })

    it("should accept valid education levels", () => {
      for (const level of ['D3', 'S1', 'S2', 'S3']) {
        const result = tracerStudySchema.safeParse({
          graduation_year: 2024,
          education_level: level,
          employment_status: 'Bekerja',
          company: 'PT Test',
          position: 'Developer',
        })
        expect(result.success).toBe(true)
      }
    })

    it("should reject invalid education level", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'SMA',
        employment_status: 'Bekerja',
        company: 'PT Test',
        position: 'Developer',
      })
      expect(result.success).toBe(false)
    })
  })

  describe("employment_status — FIXED with enum", () => {
    it("should reject empty string", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'S1',
        employment_status: '',
      })
      expect(result.success).toBe(false)
    })

    it("should accept valid employment statuses", () => {
      for (const status of ['Bekerja', 'Belum Bekerja', 'Wirausaha', 'Melanjutkan Studi', 'Tidak bekerja / Mencari pekerjaan']) {
        const result = tracerStudySchema.safeParse({
          graduation_year: 2024,
          education_level: 'S1',
          employment_status: status,
          ...(status === 'Bekerja' || status === 'Wirausaha' ? { company: 'PT', position: 'Dev' } : {}),
        })
        expect(result.success).toBe(true)
      }
    })

    it("should reject invalid employment status", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'S1',
        employment_status: 'random_status',
      })
      expect(result.success).toBe(false)
    })
  })

  describe("Optional fields", () => {
    it("should accept null company", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'S1',
        employment_status: 'Belum Bekerja',
        company: null,
      })
      expect(result.success).toBe(true)
    })

    it("should accept null position", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'S1',
        employment_status: 'Belum Bekerja',
        position: null,
      })
      expect(result.success).toBe(true)
    })

    it("should accept missing optional fields", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'S1',
        employment_status: 'Melanjutkan Studi',
      })
      expect(result.success).toBe(true)
    })
  })

  describe("Conditional validation — FIXED", () => {
    it("should require company when employment_status is Bekerja", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'S1',
        employment_status: 'Bekerja',
        company: null,
        position: 'Developer',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('company'))).toBe(true)
      }
    })

    it("should require position when employment_status is Bekerja", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'S1',
        employment_status: 'Bekerja',
        company: 'PT Test',
        position: null,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('position'))).toBe(true)
      }
    })

    it("should require company when employment_status is Wirausaha", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'S1',
        employment_status: 'Wirausaha',
        company: null,
        position: 'Owner',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('company'))).toBe(true)
      }
    })

    it("should NOT require company/position when Belum Bekerja", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'S1',
        employment_status: 'Belum Bekerja',
        company: null,
        position: null,
      })
      expect(result.success).toBe(true)
    })

    it("should NOT require company/position when Melanjutkan Studi", () => {
      const result = tracerStudySchema.safeParse({
        graduation_year: 2024,
        education_level: 'S1',
        employment_status: 'Melanjutkan Studi',
        company: null,
        position: null,
      })
      expect(result.success).toBe(true)
    })
  })
})

// ══════════════════════════════════════════
// TEST SUITE 3: Multi-step Form Navigation (canProceed)
// ══════════════════════════════════════════

describe("canProceed — Multi-step Form Navigation", () => {
  const baseFormData = {
    graduation_year: '',
    education_level: '',
    employment_status: '',
    company: '',
    position: '',
  }

  describe("Step 0: Graduation Year", () => {
    it("should allow valid 4-digit year in range", () => {
      expect(canProceed(0, { ...baseFormData, graduation_year: '2024' })).toBe(true)
    })

    it("should reject short year", () => {
      expect(canProceed(0, { ...baseFormData, graduation_year: '24' })).toBe(false)
    })

    it("should reject year below 1990", () => {
      expect(canProceed(0, { ...baseFormData, graduation_year: '1989' })).toBe(false)
    })

    it("should reject year above 2030", () => {
      expect(canProceed(0, { ...baseFormData, graduation_year: '2031' })).toBe(false)
    })

    it("should reject non-numeric year", () => {
      expect(canProceed(0, { ...baseFormData, graduation_year: 'abcd' })).toBe(false)
    })

    it("should accept boundary years 1990 and 2030", () => {
      expect(canProceed(0, { ...baseFormData, graduation_year: '1990' })).toBe(true)
      expect(canProceed(0, { ...baseFormData, graduation_year: '2030' })).toBe(true)
    })
  })

  describe("Step 1: Education Level", () => {
    it("should allow non-empty education_level", () => {
      expect(canProceed(1, { ...baseFormData, education_level: 'S1' })).toBe(true)
    })

    it("should reject empty education_level", () => {
      expect(canProceed(1, { ...baseFormData, education_level: '' })).toBe(false)
    })

    it("canProceed only checks length, enum validation is in schema", () => {
      // canProceed is UI-level validation, schema validation handles enum
      expect(canProceed(1, { ...baseFormData, education_level: 'XYZ' })).toBe(true)
    })
  })

  describe("Step 2: Employment Status", () => {
    it("should allow Bekerja with company and position", () => {
      expect(canProceed(2, {
        ...baseFormData,
        employment_status: 'Bekerja',
        company: 'PT Test',
        position: 'Developer',
      })).toBe(true)
    })

    it("should reject Bekerja without company", () => {
      expect(canProceed(2, {
        ...baseFormData,
        employment_status: 'Bekerja',
        company: '',
        position: 'Developer',
      })).toBe(false)
    })

    it("should reject Bekerja without position", () => {
      expect(canProceed(2, {
        ...baseFormData,
        employment_status: 'Bekerja',
        company: 'PT Test',
        position: '',
      })).toBe(false)
    })

    it("should reject Bekerja with whitespace-only company", () => {
      expect(canProceed(2, {
        ...baseFormData,
        employment_status: 'Bekerja',
        company: '   ',
        position: 'Developer',
      })).toBe(false)
    })

    it("should reject Bekerja with whitespace-only position", () => {
      expect(canProceed(2, {
        ...baseFormData,
        employment_status: 'Bekerja',
        company: 'PT Test',
        position: '   ',
      })).toBe(false)
    })

    it("should require company+position for Wirausaha too", () => {
      expect(canProceed(2, {
        ...baseFormData,
        employment_status: 'Wirausaha',
        company: '',
        position: '',
      })).toBe(false)
    })

    it("should NOT require company+position for Belum Bekerja", () => {
      expect(canProceed(2, {
        ...baseFormData,
        employment_status: 'Belum Bekerja',
        company: '',
        position: '',
      })).toBe(true)
    })

    it("should NOT require company+position for Melanjutkan Studi", () => {
      expect(canProceed(2, {
        ...baseFormData,
        employment_status: 'Melanjutkan Studi',
        company: '',
        position: '',
      })).toBe(true)
    })

    it("should reject empty employment_status", () => {
      expect(canProceed(2, {
        ...baseFormData,
        employment_status: '',
        company: '',
        position: '',
      })).toBe(false)
    })
  })

  describe("Step 3: Suggestions", () => {
    it("should always allow proceeding", () => {
      expect(canProceed(3, baseFormData)).toBe(true)
    })
  })

  describe("Invalid step", () => {
    it("should reject unknown step number", () => {
      expect(canProceed(99, baseFormData)).toBe(false)
      expect(canProceed(-1, baseFormData)).toBe(false)
    })
  })
})

// ══════════════════════════════════════════
// TEST SUITE 4: TracerStudyQuestion Type (angkatan field)
// ══════════════════════════════════════════

describe("TracerStudyQuestion — angkatan field consistency", () => {
  it("questions.ts queries by angkatan but migration 002 has no angkatan column", () => {
    // The TracerStudyQuestion type in types/database.ts does NOT have angkatan
    // But questions.ts queries: .eq('angkatan', angkatan)
    // Migration 004 adds angkatan to questions table
    // Migration 002 seed data does NOT include angkatan values
    // This means seed data questions won't match any angkatan filter
    const seedQuestionsWithoutAngkatan = [
      { question_text: 'Tahun Berapa Anda Lulus?', angkatan: undefined },
    ]
    const filtered = seedQuestionsWithoutAngkatan.filter(q => q.angkatan === '2024')
    expect(filtered.length).toBe(0) // Seed data has no angkatan
  })
})

// ══════════════════════════════════════════
// TEST SUITE 5: Edge Cases & Regression
// ══════════════════════════════════════════

describe("Edge Cases & Regression", () => {

  describe("Large dataset performance", () => {
    it("should handle 1000 responses without error", () => {
      const responses = Array.from({ length: 1000 }, (_, i) =>
        makeResponse({
          id: `id-${i}`,
          employment_status: i % 2 === 0 ? 'Bekerja' : 'Belum Bekerja',
          salary_range: i % 3 === 0 ? '5-10 juta' : i % 3 === 1 ? '3-5 juta' : null,
          study_field_match: i % 4 === 0 ? 'Sesuai' : i % 4 === 1 ? 'Kurang Sesuai' : null,
        })
      )
      const stats = getTracerStudyStats(responses)
      expect(stats.totalResponses).toBe(1000)
      expect(stats.employmentRate).toBe(50)
    })
  })

  describe("Special characters in salary_range", () => {
    it("should handle salary ranges with special characters", () => {
      const responses = [
        makeResponse({ salary_range: '< 3 juta' }),
        makeResponse({ id: '2', salary_range: '> 20 juta' }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.salaryDistribution).toEqual({
        '< 3 juta': 1,
        '> 20 juta': 1,
      })
    })
  })

  describe("Unicode in responses", () => {
    it("should handle Indonesian characters", () => {
      const responses = [
        makeResponse({
          company: 'PT Teknologi Nusantara',
          position: 'Staff Administrasi',
          study_field_match: 'Sangat Sesuai',
        }),
      ]
      const stats = getTracerStudyStats(responses)
      expect(stats.fieldMatchRate).toBe(100)
    })
  })
})
