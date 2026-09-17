/**
 * Bulk Import — Server Action Logic Tests
 * =========================================
 * Menguji logic CSV parsing, validasi Zod, deteksi header,
 * dan pengiriman data ke Supabase (mocked).
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals"

// ── Mocks ──

const mockCreateUser = jest.fn<() => Promise<{ data: { user: { id: string } } | null; error: { message: string } | null }>>()
const mockFrom = jest.fn()

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        createUser: mockCreateUser,
      },
    },
    from: mockFrom,
  }),
}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

import { bulkImportUsers, type BulkImportResult } from "@/lib/actions/bulk-import"

// ── Helpers ──

function makeCSV(headers: string, ...rows: string[]): string {
  return [headers, ...rows].join("\n")
}

beforeEach(() => {
  mockCreateUser.mockReset()
  mockCreateUser.mockResolvedValue({ data: { user: { id: "mock-id" } }, error: null })
  mockFrom.mockReset()
  mockFrom.mockReturnValue({
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }),
  })
})

// ── Tests ──

describe("Bulk Import — Server Action Logic", () => {
  beforeEach(() => {
    mockCreateUser.mockReset()
    mockCreateUser.mockResolvedValue({ data: { user: { id: "mock-id" } }, error: null })
  })

  // ─────────────────────────────────
  // 1. CSV Header Detection
  // ─────────────────────────────────
  describe("Header Detection", () => {
    it("should accept standard headers: Nama,Email,Password,Role", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Budi,budi@amikomsolo.ac.id,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.total).toBe(1)
      expect(res.success).toBe(1)
      expect(res.failed).toBe(0)
    })

    it("should accept alternative headers: Name,Email,Pass,Roles", async () => {
      const csv = makeCSV(
        "Name,Email,Pass,Roles",
        "Siti,siti@amikomsolo.ac.id,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.total).toBe(1)
      expect(res.success).toBe(1)
    })

    it("should accept display_name as header", async () => {
      const csv = makeCSV(
        "display_name,Email,Password",
        "Andi,andi@amikomsolo.ac.id,password123"
      )
      const res = await bulkImportUsers(csv)
      expect(res.total).toBe(1)
      expect(res.success).toBe(1)
    })

    it("should be case-insensitive for headers", async () => {
      const csv = makeCSV(
        "NAMA,EMAIL,PASSWORD,ROLE",
        "Dewi,dewi@amikomsolo.ac.id,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.total).toBe(1)
      expect(res.success).toBe(1)
    })

    it("should fail if Email header is missing", async () => {
      const csv = makeCSV(
        "Nama,Password,Role",
        "Budi,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.errors.length).toBeGreaterThan(0)
      expect(res.errors[0].message).toContain("Header wajib")
    })

    it("should fail if Password header is missing", async () => {
      const csv = makeCSV(
        "Nama,Email,Role",
        "Budi,budi@amikomsolo.ac.id,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.errors[0].message).toContain("Header wajib")
    })

    it("should fail if Nama header is missing", async () => {
      const csv = makeCSV(
        "Email,Password,Role",
        "budi@amikomsolo.ac.id,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.errors[0].message).toContain("Header wajib")
    })

    it("should succeed without Role header (defaults to user)", async () => {
      const csv = makeCSV(
        "Nama,Email,Password",
        "Budi,budi@amikomsolo.ac.id,password123"
      )
      const res = await bulkImportUsers(csv)
      expect(res.success).toBe(1)
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          user_metadata: expect.objectContaining({ role: "user" }),
        })
      )
    })
  })

  // ─────────────────────────────────
  // 2. Row Validation (Zod)
  // ─────────────────────────────────
  describe("Row Validation", () => {
    it("should reject email not ending with @amikomsolo.ac.id", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Budi,budi@gmail.com,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.failed).toBe(1)
      expect(res.errors[0].message).toContain("@amikomsolo.ac.id")
    })

    it("should reject invalid email format", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Budi,bukan-email,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.failed).toBe(1)
      expect(res.errors[0].message).toContain("Email tidak valid")
    })

    it("should reject password shorter than 6 characters", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Budi,budi@amikomsolo.ac.id,12345,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.failed).toBe(1)
      expect(res.errors[0].message).toContain("Password minimal 6 karakter")
    })

    it("should reject empty name", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        ",budi@amikomsolo.ac.id,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.failed).toBe(1)
      expect(res.errors[0].message).toContain("Nama wajib diisi")
    })

    it("should reject invalid role value", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Budi,budi@amikomsolo.ac.id,password123,admin"
      )
      const res = await bulkImportUsers(csv)
      expect(res.failed).toBe(1)
    })

    it("should accept role super_user", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Budi,budi@amikomsolo.ac.id,password123,super_user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.success).toBe(1)
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          user_metadata: expect.objectContaining({ role: "super_user" }),
        })
      )
    })

    it("should default role to user when column is empty", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Budi,budi@amikomsolo.ac.id,password123,"
      )
      const res = await bulkImportUsers(csv)
      expect(res.success).toBe(1)
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          user_metadata: expect.objectContaining({ role: "user" }),
        })
      )
    })
  })

  // ─────────────────────────────────
  // 3. Empty / Edge Cases
  // ─────────────────────────────────
  describe("Edge Cases", () => {
    it("should return error for empty input", async () => {
      const res = await bulkImportUsers("")
      expect(res.total).toBe(0)
      expect(res.errors.length).toBeGreaterThan(0)
    })

    it("should return error for header-only CSV", async () => {
      const csv = "Nama,Email,Password,Role"
      const res = await bulkImportUsers(csv)
      expect(res.total).toBe(0)
      expect(res.errors[0].message).toContain("Data kosong")
    })

    it("should handle CSV with quoted fields containing commas", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        '"Budi, S.Pd",budi@amikomsolo.ac.id,password123,user'
      )
      const res = await bulkImportUsers(csv)
      expect(res.success).toBe(1)
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          user_metadata: expect.objectContaining({ display_name: "Budi, S.Pd" }),
        })
      )
    })

    it("should handle CSV with quoted fields containing escaped quotes", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        '"Budi ""The Boss""",budi@amikomsolo.ac.id,password123,user'
      )
      const res = await bulkImportUsers(csv)
      expect(res.success).toBe(1)
    })

    it("should skip blank lines", async () => {
      const csv = "Nama,Email,Password,Role\n\nBudi,budi@amikomsolo.ac.id,password123,user\n\n"
      const res = await bulkImportUsers(csv)
      expect(res.total).toBe(1)
      expect(res.success).toBe(1)
    })

    it("should handle mixed valid and invalid rows", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Valid1,valid1@amikomsolo.ac.id,password123,user",
        ",invalid@amikomsolo.ac.id,password123,user",
        "Valid2,valid2@amikomsolo.ac.id,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.total).toBe(3)
      expect(res.success).toBe(2)
      expect(res.failed).toBe(1)
    })

    it("should handle rows with fewer columns than headers", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Budi,budi@amikomsolo.ac.id"
      )
      const res = await bulkImportUsers(csv)
      expect(res.failed).toBe(1)
    })
  })

  // ─────────────────────────────────
  // 4. Supabase Integration (Mocked)
  // ─────────────────────────────────
  describe("Supabase createUser Integration", () => {
    it("should call createUser with correct parameters", async () => {
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Budi,budi@amikomsolo.ac.id,password123,user"
      )
      await bulkImportUsers(csv)
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "budi@amikomsolo.ac.id",
        password: "password123",
        email_confirm: true,
        user_metadata: {
          display_name: "Budi",
          role: "user",
        },
      })
    })

    it("should handle Supabase error gracefully", async () => {
      mockCreateUser.mockResolvedValueOnce({
        data: null,
        error: { message: "User already exists" },
      })
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Budi,budi@amikomsolo.ac.id,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.failed).toBe(1)
      expect(res.errors[0].message).toContain("User already exists")
    })

    it("should handle Supabase exception gracefully", async () => {
      mockCreateUser.mockRejectedValueOnce(new Error("Network error"))
      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "Budi,budi@amikomsolo.ac.id,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.failed).toBe(1)
      expect(res.errors[0].message).toContain("Network error")
    })

    it("should continue processing after a row fails", async () => {
      mockCreateUser
        .mockResolvedValueOnce({ data: { user: { id: "1" } }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: "Duplicate" } })
        .mockResolvedValueOnce({ data: { user: { id: "3" } }, error: null })

      const csv = makeCSV(
        "Nama,Email,Password,Role",
        "User1,user1@amikomsolo.ac.id,password123,user",
        "User2,user2@amikomsolo.ac.id,password123,user",
        "User3,user3@amikomsolo.ac.id,password123,user"
      )
      const res = await bulkImportUsers(csv)
      expect(res.total).toBe(3)
      expect(res.success).toBe(2)
      expect(res.failed).toBe(1)
    })
  })
})
