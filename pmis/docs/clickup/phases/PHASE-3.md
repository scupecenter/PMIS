# المرحلة 3: المكونات الأساسية

| الحقل | القيمة |
| --- | --- |
| الفرع | `phase-3/datatable` ← المهام `task/3.x-<slug>`؛ مهمة الواجهة الخلفية 3.0 في `task/3.0-register-sort` |
| الحجم | L (8 إلى 10 أيام) |
| تعتمد على | بوابة المرحلة 2؛ **المهمة 3.0 (فرز السجلات على الخادم، DEC-06)** قبل قبول المرحلة |
| القرارات | DEC-06 (الفرز موافَق عليه)، DEC-07 (لا نقر أيمن)، DEC-10، DEC-11 |

## الهدف
جدول موحّد `DataTable` لعرضَي القائمة والجدول، وشريط أدوات، وشريط إجراءات جماعية، وإشعارات مع تراجع، وقوائم الرأس والصف "…". نقل `/sites` وسجل المشتريات إليه.

## الملفات
| المسار | إنشاء/تعديل |
| --- | --- |
| `pmis/apps/web/src/components/data-table/{DataTable.tsx,columns.ts,useDataTableState.ts,HeaderMenu.tsx,RowMenu.tsx,GroupRow.tsx}` | إنشاء، فوق `TableKit.tsx` وملتزم بـ `reconcile` في `lib/tablePrefs.ts` |
| `pmis/apps/web/src/components/Toolbar.tsx` | إنشاء: Group، Columns، شريحة الفلتر، Closed، Search، مفتاح Customize |
| `pmis/apps/web/src/components/BulkBar.tsx` | إنشاء |
| `pmis/apps/web/src/components/Toast.tsx` | تعديل: زر تراجع |
| `pmis/apps/web/src/pages/Sites.tsx`، `pages/Register.tsx` (المشتريات) | تعديل: النقل إلى `DataTable` |
| **3.0 فقط:** `pmis/apps/api/src/registers/registers.service.ts`، `registers.controller.ts`، `pmis/apps/api/src/common/cursor.ts`، `pmis/contracts/openapi.yaml`، `pmis/apps/api/test/registers-sort.test.ts`، `pmis/apps/web/src/api/schema.d.ts` (توليد)، `pmis/CHANGELOG.md` | تعديل/إنشاء (موافقة DEC-06) |

## بنود المواصفة
6 (جزئيًا)، 7، 8 (دون تحرير مباشر)، 16، 18؛ قوائم الرأس والصف. التدفقان F04 وF06. قواعد البوابات §0.4.

## المهام

### 3.0 فرز السجلات على الخادم (`backend-engineer`، بموافقة DEC-06)
```text
TASK 3.0: Server-side register sort
Agent: backend-engineer (database-engineer only if an index or migration is needed)   Branch: task/3.0-register-sort -> phase-3/datatable
Approval: DEC-06 (pmis/docs/clickup/DECISIONS.md). Contract first.
Goal: GET /registers/{key}/records accepts sort=<field>:<asc|desc> from a per-register allow-list, with a keyset cursor per sort;
      default order stays created_at DESC; unknown field -> 400; permission/RLS unchanged.
Read first: pmis/apps/api/src/registers/registers.service.ts lines 380-420 ; pmis/apps/api/src/common/cursor.ts ;
            pmis/apps/api/src/sites/sites.service.ts line 22 (existing sort pattern) ; contracts/openapi.yaml path /sites (sort param)
Touch only: pmis/contracts/openapi.yaml (bump minor version), pmis/apps/api/src/registers/**, pmis/apps/api/src/common/cursor.ts,
            pmis/apps/api/test/registers-sort.test.ts, pmis/apps/web/src/api/schema.d.ts (npm run gen:api), pmis/CHANGELOG.md.
            If a migration is needed: pmis/apps/api/prisma/migrations/0079_*/migration.sql AND its identical mirror in pmis/db/sql/.
Done when: new tests pass (asc, desc, ties, cursor across pages, forbidden column not sortable); full API suite green in CI.
Stop and report if: sorting needs a change to business rules or RLS.
Report to: pmis/docs/clickup/reports/3.0.md
```

### 3.1 تصميم DataTable (`feature-dev:code-architect`)
```text
TASK 3.1: DataTable architecture
Agent: feature-dev:code-architect
Goal: design note for DataTable: state (sorting, grouping, column order/visibility/size, selection), virtualization (group rows 40 + rows 36),
      permission passthrough (reconcile), server vs client sort (sites + registers after 3.0), menu model (Radix dropdown, no context menu).
Spec: pmis/docs/clickup/clone-spec.md §6, §7, §8, §16, §18
Read first: src/components/TableKit.tsx ; src/lib/tablePrefs.ts ; src/components/useVirtual.ts ; src/pages/Sites.tsx
Report to: pmis/docs/clickup/reports/3.1.md
```

### 3.2 DataTable وشريط الأدوات ونقل `/sites` (`frontend-engineer`)
```text
TASK 3.2: DataTable, Toolbar, Sites
Agent: frontend-engineer   Branch: task/3.2-datatable -> phase-3/datatable
Design: pmis/docs/clickup/reports/3.1.md
Goal: data-table/* + Toolbar.tsx; /sites runs on DataTable with no lost behaviour (old tests unchanged and green).
Touch only: src/components/data-table/**, src/components/Toolbar.tsx, src/pages/Sites.tsx, src/i18n/*.json, tests
Constraints: gate fields read-only with Lock icon (§0.4.1); hidden/forbidden columns via reconcile.
Done when: tables.test.tsx and siteRegister.test.tsx green; 10k rows without a long task.
Report to: pmis/docs/clickup/reports/3.2.md
```

