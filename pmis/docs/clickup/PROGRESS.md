# متابعة المراحل: برنامج واجهة PMIS بمستوى ClickUp

حدّث هذا الملف في نهاية كل مهمة (سطر في "سجل التحقق") وعند كل بوابة (عمود الحالة). الحالات: لم تبدأ / قيد التنفيذ / بانتظار البوابة / مكتملة.

| المرحلة | الموجز | الحالة | الفرع | طلب الدمج | موافقة البوابة |
| --- | --- | --- | --- | --- | --- |
| 0 التمهيد | [PHASE-0](phases/PHASE-0.md) | **قيد التنفيذ** | `claude/phase-0-bootstrap` | [PR #1](https://github.com/scupecenter/PMIS/pull/1) | - |
| 1 الرموز والنظام | [PHASE-1](phases/PHASE-1.md) | لم تبدأ | `phase-1/tokens` | - | - |
| 2 الإطار والتنقل | [PHASE-2](phases/PHASE-2.md) | لم تبدأ | `phase-2/frame` | - | - |
| 3 المكونات الأساسية | [PHASE-3](phases/PHASE-3.md) | لم تبدأ | `phase-3/datatable` | - | - |
| 4 الوحدات والبيانات | [PHASE-4](phases/PHASE-4.md) | لم تبدأ | `phase-4/modules` | - | - |
| 5 لوحات المعلومات والزمن | [PHASE-5](phases/PHASE-5.md) | لم تبدأ | `phase-5/time-views` | - | - |
| 6 الإعدادات والإدارة | [PHASE-6](phases/PHASE-6.md) | لم تبدأ | `phase-6/settings` | - | - |
| 7 الحركة والسحب | [PHASE-7](phases/PHASE-7.md) | لم تبدأ | `phase-7/motion` | - | - |
| 8 التجاوب والإنهاء | [PHASE-8](phases/PHASE-8.md) | لم تبدأ | `phase-8/finish` | - | - |

## المرحلة 0: قائمة التحقق
- [x] الاستيراد كملفات عادية (`0467cf8`)
- [x] المراجع في `pmis/docs/clickup/` والدليل (`/README.md`، `/START_HERE.md`)
- [x] `.github/pull_request_template.md`
- [x] `pmis/apps/web/.env.development` (`VITE_USE_MOCKS=true` فقط)
- [x] التحقق المحلي (انظر السجل)
- [ ] CI أخضر على طلب المرحلة 0 (المهمة 0.1)
- [ ] حماية `main` (المالك، OPEN-01)
- [ ] قرار خصوصية المستودع أو نقل الإطارات (المالك، OPEN-07)
- [ ] موافقة البوابة ودمج الطلب

## سجل التحقق

| التاريخ | المرحلة | الأمر | النتيجة |
| --- | --- | --- | --- |
| 2026-11-09 | 0 | `pmis/apps/web`: `npm ci` | نجح |
| 2026-11-09 | 0 | `pmis/apps/web`: `npm run typecheck` | نجح |
| 2026-11-09 | 0 | `pmis/apps/web`: `npm run lint` | نجح (0 تحذيرات) |
| 2026-11-09 | 0 | `pmis/apps/web`: `npm test` | نجح: 52 ملفًا، 677 اختبارًا |
| 2026-11-09 | 0 | `pmis/apps/api`: `npm ci` | نجح (مع `prisma generate`) |
| 2026-11-09 | 0 | `pmis/apps/api`: `npm run typecheck` | نجح |
| 2026-11-09 | 0 | `pmis/apps/api`: `npm run lint` | نجح |
| 2026-11-09 | 0 | `pmis/apps/api`: `npm test` | لم يُشغَّل محليًا: كل الملفات تمر بـ `test/global-setup.ts` الذي يحتاج PostgreSQL 16 (`TEST_PG_ADMIN_URL`). يعمل في CI (job `api`) أو بعد `bash pmis/tools/dev-setup.sh` |
| 2026-11-09 | 0 | إصلاح سببه النقل | `apps/api/test/master-import.test.ts`: اختبار "real Site Master" يُتخطى إن غاب `PMIS_Site_Master.xlsx` (DEC-14) |

## روابط
- الخطة: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) · القرارات: [DECISIONS.md](DECISIONS.md) · القالب: [TASK-BRIEF-TEMPLATE.md](TASK-BRIEF-TEMPLATE.md)
- المواصفة: [clone-spec.md](clone-spec.md) · ترتيب البناء: [build-order.md](build-order.md) · الرموز: [tokens.clone.css](tokens.clone.css)
- الدراسة: [STUDY.html](STUDY.html) · الإطارات: [frames/](frames/) · إعداد ClickUp: [clickup-config.json](clickup-config.json)
- فحص الأمان الأساسي: [../security/2026-11-09-baseline-scan.md](../security/2026-11-09-baseline-scan.md)
- تقارير الوكلاء: `reports/<phase>.<n>.md`
