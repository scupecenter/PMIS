# المرحلة 2: الإطار والتنقل

| الحقل | القيمة |
| --- | --- |
| الفرع | `phase-2/frame` ← المهام `task/2.x-<slug>` |
| الحجم | M (قرابة 5 أيام) |
| تعتمد على | بوابة المرحلة 1 |
| القرارات | DEC-10، DEC-11؛ مفتوح: OPEN-03 (البحث الموزّع)، OPEN-04 (ترتيب الشريط الجانبي) |

## الهدف
شريط أيقونات (rail) وشريط جانبي وشريط علوي ولوحة أوامر Ctrl+K ورأس موقع (breadcrumb) وشريط عروض (تبويبات + أداة اختيار، بلا أنواع عرض جديدة) واختصارات لوحة المفاتيح.

## الملفات (تحت `pmis/apps/web/src/`)
| المسار | إنشاء/تعديل |
| --- | --- |
| `components/Shell.tsx`، `components/Sidebar.tsx`، `components/navItems.ts` | تعديل: rail، وضع الأيقونات فقط، درج الجوال |
| `components/TopBar.tsx` | إنشاء |
| `components/CommandPalette.tsx` | إعادة بناء على `cmdk` داخل Radix Dialog القائم؛ تبويبات: المواقع، السجلات، الإجراءات، الأخيرة |
| `components/LocationHeader.tsx` | إنشاء (يوسّع `PageHeader.tsx`) |
| `components/ViewTabs.tsx` | تعديل: شريط عروض مع أداة اختيار |
| `lib/useShortcuts.ts` + ورقة الاختصارات `?` | إنشاء |
| `i18n/en.json`، `i18n/ar.json` | مفاتيح جديدة |
| `components/sidebar.test.tsx`، `e2e/frame.spec.ts` | اختبارات |

## بنود المواصفة
1 (rail)، 2، 3أ، 3ب، 4، 5، 20. التدفقان F01 وF03 (`clone-spec.md` §0.3).

## المهام

### 2.1 نموذج التنقل ولوحة الأوامر (`feature-dev:code-architect`، مرة واحدة)
```text
TASK 2.1: Navigation and palette design
Agent: feature-dev:code-architect
Goal: one design note (<=300 words + a component tree) for rail/sidebar/top bar/palette/shortcuts, reusing Shell, Sidebar, navItems, CommandPalette.
Spec: pmis/docs/clickup/clone-spec.md §1, §2, §3, §4, §5, §20
Read first: pmis/apps/web/src/components/{Shell,Sidebar,CommandPalette,ViewTabs,PageHeader}.tsx ; src/components/navItems.ts
Must not touch: any file (design only)
Report to: pmis/docs/clickup/reports/2.1.md  (component tree, state owner, keyboard model, RTL notes)
```

### 2.2 rail والشريط الجانبي والشريط العلوي (`frontend-engineer`)
```text
TASK 2.2: Rail, sidebar, top bar
Agent: frontend-engineer   Branch: task/2.2-shell -> phase-2/frame
Goal: rail + sidebar (full / icons-only / mobile drawer) + TopBar as in clone-spec §1-§3a, logical props, RTL mirrored.
Design: pmis/docs/clickup/reports/2.1.md
Read first: src/components/{Shell,Sidebar}.tsx ; src/components/navItems.ts ; src/components/sidebar.test.tsx
Touch only: src/components/{Shell,Sidebar,TopBar}.tsx, src/components/navItems.ts, src/i18n/*.json, tests
Done when: sidebar.test.tsx green; 400px width has no horizontal scroll; visual check vs frames/09_list_grouped_status_idle.jpg (rail+sidebar, +/-2px).
Report to: pmis/docs/clickup/reports/2.2.md
```

