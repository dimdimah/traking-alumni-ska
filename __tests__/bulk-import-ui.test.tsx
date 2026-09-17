import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

const mockBulkImportUsers = jest.fn<(...args: string[]) => Promise<{ total: number; success: number; failed: number; errors: { row: number; message: string }[] }>>()

jest.mock("@/lib/actions/bulk-import", () => ({
  bulkImportUsers: (...args: string[]) => mockBulkImportUsers(...args),
}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { createUser: jest.fn() } },
  }),
}))

jest.mock("@/components/download-template-button", () => ({
  excelFileToCSV: jest.fn().mockResolvedValue(""),
}))

import BulkImportForm from "@/components/super-user/bulk-import-form"

function makeCSVFile(content: string, name = "test.csv"): File {
  return new File([content], name, { type: "text/csv" })
}

function uploadFile(input: HTMLElement, content: string, name?: string) {
  const file = makeCSVFile(content, name)
  fireEvent.change(input, { target: { files: [file] } })
}

describe("Bulk Import — UI & UX", () => {
  beforeEach(() => {
    mockBulkImportUsers.mockReset()
  })

  describe("Initial Render", () => {
    it("should render file upload area", () => {
      render(<BulkImportForm />)
      expect(screen.getByText(/Klik untuk upload file/)).toBeTruthy()
      expect(screen.getByText(/seret file ke sini/)).toBeTruthy()
    })

    it("should show import button disabled when no file uploaded", () => {
      render(<BulkImportForm />)
      const btn = screen.getByRole("button", { name: /Import/i })
      expect(btn).toBeDisabled()
    })

    it("should not show preview table initially", () => {
      render(<BulkImportForm />)
      expect(screen.queryByRole("table")).toBeNull()
    })
  })

  describe("File Upload & Preview", () => {
    const validCSV = "Nama,Email,Password,Role\nBudi,budi@amikomsolo.ac.id,password123,user\nSiti,siti@amikomsolo.ac.id,password456,user"

    it("should show file name after upload", async () => {
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, validCSV, "data-alumni.csv")
      await waitFor(() => {
        expect(screen.getByText("data-alumni.csv")).toBeTruthy()
      })
    })

    it("should show correct row count after upload", async () => {
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, validCSV)
      await waitFor(() => {
        expect(screen.getByText(/2 baris data/)).toBeTruthy()
      })
    })

    it("should show preview table with data rows", async () => {
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, validCSV)
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeTruthy()
        expect(screen.getByText("Budi")).toBeTruthy()
        expect(screen.getByText("Siti")).toBeTruthy()
      })
    })

    it("should show valid status for valid rows", async () => {
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, validCSV)
      await waitFor(() => {
        const checks = screen.getAllByText("✓")
        expect(checks.length).toBe(2)
      })
    })

    it("should show invalid status for rows with missing data", async () => {
      const csv = "Nama,Email,Password,Role\n,budi@amikomsolo.ac.id,password123,user"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv)
      await waitFor(() => {
        expect(screen.getByText("✗")).toBeTruthy()
      })
    })

    it("should enable import button when file has data", async () => {
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, validCSV)
      await waitFor(() => {
        const btn = screen.getByRole("button", { name: /Import 2 User/i })
        expect(btn).not.toBeDisabled()
      })
    })

    it("should show 'Ganti File' button after upload", async () => {
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, validCSV)
      await waitFor(() => {
        expect(screen.getByText("Ganti File")).toBeTruthy()
      })
    })

    it("should clear file and reset state when 'Ganti File' is clicked", async () => {
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, validCSV)
      await waitFor(() => {
        expect(screen.getByText("Ganti File")).toBeTruthy()
      })
      fireEvent.click(screen.getByText("Ganti File"))
      await waitFor(() => {
        expect(screen.getByText(/Klik untuk upload file/)).toBeTruthy()
        expect(screen.queryByRole("table")).toBeNull()
      })
    })
  })

  describe("Preview Validation Logic", () => {
    it("should mark row as invalid when email has no @", async () => {
      const csv = "Nama,Email,Password,Role\nBudi,bukanemail,password123,user"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv)
      await waitFor(() => {
        expect(screen.getByText("✗")).toBeTruthy()
      })
    })

    it("should mark row as invalid when name is empty", async () => {
      const csv = "Nama,Email,Password,Role\n,budi@amikomsolo.ac.id,password123,user"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv)
      await waitFor(() => {
        expect(screen.getByText("✗")).toBeTruthy()
      })
    })

    it("should show role badge for each row", async () => {
      const csv = "Nama,Email,Password,Role\nBudi,budi@amikomsolo.ac.id,password123,super_user\nSiti,siti@amikomsolo.ac.id,password456,user"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv)
      await waitFor(() => {
        expect(screen.getByText("super_user")).toBeTruthy()
        expect(screen.getAllByText("user").length).toBeGreaterThanOrEqual(1)
      })
    })

    it("should show no preview for header-only CSV", async () => {
      const csv = "Nama,Email,Password,Role"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv)
      await waitFor(() => {
        expect(screen.queryByRole("table")).toBeNull()
      })
    })
  })

  describe("Import Action & Result Display", () => {
    it("should call bulkImportUsers with raw CSV content on import", async () => {
      mockBulkImportUsers.mockResolvedValueOnce({
        total: 2, success: 2, failed: 0, errors: [],
      })
      const csv = "Nama,Email,Password,Role\nBudi,budi@amikomsolo.ac.id,password123,user\nSiti,siti@amikomsolo.ac.id,password456,user"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Import 2 User/i })).not.toBeDisabled()
      })

      fireEvent.click(screen.getByRole("button", { name: /Import 2 User/i }))

      await waitFor(() => {
        expect(mockBulkImportUsers).toHaveBeenCalledWith(csv)
      })
    })

    it("should show loading spinner while importing", async () => {
      let resolvePromise: (v: { total: number; success: number; failed: number; errors: { row: number; message: string }[] }) => void
      mockBulkImportUsers.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve })
      )
      const csv = "Nama,Email,Password,Role\nBudi,budi@amikomsolo.ac.id,password123,user"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Import 1 User/i })).not.toBeDisabled()
      })

      fireEvent.click(screen.getByRole("button", { name: /Import 1 User/i }))

      await waitFor(() => {
        expect(screen.getByText("Mengimpor...")).toBeTruthy()
      })

      resolvePromise!({ total: 1, success: 1, failed: 0, errors: [] })
    })

    it("should show success result when all rows imported", async () => {
      mockBulkImportUsers.mockResolvedValueOnce({
        total: 2, success: 2, failed: 0, errors: [],
      })
      const csv = "Nama,Email,Password,Role\nBudi,budi@amikomsolo.ac.id,password123,user\nSiti,siti@amikomsolo.ac.id,password456,user"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv)

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /Import 2 User/i }))
      })

      await waitFor(() => {
        expect(screen.getByText("2/2 berhasil diimpor")).toBeTruthy()
        expect(screen.getByText(/Akun langsung aktif/)).toBeTruthy()
      })
    })

    it("should show partial success result", async () => {
      mockBulkImportUsers.mockResolvedValueOnce({
        total: 3, success: 2, failed: 1,
        errors: [{ row: 3, message: "Email sudah terdaftar" }],
      })
      const csv = "Nama,Email,Password,Role\nA,a@amikomsolo.ac.id,pass123456,user\nB,b@amikomsolo.ac.id,pass123456,user\nC,c@amikomsolo.ac.id,pass123456,user"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv)

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /Import 3 User/i }))
      })

      await waitFor(() => {
        expect(screen.getByText("2/3 berhasil diimpor")).toBeTruthy()
        expect(screen.getByText(/Baris 3: Email sudah terdaftar/)).toBeTruthy()
      })
    })

    it("should show error result when all rows fail", async () => {
      mockBulkImportUsers.mockResolvedValueOnce({
        total: 1, success: 0, failed: 1,
        errors: [{ row: 2, message: "Email tidak valid" }],
      })
      const csv = "Nama,Email,Password,Role\nBudi,budi@gmail.com,password123,user"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv)

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /Import 1 User/i }))
      })

      await waitFor(() => {
        expect(screen.getByText("0/1 berhasil diimpor")).toBeTruthy()
        expect(screen.getByText(/Baris 2: Email tidak valid/)).toBeTruthy()
      })
    })

    it("should show error when server action throws", async () => {
      mockBulkImportUsers.mockRejectedValueOnce(new Error("Server error"))
      const csv = "Nama,Email,Password,Role\nBudi,budi@amikomsolo.ac.id,password123,user"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv)

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /Import 1 User/i }))
      })

      await waitFor(() => {
        expect(screen.getByText(/Server error/)).toBeTruthy()
      })
    })
  })

  describe("UX Edge Cases", () => {
    it("should clear previous result when 'Ganti File' is clicked and new file uploaded", async () => {
      mockBulkImportUsers.mockResolvedValueOnce({
        total: 1, success: 1, failed: 0, errors: [],
      })
      const csv1 = "Nama,Email,Password,Role\nBudi,budi@amikomsolo.ac.id,password123,user"
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      uploadFile(input, csv1)

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /Import 1 User/i }))
      })

      await waitFor(() => {
        expect(screen.getByText("1/1 berhasil diimpor")).toBeTruthy()
      })

      fireEvent.click(screen.getByText("Ganti File"))

      await waitFor(() => {
        expect(screen.queryByText("1/1 berhasil diimpor")).toBeNull()
        expect(screen.getByText(/Klik untuk upload file/)).toBeTruthy()
      })
    })

    it("should accept .csv file type", () => {
      render(<BulkImportForm />)
      const input = document.querySelector('input[type="file"]')! as HTMLInputElement as HTMLInputElement
      expect(input.getAttribute("accept")).toContain(".csv")
    })
  })
})
