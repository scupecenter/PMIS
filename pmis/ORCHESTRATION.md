# Orchestration: 9 agents, 4 phases

| # | Agent | Owns (write access) | Model | Effort |
|---|---|---|---|---|
| 1 | tech-lead (orchestrator) | `docs/adr/`, `contracts/`, root config, phase-branch merges and gate reports | opus | high |
| 2 | domain-analyst | `docs/spec/` | opus during P0, then sonnet | medium |
| 3 | ux-designer | `design/` | sonnet | medium |
| 4 | frontend-engineer | `apps/web/` | sonnet | medium |
| 5 | backend-engineer | `apps/api/src/` (except `prisma/`) | sonnet | high |
| 6 | database-engineer | `apps/api/prisma/`, `db/`, `tools/master-import/` | sonnet | medium |
| 7 | qa-engineer | `tests/`, `docs/test-plans/` | haiku | medium |
| 8 | devops-security | `infra/`, `.github/workflows/`, `Dockerfile*` | haiku | low |
| 9 | people-registry | `docs/spec/staff-registry.md`, `db/seed/staff-registry*.csv`, `tools/staff-registry/`, the prototype hover card | sonnet | medium |

## Token budget rules
- **Opus is reserved for low-volume, high-impact work.** tech-lead plans, reviews, and writes ADRs. domain-analyst extracts business rules in P0, where an error multiplies later. Neither writes bulk code.
- **Sonnet does the bulk of the code.** Backend runs at high effort because of the approval engine and the calculations.
- **Haiku handles repetitive work:** running tests, reporting, CI configuration, Compose files.
- **Escalate only by exception.** If a haiku agent fails the same task twice, tech-lead re-runs that one task on sonnet and records why in the PR. Never escalate a whole agent.
- **Read narrowly.** Agents read the section they need, never the whole blueprint or the Master on every task. domain-analyst produces `docs/spec/` once, and the other agents read the spec, not the raw references.
- **One task per session.** Hand off through files (spec, contract, PR notes), not long chat history.
- To switch a model, edit `model:` in `.claude/agents/<name>.md`.

Minimum viable team is 5 agents: merge 2 into 1, 3 into 4, and 8 into 5. Teams larger than 8 add merge conflicts without adding speed.

## Phases and gates

**P0 · Foundations (agents 1, 2, 3, 6 in parallel)**
- domain-analyst: user stories with acceptance criteria per module, task catalogue (code, stage, SLA, documents, template, master field), and the open-questions list.
- tech-lead: ADRs for stack, auth, approval engine, template versioning, and audit log, plus OpenAPI v0.1.
- database-engineer: ERD and Prisma schema v0.1, plus a mapping from the Master columns to database fields.
- ux-designer: finishes prototype v2 and the design tokens.
- *Gate:* the product owner approves the spec, ERD, and the key prototype screens.

**P1 · Core (agents 4, 5, 6, 7)**
- Sign-in and the 4-digit ID mapping, users and roles, regions and visibility.
- Sites and the task grid, the approval engine (levels, self-skip, one-level-back rejection, notes), the editable Responsibility Matrix, and the Audit Log.
- *Gate:* E2E tests pass for submit → review → approve → next task opens, rejection back one level, and the visibility filter.

**P2 · Data entry and registers**
- Template service: issue, embed ID and version, validate, preview the diff, then batch review and approve. Master import goes through the same service.
- Registers: POWERCO first, then HPC, Procurement, Permits, Issue, Risk, and Change Control. Change Control drives gate shifts.
- System Log and notifications (in-app and M365 email).

**P3 · Dashboards and hardening (agents 4, 5, 7, 8)**
- Dashboard KPIs that match the PMIS Site Delivery Dashboard.
- Performance work, security review, backup and restore, the deployment runbook, and user acceptance testing with real data.

