# المرحلة 4: الوحدات والبيانات

| الحقل | القيمة |
| --- | --- |
| الفرع | `phase-4/modules` ← المهام `task/4.x-<slug>` (جدول واحد لكل طلب عند النقل) |
| الحجم | L (10 إلى 12 يومًا) |
| تعتمد على | بوابة المرحلة 3 |
| القرارات | DEC-04، DEC-05 (`filters._layout`)، DEC-10؛ مفتوح: OPEN-05 (قائمة التحرير المباشر)، OPEN-06 (تجربة dnd-kit) |

## الهدف
منشئ الفلاتر، وكائن العرض الموحّد مع نطاقات الحفظ، ولوحة التخصيص، ونافذة الموقع مع لوحة النشاط، والتحرير المباشر بقائمة سماح، ونقل الجداول الأربعين الباقية، وBoard للقراءة فقط.

## الملفات (تحت `pmis/apps/web/src/`)
| المسار | إنشاء/تعديل |
| --- | --- |
| `components/FilterBuilder.tsx` | إنشاء |
| `lib/viewObject.ts` (+ `viewObject.test.ts`) | إنشاء: كائن العرض الموحّد ↔ صيغة `saved-views` (فلاتر مسطّحة + `filters._layout`) |
| `components/SavedViews.tsx` | تعديل: نطاقات الحفظ، Save/Revert |
| `components/CustomizePanel.tsx` | إنشاء |
| `components/SiteModal.tsx`، `components/ActivityPanel.tsx` | إنشاء (توسّع `DrawerFrame.tsx` و`Comments.tsx`) |
| `lib/inlineEdit.ts` | إنشاء: قائمة السماح (OPEN-05)؛ `gate:true` على كل ColDef لحقل بوابة |
| `components/board/BoardView.tsx` | إنشاء: قراءة فقط، يبني على `Pipeline.tsx` |
| تجربة `@dnd-kit/core` خلف `VITE_BOARD_DND=false` | إنشاء (إن وافق المالك OPEN-06) |
| الجداول الأربعون الباقية | تعديل، كل جدول في طلب مهمة |

## بنود المواصفة
6 (Subtasks، Me، Assignee)، 8 (التحرير المباشر)، 9 (قراءة فقط)، 12، 13، 14، 15. التدفق F05.

## المهام

### 4.1 كائن العرض وتحويله (`feature-dev:code-architect` ثم `frontend-engineer`)
```text
TASK 4.1: Unified view object
Agent: feature-dev:code-architect (design) then frontend-engineer (build)   Branch: task/4.1-view-object -> phase-4/modules
Decision: DEC-05. Flat AND filters stay top-level keys (sv_strip and the region check keep working);
          view type, grouping, board/calendar/gantt settings and card order go into filters._layout; nested And/Or is
          NOT saved in shared views (personal only, or not at all) until a separate backend approval.
Read first: pmis/docs/clickup/IMPLEMENTATION_PLAN.md §7.1 (b) ; pmis/apps/api/src/views/saved-views.service.ts lines 21-44, 104-113 (read only) ;
            pmis/db/sql/064_p10_saved_views.sql lines 42-44, 260-265 (read only) ; pmis/docs/clickup/clickup-config.json "views"
Touch only: src/lib/viewObject.ts, src/lib/viewObject.test.ts, src/components/SavedViews.tsx
Done when: round-trip test (object -> payload -> object) exact; payload passes the API's .strict() schema; savedViews.test.tsx green.
Report to: pmis/docs/clickup/reports/4.1.md
```

### 4.2 منشئ الفلاتر ولوحة التخصيص (`frontend-engineer`)
```text
TASK 4.2: Filter builder and Customize
Agent: frontend-engineer   Branch: task/4.2-filters -> phase-4/modules
Spec: clone-spec.md §13, §14 ; toolbar Subtasks/Me/Assignee from §6
Touch only: src/components/{FilterBuilder,CustomizePanel,Toolbar}.tsx, src/i18n/*.json, tests
Done when: F05 e2e; visual check vs frames/12_list_customize_view_panel.jpg and frames/13_list_me_mode_menu_empty_state.jpg.
Report to: pmis/docs/clickup/reports/4.2.md
```

### 4.3 نافذة الموقع ولوحة النشاط (`frontend-engineer`)
```text
TASK 4.3: Site modal and activity
Agent: frontend-engineer   Branch: task/4.3-site-modal -> phase-4/modules
Spec: clone-spec.md §12 (states: loading, full, locked field, gate panel, dirty, comment loading)
Read first: src/components/{DrawerFrame,Comments,Pipeline,SiteIdentity}.tsx ; src/pages/Site.tsx
Touch only: src/components/{SiteModal,ActivityPanel}.tsx, router (?site=<id>), src/i18n/*.json, tests
Done when: siteIdentity.test.tsx green; visual check vs frames/06_task_detail_modal.jpg (+/-2px).
Report to: pmis/docs/clickup/reports/4.3.md
```

