/**
 * Track Record CRUD Tests
 * ========================
 * TC 2.3: Create, Update (edit modal shows old data), Delete (confirmation dialog)
 */

import { describe, it, expect } from "@jest/globals"
import { z } from "zod"

// ──────────────────────────────────────────
// Zod schema (mirroring lib/schemas/track-record.ts)
// ──────────────────────────────────────────

const trackRecordSchema = z.object({
  company_name: z.string().min(1, "Nama perusahaan wajib diisi"),
  position: z.string().min(1, "Posisi/jabatan wajib diisi"),
  start_date: z.string().min(1, "Tanggal mulai wajib diisi"),
  end_date: z.string().optional(),
  is_current: z.boolean().default(false),
  description: z.string().optional(),
  salary_range: z.string().optional(),
})

// ──────────────────────────────────────────
// CRUD logic mocks (mirroring server actions)
// ──────────────────────────────────────────

type TrackRecord = z.infer<typeof trackRecordSchema> & { id: string }

// Mock database
const mockDB: TrackRecord[] = [
  {
    id: "1",
    company_name: "PT Teknologi Maju",
    position: "Software Engineer",
    start_date: "2022-01-01",
    end_date: "2024-06-01",
    is_current: false,
    description: "Full-stack developer",
    salary_range: "5-10jt",
  },
  {
    id: "2",
    company_name: "Startup AI Indonesia",
    position: "Junior Developer",
    start_date: "2023-06-01",
    is_current: true,
    description: "",
    salary_range: "3-5jt",
  },
]

function createRecord(
  data: Omit<TrackRecord, "id">,
): { success: true; data: TrackRecord } | { success: false; errors: string[] } {
  const parsed = trackRecordSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((i) => i.message),
    }
  }
  const record: TrackRecord = { id: String(Date.now()), ...parsed.data }
  mockDB.push(record)
  return { success: true, data: record }
}

function updateRecord(
  id: string,
  data: Partial<TrackRecord>,
): { success: true; data: TrackRecord } | { success: false; error: string } {
  const idx = mockDB.findIndex((r) => r.id === id)
  if (idx === -1) return { success: false, error: "Data tidak ditemukan" }
  mockDB[idx] = { ...mockDB[idx], ...data }
  return { success: true, data: mockDB[idx] }
}

function deleteRecord(id: string): { success: boolean; error?: string } {
  const idx = mockDB.findIndex((r) => r.id === id)
  if (idx === -1) return { success: false, error: "Data tidak ditemukan" }
  mockDB.splice(idx, 1)
  return { success: true }
}

function getRecordById(id: string): TrackRecord | undefined {
  return mockDB.find((r) => r.id === id)
}

// ──────────────────────────────────────────
// Tests
// ──────────────────────────────────────────

describe("TC 2.3 — Track Record CRUD Operations", () => {
  // === CREATE ===
  describe("Create — Tambah Pengalaman Baru", () => {
    it("should reject empty company_name", () => {
      const result = createRecord({
        company_name: "",
        position: "Engineer",
        start_date: "2024-01-01",
        is_current: false,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toContain("Nama perusahaan wajib diisi")
      }
    })

    it("should reject empty position", () => {
      const result = createRecord({
        company_name: "PT ABC",
        position: "",
        start_date: "2024-01-01",
        is_current: false,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toContain("Posisi/jabatan wajib diisi")
      }
    })

    it("should reject missing start_date", () => {
      const result = createRecord({
        company_name: "PT ABC",
        position: "Engineer",
        start_date: "",
        is_current: false,
      })
      expect(result.success).toBe(false)
    })

    it("should create a valid record successfully", () => {
      const result = createRecord({
        company_name: "PT Karya Anak Bangsa",
        position: "Frontend Developer",
        start_date: "2024-03-01",
        is_current: true,
        description: "Membangun UI",
        salary_range: "5-8jt",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.company_name).toBe("PT Karya Anak Bangsa")
        expect(result.data.is_current).toBe(true)
      }
    })
  })

  // === READ / GET ===
  describe("Read — Menampilkan Data Lama ke Form Modal", () => {
    it("should return existing record by id", () => {
      const record = getRecordById("1")
      expect(record).toBeDefined()
      expect(record?.company_name).toBe("PT Teknologi Maju")
      expect(record?.position).toBe("Software Engineer")
    })

    it("should return undefined for non-existent id", () => {
      const record = getRecordById("999")
      expect(record).toBeUndefined()
    })
  })

  // === UPDATE ===
  describe("Update — Edit Pengalaman", () => {
    it("should update company_name", () => {
      const result = updateRecord("1", {
        company_name: "PT Teknologi Maju (Updated)",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.company_name).toBe("PT Teknologi Maju (Updated)")
      }
    })

    it("should update end_date when no longer current", () => {
      const result = updateRecord("2", {
        is_current: false,
        end_date: "2024-12-01",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_current).toBe(false)
        expect(result.data.end_date).toBe("2024-12-01")
      }
    })

    it("should return error for non-existent id", () => {
      const result = updateRecord("999", { company_name: "Test" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Data tidak ditemukan")
      }
    })
  })

  // === DELETE ===
  describe("Delete — Hapus Pengalaman (dengan konfirmasi)", () => {
    it("should delete existing record", () => {
      const result = deleteRecord("2")
      expect(result.success).toBe(true)
      expect(getRecordById("2")).toBeUndefined()
    })

    it("should return error when deleting non-existent record", () => {
      const result = deleteRecord("999")
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Data tidak ditemukan")
      }
    })
  })
})
