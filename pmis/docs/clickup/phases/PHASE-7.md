# المرحلة 7: الحركة والتفاعلات الدقيقة (السحب في Board)

| الحقل | القيمة |
| --- | --- |
| الفرع | `phase-7/motion` ← المهام `task/7.x-<slug>` |
| الحجم | M (قرابة 6 أيام) |
| تعتمد على | بوابة المرحلة 4 (Board للقراءة)؛ جلسة الفحص الحي في القائمة التجريبية (OPEN-10) |
| القرارات | **DEC-03** (التخطي محطةً محطة)، **DEC-04** (الإفلات يفتح إجراء المهمة)، **DEC-08** (التوقف عند محطة بلا صلاحية)، DEC-09، DEC-12 |

## الهدف
سحب البطاقات في Board مع فحص البوابة أثناء المرور فوق العمود، ونافذة قائمة البوابات للتخطي، وتدقيق الحركة في كل البنود مقابل `--dur-*`. **لا توجد نقطة "نقل موقع" ولن تُضاف.**

## الملفات (تحت `pmis/apps/web/src/components/board/`)
| المسار | إنشاء/تعديل |
| --- | --- |
| `BoardView.tsx` | تعديل: `@dnd-kit/core` مع `KeyboardSensor` وإعلانات قارئ الشاشة |
| `useGateCheck.ts` | إنشاء: `GET /sites/{id}` مرة واحدة عند بدء السحب (مخزّن طوال السحب)؛ يقرأ `pipeline[].state` و`lock_reasons` |
| `GateChecklistDialog.tsx` | إنشاء: صف لكل بوابة بين الحالية والهدف |
| `useStepwiseMove.ts` | إنشاء: التخطي محطةً محطة (DEC-03، DEC-08) |
| `pmis/apps/web/src/components/TaskDrawer.tsx` | استخدام فقط: يُفتح على مهمة المحطة الحالية بإجرائها القائم |
| `e2e/board-drag.spec.ts` | إنشاء |

## بنود المواصفة
9 (السحب)، 10 (السحب لإعادة الجدولة **فقط** إن سمحت قائمة التحرير OPEN-05 بحقل التاريخ)، والحركة في كل البنود. التدفق F02. القواعد §0.4.2 و§0.4.5.

## السلوك المطلوب (ملخص ملزم)
1. بدء السحب → `GET /sites/{id}`؛ حتى الرد: الأعمدة الأخرى "جارٍ التحقق…" والإفلات معطّل.
2. المرور فوق عمود: التالي والبوابة مستوفاة → حلقة `--gate-ok-ring`؛ مقفل → سبب الخادم + `Lock`، بلا مكان إفلات؛ أبعد من محطة → "قائمة البوابات مطلوبة (N)"؛ الرجوع مقفل ما لم يسمح الخادم.
3. الإفلات على المسموح → يفتح `TaskDrawer` على مهمة المحطة الحالية بإجرائها (`/tasks/{id}/start|submit|review|approve`) مع السبب وStepUp. العدّ لا يتغير قبل رد 2xx.
4. الإفلات على تخطٍّ → البطاقة تعود، وتُفتح `GateChecklistDialog`. زر "نقل" مفعّل فقط حين يقول الخادم إن كل البوابات مستوفاة. ثم انتقال واحد لكل محطة بالترتيب، ينتظر كل انتقال رده، ويعيد `GET /sites/{id}` بعد كل خطوة.
5. **التوقف:** عند أول رفض من الخادم، أو عند أول محطة لا يملك المستخدم صلاحية إجراء مهمتها (DEC-08)، يتوقف ويعرض أين ولماذا. لا يُرسل شيء لصاحب المهمة.
6. الرفض → البطاقة تعود وتهتز `--shake-x` × 3، وإشعار بالسبب، وإعلان في live region.

## المهام

### 7.1 ربط السحب بمسار المهمة (`feature-dev:code-architect`)
```text
TASK 7.1: Drag-to-task-action design
Agent: feature-dev:code-architect
Goal: design note: dnd-kit sensors, useGateCheck cache, drop -> TaskDrawer action mapping, useStepwiseMove state machine
      (per-step server confirm, re-check, stop on reject or missing right), announcements, reduced motion.
Spec: pmis/docs/clickup/clone-spec.md §9 ; this file "السلوك المطلوب" ; DECISIONS.md DEC-03, DEC-04, DEC-08
Read first (read only): pmis/apps/api/src/sites/sites.service.ts lines 125-140, 551-624 ; contracts/openapi.yaml lines 3114-3243 ;
            src/components/{TaskDrawer,Pipeline,StepUp}.tsx ; src/components/board/BoardView.tsx
Report to: pmis/docs/clickup/reports/7.1.md
```

