# PMIS: PMIS Workspace

**العربية:** PMIS هو نظام معلومات إدارة المشروع لمشروع PMIS (تسليم مواقع الاتصالات في 7 مناطق محلية). يحل محل ملف Excel "Site Master" كمصدر رسمي للبيانات، مع مسار اعتماد بمستويين على كل مهمة (L1 إدخال، L2 مراجعة واعتماد). يجري الآن برنامج لإعادة بناء الواجهة بمستوى تجربة ClickUp دون تغيير منطق الأعمال.

**English:** PMIS is the project management information system for the PMIS site-delivery project (telecom sites across 7 Local regions). It replaces the Excel Site Master as the system of record, with a two-level approval workflow on every task. A UI programme is rebuilding the web app to ClickUp-grade UX without changing business logic.

PMIS (`scupecenter/PMIS`) is an **independent** repository. It was bootstrapped from the PMIS Workspace source; nothing here depends on the old repository.

> **New session? Start with [START_HERE.md](START_HERE.md).** / **جلسة جديدة؟ ابدأ من [START_HERE.md](START_HERE.md).**

## Repo map / خريطة المستودع

| Path | What |
| --- | --- |
| `START_HERE.md` | Entry point for any new session: read order, status, next task |
| `pmis/CLAUDE.md` | Binding project rules and owner decisions |
| `pmis/HANDOVER.md`, `pmis/ORCHESTRATION.md` | Handover state; agents, branches, phase gates |
| `pmis/CHANGELOG.md` | Dated change log (newest first) |
| `pmis/apps/web` | React 18 + TypeScript + Vite + Tailwind web app (MSW mocks in dev) |
| `pmis/apps/api` | NestJS + Prisma API on PostgreSQL 16 |
| `pmis/contracts/openapi.yaml` | API contract (contract first) |
| `pmis/db/` | SQL mirrors, RLS, seeds, ERD |
| `pmis/docs/clickup/` | ClickUp-grade UI programme: plan, spec, tokens, study, frames, phase briefs, progress, decisions |
| `pmis/docs/` (other) | ADRs, spec, plans, references, test plans, security scans |
| `pmis/design/`, `pmis/tools/`, `pmis/infra/`, `pmis/tests/` | Prototype and forms; installers and tools; deployment; DB security tests |
| `.claude/agents/` | Repo agent definitions |
| `.github/` | CI workflow and PR template |

## Quick start / البدء السريع

Requires Node 22 and npm 10. The API tests also need PostgreSQL 16.

```bash
# Web (runs on mocks: pmis/apps/web/.env.development sets VITE_USE_MOCKS=true)
cd pmis/apps/web
npm ci
npm run dev          # http://localhost:5173
npm run typecheck && npm run lint && npm test
npm run e2e          # Playwright

# API
cd pmis/apps/api
npm ci
npm run typecheck && npm run lint
npm test             # needs PostgreSQL 16: run `bash pmis/tools/dev-setup.sh` once from the repo root

# One-command developer setup (PostgreSQL + npm ci for api and web + scan tools)
bash pmis/tools/dev-setup.sh
```

## Links / روابط
- [START_HERE.md](START_HERE.md)
- [pmis/docs/clickup/PROGRESS.md](pmis/docs/clickup/PROGRESS.md): phase tracker
- [pmis/docs/clickup/DECISIONS.md](pmis/docs/clickup/DECISIONS.md): decision log
- [pmis/docs/clickup/IMPLEMENTATION_PLAN.md](pmis/docs/clickup/IMPLEMENTATION_PLAN.md): full plan (Arabic)
- [pmis/README_AR.md](pmis/README_AR.md)
