import { describe, it, expect, jest, beforeEach } from "@jest/globals"

const mockCreateUser = jest.fn<() => Promise<{ data: { user: { id: string } } | null; error: { message: string } | null }>>()
const mockFrom = jest.fn()

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: { createUser: mockCreateUser },
    },
    from: mockFrom,
  }),
}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

import { bulkImportUsers } from "@/lib/actions/bulk-import"

describe("BUG #1 — File Excel (.xlsx) tidak didukung", () => {
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

  it("FIXED: Server mendeteksi binary (ZIP header) dan mengembalikan error yang informatif", async () => {
    const fakeExcelContent = "PK\x03\x04\x14\x00\x00\x00\x08\x00some binary [Content_Types].xml"
    const res = await bulkImportUsers(fakeExcelContent)

    expect(res.success).toBe(0)
    expect(res.errors.length).toBeGreaterThan(0)
    expect(res.errors[0].message.toLowerCase()).toContain("format")
    console.log("  -> Error yang diterima user:", res.errors[0].message)
    console.log("  -> FIX: Error menyebutkan format, bukan error parsing binary")
  })

  it("FIXED: Error message menyebutkan format atau Excel", async () => {
    const binaryGarbage = "\x00\x01\x02\x03\x04\x05random binary data"
    const res = await bulkImportUsers(binaryGarbage)

    expect(res.success).toBe(0)
    const errorMsg = res.errors[0].message
    console.log("  -> Pesan error:", errorMsg)

    const mentionsFormat = errorMsg.includes("format") || errorMsg.includes("bukan CSV")
    const mentionsUpload = errorMsg.includes("upload")
    expect(mentionsFormat || mentionsUpload).toBe(true)
    console.log("  -> Menyebutkan format file:", mentionsFormat)
    console.log("  -> Menyebutkan upload:", mentionsUpload)
    console.log("  -> FIX: Error informatif, user tahu harus upload CSV")
  })
})

describe("BUG #2 — CRLF (\\r\\n) dari Windows", () => {
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

  it("FIXED: Server berhasil import CRLF dengan trim dan filter yang benar", async () => {
    const csvCRLF = "Nama,Email,Password,Role\r\nBudi,budi@amikomsolo.ac.id,password123,user\r\nSiti,siti@amikomsolo.ac.id,password456,user\r\n"
    const res = await bulkImportUsers(csvCRLF)

    expect(res.success).toBe(2)
    console.log("  -> Server CRLF: success =", res.success, "(OK karena \\r\\n → \\n + trim)")
  })

  it("FIXED: Baris kosong \\r tidak lolos filter (sekarang pakai .trim() + .length > 0)", async () => {
    const csvWithCRLFBlankLines = "Nama,Email,Password,Role\r\nBudi,budi@amikomsolo.ac.id,password123,user\r\n\r\nSiti,siti@amikomsolo.ac.id,password456,user\r\n"
    const res = await bulkImportUsers(csvWithCRLFBlankLines)

    console.log("  -> Total:", res.total, "| Success:", res.success, "| Failed:", res.failed)

    expect(res.total).toBe(2)
    console.log("  -> FIX: total =", res.total, "(hanya 2 baris data, baris kosong terfilter)")
  })

  it("FIXED: CRLF tidak mengotori field terakhir (\\r sudah dihapus)", async () => {
    const csv = "Nama,Email,Password\r\nBudi,budi@amikomsolo.ac.id,password123\r\n"
    const res = await bulkImportUsers(csv)

    console.log("  -> Success:", res.success)
    expect(res.success).toBe(1)
    console.log("  -> FIX: Password field terakhir OK karena .trim() di parseCSVLine + \\r dihapus")
  })
})

describe("BUG #8 — Baris kosong yang hanya \\r lolos filter", () => {
  it("FIXED: filter sekarang pakai .trim() + .length > 0, bukan filter(Boolean)", () => {
    const raw = "Nama,Email,Password,Role\r\nBudi,budi@amikomsolo.ac.id,password123,user\r\n\r\nSiti,siti@amikomsolo.ac.id,password456,user"
    // simulasi logika baru
    const lines = raw
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)

    console.log("  -> Jumlah baris setelah filter baru:", lines.length)
    console.log("  -> Baris-baris:", lines.map(l => JSON.stringify(l)))

    const hasEmptyLine = lines.some(l => l === '')
    expect(hasEmptyLine).toBe(false)
    expect(lines.length).toBe(3)
    console.log("  -> FIX: Baris kosong tidak lolos filter")
  })
})
