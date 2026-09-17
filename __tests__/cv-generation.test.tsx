/**
 * CV Generation Feature Tests
 * ============================
 * TC 5.1: getCvData server action — returns profile, track records, tracer study
 * TC 5.2: CvTemplate component — renders all sections correctly (ID & EN)
 * TC 5.3: CvTemplate — handles missing optional fields gracefully
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

jest.mock("@react-pdf/renderer", () => ({
  Document: mockDocument,
  Page: mockPage,
  Text: mockText,
  View: mockView,
  StyleSheet: mockStyleSheet,
  Font: {},
}))

jest.mock("next/server", () => ({
  NextRequest: class extends (globalThis.Request || function() {}) {},
  NextResponse: {
    json: (body: any, init?: any) => {
      const ResponseCtor = globalThis.Response || function() {}
      return new ResponseCtor(JSON.stringify(body), {
        status: init?.status || 200,
        headers: { "Content-Type": "application/json" },
      })
    },
  },
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

// ── Helper: build mock profile ────────────────────────────────────────────────

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

// ── Mock factory for table queries ────────────────────────────────────────────

function mockTable(table: string, data: any, needsOrder = false) {
  if (table === "profiles") {
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data, error: null }),
        }),
      }),
    }
  }
  if (table === "track_records") {
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data, error: null }),
        }),
      }),
    }
  }
  if (table === "tracer_study_responses") {
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
        }),
      }),
    }
  }
  return {} as any
}

// ── Import after mocks ────────────────────────────────────────────────────────

import { getCvData } from "@/lib/actions/cv"
import { CvTemplate } from "@/components/cv/cv-template"
import type { CvData } from "@/lib/actions/cv"

// ═══════════════════════════════════════════════════════════════════════════════
// TC 5.1 — getCvData Server Action
// ═══════════════════════════════════════════════════════════════════════════════

describe("TC 5.1 — getCvData Server Action", () => {
  beforeEach(() => {
    mockAuthGetUser.mockReset()
    mockFrom.mockReset()
  })

  it("should return CvData when user is authenticated and profile exists", async () => {
    const profile = makeProfile()
    const trackRecords = [makeTrackRecord()]
    const tracerStudy = makeTracerStudy()

    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    })

    mockFrom.mockImplementation((table: string) => mockTable(table, {
      profiles: profile,
      track_records: trackRecords,
      tracer_study_responses: tracerStudy,
    }[table]))

    const result = await getCvData()

    expect(result).not.toBeNull()
    expect(result?.profile).toEqual(profile)
    expect(result?.trackRecords).toEqual(trackRecords)
    expect(result?.tracerStudy).toEqual(tracerStudy)
  })

  it("should return null when user is not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const result = await getCvData()

    expect(result).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it("should return null when profile does not exist", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-999" } },
      error: null,
    })

    mockFrom.mockImplementation((table: string) => mockTable(table, {
      profiles: null,
      track_records: [],
      tracer_study_responses: null,
    }[table]))

    const result = await getCvData()

    expect(result).toBeNull()
  })

  it("should return empty track records when user has none", async () => {
    const profile = makeProfile()

    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    })

    mockFrom.mockImplementation((table: string) => mockTable(table, {
      profiles: profile,
      track_records: [],
      tracer_study_responses: null,
    }[table]))

    const result = await getCvData()

    expect(result).not.toBeNull()
    expect(result?.trackRecords).toEqual([])
    expect(result?.tracerStudy).toBeNull()
  })

  it("should return null when tracer study does not exist", async () => {
    const profile = makeProfile()

    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    })

    mockFrom.mockImplementation((table: string) => mockTable(table, {
      profiles: profile,
      track_records: [],
      tracer_study_responses: null,
    }[table]))

    const result = await getCvData()

    expect(result).not.toBeNull()
    expect(result?.tracerStudy).toBeNull()
  })

  it("should fetch track records ordered by start_date descending", async () => {
    const profile = makeProfile()
    const trackRecords = [
      makeTrackRecord({ id: "tr-2", start_date: "2023-06-01" }),
      makeTrackRecord({ id: "tr-1", start_date: "2022-01-01" }),
    ]

    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    })

    let capturedOrderArgs: string | undefined

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: profile, error: null }),
            }),
          }),
        }
      }
      if (table === "track_records") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockImplementation((column: string) => {
                capturedOrderArgs = column
                return Promise.resolve({ data: trackRecords, error: null })
              }),
            }),
          }),
        }
      }
      if (table === "tracer_study_responses") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }
      return {} as any
    })

    const result = await getCvData()

    expect(result).not.toBeNull()
    expect(result?.trackRecords).toHaveLength(2)
    expect(capturedOrderArgs).toBe("start_date")
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC 5.2 — CvTemplate Component Rendering (Indonesian)
// ═══════════════════════════════════════════════════════════════════════════════

describe("TC 5.2 — CvTemplate Component Rendering (ID)", () => {
  const mockData: CvData = {
    profile: makeProfile() as any,
    trackRecords: [makeTrackRecord() as any],
    tracerStudy: makeTracerStudy() as any,
  }

  beforeEach(() => {
    mockDocument.mockClear()
    mockPage.mockClear()
    mockText.mockClear()
    mockView.mockClear()
    mockStyleSheet.create.mockClear()
  })

  it("should render document with profile name as title", () => {
    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)
    expect(mockDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "CV — Budi Santoso",
        author: "Budi Santoso",
        subject: "Curriculum Vitae",
        creator: "SITRACK — Universitas Amikom Surakarta",
        producer: "SITRACK",
      }),
      expect.anything()
    )
  })

  it("should render A4 page with correct styles", () => {
    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)
    expect(mockPage).toHaveBeenCalledWith(
      expect.objectContaining({
        size: "A4",
        style: expect.objectContaining({
          fontFamily: "Helvetica",
          fontSize: 10,
          paddingTop: 40,
          paddingBottom: 48,
          paddingHorizontal: 48,
        }),
      }),
      expect.anything()
    )
  })

  it("should render header section with name", () => {
    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)
    expect(mockView).toHaveBeenCalledWith(
      expect.objectContaining({ style: expect.objectContaining({ borderBottomWidth: 2, borderBottomColor: "#700070" }) }),
      expect.anything()
    )
    const nameCalls = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "Budi Santoso"
    )
    expect(nameCalls.length).toBeGreaterThanOrEqual(1)
  })

  it("should render contact info (email, phone, location)", () => {
    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)
    const contactTexts = mockText.mock.calls
      .filter((args: any[]) => typeof args[0]?.children === "string")
      .map((args: any) => args[0].children)

    expect(contactTexts).toContain("alumni@amikomsolo.ac.id")
    expect(contactTexts).toContain("+6281234567890")
    expect(contactTexts).toContain("Solo Raya")
  })

  it("should render professional summary section when bio exists", () => {
    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)
    const summaryTitleCalls = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "Ringkasan Profesional"
    )
    expect(summaryTitleCalls.length).toBeGreaterThanOrEqual(1)
  })

  it("should render skills section with skill badges", () => {
    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)
    const skillsTitleCalls = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "Kemampuan"
    )
    expect(skillsTitleCalls.length).toBeGreaterThanOrEqual(1)

    const skillTexts = mockText.mock.calls.filter(
      (args: any[]) => ["React", "TypeScript", "Node.js", "Supabase"].includes(args[0]?.children)
    )
    expect(skillTexts.length).toBe(4)
  })

  it("should render work experience section with track records", () => {
    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)
    const expTitleCalls = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "Pengalaman Kerja"
    )
    expect(expTitleCalls.length).toBeGreaterThanOrEqual(1)

    const positionCalls = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "Software Engineer"
    )
    expect(positionCalls.length).toBeGreaterThanOrEqual(1)

    const companyCalls = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "PT Teknologi Indonesia"
    )
    expect(companyCalls.length).toBeGreaterThanOrEqual(1)
  })

  it("should render education section with university and graduation year", () => {
    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)
    const eduTitleCalls = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "Pendidikan"
    )
    expect(eduTitleCalls.length).toBeGreaterThanOrEqual(1)

    const uniTexts = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "Universitas Amikom Surakarta"
    )
    expect(uniTexts.length).toBeGreaterThanOrEqual(1)

    const gradTexts = mockText.mock.calls.filter(
      (args: any[]) => {
        const children = args[0]?.children
        const text = typeof children === "string" ? children : Array.isArray(children) ? children.filter((c: any) => typeof c === "string" || typeof c === "number").join("") : ""
        return text.includes("2024")
      }
    )
    expect(gradTexts.length).toBeGreaterThanOrEqual(1)
  })

  it("should render formatted period for current job (no end date)", () => {
    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)
    const periodTexts = mockText.mock.calls.filter(
      (args: any[]) => typeof args[0]?.children === "string" && args[0]?.children?.includes("Sekarang")
    )
    expect(periodTexts.length).toBeGreaterThanOrEqual(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC 5.2b — CvTemplate Component Rendering (English)
// ═══════════════════════════════════════════════════════════════════════════════

describe("TC 5.2b — CvTemplate Component Rendering (EN)", () => {
  const mockData: CvData = {
    profile: makeProfile() as any,
    trackRecords: [makeTrackRecord() as any],
    tracerStudy: makeTracerStudy() as any,
  }

  beforeEach(() => {
    mockDocument.mockClear()
    mockPage.mockClear()
    mockText.mockClear()
    mockView.mockClear()
    mockStyleSheet.create.mockClear()
  })

  it("should render English labels when lang='en'", () => {
    renderWithWrapper(<CvTemplate data={mockData} lang="en" />)

    const enLabels = [
      "Professional Summary",
      "Skills",
      "Work Experience",
      "Education",
      "Present",
      "Amikom Surakarta University",
      "Graduation Year",
      "Student ID",
      "Phone",
      "Email",
      "Location",
    ]

    const allTexts: string[] = []
    for (const call of mockText.mock.calls) {
      const children = call[0]?.children
      if (typeof children === "string") {
        allTexts.push(children)
      } else if (Array.isArray(children)) {
        for (const c of children) {
          if (typeof c === "string") allTexts.push(c)
        }
      }
    }

    for (const label of enLabels) {
      expect(allTexts.some((t: string) => t.includes(label))).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC 5.3 — CvTemplate Handles Missing Optional Fields
// ═══════════════════════════════════════════════════════════════════════════════

describe("TC 5.3 — CvTemplate Missing Optional Fields", () => {
  beforeEach(() => {
    mockDocument.mockClear()
    mockPage.mockClear()
    mockText.mockClear()
    mockView.mockClear()
    mockStyleSheet.create.mockClear()
  })

  it("should not render contact row when all contacts are empty", () => {
    const mockData: CvData = {
      profile: makeProfile({ email: null, phone: null, location: null }) as any,
      trackRecords: [],
      tracerStudy: null,
    }

    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)

    const contactTexts = mockText.mock.calls.filter(
      (args: any[]) => typeof args[0]?.children === "string" && args[0]?.children?.includes("@")
    )
    expect(contactTexts).toHaveLength(0)
  })

  it("should not render bio section when bio is empty", () => {
    const mockData: CvData = {
      profile: makeProfile({ bio: null }) as any,
      trackRecords: [],
      tracerStudy: null,
    }

    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)

    const bioCalls = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "Ringkasan Profesional"
    )
    expect(bioCalls).toHaveLength(0)
  })

  it("should not render skills section when skills array is empty", () => {
    const mockData: CvData = {
      profile: makeProfile({ skills: [] }) as any,
      trackRecords: [],
      tracerStudy: null,
    }

    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)

    const skillsCalls = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "Kemampuan"
    )
    expect(skillsCalls).toHaveLength(0)
  })

  it("should not render experience section when track records is empty", () => {
    const mockData: CvData = {
      profile: makeProfile() as any,
      trackRecords: [],
      tracerStudy: null,
    }

    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)

    const expCalls = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "Pengalaman Kerja"
    )
    expect(expCalls).toHaveLength(0)
  })

  it("should not render graduation year when tracer study is null", () => {
    const mockData: CvData = {
      profile: makeProfile() as any,
      trackRecords: [],
      tracerStudy: null,
    }

    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)

    const gradCalls = mockText.mock.calls.filter(
      (args: any[]) => typeof args[0]?.children === "string" && args[0]?.children?.includes("2024")
    )
    expect(gradCalls).toHaveLength(0)
  })

  it("should not render NIM when profile.nim is null", () => {
    const mockData: CvData = {
      profile: makeProfile({ nim: null }) as any,
      trackRecords: [],
      tracerStudy: null,
    }

    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)

    const nimCalls = mockText.mock.calls.filter(
      (args: any[]) => {
        const children = args[0]?.children
        const text = typeof children === "string" ? children : Array.isArray(children) ? children.filter((c: any) => typeof c === "string").join("") : ""
        return text.includes("NIM") && text.includes("12345")
      }
    )
    expect(nimCalls).toHaveLength(0)
  })

  it("should always render education section even with minimal data", () => {
    const mockData: CvData = {
      profile: makeProfile({ full_name: "Anonim", education_level: null, nim: null }) as any,
      trackRecords: [],
      tracerStudy: null,
    }

    renderWithWrapper(<CvTemplate data={mockData} lang="id" />)

    const eduCalls = mockText.mock.calls.filter(
      (args: any[]) => args[0]?.children === "Pendidikan"
    )
    expect(eduCalls.length).toBeGreaterThanOrEqual(1)
  })
})

// ── Helper — render with mocked react-pdf wrapper ─────────────────────────────

import { render } from "@testing-library/react"

function renderWithWrapper(ui: React.ReactElement) {
  return render(ui)
}
    const cvData: CvData = {
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
    const cvData: CvData = {
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

// ═══════════════════════════════════════════════════════════════════════════════
// TC 5.5 — API Route Error Handling
// ═══════════════════════════════════════════════════════════════════════════════

describe("TC 5.5 — API Route Error Handling", () => {
  let mockGetCvData: jest.Mock
  let mockRenderToBuffer: jest.Mock

  beforeEach(() => {
    jest.resetModules()

    mockGetCvData = jest.fn()
    mockRenderToBuffer = jest.fn()

    jest.mock("@/lib/actions/cv", () => ({
      getCvData: mockGetCvData,
    }))

    jest.mock("@react-pdf/renderer", () => ({
      Document: mockDocument,
      Page: mockPage,
      Text: mockText,
      View: mockView,
      StyleSheet: mockStyleSheet,
      Font: {},
      renderToBuffer: mockRenderToBuffer,
    }))
  })

  it("should return 500 when PDF rendering fails", async () => {
    const cvData: CvData = {
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
    const cvData: CvData = {
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

// ═══════════════════════════════════════════════════════════════════════════════
// Helper — render with mocked react-pdf wrapper
// ═══════════════════════════════════════════════════════════════════════════════

import { render } from "@testing-library/react"

function renderWithWrapper(ui: React.ReactElement) {
  return render(ui)
}
