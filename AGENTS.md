# AGENTS.md — Instructions for AI Agents

## First Thing
Read these files in order:
1. `BRAIN.md` — project state, active decisions, patterns
2. `CONTEXT.md` — domain knowledge, business rules, user personas
3. `ARCHITECTURE.md` — tech stack, data flow, route structure

## Mandatory Workflow (Must Execute on Every Task)
1. Read `BRAIN.md` (sections I–III for context, IV for progress)
2. Make changes
3. **Run Pre-Deployment & Netlify Build Verification**:
   - `npx tsc --noEmit` — pastikan 0 error TypeScript
   - `npx next lint` — pastikan 0 warning dan 0 error ESLint
   - `npm run build` — pastikan seluruh static (○) dan dynamic (ƒ) routes (39/39) lolos kompilasi tanpa error
4. **Netlify & Security Safety Rules**:
   - JANGAN PERNAH menyimpan secret/token/service_role_key atau file `.env` di Git
   - Jangan tinggalkan skrip scratch/temporary (mis. `.mjs`, `.cmd`, `.csv` dummy) di root project
   - Jangan definisikan fungsi sinkron yang di-export di file berlabel `'use server'` (Next.js server actions harus `async`)
   - Pastikan domain gambar eksternal didaftarkan di `next.config.mjs` (remotePatterns & CSP)
5. Update `BRAIN.md` section IV (Progress Log) with what was done
6. Update `BRAIN.md` section III (Pattern Reference) if you introduced a new pattern
7. Update `BRAIN.md` section V (Next Steps) — remove completed, add new if any

## BRAIN.md Update Rules
- Add new item to Progress Log table (section IV)
- File path must be exact and relative to project root
- Status: ✅ Selesai / 🔄 In Progress / ⏳ Pending
- If you introduced a reusable pattern, add to section III
- If a decision becomes mandatory, add to section II

