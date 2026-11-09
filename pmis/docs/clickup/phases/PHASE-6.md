# المرحلة 6: الإعدادات والإدارة

| الحقل | القيمة |
| --- | --- |
| الفرع | `phase-6/settings` ← المهام `task/6.x-<slug>` |
| الحجم | M (قرابة 6 أيام)، يمكن أن تعمل بالتوازي مع المرحلة 5 |
| تعتمد على | بوابة المرحلة 3 (`DataTable`) |
| القرارات | DEC-10 (لا تغيير في الصلاحيات)؛ مفتوح: OPEN-09 (قوالب الإشعارات) |

## الهدف
هيكل إعدادات بشريط جانبي مجمّع وحارس مغادرة، وصفحات الأشخاص، والأدوار (عرض الفرق)، والإشعارات (قوالب جاهزة)، والأمان (سياسة 2FA والجلسات). **الواجهة تعرض وترسل الحمولة نفسها التي تُرسل اليوم.**

## الملفات (تحت `pmis/apps/web/src/`)
| المسار | إنشاء/تعديل |
| --- | --- |
| `pages/admin/SettingsShell.tsx` | إنشاء: شريط جانبي مجمّع + `useBlocker` (react-router) |
| `pages/settings/**` | تعديل: إدخال الأقسام السبعة عشر في الهيكل |
| `components/PeopleAdmin.tsx` | تعديل: على `DataTable` |
| `pages/Roles.tsx` | تعديل: عرض الفرق قبل الحفظ |
| صفحة الإشعارات القائمة | تعديل: قوالب جاهزة تولّد الأعلام نفسها |
| `pages/OnlineNow.tsx`، صفحة 2FA القائمة | تعديل: صفحة الأمان، الجلسات على `DataTable` |
| `pages/settingsScreens.test.tsx` + اختبار مطابقة الحمولة الجديد | اختبارات |

## بنود المواصفة
17، 17أ، 17ب، 17ج، 17د. التدفق F07.

## المهام

### 6.1 هيكل الإعدادات وحارس المغادرة (`frontend-engineer`)
```text
TASK 6.1: Settings shell and leave guard
Agent: frontend-engineer   Branch: task/6.1-settings-shell -> phase-6/settings
Spec: pmis/docs/clickup/clone-spec.md §17
Read first: src/pages/settings/ (list it) ; src/App.tsx (routes) ; src/pages/settingsScreens.test.tsx
Touch only: src/pages/admin/SettingsShell.tsx, src/pages/settings/**, src/App.tsx (routes only), src/i18n/*.json, tests
Done when: no edit lost when leaving any of the 17 sections (useBlocker); settingsScreens.test.tsx green.
Report to: pmis/docs/clickup/reports/6.1.md
```

### 6.2 الأشخاص والأدوار (`frontend-engineer` + `qa-engineer`)
```text
TASK 6.2: People and Roles diff
Agent: frontend-engineer (build) + qa-engineer (payload test)   Branch: task/6.2-people-roles -> phase-6/settings
Spec: clone-spec.md §17a, §17b
Constraint: DEC-10. The saved permission payload must be byte-identical to today's.
Read first: src/components/PeopleAdmin.tsx ; src/pages/Roles.tsx ; src/pages/peopleRealShapes.test.tsx
Touch only: src/components/PeopleAdmin.tsx, src/pages/Roles.tsx, src/i18n/*.json, tests
Done when: unit test captures the request body before/after and compares byte-for-byte; peopleRealShapes.test.tsx green.
Report to: pmis/docs/clickup/reports/6.2.md
```

### 6.3 الإشعارات والأمان (`frontend-engineer`، مراجعة `devops-security`)
```text
TASK 6.3: Notifications presets and Security page
Agent: frontend-engineer, reviewed by devops-security   Branch: task/6.3-notif-security -> phase-6/settings
Spec: clone-spec.md §17c, §17d ; OPEN-09 preset list (domain-analyst proposes)
Constraints: mandatory notification types stay non-optional; StepUp + typed confirmation unchanged (F07).
Touch only: notification and security pages under src/pages/**, src/i18n/*.json, tests
Done when: each preset produces exactly the flags of the manual setting (unit test); F07 e2e with StepUp.
Report to: pmis/docs/clickup/reports/6.3.md
```

## الاعتماديات
لا شيء (`useBlocker` موجود في react-router).

## الاختبارات والأوامر
```bash
cd pmis/apps/web && npm run typecheck && npm run lint && npm test && npx playwright test
npm run build && node scripts/bundle-budget.mjs      # +5 KB
git diff main -- pmis/apps/api pmis/db pmis/contracts   # فارغ
```

## معايير القبول
- [ ] لا يضيع تعديل عند مغادرة أي قسم من الأقسام السبعة عشر.
- [ ] حمولة حفظ الصلاحيات مطابقة بايتًا ببايت لما يُرسل اليوم.
- [ ] القوالب الجاهزة تنتج الأعلام نفسها التي يعطيها الضبط اليدوي.
- [ ] F07 مع StepUp وإدخال الاسم للتأكيد كما هو.
- [ ] **مقارنة بصرية**: لا إطارات للإعدادات بعد. المرجع `clone-spec.md` §17 وجلسة القائمة التجريبية (OPEN-10)؛ قائمة الأشخاص بالكثافة نفسها التي في `frames/14_list_column_header_menu_assignees_panel.jpg`.

## المخاطر
| الخطر | التخفيف |
| --- | --- |
| تغيير في صفحة الأدوار يمس الصلاحيات | عرض فقط، والحمولة نفسها، واختبار المطابقة شرط إلزامي |
| صفحة الأمان تخفي خيارًا إلزاميًا | مراجعة `devops-security` قبل الدمج |

## تعريف الإنجاز
قائمة §2.3 في الخطة ناجحة، والتقارير في `reports/`، و`PROGRESS.md` محدّث.

## موافقات المالك المطلوبة
OPEN-09 (قائمة القوالب وأسماؤها)، ثم البوابة.
