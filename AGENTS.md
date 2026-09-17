# AGENTS.md — Instructions for AI Agents

## First Thing
Read these files in order:
1. `BRAIN.md` — project state, active decisions, patterns
2. `CONTEXT.md` — domain knowledge, business rules, user personas
3. `ARCHITECTURE.md` — tech stack, data flow, route structure

## Mandatory Workflow
1. Read BRAIN.md (sections I–III for context, IV for progress)
2. Make changes
3. Run `npx tsc --noEmit` — ensure zero new errors
4. Update BRAIN.md section IV (Progress Log) with what was done
5. Update BRAIN.md section III (Pattern Reference) if you introduced a new pattern
6. Update BRAIN.md section V (Next Steps) — remove completed, add new if any

## BRAIN.md Update Rules
- Add new item to Progress Log table (section IV)
- File path must be exact and absolute from project root
- Status: ✅ Selesai / 🔄 In Progress / ⏳ Pending
- If you introduced a reusable pattern, add to section III
- If a decision becomes mandatory, add to section II
