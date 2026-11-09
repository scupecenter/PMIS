# Security report: pmis (2026-11-09)

Risk score 70.7/100 (High Risk). Score = min(100, round(log10(0*100+11*30+34*10+0*3+1)*25)) = 70.7

Critical 0, High 11, Medium 34, Low 0.

## High: gitleaks (11), all verified non-real: test fixtures under pmis/apps/api/test/ and a localStorage key name.
- pmis/apps/api/test/calc-admin.test.ts:344 generic-api-key (value masked ****)
- pmis/apps/api/test/calc-admin.test.ts:349 generic-api-key (value masked ****)
- pmis/apps/api/test/documents-unit.test.ts:184 generic-api-key (value masked ****)
- pmis/apps/api/test/documents-unit.test.ts:184 generic-api-key (value masked ****)
- pmis/apps/api/test/documents-unit.test.ts:184 generic-api-key (value masked ****)
- pmis/apps/api/test/helpers.ts:19 generic-api-key (value masked ****)
- pmis/apps/api/test/session-context.test.ts:70 generic-api-key (value masked ****)
- pmis/apps/api/test/users.test.ts:77 generic-api-key (value masked ****)
- pmis/apps/api/test/users.test.ts:183 generic-api-key (value masked ****)
- pmis/apps/api/test/users.test.ts:186 generic-api-key (value masked ****)
- pmis/tools/capacity-sizer/index.html:382 generic-api-key (value masked ****)

## Medium: semgrep WARNING (34)
- template-explicit-unescape: 16
- github-actions-mutable-action-tag: 8
- detect-non-literal-regexp: 3
- insecure-object-assign: 2
- ifs-tampering: 2
- prototype-pollution-loop: 1
- missing-integrity: 1
- curl-pipe-bash: 1

grype: 0 vulnerabilities. checkov: 0 failed. hadolint: no findings.

Remediation: no real secrets; triage semgrep warnings in Phase 1 hardening.