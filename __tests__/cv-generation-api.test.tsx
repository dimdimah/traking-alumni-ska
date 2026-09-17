/**
 * CV Generation API Route Tests
 * ==============================
 * TC 5.4: API route /api/generate-cv — returns PDF or error responses
 * TC 5.5: API route — handles unauthorized and render errors
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import React from "react"

// ── Mock @react-pdf/renderer ──────────────────────────────────────────────────

const mockDocument = jest.fn(({ children }: any) => React.createElement('div', { 'data-testid': 'pdf-document' }, children))
const mockPage = jest.fn(({ children, style }: any) => React.createElement('div', { 'data-testid': 'pdf-page' }, children))
const mockText = jest.fn(({ children, style }: any) => React.createElement('span', { 'data-testid': 'pdf-text' }, children))
const mockView = jest.fn(({ children, style }: any) => React.createElement('div', { 'data-testid': 'pdf-view' }, children))
const mockStyleSheet = { create: jest.fn((styles: any) => styles) }
const mockRenderToBuffer = jest.fn()

jest.mock("@react-pdf/renderer", () => ({
  Document: mockDocument,
  Page: mockPage,
  Text: mockText,
  View: mockView,
  StyleSheet: mockStyleSheet,
  Font: {},
  renderToBuffer: mockRenderToBuffer,
}))

// ── Mock Supabase server client ───────────────────────────────────────────────

const mockAuthGetUser = jest.fn()
const mockFrom = jest.fn()

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockAuthGetUser,
    },
    from: mockFrom,
  })),
}))

// ── Mock next/server ──────────────────────────────────────────────────────────

jest.mock("next/server", () => ({
  NextRequest: class extends (globalThis.Request || function() {}) {},
  NextResponse: class extends (globalThis.Response || function() {}) {
    static json(body: any, init?: any) {
      const ResponseCtor = globalThis.Response || function() {}
      return new ResponseCtor(JSON.stringify(body), {
        status: init?.status || 200,
        headers: { "Content-Type": "application/json" },
      })
    }
  },
}))

// ── Mock lib/actions/cv ───────────────────────────────────────────────────────

const mockGetCvData = jest.fn()

jest.mock("@/lib/actions/cv", () => ({
  getCvData: mockGetCvData,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProfile(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "user-123",
    email: "alumni@amikomsolo.ac.id",
    role: "user",
    full_name: "Budi Santoso",
    nim: "12345",
    tanggal_lahir: "2000-05-15",
    phone: "+6281234567890",
    bio: "Software engineer dengan pengalaman 3 tahun.",
    skills: ["React", "TypeScript", "Node.js", "Supabase"],
    location: "Solo Raya",
    education_level: "S1",
    expected_salary: "5-10 juta",
    preferred_type: "Full-time",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  }
}

function makeTrackRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "tr-1",
    user_id: "user-123",
    company: "PT Teknologi Indonesia",
    position: "Software Engineer",
    start_date: "2022-01-01",
    end_date: null,
    description: "Mengembangkan aplikasi web dengan React dan Node.js.",
    is_current: true,
    idempotency_key: "key-1",
    created_at: "2022-01-01T00:00:00Z",
    updated_at: "2022-01-01T00:00:00Z",
    ...overrides,
  }
}

function makeTracerStudy(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "ts-1",
    user_id: "user-123",
    graduation_year: 2024,
    education_level: "S1",
    employment_status: "Bekerja",
    company: "PT Teknologi Indonesia",
    position: "Software Engineer",
    salary_range: "5-10jt",
    study_field_match: "Sangat Sesuai",
    suggestions: null,
    submitted_at: "2024-06-01T00:00:00Z",
    updated_at: "2024-06-01T00:00:00Z",
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TC 5.4 — API Route /api/generate-cv", () => {
  beforeEach(() => {
    mockGetCvData.mockReset()
    mockRenderToBuffer.mockReset()
    mockDocument.mockClear()
    mockPage.mockClear()
    mockText.mockClear()
    mockView.mockClear()
    mockStyleSheet.create.mockClear()
  })

  it("should return PDF response with correct headers when authenticated", async () => {
    const cvData = {
      profile: makeProfile({ full_name: "Budi Santoso" }) as any,
      trackRecords: [makeTrackRecord() as any],
      tracerStudy: makeTracerStudy() as any,
    }

    mockGetCvData.mockResolvedValue(cvData)
    mockRenderToBuffer.mockResolvedValue(Buffer.from("fake-pdf-content"))

    const { GET } = await import("@/app/api/generate-cv/route")

    const request = new Request("http://localhost/api/generate-cv?lang=id")
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("application/pdf")
    expect(response.headers.get("Content-Disposition")).toContain('filename="CV_Budi_Santoso_ID.pdf"')
    expect(response.headers.get("Cache-Control")).toBe("no-store")
  })

  it("should return English filename when lang=en", async () => {
    const cvData = {
      profile: makeProfile({ full_name: "Budi Santoso" }) as any,
      trackRecords: [] as any,
      tracerStudy: null as any,
    }

    mockGetCvData.mockResolvedValue(cvData)
    mockRenderToBuffer.mockResolvedValue(Buffer.from("fake-pdf-content"))

    const { GET } = await import("@/app/api/generate-cv/route")

    const request = new Request("http://localhost/api/generate-cv?lang=en")
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Disposition")).toContain('filename="CV_Budi_Santoso_EN.pdf"')
  })

  it("should default to 'id' language when lang param is missing", async () => {
    const cvData = {
      profile: makeProfile() as any,
      trackRecords: [] as any,
      tracerStudy: null as any,
    }

    mockGetCvData.mockResolvedValue(cvData)
    mockRenderToBuffer.mockResolvedValue(Buffer.from("fake-pdf-content"))

    const { GET } = await import("@/app/api/generate-cv/route")

    const request = new Request("http://localhost/api/generate-cv")
    const response = await GET(request as any)

    expect(response.status).toBe(200)
  })

  it("should return 401 when getCvData returns null", async () => {
    mockGetCvData.mockResolvedValue(null)
    mockRenderToBuffer.mockResolvedValue(Buffer.from("fake-pdf-content"))

    const { GET } = await import("@/app/api/generate-cv/route")

    const request = new Request("http://localhost/api/generate-cv?lang=id")
    const response = await GET(request as any)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toContain("Unauthorized")
  })
})

describe("TC 5.5 — API Route Error Handling", () => {
  beforeEach(() => {
    mockGetCvData.mockReset()
    mockRenderToBuffer.mockReset()
    mockDocument.mockClear()
    mockPage.mockClear()
    mockText.mockClear()
    mockView.mockClear()
    mockStyleSheet.create.mockClear()
  })

  it("should return 500 when PDF rendering fails", async () => {
    const cvData = {
      profile: makeProfile() as any,
      trackRecords: [] as any,
      tracerStudy: null as any,
    }

    mockGetCvData.mockResolvedValue(cvData)
    mockRenderToBuffer.mockRejectedValue(new Error("PDF render error"))

    const { GET } = await import("@/app/api/generate-cv/route")

    const request = new Request("http://localhost/api/generate-cv?lang=id")
    const response = await GET(request as any)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toContain("Gagal membuat PDF")
  })

  it("should sanitize invalid lang param to 'id'", async () => {
    const cvData = {
      profile: makeProfile() as any,
      trackRecords: [] as any,
      tracerStudy: null as any,
    }

    mockGetCvData.mockResolvedValue(cvData)
    mockRenderToBuffer.mockResolvedValue(Buffer.from("fake-pdf-content"))

    const { GET } = await import("@/app/api/generate-cv/route")

    const request = new Request("http://localhost/api/generate-cv?lang=invalid")
    const response = await GET(request as any)

    expect(response.status).toBe(200)
  })
})
