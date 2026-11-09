# المرحلة 1: الرموز والنظام

| الحقل | القيمة |
| --- | --- |
| الفرع | `phase-1/tokens` → طلب مسودة نحو `main`؛ المهام `task/1.x-<slug>` → `phase-1/tokens` |
| الحجم | S (قرابة 3 أيام) |
| تعتمد على | بوابة المرحلة 0 |
| القرارات | DEC-01 (Cairo + Inter)، DEC-02 (`neutral` افتراضي)، DEC-11 |

## الهدف
طبقة الرموز 3 (`tokens.clone.css`) والخطوط والحركة الأساسية والنسختان `neutral`/`pmis`، **دون تغيير أي تخطيط**.

## الملفات (كلها تحت `pmis/apps/web/`)
| المسار | إنشاء/تعديل |
| --- | --- |
| `src/styles/tokens.clone.css` | إنشاء: نسخة من `pmis/docs/clickup/tokens.clone.css` |
| `src/styles/index.css` | تعديل: استيراد `tokens.clone.css` بعد `tokens.css` |
| `tailwind.config.js` | تعديل: `bg-selected`، `bg-rowHover`، `border-lineStrong`، `ring-focusRing`، `h-row`، `duration-menu`… |
| `src/styles/fonts.css`، `src/assets/fonts/Inter-*.woff2` | تعديل/إنشاء: Inter 400/500/600 مقسّم بـ `unicode-range`، Cairo يبقى |
| `src/lib/localPref.ts` | تعديل: `data-preset` (افتراضي `neutral`) و`data-density` على `<html>` |
| `src/pages/Profile.tsx` (أو صفحة التفضيلات القائمة) | تعديل: مفتاح تبديل `neutral`/`pmis` |
| `src/components/EChart.tsx` | تعديل: `animation:false` تحت `prefers-reduced-motion` |
| `src/pages/DesignSystem.tsx` + مسار `/design` | إنشاء: كل عنصر أساسي في التركيبات الأربع (preset × theme) |
| `src/styles/contrast.test.ts` | تعديل: كل أزواج الطبقة 3 (208 زوجًا) |
| `src/components/Shell.tsx` أو مكوّن الجرس | تعديل: شارة الجرس (5.2:1 في الداكن) وحلقة التركيز |
| `playwright.config.ts` | تعديل: مشاريع `en-light` و`en-dark` و`ar-light` و`ar-dark` (`addInitScript` بمفاتيح `localPref.ts`) |
| `.github/workflows/ci.yml` | تعديل (`devops-security`): مشغّلات `phase-*` إن لم تُنفَّذ في 0.4 |
| `scripts/bundle-budget.mjs`، `bundle-budget.json` | إنشاء: فحص حجم gzip بلا اعتماديات، خط الأساس يقاس هنا |

## بنود المواصفة
الرموز للجميع؛ 1 (السمات فقط)؛ 18 (الحركة)؛ 19 (الهندسة)؛ §0.6.

## المهام

### 1.1 الرموز وTailwind والتباين (`ux-designer`)
```text
TASK 1.1: Layer-3 tokens and Tailwind
Agent: ux-designer   Branch: task/1.1-tokens -> phase-1/tokens
Goal: tokens.clone.css loaded after tokens.css, Tailwind names added, 208 contrast pairs pass AA in 4 combos.
Spec: pmis/docs/clickup/clone-spec.md §0.6 ; build-order.md "Phase 1" ; tokens file header (lines 1-12)
Decisions: DEC-01, DEC-02, DEC-11
Read first: pmis/docs/clickup/tokens.clone.css ; pmis/apps/web/src/styles/tokens.css ; pmis/apps/web/tailwind.config.js ;
            pmis/apps/web/src/styles/contrast.test.ts ; pmis/docs/clickup/_work/contrast-report.txt
Touch only: pmis/apps/web/src/styles/**, pmis/apps/web/tailwind.config.js
Done when: npm test (contrast.test.ts) green with 0 AA failures; no layout change (screenshot diff = colour only).
Report (<=300 words) to: pmis/docs/clickup/reports/1.1.md
```

### 1.2 الخطوط (`frontend-engineer`)
```text
TASK 1.2: Inter font and stack
Agent: frontend-engineer   Branch: task/1.2-fonts -> phase-1/tokens
Goal: Latin in self-hosted Inter (400/500/600, unicode-range), Arabic stays Cairo, CLS < 0.02, Inter <= 120 KB woff2.
Decisions: DEC-01 (no Plus Jakarta Sans, no IBM Plex Sans Arabic)
Read first: pmis/apps/web/src/styles/fonts.css ; pmis/apps/web/src/styles/tokens.clone.css lines 14-22
Touch only: pmis/apps/web/src/styles/fonts.css, pmis/apps/web/src/assets/fonts/**
Done when: font-display:swap; typecheck/lint/test green; AR screenshots of Matrix and Procurement before/after attached.
Report to: pmis/docs/clickup/reports/1.2.md
```

