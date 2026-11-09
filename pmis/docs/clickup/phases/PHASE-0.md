# المرحلة 0: التمهيد (الاستيراد، CI، الدليل)

| الحقل | القيمة |
| --- | --- |
| الحالة | **قيد التنفيذ** (انظر `../PROGRESS.md`) |
| الفرع | `claude/phase-0-bootstrap` → طلب دمج مسودة نحو `main` |
| الحجم | S |
| تعتمد على | لا شيء |

## الهدف
PMIS يحوي PMIS Workspace كاملًا ومستقلًا، وCI أخضر على PMIS، و`main` محمي، والمواصفات وموجزات المراحل داخل المستودع بحيث تنفّذ أي جلسة جديدة أي مرحلة من المستودع وحده.

## ما أُنجز (commit `0467cf8` وما بعده)
- [x] استيراد `pmis/` و`.claude/` و`.github/` و`.gitignore` و`.mcp.json` كملفات عادية (DEC-13).
- [x] الدليل: `/README.md` و`/START_HERE.md` وتحديث `pmis/CLAUDE.md` و`HANDOVER.md` و`ORCHESTRATION.md`.
- [x] `pmis/docs/clickup/`: الخطة والمواصفة وترتيب البناء والرموز وإعداد ClickUp والدراسة والإطارات وموجزات المراحل 0 إلى 8 و`PROGRESS.md` و`DECISIONS.md` والقالب.
- [x] `.github/pull_request_template.md`.
- [x] `pmis/docs/security/2026-11-09-baseline-scan.md` (لا أسرار حقيقية).
- [x] `pmis/apps/web/.env.development` مستعاد (`VITE_USE_MOCKS=true` فقط، بلا أسرار).
- [x] اختبار `master-import.test.ts` الذي يقرأ `PMIS_Site_Master.xlsx` يُتخطى إن غاب الملف (DEC-14).
- [x] تحقق محلي: الويب (`npm ci`، typecheck، lint، test) والـ API (`npm ci`، typecheck، lint). النتائج في `../PROGRESS.md`.

## الملفات المتبقية
| المسار | الإجراء |
| --- | --- |
| `.github/workflows/ci.yml` | لا تغيير إلا إن فشل CI بسبب النقل. اختياري (مهمة 0.4): `pull_request.branches: [main, 'phase-*']` |
| إعدادات GitHub للمستودع | حماية `main` (المالك) |
| `pmis/docs/clickup/PROGRESS.md`، `pmis/HANDOVER.md` | تحديث الحالة بعد CI |

## بنود المواصفة
لا شيء (تمهيد).

## المهام

### 0.1 CI أخضر على طلب المرحلة 0
- الوكيل: `devops-security` (haiku). يصعّد إلى sonnet إن فشل مرتين.
- الأوامر:
  ```bash
  gh api repos/scupecenter/PMIS/actions/runs?branch=claude/phase-0-bootstrap --jq '.workflow_runs[0] | {status,conclusion,html_url}'
  gh api repos/scupecenter/PMIS/actions/runs/<run_id>/jobs --jq '.jobs[] | {name,conclusion}'
  ```
- الموجز:
  ```text
  TASK 0.1: Make CI green on PMIS
  Agent: devops-security   Branch: claude/phase-0-bootstrap (PR already open, see pmis/docs/clickup/PROGRESS.md)
  Goal: all 4 jobs of .github/workflows/ci.yml (api, web, contract, installer) pass on the Phase 0 PR.
  Read first: .github/workflows/ci.yml ; pmis/HANDOVER.md §3 ; pmis/docs/clickup/DECISIONS.md DEC-13, DEC-14
  Touch only: .github/workflows/ci.yml, and test files only when a failure is caused by the move
              (a path that pointed outside pmis/, or a file that was not imported).
  Must not touch: business logic, permissions, migrations, contracts.
  Done when: every job is green; each fix is one commit "ci: <what> (caused by the move)".
  Stop and report if: a failure also happens on My_Repo main (pre-existing), or needs a code change in apps/api/src.
  Report (<=300 words) to: pmis/docs/clickup/reports/0.1.md  sections: Changed files | Jobs | Not done | Risks
  ```