### 7.2 التنفيذ (`frontend-engineer`)
```text
TASK 7.2: Board drag with gate checks
Agent: frontend-engineer   Branch: task/7.2-board-drag -> phase-7/motion
Design: pmis/docs/clickup/reports/7.1.md
Touch only: src/components/board/**, src/i18n/*.json, tests
Must not touch: pmis/apps/api/**, pmis/contracts/** (no move-site endpoint, DEC-04)
Done when: unit tests for useStepwiseMove (all met / reject at step k / no right at step k) ;
           visual check vs frames/02_board_drag_ghost_tilt_shadow.jpg (tilt, shadow, placeholder).
Report to: pmis/docs/clickup/reports/7.2.md
```

### 7.3 اختبارات السحب (`qa-engineer`)
```text
TASK 7.3: Board drag e2e
Agent: qa-engineer   Touch only: pmis/apps/web/e2e/**
Goal: e2e/board-drag.spec.ts in AR and EN, mouse and keyboard:
  - locked column shows reason before drop and calls NO write endpoint;
  - reject snaps back, counts unchanged;
  - skip opens the checklist without a write; "Move" disabled while one gate is unmet;
  - skip after full checklist sends N separate transition calls for N milestones, in order (network assertion);
    reject at step k leaves k..N untouched; missing right at step k stops there (DEC-08);
  - reduced motion: zero transforms.
Report to: pmis/docs/clickup/reports/7.3.md
```

### 7.4 تدقيق الحركة (`ux-designer`)
```text
TASK 7.4: Motion audit
Agent: ux-designer
Goal: every item's motion uses only opacity/transform and --dur-* tokens; closing is instant except the drawer.
Spec: clone-spec.md §0.6 (Motion), each item's "Motion" line
Report to: pmis/docs/clickup/reports/7.4.md (table: item | token | ok/fix)
```

## الاعتماديات
| الحزمة | السبب | لماذا لا البديل |
| --- | --- | --- |
| `@dnd-kit/core` (إنتاج) | مستشعرات المؤشر ولوحة المفاتيح، إعلانات قارئ الشاشة، `onDragOver` لكل عمود لفحص البوابة قبل الإفلات، يعمل مع الأعمدة الافتراضية | HTML5 drag بلا مسار لوحة مفاتيح؛ react-beautiful-dnd متوقفة. لا حاجة لـ sortable |

## الاختبارات والأوامر
```bash
cd pmis/apps/web && npm run typecheck && npm run lint && npm test && npx playwright test e2e/board-drag.spec.ts
npm run build && node scripts/bundle-budget.mjs      # +15 KB، تحميل كسول مع Board
git diff main -- pmis/apps/api pmis/db pmis/contracts   # فارغ
```

## معايير القبول
- [ ] كل بنود 7.3 تنجح بالعربية والإنجليزية، بالفأرة ولوحة المفاتيح.
- [ ] الإفلات المسموح يفتح إجراء المهمة القائم ولا يكتب شيئًا آخر.
- [ ] سجل التدقيق يُظهر N مدخلًا لتخطي N محطة.
- [ ] تقليل الحركة يلغي كل transform.
- [ ] **مقارنة بصرية** (±2px): `frames/01_board_idle_stage_columns.jpg` (السكون) و`frames/02_board_drag_ghost_tilt_shadow.jpg` (الشبح والميل والظل)؛ وما لم يُرَ في الإطارات يُقارن في جلسة القائمة التجريبية (OPEN-10) بمتصفح الجلسة (Playwright MCP)، **لا عبر REA** (DEC-12).

## المخاطر
| الخطر | التخفيف |
| --- | --- |
| توقع "سحب = إنجاز المحطة" | مرفوض (DEC-04): السحب يفتح الإجراء القائم فقط |
| تخطٍّ جزئي يترك الموقع في منتصف الطريق | مقصود ومسجَّل (DEC-03، DEC-08)؛ النافذة تعرض أين توقف |
| حالة سباق بين الخطوات | كل خطوة تنتظر رد الخادم وتعيد الفحص قبل التالية |

## تعريف الإنجاز
قائمة §2.3 في الخطة ناجحة، والتقارير 7.1 إلى 7.4 في `reports/`، و`PROGRESS.md` محدّث.

## موافقات المالك المطلوبة
موعد جلسة الفحص الحي (OPEN-10)، وحقل التاريخ للسحب في التقويم إن طُلب (OPEN-05)، ثم البوابة.