## How to run it with Claude Code
1. PMIS Workspace lives in `pmis/` of the independent repository `scupecenter/PMIS`. Agent definitions are in `.claude/agents/` at the repository root. A new session starts at `../START_HERE.md`.
2. Branches: `main` is protected (PR, green CI, one owner review, no force push). Each phase has one branch `phase-N/<slug>` from `main` and one draft PR into `main`. Each task has a branch `task/N.x-<slug>` and a small PR into the phase branch. A phase PR merges only after the owner approves its gate.
3. The coordinating session acts as tech-lead: it sends each task's brief from `docs/clickup/phases/PHASE-N.md` to the named agent and reads only the reports in `docs/clickup/reports/`. For parallel work each agent uses its own worktree or cloud session.
4. Agents never merge to `main`. The product owner approves at each gate.

## What agents cannot do (needs humans)
- Register the Entra ID app in the company tenant. This needs an M365 admin.
- Provide or approve the production server, domain, and backups.
- Supply the real data and the official document forms.
- Settle the open decisions in `CLAUDE.md`.

## ClickUp-grade UI programme: agent roster (2026-11-09)

Phases 0 to 8 of `docs/clickup/` follow the P0 to P3 rules above. Briefs per phase: `docs/clickup/phases/PHASE-N.md`. Template: `docs/clickup/TASK-BRIEF-TEMPLATE.md`.

| Work | Agent | Source | Model | When |
| --- | --- | --- | --- | --- |
| Phase plan, task split, gate report, approved contract edits | `tech-lead` | `.claude/agents/tech-lead.md` | opus | start and end of each phase |
| Architecture of a shared component (navigation, DataTable, view object, Board drag) | `feature-dev:code-architect` | plugin | - | phases 2, 3, 4, 7, once per component |
| Questions about the code (where, who calls, what shape) | `Explore` | built-in | - | on demand, one question, answer with file:line |
| Screens and components | `frontend-engineer` | `.claude/agents/frontend-engineer.md` | sonnet | every phase |
| Tokens, contrast, visual checks against `frames/`, RTL and motion audit | `ux-designer` | `.claude/agents/ux-designer.md` | sonnet | phases 1, 2, 7, 8 and each gate |
| Mechanical work (table moves by a fixed pattern, i18n keys, screenshots, paths) | `hzblj-skills:fast-worker` | plugin | fast | phases 3, 4, 8 |
| Test plans, Playwright, axe, definition-of-done evidence | `qa-engineer` | `.claude/agents/qa-engineer.md` | haiku | every phase |
| CI, branch protection, secret scan, security review | `devops-security` | `.claude/agents/devops-security.md` | haiku | phase 0, any `.github/` change, phase 6 review |
| Diff review before a gate | `pr-review-toolkit:code-reviewer` | plugin | - | end of each phase, large task PRs |
| Backend or DB work, **only with a separate approval** (DEC-06 register sort is approved) | `backend-engineer`, `database-engineer` | `.claude/agents/` | sonnet | task 3.0; others only after approval |
| Unknown business rules | `domain-analyst` | `.claude/agents/domain-analyst.md` | sonnet | writes `docs/spec/open-questions.md`, never invents |

**Phase gate workflow:**
1. Before start: the owner approves the phase's pre-start decisions (`DECISIONS.md`, "OPEN-xx") in a comment on the phase PR.
2. During: task PRs into the phase branch, each with tests, a CHANGELOG entry and a report in `docs/clickup/reports/`.
3. At the end: `qa-engineer` fills the 9-item definition of done (`docs/clickup/IMPLEMENTATION_PLAN.md` §2.3) in the phase PR; `pr-review-toolkit:code-reviewer` reviews the full diff; `tech-lead` posts one gate report (checklist, before/after screenshots in AR/EN and light/dark, frame comparisons, deferred items).
4. The owner answers "approved" (merge, next phase starts), "approved with conditions" (fix in the same branch) or "rejected" (branch stays open).
5. Only phases 5 and 6 may run at the same time.