### 0.2 `.env.development` للويب
- منجز. للتحقق: `cat pmis/apps/web/.env.development` يجب أن يحوي `VITE_USE_MOCKS=true` فقط. أي سطر آخر بقيمة سرية يُحذف فورًا.

### 0.3 حماية الفرع `main` (إجراء المالك)
- الوكيل: لا أحد. المالك بصلاحية مدير المستودع، أو `devops-security` بتفويض صريح.
- خذ أسماء الفحوص من أول تشغيل ناجح (حقل `name` لكل job في `ci.yml`):
  ```bash
  gh api -X PUT repos/scupecenter/PMIS/branches/main/protection \
    -F required_status_checks.strict=true \
    -f 'required_status_checks.contexts[]=API (typecheck, lint, build, tests on PostgreSQL 16)' \
    -f 'required_status_checks.contexts[]=Web (typecheck, lint, unit tests, build, Playwright e2e)' \
    -f 'required_status_checks.contexts[]=OpenAPI contract lint' \
    -f 'required_status_checks.contexts[]=Installer scripts (syntax and shellcheck)' \
    -F enforce_admins=true -F required_pull_request_reviews.required_approving_review_count=1 \
    -F restrictions= -F allow_force_pushes=false -F allow_deletions=false
  ```

### 0.4 (اختياري، أو أول مهمة في المرحلة 1) مشغّلات CI لفروع المراحل
- الوكيل: `devops-security`.
  ```text
  TASK 0.4: CI on phase branches
  Goal: pull requests into phase-* branches run CI.
  Touch only: .github/workflows/ci.yml (the "on:" block only)
  Done when: on.pull_request.branches is [main, 'phase-*'] and a test PR into a phase branch runs all jobs.
  ```

## الاعتماديات
لا شيء.

## الاختبارات والأوامر
```bash
cd pmis/apps/web && npm ci && npm run typecheck && npm run lint && npm test
cd pmis/apps/api && npm ci && npm run typecheck && npm run lint
# اختبارات الـ API تحتاج PostgreSQL 16: bash pmis/tools/dev-setup.sh ثم npm test داخل apps/api
git status --porcelain | grep node_modules   # يجب أن يكون فارغًا
```

## معايير القبول
- [ ] الـ jobs الأربع في CI خضراء على طلب المرحلة 0.
- [ ] الأوامر المحلية أعلاه خضراء (الويب) أو موثّقة بنتيجتها (الـ API بلا قاعدة بيانات).
- [ ] `STUDY.html` يفتح في المتصفح والصور الإحدى عشرة تظهر من `frames/`.
- [ ] لا `node_modules` ولا أسرار في git.
- [ ] مقارنة بصرية: لا تنطبق (لا تغيير في الواجهة).

## المخاطر
| الخطر | التخفيف |
| --- | --- |
| اختبار في CI يعتمد على ملف لم يُستورد | يُتخطى بشرط وجود الملف، مع تعليق يذكر DEC-14 |
| المستودع عام ويحوي لقطات ClickUp | OPEN-07: يقرر المالك قبل البوابة |
| e2e لا يعمل بالعربية والداكن بعد | المصفوفة الرباعية تُضاف في المرحلة 1، ويُسدَّد الدين في المرحلة 8 |

## تعريف الإنجاز
CI أخضر، و`main` محمي، و`PROGRESS.md` و`HANDOVER.md` محدّثان، وطلب الدمج محوَّل من مسودة إلى جاهز، والمالك وافق.

## موافقات المالك المطلوبة
1. حماية `main` (OPEN-01).
2. تجميد `My_Repo` (OPEN-02).
3. خصوصية المستودع أو نقل الإطارات (OPEN-07).
4. دمج طلب المرحلة 0.
