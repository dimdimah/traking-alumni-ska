/**
 * Authentication & Route Protection Tests
 * =========================================
 * TC 1.1: Login form validation (Zod) — reject invalid email/password
 * TC 1.2: Role redirect — alumni → /dashboard, super_user → /admin
 * TC 1.3: Middleware protection — unauthenticated → redirect to /login
 */

import { describe, it, expect } from "@jest/globals"
import { z } from "zod"

// ──────────────────────────────────────────
// 1. Zod schemas (mirroring the auth schemas)
// ──────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .regex(
      /^[a-zA-Z0-9._%+-]+@amikomsolo\.ac\.id$/,
      "Gunakan email institusi @amikomsolo.ac.id",
    ),
  password: z.string().min(1, "Password wajib diisi"),
})

const loginSchemaStrict = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .regex(
      /^[a-zA-Z0-9._%+-]+@amikomsolo\.ac\.id$/,
      "Gunakan email institusi @amikomsolo.ac.id",
    ),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

// ──────────────────────────────────────────
// 2. Role redirect logic (mirroring middleware)
// ──────────────────────────────────────────

function getRedirectPath(role: string | null): string {
  if (!role) return "/login"
  if (role === "super_user") return "/admin"
  return "/dashboard"
}

function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/admin")
}

function middlewareGuard(
  hasSession: boolean,
  pathname: string,
): string | null {
  if (!hasSession && isProtectedRoute(pathname)) {
    return "/login"
  }
  return null // allow
}

// ──────────────────────────────────────────
// Tests
// ──────────────────────────────────────────

describe("TC 1.1 — Login Form Validation (Zod)", () => {
  it("should reject empty email and password", () => {
    const result = loginSchema.safeParse({ email: "", password: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain("Email wajib diisi")
      expect(messages).toContain("Password wajib diisi")
    }
  })

  it("should reject invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "bukan-email",
      password: "123456",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes("email"))).toBe(true)
    }
  })

  it("should reject non-institution email", () => {
    const result = loginSchema.safeParse({
      email: "user@gmail.com",
      password: "123456",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes("institusi"))).toBe(true)
    }
  })

  it("should reject password shorter than 6 characters in strict mode", () => {
    const result = loginSchemaStrict.safeParse({
      email: "nim@amikomsolo.ac.id",
      password: "123",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain("Password minimal 6 karakter")
    }
  })

  it("should accept valid institution email and password", () => {
    const result = loginSchema.safeParse({
      email: "nim@amikomsolo.ac.id",
      password: "123456",
    })
    expect(result.success).toBe(true)
  })
})

describe("TC 1.2 — Role Redirect", () => {
  it("should redirect alumni role to /dashboard", () => {
    expect(getRedirectPath("alumni")).toBe("/dashboard")
  })

  it("should redirect super_user role to /admin", () => {
    expect(getRedirectPath("super_user")).toBe("/admin")
  })

  it("should redirect unauthenticated user to /login", () => {
    expect(getRedirectPath(null)).toBe("/login")
  })

  it("should redirect unknown role to /dashboard (default)", () => {
    expect(getRedirectPath("some_unknown_role")).toBe("/dashboard")
  })
})

describe("TC 1.3 — Middleware Route Protection", () => {
  it("should block /dashboard when not authenticated", () => {
    expect(middlewareGuard(false, "/dashboard")).toBe("/login")
  })

  it("should block /admin when not authenticated", () => {
    expect(middlewareGuard(false, "/admin")).toBe("/login")
  })

  it("should allow /dashboard when authenticated", () => {
    expect(middlewareGuard(true, "/dashboard")).toBeNull()
  })

  it("should allow /admin when authenticated", () => {
    expect(middlewareGuard(true, "/admin")).toBeNull()
  })

  it("should allow public routes like /login when not authenticated", () => {
    expect(middlewareGuard(false, "/login")).toBeNull()
  })

  it("should allow root path when not authenticated", () => {
    expect(middlewareGuard(false, "/")).toBeNull()
  })
})