### 4.4 التحرير المباشر بقائمة سماح (`frontend-engineer` + `qa-engineer`)
```text
TASK 4.4: Inline edit allow-list
Agent: frontend-engineer (build) + qa-engineer (gate test)   Branch: task/4.4-inline-edit -> phase-4/modules
Approval needed: OPEN-05 list per register (owner). Never a gate field.
Goal: src/lib/inlineEdit.ts; every save goes through the existing PATCH + reason dialog + StepUp unchanged.
Done when: unit test over every ColDef in every register: no inline editor where gate:true; tables.test.tsx green.
Report to: pmis/docs/clickup/reports/4.4.md
```

### 4.5 Board للقراءة فقط (+ تجربة dnd-kit خلف علم) (`frontend-engineer`)
```text
TASK 4.5: Read-only Board
Agent: frontend-engineer   Branch: task/4.5-board-ro -> phase-4/modules
Spec: clone-spec.md §9 (idle states only, no drag) ; decisions DEC-04
Read first: src/components/Pipeline.tsx ; src/pages/Sites.tsx
Touch only: src/components/board/**, src/i18n/*.json, tests ; @dnd-kit spike only behind VITE_BOARD_DND=false (OPEN-06)
Done when: columns = milestones in order, WIP over limit is a warning only; no write call from the board (network assertion);
           visual check vs frames/01_board_idle_stage_columns.jpg (column 264 wide, card 248, gap 8).
Report to: pmis/docs/clickup/reports/4.5.md
```

### 4.6 نقل الجداول الأربعين (`hzblj-skills:fast-worker`، طلب لكل جدول)
```text
TASK 4.6.<n>: Move <page> onto DataTable
Agent: hzblj-skills:fast-worker   Branch: task/4.6-<page> -> phase-4/modules
Pattern to copy exactly: pmis/docs/clickup/reports/3.2.md and 3.4.md
Touch only: src/pages/<Page>.tsx and its existing test file
Done when: the page's existing tests pass unchanged; typecheck/lint green. Old table code removed only after green.
Report to: pmis/docs/clickup/reports/4.6.<n>.md (<=150 words)
```

## الاعتماديات
لا شيء للإنتاج. `@dnd-kit/core` كتجربة خلف علم فقط (OPEN-06)، ويُحذف إن رُفضت.

## الاختبارات والأوامر
```bash
cd pmis/apps/web && npm run typecheck && npm run lint && npm test && npx playwright test
npm run build && node scripts/bundle-budget.mjs      # +20 KB، الصفحات الثقيلة تُحمَّل كسولًا
git diff main -- pmis/apps/api pmis/db pmis/contracts   # فارغ
```

## معايير القبول
- [ ] فلتر يُحفظ ويُسترجع كما هو ضمن حدود DEC-05؛ Save وRevert دقيقان.
- [ ] لا محرر مباشر على أي حقل `gate:true` (اختبار على كل ColDef في كل سجل).
- [ ] لا يمكن الوصول إلى انتقال محطة إلا من مسار المهمة القائم.
- [ ] الجداول المنقولة تنجح اختباراتها القديمة. F05.
- [ ] **مقارنة بصرية** (±2px): `06_task_detail_modal`، `12_list_customize_view_panel`، `13_list_me_mode_menu_empty_state`، `01_board_idle_stage_columns`.

## المخاطر
| الخطر | التخفيف |
| --- | --- |
| فلتر متداخل في عرض مشترك ينجو من `sv_strip` (أمني) | لا يُحفظ متداخل في عرض مشترك (DEC-05)؛ اختبار في 4.1 |
| التحرير المباشر يتجاوز السبب أو StepUp | يمر عبر `PATCH` والنوافذ القائمة؛ لا حقل دون موافقة |
| انحدار عند نقل الجداول | جدول لكل طلب، والقديم يبقى حتى ينجح الجديد |

## تعريف الإنجاز
قائمة §2.3 في الخطة ناجحة، والتقارير في `reports/`، و`PROGRESS.md` محدّث.

## موافقات المالك المطلوبة
OPEN-05 (قائمة التحرير المباشر لكل سجل)، OPEN-06 (تجربة dnd-kit)، ثم البوابة. أي رغبة في And/Or مشتركة = موافقة خلفية منفصلة.