### 2.3 لوحة الأوامر على cmdk (`frontend-engineer`)
```text
TASK 2.3: Ctrl+K palette on cmdk
Agent: frontend-engineer   Branch: task/2.3-palette -> phase-2/frame
Goal: F01 (site by ID in <=3 keys after typing). Tabs: Sites (GET /sites?q=), Registers (parallel GET /registers/{key}/records?q=&limit=5
      for permitted registers only, 250 ms debounce, AbortController, max 6 in flight), Actions, Recent.
Spec: clone-spec.md §3b ; IMPLEMENTATION_PLAN.md Phase 2 risks
Decisions: OPEN-03 default (distributed search, no /search endpoint)
Read first: src/components/CommandPalette.tsx ; src/lib/perm.ts ; src/api/schema.d.ts (search 'registers/{key}/records')
Touch only: src/components/CommandPalette.tsx, src/i18n/*.json, tests
Done when: arrow/Home/End work and follow visual order in RTL; e2e F01 green.
Report to: pmis/docs/clickup/reports/2.3.md
```

### 2.4 رأس الموقع وشريط العروض والاختصارات (`frontend-engineer`)
```text
TASK 2.4: Location header, views bar, shortcuts
Agent: frontend-engineer   Branch: task/2.4-views-bar -> phase-2/frame
Goal: LocationHeader (breadcrumb), ViewTabs as tabs + picker (no new view types), useShortcuts + "?" sheet listing every shortcut of clone-spec §20.
Read first: src/components/{PageHeader,ViewTabs,SavedViews}.tsx
Touch only: src/components/{LocationHeader,ViewTabs}.tsx, src/lib/useShortcuts.ts, src/i18n/*.json, tests
Done when: shortcut sheet complete; visual check vs frames/15_view_picker_popover.jpg.
Report to: pmis/docs/clickup/reports/2.4.md
```

### 2.5 اختبارات F01 وF03 (`qa-engineer`)
```text
TASK 2.5: e2e F01 and F03
Agent: qa-engineer   Branch: task/2.5-e2e -> phase-2/frame
Goal: e2e/frame.spec.ts covers F01 and F03 with click counts asserted, in the 4 projects.
Touch only: pmis/apps/web/e2e/**
Report to: pmis/docs/clickup/reports/2.5.md
```

## الاعتماديات
| الحزمة | السبب | لماذا لا البديل |
| --- | --- | --- |
| `cmdk` | قائمة أوامر صغيرة سهلة الوصول (listbox، الأسهم، Home/End، تجميع) داخل Radix Dialog القائم | اللوحة الحالية بلا أسهم ولا تجميع، وcombobox صحيح يدويًا أكثر كلفة |

## الاختبارات والأوامر
```bash
cd pmis/apps/web && npm run typecheck && npm run lint && npm test
npx playwright test e2e/frame.spec.ts
npm run build && node scripts/bundle-budget.mjs     # الميزانية: +15 KB
```

## معايير القبول
- [ ] F01: موقع بمعرّفه في 3 ضغطات أو أقل بعد الكتابة. F03: ضغطتان.
- [ ] ورقة الاختصارات كاملة (§20).
- [ ] عرض 400px بلا تمرير أفقي.
- [ ] الأسهم تتبع الاتجاه البصري في RTL.
- [ ] الحزمة ≤ خط الأساس + 15 كيلوبايت.
- [ ] **مقارنة بصرية** (±2px): rail والشريط الجانبي والشريط العلوي مقابل `frames/09_list_grouped_status_idle.jpg`؛ أداة اختيار العروض مقابل `frames/15_view_picker_popover.jpg`؛ وضع "Me" والحالة الفارغة مقابل `frames/13_list_me_mode_menu_empty_state.jpg`.

## المخاطر
| الخطر | التخفيف |
| --- | --- |
| لا توجد نقطة بحث شامل | بحث موزّع محدود (6 طلبات، إلغاء، تأخير 250ms) |
| طلبات السجلات تكشف سجلات ممنوعة | لا يُستعلم إلا عن السجلات التي يعيدها `perm.ts` للمستخدم؛ والخادم يطبّق RLS على أي حال |

## تعريف الإنجاز
قائمة §2.3 في الخطة ناجحة بأدلتها، وتقارير 2.1 إلى 2.5 في `reports/`، و`PROGRESS.md` محدّث.

## موافقات المالك المطلوبة
OPEN-03 (البحث الموزّع)، OPEN-04 (ترتيب الشريط الجانبي)، ثم البوابة.
