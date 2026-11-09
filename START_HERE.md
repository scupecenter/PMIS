# ابدأ من هنا (START HERE)

هذا الملف هو نقطة الدخول الوحيدة لأي جلسة جديدة، بشرية أو Claude. كل ما تحتاجه لتنفيذ أي مرحلة موجود في المستودع، ولا تحتاج إلى أي محادثة سابقة.

PMIS مستودع **مستقل** (`scupecenter/PMIS`). لا تكتب في أي مستودع آخر.

## 1. اقرأ هذه الملفات الخمسة بالترتيب

| # | الملف | لماذا | الحجم |
| --- | --- | --- | --- |
| 1 | `START_HERE.md` (هذا) | الحالة والمهمة التالية وطريقة العمل | قصير |
| 2 | `pmis/docs/clickup/PROGRESS.md` | أين وصلنا، وروابط كل شيء | قصير |
| 3 | `pmis/docs/clickup/DECISIONS.md` | القرارات الملزمة والمفتوحة | قصير |
| 4 | `pmis/docs/clickup/phases/PHASE-<N>.md` للمرحلة الحالية | الموجز الجاهز للتنفيذ مع موجزات الوكلاء | متوسط |
| 5 | `pmis/CLAUDE.md`، القسم "ClickUp-grade UI programme" فقط | القواعد الملزمة وقواعد الاقتصاد في الرموز | اقرأ القسم وحده |

لا تقرأ `IMPLEMENTATION_PLAN.md` ولا `clone-spec.md` ولا `STUDY.html` ولا `openapi.yaml` كاملة في الجلسة الرئيسية. الموجزات تشير إلى الأقسام المطلوبة، والوكيل يقرؤها بنفسه.

## 2. الحالة الحالية (2026-11-09)

- **المرحلة 0 قيد التنفيذ** على الفرع `claude/phase-0-bootstrap`، وطلب دمج مسودة نحو `main` (الرابط في `PROGRESS.md`).
- منجز: الاستيراد، والدليل، والمراجع، وموجزات المراحل 0 إلى 8، و`.env.development`، والتحقق المحلي (الويب: typecheck وlint و677 اختبارًا ناجحة؛ الـ API: typecheck وlint ناجحان، واختباراته تحتاج PostgreSQL).
- متبقٍ للمرحلة 0: CI أخضر على الطلب، وحماية `main` (المالك)، وقرار خصوصية المستودع (OPEN-07)، ثم موافقة البوابة.

## 3. المهمة التالية بالضبط

1. افتح `pmis/docs/clickup/PROGRESS.md` وخذ رابط طلب المرحلة 0.
2. افحص CI:
   ```bash
   gh api "repos/scupecenter/PMIS/actions/runs?branch=claude/phase-0-bootstrap" --jq '.workflow_runs[0] | {status,conclusion,html_url}'
   ```
3. إن فشل أي job: أرسل موجز **المهمة 0.1** من `pmis/docs/clickup/phases/PHASE-0.md` إلى وكيل `devops-security`.
4. حين يخضر CI: حدّث `PROGRESS.md` و`pmis/HANDOVER.md`، واطلب من المالك OPEN-01 وOPEN-02 وOPEN-07 وموافقة البوابة.
5. بعد الدمج: أنشئ `phase-1/tokens` من `main` وابدأ `phases/PHASE-1.md`.

## 4. طريقة التشغيل

```bash
cd pmis/apps/web && npm ci && npm run dev                 # الويب على بيانات MSW الاصطناعية
cd pmis/apps/web && npm run typecheck && npm run lint && npm test && npm run e2e
cd pmis/apps/api && npm ci && npm run typecheck && npm run lint
bash pmis/tools/dev-setup.sh && (cd pmis/apps/api && npm test)   # اختبارات الـ API مع PostgreSQL 16
```

الفروع: `main` محمي. لكل مرحلة فرع `phase-N/<slug>` وطلب مسودة واحد نحو `main`. لكل مهمة فرع `task/N.x-<slug>` وطلب نحو فرع المرحلة. القالب `.github/pull_request_template.md`. التفصيل في `pmis/ORCHESTRATION.md`.

## 5. العمل مع الوكلاء بأقل كلفة

| القاعدة | التطبيق |
| --- | --- |
| الوكيل يأخذ **مسارات لا محتوى** | الموجز يذكر الملف والأسطر ورقم البند، ولا يلصق نصًا |
| التقرير **300 كلمة أو أقل** | في `pmis/docs/clickup/reports/<phase>.<n>.md`، بالأقسام: Changed files / Tests / Not done / Risks |
| الجلسة الرئيسية **تنسّق فقط** | لا تقرأ ملفًا فوق 200 سطر؛ تسأل `Explore` سؤالًا واحدًا وتطلب file:line |
| العمل الآلي للوكيل السريع | نقل جدول بنمط ثابت، مفاتيح i18n، لقطات، مسارات: `hzblj-skills:fast-worker` |
| مهمة واحدة لكل وكيل | لا تتجاوز طلب دمج واحدًا؛ التوازي فقط لمهام لا تشترك في ملف |
| التقرير السابق يُمرَّر كمسار | لا يُنسخ نصه في الموجز التالي |
| توقف مبكر | أي حاجة لتغيير الـ API أو قاعدة البيانات أو الصلاحيات: يتوقف الوكيل ويبلغ (DEC-10) |

القالب: `pmis/docs/clickup/TASK-BRIEF-TEMPLATE.md`. خريطة الوكلاء: `pmis/ORCHESTRATION.md`.

## 6. أول رسالة تلصقها في جلسة Claude Code جديدة

```text
You are the coordinator for scupecenter/PMIS (independent repo; never write anywhere else).
Read only, in order: START_HERE.md, pmis/docs/clickup/PROGRESS.md, pmis/docs/clickup/DECISIONS.md,
the PHASE-<N>.md of the current phase in pmis/docs/clickup/phases/, and the section
"ClickUp-grade UI programme" of pmis/CLAUDE.md. Do not read large files yourself.
Then: state the current phase and the next task in 3 lines, and execute it by sending the
task's brief from PHASE-<N>.md to the named agent type (paths, not content; report <=300 words to
pmis/docs/clickup/reports/). Mechanical work goes to hzblj-skills:fast-worker. Stop and ask me before any
change to pmis/apps/api, pmis/db, pmis/contracts or permissions unless DECISIONS.md approves it.
After each task: update PROGRESS.md (and HANDOVER.md at a gate), commit with the attribution lines,
push, and keep the phase PR description current.
```
