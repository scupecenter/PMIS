# المرحلة 5: لوحات المعلومات وعروض الزمن

| الحقل | القيمة |
| --- | --- |
| الفرع | `phase-5/time-views` ← المهام `task/5.x-<slug>` |
| الحجم | M (قرابة 5 أيام)، يمكن أن تعمل بالتوازي مع المرحلة 6 |
| تعتمد على | بوابة المرحلة 4 (كائن العرض يحمل إعدادات التقويم وGantt في `filters._layout`) |
| القرارات | DEC-05، DEC-10؛ مفتوح: OPEN-08 (تاريخ التقويم والشريط غير المجدول) |

## الهدف
تقويم وGantt **للقراءة فقط**، وبطاقات لوحة المعلومات تُخفى وتُظهر ويُعاد ترتيبها مع فلاتر على مستوى اللوحة.

## الملفات (تحت `pmis/apps/web/src/`)
| المسار | إنشاء/تعديل |
| --- | --- |
| `components/views/CalendarView.tsx` | إنشاء (CSS، بلا مكتبة) |
| `components/views/GanttView.tsx` | إنشاء (SVG + CSS، بلا مكتبة) |
| `pages/Dashboard.tsx` | تعديل: إظهار/إخفاء/ترتيب البطاقات (يُحفظ في `localPref` أو `filters._layout`) |
| `components/EChart.tsx` | تحقق من تقليل الحركة (من المرحلة 1) |
| `components/ViewTabs.tsx` | تعديل: نوعا العرض الجديدان |
| `pages/dashboard.test.tsx`، `e2e/time-views.spec.ts` | اختبارات |

## بنود المواصفة
10، 11، ولوحات المعلومات (الدراسة `STUDY.html` §6).

## المهام

### 5.1 التقويم (`frontend-engineer`)
```text
TASK 5.1: Read-only Calendar
Agent: frontend-engineer   Branch: task/5.1-calendar -> phase-5/time-views
Spec: pmis/docs/clickup/clone-spec.md §10 ; clickup-config.json "views" (calendar_settings)
Decision: OPEN-08 default (position = approved baseline date of the next milestone; unscheduled rail shown)
Read first: src/components/Pipeline.tsx ; src/api/schema.d.ts (search 'baseline_date') ; src/lib/viewObject.ts
Touch only: src/components/views/CalendarView.tsx, src/components/ViewTabs.tsx, src/i18n/*.json, tests
Constraints: only dates returned by pipeline (baseline_date, actual_date, variance_wd); never derive a date; no write call.
Done when: dates equal the table for the same filter; visual check vs frames/07_calendar_month_today_unscheduled_rail.jpg.
Report to: pmis/docs/clickup/reports/5.1.md
```

### 5.2 Gantt (`frontend-engineer`)
```text
TASK 5.2: Read-only Gantt
Agent: frontend-engineer   Branch: task/5.2-gantt -> phase-5/time-views
Spec: clone-spec.md §11 (week/month/quarter zoom, today line, baseline vs forecast)
Touch only: src/components/views/GanttView.tsx, src/components/ViewTabs.tsx, src/i18n/*.json, tests
Constraints: SVG/CSS only, no library; time axis right-to-left under dir=rtl; no write call.
Report to: pmis/docs/clickup/reports/5.2.md
```

### 5.3 بطاقات لوحة المعلومات (`frontend-engineer`)
```text
TASK 5.3: Dashboard cards show/hide/reorder
Agent: frontend-engineer   Branch: task/5.3-dashboard -> phase-5/time-views
Spec: STUDY.html §6 (show/hide/reorder only, no free grid) ; clone-spec.md §0.5 (card library deferred)
Read first: src/pages/Dashboard.tsx ; src/pages/dashboard*.test.tsx
Touch only: src/pages/Dashboard.tsx, src/lib/localPref.ts, src/i18n/*.json, tests
Done when: dashboard numbers identical before/after (existing tests green unchanged).
Report to: pmis/docs/clickup/reports/5.3.md
```

### 5.4 التحقق (`qa-engineer`)
```text
TASK 5.4: Time views verification
Agent: qa-engineer   Touch only: pmis/apps/web/e2e/**
Goal: e2e asserts no POST/PATCH/PUT/DELETE from Calendar and Gantt; dates match the table; RTL axis direction.
Report to: pmis/docs/clickup/reports/5.4.md
```

## الاعتماديات
لا شيء.

## الاختبارات والأوامر
```bash
cd pmis/apps/web && npm run typecheck && npm run lint && npm test && npx playwright test e2e/time-views.spec.ts
npm run build && node scripts/bundle-budget.mjs      # +10 KB
```

## معايير القبول
- [ ] التواريخ في التقويم وGantt تساوي الجدول للفلتر نفسه.
- [ ] لا طلب كتابة من أي من العرضين (تأكيد على الشبكة).
- [ ] أرقام لوحة المعلومات متطابقة قبل وبعد.
- [ ] الزمن في Gantt من اليمين إلى اليسار في RTL.
- [ ] **مقارنة بصرية** (±2px): التقويم مقابل `frames/07_calendar_month_today_unscheduled_rail.jpg`. لا إطار لـ Gantt: المرجع `clone-spec.md` §11 وجلسة القائمة التجريبية (DEC-09).

## المخاطر
| الخطر | التخفيف |
| --- | --- |
| مصدر "التاريخ المخطط" غير موحّد بين السجلات | نعرض فقط ما يعيده `pipeline`، ولا نشتق |
| التوازي مع المرحلة 6 يسبب تعارضًا | لا ملفات مشتركة بعد المرحلة 4؛ `ViewTabs.tsx` يخص المرحلة 5 وحدها |

## تعريف الإنجاز
قائمة §2.3 في الخطة ناجحة، والتقارير في `reports/`، و`PROGRESS.md` محدّث.

## موافقات المالك المطلوبة
OPEN-08، ثم البوابة.
