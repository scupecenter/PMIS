## Summary / الملخص
<!-- What changed and why, 2-5 lines. ما الذي تغيّر ولماذا. -->

## Phase / المرحلة
<!-- e.g. Phase 3, task 3.2, pmis/docs/clickup/phases/PHASE-3.md -->
- Phase: 
- Task: 
- Decisions applied (pmis/docs/clickup/DECISIONS.md): 
- Separate approval for API/DB/contract/permission changes (number, or "none"): 

## Spec items / بنود المواصفة
<!-- clone-spec.md item numbers (1-20, 17a-d) and flows (F01-F07) -->

## Tests / الاختبارات
- [ ] `cd pmis/apps/web && npm run typecheck && npm run lint && npm test`
- [ ] e2e (projects: en-light, en-dark, ar-light, ar-dark where available)
- [ ] API (if touched): `cd pmis/apps/api && npm run typecheck && npm run lint && npm test`
- [ ] `git diff main -- pmis/apps/api pmis/db pmis/contracts` empty, or covered by the approval above
- [ ] CHANGELOG entry added (`pmis/CHANGELOG.md`)

## Screenshots / لقطات الشاشة
<!-- Before/after; light+dark; AR+EN; and the frame compared from pmis/docs/clickup/frames/ -->

## Risks / المخاطر
<!-- Anything a reviewer must check by hand: permissions, gates, migrations, secrets -->
