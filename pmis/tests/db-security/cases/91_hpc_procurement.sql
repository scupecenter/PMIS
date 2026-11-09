-- The HPC fiber purchasing redesign (migration 0042, owner decision 2026-11-02) and Q91. The HPC purchase request is a Procurement record of scope HPC,
-- entered only by the L1 holders of the Matrix row `procurement_hpc` (the HPC Fiber Team); every other scope stays with the Procurement row. The database
-- enforces it (trigger b_reg_scope_entry) whatever the API does. The task sources (C1, C3, C4), the scope rows, the HPC link and the typed approved
-- tables are closed to the application role; the closing helpers are not callable by it.

-- @case HPC-01
-- @title Alice plants an approved HPC purchase request straight into the register records (to close C3 without anybody's approval)
-- @category hpc_procurement
-- @actor ALICE
-- @region 1
-- @expect error 42501 permission denied
INSERT INTO register_records (entity_id, register_key, site_id, region_id, state, data)
VALUES (gen_random_uuid(), 'procurement', '{{SITE_TRI}}', 1, 'approved', '{"scope": "HPC", "pr_no": "X", "pr_date": "2026-01-01", "hpc_approval_date": "2026-01-02"}');
-- @end

-- @case HPC-02
-- @title Alice forges the HPC approval date of an approved order in the typed table (moves the C3 date and the C-3 SLA)
-- @category hpc_procurement
-- @actor ALICE
-- @region 1
-- @expect error 42501 permission denied
UPDATE procurement_records SET hpc_approval_date = DATE '2026-01-01';
-- @end

-- @case HPC-03
-- @title Alice re-routes C3 to another date field of Procurement
-- @category hpc_procurement
-- @actor ALICE
-- @region 1
-- @expect error 42501 permission denied
UPDATE register_task_sources SET date_field = 'pr_date' WHERE register_key = 'procurement' AND task_code = 'C3';
-- @end

-- @case HPC-04
-- @title Alice removes the scope row of HPC, so the Procurement row decides scope HPC again
-- @category hpc_procurement
-- @actor ALICE
-- @region 1
-- @expect error 42501 permission denied
UPDATE register_definitions SET rules = rules - 'scope_rows' WHERE register_key = 'procurement';
-- @end

-- @case HPC-05
-- @title Alice names herself L1 of the HPC scope row of the Matrix
-- @category hpc_procurement
-- @actor ALICE
-- @region 1
-- @expect error 42501 permission denied
INSERT INTO matrix_cell_assignees (cell_id, kind, ref_id)
SELECT c.id, 'user', '{{ALICE}}' FROM matrix_cells c WHERE c.register_key = 'procurement_hpc' AND c.level = 1 LIMIT 1;
-- @end

-- @case HPC-06
-- @title Alice switches the old HPC request fields back on, so the request can be typed in the HPC register again
-- @category hpc_procurement
-- @actor ALICE
-- @region 1
-- @expect error 42501 permission denied
UPDATE register_fields SET is_active = true WHERE register_key = 'hpc' AND code IN ('request_no', 'request_date');
-- @end

-- @case HPC-07
-- @title Alice writes the in-service date of an HPC record into the typed table (closes nothing, but moves the RFI condition)
-- @category hpc_procurement
-- @actor ALICE
-- @region 1
-- @expect error 42501 permission denied
UPDATE hpc_records SET in_service_date = DATE '2026-01-01';
-- @end

-- @case HPC-08
-- @title Alice calls the task closer of a register record directly (approves C3 with a date of her choice)
-- @category hpc_procurement
-- @actor ALICE
-- @region 1
-- @expect error 42501 permission denied for function
SELECT reg_close_task(gen_random_uuid(), gen_random_uuid(), 'hpc_approval_date', '{{ALICE}}', true, false, NULL);
-- @end

-- @case HPC-09
-- @title Alice calls the final-approval closing of a record directly (C1 / C2 / C3 / C4 without the L2)
-- @category hpc_procurement
-- @actor ALICE
-- @region 1
-- @expect error 42501 permission denied for function
SELECT reg_complete_task(gen_random_uuid(), '{{ALICE}}', true, false);
-- @end

-- @case HPC-10
-- @title Alice projects a record into the typed tables directly
-- @category hpc_procurement
-- @actor ALICE
-- @region 1
-- @expect error 42501 permission denied for function
SELECT reg_apply(gen_random_uuid());
-- @end

-- @case HPC-11
-- @title Alice reads the HPC purchase request of a site through the internal link helper
-- @category hpc_procurement
-- @actor ALICE
-- @region 1
-- @expect error 42501 permission denied for function
SELECT * FROM reg_hpc_pr('{{SITE_BEN}}');
-- @end

-- @case HPC-12
-- @title An HPC Fiber Team member (L1 of the HPC scope row only) enters a CW order: refused by the database
-- @category hpc_procurement
-- @actor ADMIN
-- @region *
-- @expect error P0001 not_eligible_holder
SELECT idm_assign('{{CAROL}}', (SELECT id FROM roles WHERE code = 'HPC_TEAM'), 'entry', NULL, NULL, NULL, false, true, NULL, true, NULL,
  ARRAY[(SELECT id FROM permission_profiles WHERE code = 'data_entry')], 'Security case HPC-12');
\ctx CAROL
SELECT reg_save_record('procurement', NULL, NULL, '{{SITE_TRI}}', NULL, '{"scope": "CW", "order_status": "Open"}'::jsonb, NULL, NULL, false);
-- @end

-- @case HPC-13
-- @title The same member moves her own HPC draft to scope CW: refused by the database
-- @category hpc_procurement
-- @actor ADMIN
-- @region *
-- @expect error P0001 not_eligible_holder
SELECT idm_assign('{{CAROL}}', (SELECT id FROM roles WHERE code = 'HPC_TEAM'), 'entry', NULL, NULL, NULL, false, true, NULL, true, NULL,
  ARRAY[(SELECT id FROM permission_profiles WHERE code = 'data_entry')], 'Security case HPC-13');
\ctx CAROL
SELECT set_config('secsuite.rec', reg_save_record('procurement', NULL, NULL, '{{SITE_TRI}}', NULL, '{"scope": "HPC", "order_status": "Open"}'::jsonb, NULL, NULL, false)::text, true);
SELECT reg_save_record('procurement', current_setting('secsuite.rec')::uuid, 1, NULL, NULL, '{"scope": "CW"}'::jsonb, NULL, NULL, false);
-- @end

-- @case HPC-14
-- @title Control: the same member enters an HPC purchase request (allowed; rolled back)
-- @category hpc_procurement
-- @actor ADMIN
-- @region *
-- @expect output true
SELECT idm_assign('{{CAROL}}', (SELECT id FROM roles WHERE code = 'HPC_TEAM'), 'entry', NULL, NULL, NULL, false, true, NULL, true, NULL,
  ARRAY[(SELECT id FROM permission_profiles WHERE code = 'data_entry')], 'Security case HPC-14');
\ctx CAROL
SELECT (reg_save_record('procurement', NULL, NULL, '{{SITE_TRI}}', NULL, '{"scope": "HPC", "order_status": "Open"}'::jsonb, NULL, NULL, false) IS NOT NULL)::text;
-- @end

-- @case HPC-15
-- @title A System Admin enters scope HPC while the HPC scope row has a holder (the no-holder fallback of B10 does not apply)
-- @category hpc_procurement
-- @actor ADMIN
-- @region *
-- @expect error P0001 not_eligible_holder
SELECT idm_assign('{{CAROL}}', (SELECT id FROM roles WHERE code = 'HPC_TEAM'), 'entry', NULL, NULL, NULL, false, true, NULL, true, NULL,
  ARRAY[(SELECT id FROM permission_profiles WHERE code = 'data_entry')], 'Security case HPC-15');
SELECT reg_save_record('procurement', NULL, NULL, '{{SITE_TRI}}', NULL, '{"scope": "HPC", "order_status": "Open"}'::jsonb, NULL, NULL, false);
-- @end

-- @case HPC-16
-- @title Alice (Alpha) reads the reviewer warnings of a Bravo record: nothing comes back
-- @category hpc_procurement
-- @actor ADMIN
-- @region *
-- @expect output []
SELECT set_config('secsuite.rec', reg_save_record('procurement', NULL, NULL, '{{SITE_BEN}}', NULL,
  '{"scope": "HPC", "order_status": "Open", "pr_no": "B-1", "pr_date": "2026-01-10", "hpc_approval_date": "2026-01-05"}'::jsonb, NULL, NULL, false)::text, true);
\ctx ALICE
SELECT reg_warnings(current_setting('secsuite.rec')::uuid)::text;
-- @end
