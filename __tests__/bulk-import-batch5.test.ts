/**
 * Bulk Import — Batch 5 Records Test
 * =====================================
 * Menguji pengiriman 5 data sekaligus ke database dalam satu kali import.
 * Memastikan semua 5 record diproses, divalidasi, dan dikirim ke Supabase.
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

// ── Tests ──

describe("Bulk Import — Kirim 5 Data Sekaligus ke DB", () => {
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

  it("should process exactly 5 valid records and send all to DB", async () => {
    const csv = [
      "Nama,Email,Password,Role",
      "Andi Pratama,andi.pratama@amikomsolo.ac.id,password123,user",
      "Siti Nurhaliza,siti.nurhaliza@amikomsolo.ac.id,password456,user",
      "Budi Santoso,budi.santoso@amikomsolo.ac.id,password789,super_user",
      "Dewi Lestari,dewi.lestari@amikomsolo.ac.id,password012,user",
      "Rizky Hidayat,rizky.hidayat@amikomsolo.ac.id,password345,user",
    ].join("\n")

    const res = await bulkImportUsers(csv)

    expect(res.total).toBe(5)
    expect(res.success).toBe(5)
    expect(res.failed).toBe(0)
    expect(res.errors).toHaveLength(0)
    expect(mockCreateUser).toHaveBeenCalledTimes(5)
  })

  it("should call createUser with correct data for each of 5 records", async () => {
    const records = [
      { name: "Andi Pratama", email: "andi.pratama@amikomsolo.ac.id", password: "password123", role: "user" },
      { name: "Siti Nurhaliza", email: "siti.nurhaliza@amikomsolo.ac.id", password: "password456", role: "user" },
      { name: "Budi Santoso", email: "budi.santoso@amikomsolo.ac.id", password: "password789", role: "super_user" },
      { name: "Dewi Lestari", email: "dewi.lestari@amikomsolo.ac.id", password: "password012", role: "user" },
      { name: "Rizky Hidayat", email: "rizky.hidayat@amikomsolo.ac.id", password: "password345", role: "user" },
    ]

    const csv = [
      "Nama,Email,Password,Role",
      ...records.map(r => `${r.name},${r.email},${r.password},${r.role}`),
    ].join("\n")

    await bulkImportUsers(csv)

    records.forEach((r, i) => {
      expect(mockCreateUser).toHaveBeenNthCalledWith(i + 1, {
        email: r.email,
        password: r.password,
        email_confirm: true,
        user_metadata: {
          display_name: r.name,
          role: r.role,
        },
      })
    })
  })

  it("should handle 5 records with mixed valid and invalid data", async () => {
    const csv = [
      "Nama,Email,Password,Role",
      "User Satu,user1@amikomsolo.ac.id,password123,user",
      ",user2@amikomsolo.ac.id,password456,user",
      "User Tiga,bukan-email,password789,user",
      "User Empat,user4@amikomsolo.ac.id,12345,user",
      "User Lima,user5@amikomsolo.ac.id,password345,user",
    ].join("\n")

    const res = await bulkImportUsers(csv)

    expect(res.total).toBe(5)
    expect(res.success).toBe(2)
    expect(res.failed).toBe(3)
    expect(res.errors).toHaveLength(3)

    expect(res.errors[0].row).toBe(3)
    expect(res.errors[0].message).toContain("Nama wajib diisi")

    expect(res.errors[1].row).toBe(4)
    expect(res.errors[1].message).toContain("Email tidak valid")

    expect(res.errors[2].row).toBe(5)
    expect(res.errors[2].message).toContain("Password minimal")

    expect(mockCreateUser).toHaveBeenCalledTimes(2)
  })

  it("should handle 5 records with all invalid data", async () => {
    const csv = [
      "Nama,Email,Password,Role",
      ",user1@gmail.com,12345,admin",
      ",user2@gmail.com,12345,admin",
      ",user3@gmail.com,12345,admin",
      ",user4@gmail.com,12345,admin",
      ",user5@gmail.com,12345,admin",
    ].join("\n")

    const res = await bulkImportUsers(csv)

    expect(res.total).toBe(5)
    expect(res.success).toBe(0)
    expect(res.failed).toBe(5)
    expect(res.errors).toHaveLength(5)
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it("should handle partial Supabase failures in batch of 5", async () => {
    mockCreateUser
      .mockResolvedValueOnce({ data: { user: { id: "1" } }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "Email sudah terdaftar" } })
      .mockResolvedValueOnce({ data: { user: { id: "3" } }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "Email sudah terdaftar" } })
      .mockResolvedValueOnce({ data: { user: { id: "5" } }, error: null })

    const csv = [
      "Nama,Email,Password,Role",
      "User1,user1@amikomsolo.ac.id,password123,user",
      "User2,user2@amikomsolo.ac.id,password456,user",
      "User3,user3@amikomsolo.ac.id,password789,user",
      "User4,user4@amikomsolo.ac.id,password012,user",
      "User5,user5@amikomsolo.ac.id,password345,user",
    ].join("\n")

    const res = await bulkImportUsers(csv)

    expect(res.total).toBe(5)
    expect(res.success).toBe(3)
    expect(res.failed).toBe(2)
    expect(res.errors).toHaveLength(2)
    expect(res.errors[0].message).toContain("Email sudah terdaftar")
    expect(res.errors[1].message).toContain("Email sudah terdaftar")
    expect(mockCreateUser).toHaveBeenCalledTimes(5)
  })

  it("should process 5 records sequentially (not in parallel)", async () => {
    const callOrder: number[] = []
    let callCount = 0

    mockCreateUser.mockImplementation(async () => {
      const order = ++callCount
      callOrder.push(order)
      return { data: { user: { id: `id-${order}` } }, error: null }
    })

    const csv = [
      "Nama,Email,Password,Role",
      "User1,user1@amikomsolo.ac.id,password123,user",
      "User2,user2@amikomsolo.ac.id,password456,user",
      "User3,user3@amikomsolo.ac.id,password789,user",
      "User4,user4@amikomsolo.ac.id,password012,user",
      "User5,user5@amikomsolo.ac.id,password345,user",
    ].join("\n")

    await bulkImportUsers(csv)

    expect(callOrder).toEqual([1, 2, 3, 4, 5])
  })

  it("should handle 5 records with various role combinations", async () => {
    const csv = [
      "Nama,Email,Password,Role",
      "User1,user1@amikomsolo.ac.id,password123,user",
      "User2,user2@amikomsolo.ac.id,password456,super_user",
      "User3,user3@amikomsolo.ac.id,password789,user",
      "User4,user4@amikomsolo.ac.id,password012,super_user",
      "User5,user5@amikomsolo.ac.id,password345,user",
    ].join("\n")

    const res = await bulkImportUsers(csv)

    expect(res.success).toBe(5)

    const calls = mockCreateUser.mock.calls
    expect(calls[0][0].user_metadata.role).toBe("user")
    expect(calls[1][0].user_metadata.role).toBe("super_user")
    expect(calls[2][0].user_metadata.role).toBe("user")
    expect(calls[3][0].user_metadata.role).toBe("super_user")
    expect(calls[4][0].user_metadata.role).toBe("user")
  })

  it("should handle 5 records without Role column (all default to user)", async () => {
    const csv = [
      "Nama,Email,Password",
      "User1,user1@amikomsolo.ac.id,password123",
      "User2,user2@amikomsolo.ac.id,password456",
      "User3,user3@amikomsolo.ac.id,password789",
      "User4,user4@amikomsolo.ac.id,password012",
      "User5,user5@amikomsolo.ac.id,password345",
    ].join("\n")

    const res = await bulkImportUsers(csv)

    expect(res.success).toBe(5)
    const calls = mockCreateUser.mock.calls
    calls.forEach(call => {
      expect(call[0].user_metadata.role).toBe("user")
    })
  })

  it("should handle 5 records with quoted CSV fields", async () => {
    const csv = [
      "Nama,Email,Password,Role",
      '"Pratama, Andi",andi@amikomsolo.ac.id,password123,user',
      '"Nurhaliza, Siti",siti@amikomsolo.ac.id,password456,user',
      '"Santoso, Budi",budi@amikomsolo.ac.id,password789,user',
      '"Lestari, Dewi",dewi@amikomsolo.ac.id,password012,user',
      '"Hidayat, Rizky",rizky@amikomsolo.ac.id,password345,user',
    ].join("\n")

    const res = await bulkImportUsers(csv)

    expect(res.total).toBe(5)
    expect(res.success).toBe(5)

    const calls = mockCreateUser.mock.calls
    expect(calls[0][0].user_metadata.display_name).toBe("Pratama, Andi")
    expect(calls[1][0].user_metadata.display_name).toBe("Nurhaliza, Siti")
    expect(calls[2][0].user_metadata.display_name).toBe("Santoso, Budi")
    expect(calls[3][0].user_metadata.display_name).toBe("Lestari, Dewi")
    expect(calls[4][0].user_metadata.display_name).toBe("Hidayat, Rizky")
  })
})
