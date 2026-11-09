# المرحلة 8: التجاوب واللمسات الأخيرة

| الحقل | القيمة |
| --- | --- |
| الفرع | `phase-8/finish` ← المهام `task/8.x-<slug>` |
| الحجم | M (قرابة 5 أيام) |
| تعتمد على | بوابة المرحلة 7 |
| القرارات | DEC-09 (القائمة التجريبية تُغلق بعد هذه المرحلة فقط)؛ مفتوح: OPEN-11 (الصفحات الأساسية للجوال) |

## الهدف
كل البنود تحت عرض 768px، وتدقيق إمكانية الوصول، والأداء، ولقطات RTL لكل بند، وسداد دين e2e من المرحلة 1.

## الملفات (تحت `pmis/apps/web/`)
| المسار | إنشاء/تعديل |
| --- | --- |
| `src/pages/MyWork.tsx`، `src/pages/Approvals.tsx` | تعديل: بطاقات بدل الجداول تحت 768px |
| `src/components/BulkBar.tsx`، `src/components/Toolbar.tsx` | تعديل: طي والتفاف |
| `src/components/SiteModal.tsx` | تعديل: ملء الشاشة على الجوال |
| كل المكونات التفاعلية | `min-h-11` (44px) تحت 768px |
| `playwright.config.ts` | تعديل: إزالة قائمة السماح، كل الملفات في المشاريع الأربعة |
| `e2e/a11y.spec.ts`، `e2e/mobile.spec.ts` | إنشاء |
| `pmis/docs/clickup/reports/8-final-performance.md` | إنشاء: تقرير الأداء النهائي |

## بنود المواصفة
كل البنود على الجوال، وإمكانية الوصول، والأداء، وRTL (`clone-spec.md` §0.6 Hit targets، و`build-order.md` "Phase 8").

## المهام

### 8.1 الجوال (`frontend-engineer`)
```text
TASK 8.1: Mobile cards and layouts
Agent: frontend-engineer   Branch: task/8.1-mobile -> phase-8/finish
Decision: OPEN-11 default core pages: Login, My work, Approvals, Sites, Site modal
Goal: cards instead of tables for My work and Approvals < 768px; bulk bar collapse; toolbar wrap; site modal full-screen.
Touch only: src/pages/{MyWork,Approvals}.tsx, src/components/{BulkBar,Toolbar,SiteModal}.tsx, src/i18n/*.json, tests
Done when: 400px width without horizontal scroll on core pages (e2e/mobile.spec.ts).
Report to: pmis/docs/clickup/reports/8.1.md
```

### 8.2 أهداف اللمس ولقطات RTL (`hzblj-skills:fast-worker`)
```text
TASK 8.2: 44px targets and RTL screenshots
Agent: hzblj-skills:fast-worker   Branch: task/8.2-targets -> phase-8/finish
Goal: add the existing min-h-11 pattern to interactive elements under 768px; regenerate RTL screenshots of every item
      in a separate commit titled "baseline: phase 8 RTL".
Touch only: src/components/**, src/pages/** (class names only), e2e/**/*-snapshots/**
Report to: pmis/docs/clickup/reports/8.2.md (<=150 words)
```

### 8.3 إمكانية الوصول وسداد دين e2e (`qa-engineer`)
```text
TASK 8.3: a11y audit and e2e debt
Agent: qa-engineer   Touch only: pmis/apps/web/e2e/**, pmis/apps/web/playwright.config.ts
Goal: axe on every core page with zero serious/critical; keyboard-only walk of F01-F07 with click counts <= clone-spec §0.3;
      remove the Phase 1 allow-list so every spec runs in en-light, en-dark, ar-light, ar-dark.
Report to: pmis/docs/clickup/reports/8.3.md
```

### 8.4 مرور RTL والأداء النهائي (`ux-designer` + `qa-engineer`)
```text
TASK 8.4: RTL pass and final performance
Agent: ux-designer (RTL) + qa-engineer (LCP, bundle)
Goal: RTL review of every item vs clone-spec §0.6; LCP /sites < 2.0 s on MSW data; total bundle <= baseline + 125 KB.
Report to: pmis/docs/clickup/reports/8-final-performance.md
```

## الاعتماديات
لا شيء.

## الاختبارات والأوامر
```bash
cd pmis/apps/web && npm run typecheck && npm run lint && npm test
npx playwright test                       # كل الملفات في المشاريع الأربعة
npx playwright test e2e/a11y.spec.ts e2e/mobile.spec.ts
npm run build && node scripts/bundle-budget.mjs
```

## معايير القبول
- [ ] عرض 400px بلا تمرير أفقي في الصفحات الأساسية.
- [ ] عدد النقرات في F01 إلى F07 مساوٍ لأرقام `clone-spec.md` §0.3 أو أقل.
- [ ] لا مشكلة axe من درجة serious أو critical.
- [ ] LCP أقل من 2.0 ثانية؛ الحزمة ≤ خط الأساس + 125 كيلوبايت.
- [ ] المشاريع الأربعة تعمل بكل ملفات e2e.
- [ ] **مقارنة بصرية نهائية**: كل الإطارات الاثني عشر في `frames/` مقابل الصفحات المقابلة بالنسخة `neutral`، بتقرير واحد يُرفق بطلب المرحلة.

## المخاطر
| الخطر | التخفيف |
| --- | --- |
| تراكم دين الشاشات الصغيرة | كل مرحلة سابقة فحصت 400px لصفحاتها |
| دين e2e أكبر من المتوقع | يُفتح كمهام `task/8.3.<n>` صغيرة، ملف لكل مهمة |

## تعريف الإنجاز
قائمة §2.3 في الخطة ناجحة، والتقارير في `reports/`، و`PROGRESS.md` يُظهر المراحل 0 إلى 8 مكتملة، و`HANDOVER.md` محدّث بحالة البرنامج. بعد الدمج يقرر المالك إغلاق القائمة التجريبية (DEC-09).

## موافقات المالك المطلوبة
OPEN-11، ثم البوابة النهائية، ثم إغلاق القائمة التجريبية.
