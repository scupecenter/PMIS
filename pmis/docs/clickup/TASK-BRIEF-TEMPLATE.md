# قالب موجز المهمة للوكلاء

انسخ الكتلة، واملأ ما بين `< >`، وأرسلها كما هي إلى الوكيل. الموجز يذكر **مسارات وأرقام أسطر وأرقام بنود**، ولا ينسخ نص الملفات.

## القواعد السبع

1. مهمة واحدة محدودة لكل وكيل، لا تتجاوز طلب دمج واحدًا.
2. مسارات لا محتوى. الوكيل يقرأ بنفسه.
3. التقرير 300 كلمة أو أقل، في الملف المحدد، بالأقسام الأربعة.
4. العمل الآلي (نقل جدول بنمط ثابت، مفاتيح i18n، لقطات، مسارات) إلى `hzblj-skills:fast-worker`.
5. لا يكتب الوكيل خارج "Touch only". لا يلمس `pmis/apps/api/**` و`pmis/db/**` و`pmis/contracts/**` إلا بموافقة منفصلة مذكور رقمها (DEC-06 مثلًا).
6. توقف وأبلغ إن احتاجت المهمة تغييرًا في منطق الأعمال أو الصلاحيات أو قاعدة البيانات.
7. التقرير السابق يُمرَّر للوكيل التالي كمسار ملف، لا كنص.

## القالب

```text
TASK <phase>.<n>: <title, 5 words max>
Agent: <agent type>   Branch: task/<phase>.<n>-<slug>  ->  PR into phase-<N>/<slug>
Goal (one sentence): <measurable result>
Spec: pmis/docs/clickup/clone-spec.md §<item> ; pmis/docs/clickup/build-order.md "Phase <N>"
Brief: pmis/docs/clickup/phases/PHASE-<N>.md task <phase>.<n>
Decisions: pmis/docs/clickup/DECISIONS.md <DEC-xx, ...>
Read first (paths only, with line ranges for large files):
  - <path>
  - <path>
Touch only: <globs>
Must not touch: pmis/apps/api/**, pmis/db/**, pmis/contracts/** (unless approval <DEC-xx> is named here)
Reuse: <existing component/hook, e.g. src/components/TableKit.tsx, src/lib/tablePrefs.ts reconcile>
Constraints: clone-spec §0.4 gate rules; logical CSS props (RTL); tokens only, no hex; EN+AR i18n keys;
             no ClickUp code/assets/copy (DEC-11); synthetic data only.
Done when:
  - [ ] <unit test path> passes
  - [ ] <e2e spec path> passes (en-light, en-dark, ar-light, ar-dark where the matrix exists)
  - [ ] cd pmis/apps/web && npm run typecheck && npm run lint && npm test  -> green
  - [ ] visual check against pmis/docs/clickup/frames/<frame>.jpg (sizes +/-2px) noted in the report
  - [ ] CHANGELOG.md entry added (pmis/CHANGELOG.md, top, dated)
Stop and report if: a backend/DB/permission change is needed, or a test outside "Touch only" fails.
Report (<=300 words) to: pmis/docs/clickup/reports/<phase>.<n>.md
  sections: Changed files | Tests (counts) | Not done | Risks
```

## مثال معبّأ

```text
TASK 1.2: Inter font and stack
Agent: frontend-engineer   Branch: task/1.2-fonts -> PR into phase-1/tokens
Goal (one sentence): Latin text renders in self-hosted Inter, Arabic stays Cairo, CLS < 0.02.
Spec: pmis/docs/clickup/clone-spec.md §0.6 ; build-order.md "Phase 1"
Brief: pmis/docs/clickup/phases/PHASE-1.md task 1.2
Decisions: DEC-01
Read first: pmis/apps/web/src/styles/fonts.css ; pmis/apps/web/src/styles/tokens.clone.css lines 14-22
Touch only: pmis/apps/web/src/styles/**, pmis/apps/web/src/assets/fonts/**
...
```