### 3.3 شريط الإجراءات الجماعية والتراجع وقوائم الصف (`frontend-engineer`)
```text
TASK 3.3: Bulk bar, undo toast, row menu
Agent: frontend-engineer   Branch: task/3.3-bulk -> phase-3/datatable
Goal: BulkBar (F06), Toast with undo, "..." row/header menus on @radix-ui/react-dropdown-menu. No right-click (DEC-07).
Constraints: bulk list has NO gate action (no milestone/status move, approve, reject, close, cancel, reopen) - §0.4.3.
Touch only: src/components/{BulkBar,Toast}.tsx, src/components/data-table/{RowMenu,HeaderMenu}.tsx, tests
Done when: unit test iterating every register's bulk actions finds no gate action.
Report to: pmis/docs/clickup/reports/3.3.md
```

### 3.4 نقل سجل المشتريات (`hzblj-skills:fast-worker`)
```text
TASK 3.4: Procurement onto DataTable
Agent: hzblj-skills:fast-worker   Branch: task/3.4-procurement -> phase-3/datatable
Pattern to copy exactly: the /sites migration in task 3.2 (see pmis/docs/clickup/reports/3.2.md).
Touch only: src/pages/Register.tsx (procurement path), its tests
Done when: hpcProcurement.test.tsx and registers.test.tsx green; sort uses server sort from task 3.0.
Report to: pmis/docs/clickup/reports/3.4.md
```

### 3.5 الاختبارات (`qa-engineer`)
```text
TASK 3.5: Bulk-gate and 10k-row tests
Agent: qa-engineer   Touch only: pmis/apps/web/e2e/**, pmis/apps/web/src/**/*.test.tsx
Goal: e2e F04 and F06; 10k rows scroll with no longtask > 50 ms (PerformanceObserver); reconcile keeps forbidden columns hidden.
Report to: pmis/docs/clickup/reports/3.5.md
```

## الاعتماديات
| الحزمة | السبب | لماذا لا البديل |
| --- | --- | --- |
| `@tanstack/react-table` | بلا واجهة مفروضة: فرز، تجميع، أعمدة، تحديد كحالة؛ يُرسم داخل `TableKit`. من عائلة react-query الموجودة | محرك يدوي يكرر أخطاء التجميع في 42 جدولًا؛ AG Grid/MUI بشكل وترخيص مفروضين |
| `@tanstack/react-virtual` | ارتفاعات متغيرة وصفوف تجميع وأعمدة أفقية | `useVirtual.ts` يدعم ارتفاعًا ثابتًا فقط |
| `@radix-ui/react-dropdown-menu` | دلالات القوائم، التنقل بلوحة المفاتيح، القوائم الفرعية، RTL، `data-state` | `Popover` الحالي بلا دلالات قائمة |
| ~~`@radix-ui/react-context-menu`~~ | **لا يُضاف** (DEC-07) | - |

## الاختبارات والأوامر
```bash
cd pmis/apps/web && npm run typecheck && npm run lint && npm test && npx playwright test
npm run build && node scripts/bundle-budget.mjs      # الميزانية: +45 KB
# 3.0: cd pmis/apps/api && npm run typecheck && npm run lint && npm test  (يحتاج PostgreSQL 16: bash pmis/tools/dev-setup.sh)
git diff main -- pmis/apps/api pmis/db pmis/contracts   # يجب أن يقتصر على المهمة 3.0
```

## معايير القبول
- [ ] `/sites` والمشتريات على `DataTable`، واختبارات الصفحتين القديمة تنجح كما هي.
- [ ] الفرز في المشتريات على الخادم (3.0)، و10 آلاف صف بلا مهمة طويلة.
- [ ] لا إجراء بوابة في أي قائمة إجراءات جماعية (اختبار وحدة على كل السجلات).
- [ ] الأعمدة الممنوعة تبقى مخفية (`reconcile`).
- [ ] F04 وF06 بعدد النقرات في §0.3 أو أقل.
- [ ] **مقارنة بصرية** (±2px): صفوف القائمة المجمّعة مقابل `frames/09_list_grouped_status_idle.jpg` و`frames/10_list_row_hover_group_rename.jpg`؛ قائمة Group مقابل `frames/11_list_groupby_menu_fields.jpg`؛ قائمة رأس العمود مقابل `frames/14_list_column_header_menu_assignees_panel.jpg`؛ خلايا القوائم وشريحة الفرز مقابل `frames/16_list_dropdown_field_cells_sort_chip.jpg`.

## المخاطر
| الخطر | التخفيف |
| --- | --- |
| 3.0 يتأخر | يبقى الفرز على العميل حين تكتمل كل الصفحات فقط (`next_cursor = null`)، ولا تُقبل المرحلة قبل 3.0 |
| فقد سلوك عند النقل | جدولان فقط في هذه المرحلة؛ القديم يبقى حتى ينجح الجديد |
| إجراء جماعي يتجاوز البوابة | اختبار وحدة شامل + مراجعة `pr-review-toolkit:code-reviewer` |

## تعريف الإنجاز
قائمة §2.3 في الخطة ناجحة، وفرق `apps/api`/`contracts` محصور في 3.0 بموافقة DEC-06، والتقارير 3.0 إلى 3.5 في `reports/`.

## موافقات المالك المطلوبة
لا قرار جديد (DEC-06 وDEC-07 محسومان). البوابة فقط.