### 1.3 السمات والكثافة والمفتاح (`frontend-engineer`)
```text
TASK 1.3: Preset and density attributes
Agent: frontend-engineer   Branch: task/1.3-preset -> phase-1/tokens
Goal: <html data-preset data-density>; new users get neutral; switch to pmis persists per user preference.
Decisions: DEC-02
Read first: pmis/apps/web/src/lib/localPref.ts ; pmis/apps/web/src/pages/Profile.tsx ; pmis/apps/web/src/components/Shell.tsx
Touch only: src/lib/localPref.ts, src/pages/Profile.tsx, src/i18n/** (EN+AR keys), a new unit test
Done when: unit test for default=neutral and persisted switch; e2e: switch changes colours only.
Report to: pmis/docs/clickup/reports/1.3.md
```

### 1.4 الحركة وECharts وصفحة `/design` (`frontend-engineer`)
```text
TASK 1.4: Motion basics and /design page
Agent: frontend-engineer   Branch: task/1.4-design-page -> phase-1/tokens
Goal: Radix data-state enter/exit classes on --dur-*, ECharts animation:false under reduced motion,
      /design route showing every primitive in 4 combinations, bell badge 5.2:1 in dark, 2px focus ring.
Spec: clone-spec.md §0.6, §18, §19
Read first: src/components/EChart.tsx ; src/lib/echarts.ts ; src/components/States.tsx ; src/components/Toast.tsx
Touch only: src/components/EChart.tsx, src/pages/DesignSystem.tsx (new), router file, src/styles/**
Done when: reduced-motion e2e shows zero transforms; /design renders in 4 combos.
Report to: pmis/docs/clickup/reports/1.4.md
```

### 1.5 مصفوفة e2e الرباعية وaxe وميزانية الحزمة (`qa-engineer` + `devops-security`)
```text
TASK 1.5: e2e matrix, axe, bundle budget
Agent: qa-engineer (playwright.config.ts, axe) + devops-security (ci.yml job, budget script)
Goal: Playwright projects en-light/en-dark/ar-light/ar-dark; en-light runs all specs, the other 3 run an allow-list
      of specs that pass today (rest logged as Phase 8 debt); @axe-core/playwright on touched pages; bundle-budget.mjs fails CI over budget.
Read first: pmis/apps/web/playwright.config.ts ; pmis/apps/web/src/lib/localPref.ts ; .github/workflows/ci.yml lines 91-150
Touch only: pmis/apps/web/playwright.config.ts, pmis/apps/web/e2e/**, pmis/apps/web/scripts/**, bundle-budget.json, .github/workflows/ci.yml
Done when: CI job e2e-matrix green; budget baseline recorded in bundle-budget.json.
Report to: pmis/docs/clickup/reports/1.5.md
```

### 1.6 فرز تحذيرات semgrep (`devops-security`، OPEN-13)
```text
TASK 1.6: Triage semgrep warnings
Goal: classify the 34 warnings in pmis/docs/security/2026-11-09-baseline-scan.md (fix / accept with reason); pin the 8 mutable action tags in ci.yml.
Touch only: .github/workflows/ci.yml, pmis/docs/security/**
Report to: pmis/docs/clickup/reports/1.6.md
```

## الاعتماديات
| الحزمة | النوع | السبب |
| --- | --- | --- |
| `@axe-core/playwright` | تطوير فقط | فحص إمكانية الوصول الآلي (بند 6 في تعريف الإنجاز). لا يُشحن |
| Inter woff2 | ملف أصل، لا حزمة npm | DEC-01؛ OFL |

## الاختبارات والأوامر
```bash
cd pmis/apps/web
npm run typecheck && npm run lint && npm test          # contrast.test.ts ضمنها
npx playwright test --project=en-light                 # كل الملفات
npx playwright test --project=ar-dark                  # قائمة السماح
npm run build && node scripts/bundle-budget.mjs
```

## معايير القبول
- [ ] 208 زوجًا بلا فشل AA في التركيبات الأربع.
- [ ] تبديل preset لا يغيّر التخطيط: فرق اللقطات محصور في الألوان.
- [ ] مستخدم جديد يرى `neutral`؛ التبديل إلى `pmis` يُحفظ.
- [ ] CLS أقل من 0.02؛ JS = خط الأساس + 0 كيلوبايت؛ Inter ≤ 120 كيلوبايت.
- [ ] **مقارنة بصرية:** `/design` و`/sites` بالنسخة `neutral` مقابل `frames/09_list_grouped_status_idle.jpg` و`frames/16_list_dropdown_field_cells_sort_chip.jpg` (ألوان الإطار والخط والكثافة، ±5 لكل قناة لون).

## المخاطر
| الخطر | التخفيف |
| --- | --- |
| `neutral` افتراضيًا يغيّر ألوان كل المستخدمين يوم الدمج | لقطات قبل/بعد في تقرير البوابة، وإعلان داخل التطبيق عن المفتاح |
| Inter بجانب Cairo يغيّر ارتفاع الأسطر المختلطة | لقطات عربية للمصفوفة والمشتريات قبل وبعد |
| e2e يفشل بالعربية أو الداكن | قائمة سماح، والدين يُسدَّد في المرحلة 8 |

## تعريف الإنجاز
قائمة "تعريف الإنجاز" التسع في `IMPLEMENTATION_PLAN.md` §2.3 كلها ناجحة ومُرفقة بأدلتها في وصف طلب المرحلة، و`PROGRESS.md` محدّث.

## موافقات المالك المطلوبة
لا قرار مسبق (DEC-01 وDEC-02 محسومان). موافقة البوابة فقط.
