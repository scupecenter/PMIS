import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client as PgClient } from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { allLocked, open, q, taskId, taskRow } from './calc-helpers';
import { startApp, superDb } from './helpers';
import { G, POWERCO, HPC, HPC_PR, PROC, Team, createRec, patch, post, recPath, regCell, team } from './reg-helpers';
import { Actor, actor, setCell } from './wf-helpers';
import { partyWithContract } from './p4b-helpers';

/**
 * Migration 0042: the HPC fiber purchasing redesign (owner decision 2026-11-02) and Q91.
 *   - the HPC purchase request is a Procurement record of scope HPC, entered only by the holders of the Matrix row `procurement_hpc` (the HPC Fiber Team);
 *   - the HPC register holds execution only and is linked to the approved scope-HPC order;
 *   - C3 closes on the HPC approval date (its SLA runs from the PR issue), C4 on the in-service date, C1 on the POWERCO request date (Q91).
 * Region 7 and the register-cell lock of the other register suites. Dates are fixed past dates and every working-day count is asked from the database,
 * so nothing here depends on the weekday.
 */
let app: NestExpressApplication;
let db: PgClient;

beforeAll(async () => {
  app = await startApp();
  db = await superDb();
});
beforeEach(async () => {
  await db.query('SELECT pg_advisory_lock(770101)');
});
afterEach(async () => {
  await db.query('SELECT pg_advisory_unlock(770101)');
});
afterAll(async () => {
  await db.end();
  await app.close();
});

const R = 7;

interface HpcTeam {
  proc: Team;          // the Procurement team: entry, review and approve holders of the procurement row
  hpc: Team;           // the HPC Fiber Team on the same site: L1 and L2 of the procurement_hpc row (key = procurement)
  fiber: Team;         // the HPC register row (execution) on the same site
}

/** The Procurement row, the HPC scope row and the HPC register row in region R, all on one site with POWERCO and HPC scope on. */
async function hpcTeam(): Promise<HpcTeam> {
  const proc = await team(app, db, 'procurement', 'procurement', R);
  const entry = await actor(app, db, { level: 'entry', grants: G('procurement', 'view', 'create', 'edit'), regions: [R], modules: null });
  const approve = await actor(app, db, { level: 'approve', grants: G('procurement', 'view', 'approve'), regions: [R], modules: null });
  await regCell(db, 'procurement_hpc', R, 'entry', { user: [entry.user.id] });
  await regCell(db, 'procurement_hpc', R, 'approve', { user: [approve.user.id] });
  const fiberEntry = await actor(app, db, { level: 'entry', grants: G('hpc', 'view', 'create', 'edit'), regions: [R], modules: null });
  const fiberApprove = await actor(app, db, { level: 'approve', grants: G('hpc', 'view', 'approve'), regions: [R], modules: null });
  await regCell(db, 'hpc', R, 'entry', { user: [fiberEntry.user.id] });
  await regCell(db, 'hpc', R, 'approve', { user: [fiberApprove.user.id] });
  return {
    proc,
    hpc: { ...proc, entry, review: approve, approve },
    fiber: { key: 'hpc', site: proc.site, region: R, entry: fiberEntry, review: fiberApprove, approve: fiberApprove },
  };
}

/** Submits and approves a record with the given L1 and L2; returns the final body. */
async function pass(key: string, l1: Actor, l2: Actor, id: string, version: number): Promise<Record<string, any>> {
  let res = await post(l1.api, key, id, 'submit', version);
  if (res.status !== 200) throw new Error(`submit failed: ${res.status} ${JSON.stringify(res.body)}`);
  if (res.body.state === 'approved') return res.body as Record<string, any>;
  await l2.api.stepUp(l2.user.password);
  res = await post(l2.api, key, id, 'approve', res.body.version);
  if (res.status !== 200) throw new Error(`approve failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as Record<string, any>;
}

/** All tasks of the site locked, Site Release dated (gate G2 open), the given tasks open, and one stage approver on the cells of `codes`. */
async function withTasks(t: Team, codes: string[], opened: string[], modules: string[] = [t.key]): Promise<Actor> {
  await allLocked(db, t.site);
  await db.query(`UPDATE task_instances SET state = 'approved', actual_date = DATE '2025-12-01' WHERE id = $1`, [await taskId(db, t.site, 'MS1')]);
  for (const c of opened) await open(db, await taskId(db, t.site, c));
  const stageApprove = await actor(app, db, { level: 'approve', grants: modules.flatMap((m) => G(m, 'view', 'approve')), regions: [t.region], modules: null });
  for (const c of codes) await setCell(db, c, t.region, 'approve', { user: [stageApprove.user.id] });
  return stageApprove;
}

const codesOf = (body: { errors?: { code: string }[] }): string[] => (body.errors ?? []).map((e) => e.code).sort();
// 0057 (Q104): `list_other` marks a value outside a pending list that still accepts another value (the fixtures use Open and Exchange); the ordering warnings are what this suite checks
const warnOf = (body: { warnings?: { code: string }[] }): string[] => (body.warnings ?? []).map((e) => e.code).filter((c) => c !== 'list_other').sort();

describe('entry rights per scope (the database decides)', () => {
  it('lets only the HPC Fiber Team enter scope HPC, and keeps every other scope with the Procurement team', async () => {
    const { proc, hpc } = await hpcTeam();
    const mine = await hpc.entry.api.call('post', recPath('procurement'), { site_id: hpc.site.id, data: HPC_PR });
    expect(mine.status).toBe(201);
    expect(mine.body.allowed_actions).toEqual(expect.arrayContaining(['edit', 'submit']));
    // the HPC team cannot enter another scope
    const cw = await hpc.entry.api.call('post', recPath('procurement'), { site_id: hpc.site.id, data: PROC });
    expect(cw.status).toBe(403);
    expect(cw.body.code).toBe('not_eligible_holder');
    // the Procurement team cannot enter scope HPC, but still enters its own orders
    const theirs = await proc.entry.api.call('post', recPath('procurement'), { site_id: proc.site.id, data: HPC_PR });
    expect(theirs.status).toBe(403);
    expect(theirs.body.code).toBe('not_eligible_holder');
    const order = await proc.entry.api.call('post', recPath('procurement'), { site_id: proc.site.id, data: PROC });
    expect(order.status).toBe(201);

    // moving a draft to another team's scope is refused, and nothing is written
    const toCw = await patch(hpc.entry.api, 'procurement', mine.body.id, mine.body.version, { data: { scope: 'CW' } });
    expect(toCw.status).toBe(403);
    expect(toCw.body.code).toBe('not_eligible_holder');
    const toHpc = await patch(proc.entry.api, 'procurement', order.body.id, order.body.version, { data: { scope: 'HPC' } });
    expect(toHpc.status).toBe(403);
    expect((await q<{ scope: string }>(db, `SELECT data ->> 'scope' AS scope FROM register_records WHERE id = $1`, [order.body.id]))[0]!.scope).toBe('CW');
    // the Procurement team cannot edit the HPC draft either (its entry level is the HPC row's)
    const edit = await patch(proc.entry.api, 'procurement', mine.body.id, mine.body.version, { data: { remark: 'x' } });
    expect(edit.status).toBe(403);
    expect(edit.body.code).toBe('not_eligible_holder');
    expect((await proc.entry.api.call('get', recPath('procurement', mine.body.id))).body.allowed_actions).not.toContain('edit');

    // the catalogue tells each team which scopes it may enter (the form offers only those)
    const defOf = async (a: Actor) => (await a.api.call('get', '/registers')).body.items.find((i: { register_key: string }) => i.register_key === 'procurement');
    expect((await defOf(hpc.entry)).entry_scopes).toEqual(['HPC']);
    const procScopes = (await defOf(proc.entry)).entry_scopes as string[];
    expect(procScopes).toContain('CW');
    expect(procScopes).not.toContain('HPC');
    expect((await defOf(hpc.entry)).fields.find((f: { code: string }) => f.code === 'scope').options.map((o: { value: string }) => o.value)).toContain('HPC');
    // POWERCO stays in its own register (Q56)
    const powerco = await proc.entry.api.call('post', recPath('procurement'), { site_id: proc.site.id, data: { ...PROC, scope: 'POWERCO' } });
    expect(powerco.status).toBe(422);
    expect(codesOf(powerco.body)).toEqual(['wrong_register']);
  });

  it('routes the approval of an HPC request to the L2 of the HPC row (CW Team Lead by default), and its new versions to the HPC team', async () => {
    const { proc, hpc } = await hpcTeam();
    const rec = await createRec(hpc, HPC_PR);
    const sub = await post(hpc.entry.api, 'procurement', rec.id, 'submit', rec.version);
    expect(sub.status).toBe(200);
    expect(sub.body.state).toBe('in_approval');
    expect(sub.body.ball_in_court.holders.map((h: { ref_id: string }) => h.ref_id)).toEqual([hpc.approve.user.id]);
    await proc.approve.api.stepUp(proc.approve.user.password);
    const wrong = await post(proc.approve.api, 'procurement', rec.id, 'approve', sub.body.version);
    expect(wrong.status).toBe(403);
    expect(wrong.body.code).toBe('not_eligible_holder');
    await hpc.approve.api.stepUp(hpc.approve.user.password);
    const ok = await post(hpc.approve.api, 'procurement', rec.id, 'approve', sub.body.version);
    expect(ok.body.state).toBe('approved');
    const typed = await q<{ scope: string; pr_no: string; hpc_approval_date: string }>(db,
      `SELECT scope, pr_no, hpc_approval_date::text AS hpc_approval_date FROM procurement_records WHERE id = $1`, [rec.entity_id]);
    expect(typed[0]).toEqual({ scope: 'HPC', pr_no: 'HPR-1', hpc_approval_date: '2026-01-12' });

    // a new version: only the HPC team
    expect((await proc.entry.api.call('get', recPath('procurement', rec.id))).body.allowed_actions).not.toContain('new_version');
    expect((await post(proc.entry.api, 'procurement', rec.id, 'versions', ok.body.version)).body.code).toBe('not_eligible_holder');
    expect((await hpc.entry.api.call('get', recPath('procurement', rec.id))).body.allowed_actions).toContain('new_version');
    const v2 = await post(hpc.entry.api, 'procurement', rec.id, 'versions', ok.body.version);
    expect(v2.status).toBe(201);

    // the default holders of the HPC row: L1 = HPC Fiber Team, L2 = CW Team Lead (Q90)
    const seeded = await q<{ s: string }>(db, `SELECT string_agg(c.level || ':' || r.code, ',' ORDER BY c.level) AS s FROM matrix_cells c
      JOIN matrix_cell_assignees a ON a.cell_id = c.id JOIN roles r ON r.id = a.ref_id WHERE c.register_key = 'procurement_hpc' AND c.region_id IS NULL`);
    expect(seeded[0]!.s).toBe('1:HPC_TEAM,3:CW_TL');
  });
});

describe('the HPC purchase request in Procurement: fields and rules', () => {
  it('needs the PR No. and PR date, refuses a site whose HPC scope is N/A and an HPC approval date on another scope; an approval before the PR only warns', async () => {
    const { proc, hpc } = await hpcTeam();
    const bare = await createRec(hpc, { scope: 'HPC', order_status: 'Open' });
    const e1 = await post(hpc.entry.api, 'procurement', bare.id, 'submit', bare.version);
    expect(e1.status).toBe(422);
    expect(e1.body.errors.map((e: { path: string }) => e.path).sort()).toEqual(['/data/pr_date', '/data/pr_no']);
    // an actual date cannot be in the future
    const future = await hpc.entry.api.call('post', recPath('procurement'), { site_id: hpc.site.id, data: { ...HPC_PR, hpc_approval_date: '2035-12-30' } });
    expect(codesOf(future.body)).toEqual(['future_date']);
    // the HPC approval date belongs to scope HPC
    const cw = await createRec(proc, { ...PROC, hpc_approval_date: '2026-01-12' });
    expect(codesOf((await post(proc.entry.api, 'procurement', cw.id, 'submit', cw.version)).body)).toEqual(['hpc_scope_only']);
    // the warning of Q96: not blocking
    const early = await createRec(hpc, { ...HPC_PR, pr_no: 'HPR-2', hpc_approval_date: '2026-01-02' });
    expect(warnOf(early)).toEqual(['approval_before_pr']);
    const sub = await post(hpc.entry.api, 'procurement', early.id, 'submit', early.version);
    expect(sub.status).toBe(200);
    expect(warnOf(sub.body)).toEqual(['approval_before_pr']);
    // DQ07: no HPC request for a site without HPC fiber
    await db.query(`UPDATE sites SET scope_hpc_fiber = 'na' WHERE id = $1`, [hpc.site.id]);
    const na = await createRec(hpc, { ...HPC_PR, pr_no: 'HPR-3' });
    expect(codesOf((await post(hpc.entry.api, 'procurement', na.id, 'submit', na.version)).body)).toEqual(['scope_conflict']);
  });
});

describe('C3 closes from the approved HPC request on the HPC approval date (C-3 = PR issue -> HPC approval)', () => {
  it('starts the C3 clock at the PR issue, and closes C3 with the HPC approval date of the approved order', async () => {
    const { hpc } = await hpcTeam();
    const stage = await withTasks(hpc, ['C3'], ['C3']);
    expect((await taskRow(db, hpc.site, 'C3')).sla_start_date).toBeNull();                 // no PR yet: the clock waits for its start event
    // the PR without the HPC approval: approved on the register row, C3 stays open, its clock starts at the PR date
    const v1 = await createRec(hpc, { ...HPC_PR, hpc_approval_date: null });
    let res = await pass('procurement', hpc.entry, hpc.approve, v1.id, v1.version);
    expect(res.task).toBeUndefined();
    let c3 = await taskRow(db, hpc.site, 'C3');
    expect(c3).toMatchObject({ state: 'open', sla_start_date: '2026-01-05' });
    // the HPC approval date arrives in a new version: it is the source of C3 and goes to C3's L2
    const v2 = await post(hpc.entry.api, 'procurement', v1.id, 'versions', res.version);
    const v2b = await patch(hpc.entry.api, 'procurement', v2.body.id, v2.body.version, { data: { hpc_approval_date: '2026-01-12' } });
    res = (await post(hpc.entry.api, 'procurement', v2.body.id, 'submit', v2b.body.version)).body;
    expect(res.task.task_code).toBe('C3');
    expect(res.ball_in_court.holders.map((h: { ref_id: string }) => h.ref_id)).toEqual([stage.user.id]);
    await stage.api.stepUp(stage.user.password);
    res = (await post(stage.api, 'procurement', v2.body.id, 'approve', res.version)).body;
    expect(res.state).toBe('approved');
    c3 = await taskRow(db, hpc.site, 'C3');
    expect(c3).toMatchObject({ state: 'approved', actual_date: '2026-01-12', sla_start_date: '2026-01-05', sla_end_date: '2026-01-12' });
    const wd = await q<{ n: number }>(db, `SELECT cal_workdays_between(DATE '2026-01-05', DATE '2026-01-12', r.calendar_id) AS n FROM sla_rules r WHERE r.id = $1`, [c3.sla_rule_id]);
    expect(c3.sla_elapsed_wd).toBe(wd[0]!.n);
    expect((await q<{ s: string }>(db, `SELECT start_ref AS s FROM sla_rules WHERE id = $1`, [c3.sla_rule_id]))[0]!.s).toBe('PR:HPC');
    // C4 opened with C3 (its predecessor)
    expect((await taskRow(db, hpc.site, 'C4')).state).toBe('open');
  });

  it('refuses an HPC request with an approval date while C3 is still locked (Q92), and a CW order never closes C3', async () => {
    const { proc, hpc } = await hpcTeam();
    await allLocked(db, hpc.site);
    const rec = await createRec(hpc, HPC_PR);
    const sub = await post(hpc.entry.api, 'procurement', rec.id, 'submit', rec.version);
    expect(sub.status).toBe(409);
    expect(sub.body.detail).toContain('C3');
    // a CW order matches B1, not C3
    await open(db, await taskId(db, proc.site, 'B1'));
    const cw = await createRec(proc, PROC);
    const s2 = await post(proc.entry.api, 'procurement', cw.id, 'submit', cw.version);
    expect(s2.body.task.task_code).toBe('B1');
  });
});

describe('the HPC register: execution only, linked to the HPC request; C4 on the in-service date', () => {
  it('refuses the old request fields, links the approved HPC request, blocks the two date rules and warns on the rest (Q96)', async () => {
    const { hpc, fiber } = await hpcTeam();
    const old = await fiber.entry.api.call('post', recPath('hpc'), { site_id: fiber.site.id, data: { request_no: 'HR-1', request_date: '2026-01-05' } });
    expect(old.status).toBe(422);
    expect(codesOf(old.body)).toEqual(['unknown_field', 'unknown_field']);
    const forged = await fiber.entry.api.call('post', recPath('hpc'), { site_id: fiber.site.id, data: { pr_no: 'X' } });
    expect(codesOf(forged.body)).toEqual(['field_read_only']);                                  // the link is filled by the database (Q45)

    // before the HPC request is approved: no link, a warning for the reviewer
    const rec = await createRec(fiber, { ...HPC, installation_date: '2026-01-04', in_service_date: '2026-01-20' });
    expect(rec.data.procurement_record_id).toBeUndefined();
    expect(warnOf(rec)).toEqual(['before_link_received', 'in_service_without_test', 'no_approved_hpc_pr']);
    // the HPC request is approved: the next save (and the submit) links it
    const pr = await pass('procurement', hpc.entry, hpc.approve, (await createRec(hpc, HPC_PR)).id, 1);
    const linked = await patch(fiber.entry.api, 'hpc', rec.id, rec.version, { data: { remark: 'after the PR' } });
    expect(linked.body.data).toMatchObject({ procurement_record_id: pr.id, pr_no: 'HPR-1', hpc_approval_date: '2026-01-12' });
    expect(warnOf(linked.body)).toEqual(['before_hpc_approval', 'before_hpc_approval', 'before_link_received', 'in_service_without_test']);
    expect((await fiber.entry.api.call('get', '/registers')).body.items.find((i: { register_key: string }) => i.register_key === 'hpc')
      .fields.find((f: { code: string }) => f.code === 'pr_no').read_only).toBe(true);

    // the two blocking rules: the test is not before the installation, the operation is not before the test
    const bad1 = await patch(fiber.entry.api, 'hpc', rec.id, linked.body.version, { data: { installation_date: '2026-01-14', tx_link_tested_date: '2026-01-13', in_service_date: '2026-01-20' } });
    expect(codesOf((await post(fiber.entry.api, 'hpc', rec.id, 'submit', bad1.body.version)).body)).toEqual(['before_installation']);
    const bad2 = await patch(fiber.entry.api, 'hpc', rec.id, bad1.body.version, { data: { tx_link_tested_date: '2026-01-16', in_service_date: '2026-01-15' } });
    expect(codesOf((await post(fiber.entry.api, 'hpc', rec.id, 'submit', bad2.body.version)).body)).toEqual(['before_test']);
    // only warnings left: the submit passes, the approval projects the execution dates and the link
    const fine = await patch(fiber.entry.api, 'hpc', rec.id, bad2.body.version, { data: { link_received_date: '2026-01-13', in_service_date: '2026-01-18' } });
    expect(warnOf(fine.body)).toEqual([]);
    const done = await pass('hpc', fiber.entry, fiber.approve, rec.id, fine.body.version);
    expect(done.state).toBe('approved');
    const typed = await q(db, `SELECT link_received_date::text AS l, installation_date::text AS i, tx_link_tested_date::text AS t, in_service_date::text AS s,
      procurement_record_id::text AS p FROM hpc_records WHERE id = $1`, [rec.entity_id]);
    expect(typed[0]).toEqual({ l: '2026-01-13', i: '2026-01-14', t: '2026-01-16', s: '2026-01-18', p: pr.id });
  });

  it('closes C4 on the in-service date (not on the TX link test), after C3; C4 locked refuses the in-service record (Q92)', async () => {
    const { hpc, fiber } = await hpcTeam();
    const stage = await withTasks(hpc, ['C3', 'C4'], ['C3'], ['procurement', 'hpc']);
    // C4 is locked while C3 is open: an in-service record is refused, the draft is kept. Since 0063 (Q148) the execution dates are refused first, because the
    // HPC request of the site is not approved yet (C3 open).
    const early = await createRec(fiber, { ...HPC, installation_date: '2026-01-14', tx_link_tested_date: '2026-01-15', in_service_date: '2026-01-16' });
    const refused = await post(fiber.entry.api, 'hpc', early.id, 'submit', early.version);
    expect(refused.status).toBe(422);
    expect(codesOf(refused.body)).toEqual(['no_approved_hpc_pr']);
    // C3 closes with the HPC request; C4 opens
    const pr = await createRec(hpc, HPC_PR);
    let res = (await post(hpc.entry.api, 'procurement', pr.id, 'submit', pr.version)).body;
    await stage.api.stepUp(stage.user.password);
    res = (await post(stage.api, 'procurement', pr.id, 'approve', res.version)).body;
    expect((await taskRow(db, hpc.site, 'C3')).state).toBe('approved');
    expect((await taskRow(db, hpc.site, 'C4')).state).toBe('open');
    // a record with the TX link test only is not the source of C4 any more
    const testOnly = await patch(fiber.entry.api, 'hpc', early.id, early.version, { data: { in_service_date: null } });
    res = (await post(fiber.entry.api, 'hpc', early.id, 'submit', testOnly.body.version)).body;
    expect(res.task).toBeUndefined();
    await fiber.approve.api.stepUp(fiber.approve.user.password);
    res = (await post(fiber.approve.api, 'hpc', early.id, 'approve', res.version)).body;
    expect((await taskRow(db, hpc.site, 'C4')).state).toBe('open');
    // the in-service date in a new version closes C4 with that date
    const v2 = await post(fiber.entry.api, 'hpc', early.id, 'versions', res.version);
    const v2b = await patch(fiber.entry.api, 'hpc', v2.body.id, v2.body.version, { data: { in_service_date: '2026-01-19' } });
    res = (await post(fiber.entry.api, 'hpc', v2.body.id, 'submit', v2b.body.version)).body;
    expect(res.task.task_code).toBe('C4');
    res = (await post(stage.api, 'hpc', v2.body.id, 'approve', res.version)).body;
    expect(res.state).toBe('approved');
    expect(await taskRow(db, hpc.site, 'C4')).toMatchObject({ state: 'approved', actual_date: '2026-01-19' });
  });

  it('keeps the HPC request data entered before 0042 readable, carries it into new versions and counts it as a request until Procurement has one', async () => {
    const { hpc, fiber } = await hpcTeam();
    const rec = await pass('hpc', fiber.entry, fiber.approve, (await createRec(fiber, HPC)).id, 1);
    // what a record of before the migration holds (written as the migration role)
    await db.query(`UPDATE register_records SET data = data || '{"request_no": "HR-OLD", "request_date": "2025-12-20"}'::jsonb WHERE id = $1`, [rec.id]);
    await db.query(`UPDATE hpc_records SET request_no = 'HR-OLD', request_date = DATE '2025-12-20' WHERE id = $1`, [rec.entity_id]);
    expect((await fiber.entry.api.call('get', recPath('hpc', rec.id))).body.data).toMatchObject({ request_no: 'HR-OLD', request_date: '2025-12-20' });
    const prs = async () => (await q<{ k: string; n: string }>(db, `SELECT register_key AS k, request_no AS n FROM v_purchase_requests WHERE site_id = $1 ORDER BY register_key`, [fiber.site.id]));
    expect(await prs()).toEqual([{ k: 'hpc', n: 'HR-OLD' }]);
    // a new version carries the old request, which cannot be changed any more
    const v2 = await post(fiber.entry.api, 'hpc', rec.id, 'versions', rec.version);
    expect(v2.body.data).toMatchObject({ request_no: 'HR-OLD', request_date: '2025-12-20' });
    expect(codesOf((await patch(fiber.entry.api, 'hpc', v2.body.id, v2.body.version, { data: { request_no: 'HR-NEW' } })).body)).toEqual(['unknown_field']);
    // (0063, Q148: an execution date would need the approved HPC request first, so the new version records the handover from HPC)
    const v2b = await patch(fiber.entry.api, 'hpc', v2.body.id, v2.body.version, { data: { link_received_date: '2026-01-20' } });
    await pass('hpc', fiber.entry, fiber.approve, v2.body.id, v2b.body.version);
    expect((await q(db, `SELECT request_no, link_received_date::text AS l FROM hpc_records WHERE id = $1`, [rec.entity_id]))[0]).toEqual({ request_no: 'HR-OLD', l: '2026-01-20' });
    // once the HPC team has entered the request in Procurement, it is counted there only
    await pass('procurement', hpc.entry, hpc.approve, (await createRec(hpc, HPC_PR)).id, 1);
    expect(await prs()).toEqual([{ k: 'procurement', n: 'HPR-1' }]);
  });
});

describe('Q91: an approved POWERCO request closes C1 with the request date', () => {
  it('closes C1 and, in the same approval, C2 when the record also holds the Power-On date and C2 has the same L2', async () => {
    const g = await team(app, db, 'powerco', 'powerco', R);
    const stage = await withTasks(g, ['C1', 'C2'], ['C1']);
    // 0061 (Q146): approved with its POWERCO party and an active contract for POWERCO
    const rec = await createRec(g, { ...POWERCO, installation_finish: '2026-01-20', power_on_date: '2026-01-25' }, { external_party_id: await partyWithContract(db, { type: 'powerco', scopes: ['POWERCO'] }) });
    let res = (await post(g.entry.api, 'powerco', rec.id, 'submit', rec.version)).body;
    expect(res.task.task_code).toBe('C1');
    await stage.api.stepUp(stage.user.password);
    res = (await post(stage.api, 'powerco', rec.id, 'approve', res.version)).body;
    expect(res.state).toBe('approved');
    expect(await taskRow(db, g.site, 'C1')).toMatchObject({ state: 'approved', actual_date: '2026-01-05' });
    expect(await taskRow(db, g.site, 'C2')).toMatchObject({ state: 'approved', actual_date: '2026-01-25' });
    const steps = await q<{ note: string }>(db, `SELECT note FROM workflow_steps WHERE task_id = $1 AND action = 'approve'`, [await taskId(db, g.site, 'C2')]);
    expect(steps[0]!.note).toContain('same approval as C1');
  });

  it('leaves C2 open when its L2 is someone else, and refuses the request while C1 is locked (Q92)', async () => {
    const g = await team(app, db, 'powerco', 'powerco', R);
    const stage = await withTasks(g, ['C1'], ['C1']);
    const other = await actor(app, db, { level: 'approve', grants: G('powerco', 'view', 'approve'), regions: [R], modules: null });
    await setCell(db, 'C2', R, 'approve', { user: [other.user.id] });
    const rec = await createRec(g, { ...POWERCO, power_on_date: '2026-01-25' }, { external_party_id: await partyWithContract(db, { type: 'powerco', scopes: ['POWERCO'] }) });   // 0061 (Q146)
    const sub = (await post(g.entry.api, 'powerco', rec.id, 'submit', rec.version)).body;
    await stage.api.stepUp(stage.user.password);
    expect((await post(stage.api, 'powerco', rec.id, 'approve', sub.version)).body.state).toBe('approved');
    expect((await taskRow(db, g.site, 'C1')).state).toBe('approved');
    expect((await taskRow(db, g.site, 'C2')).state).toBe('open');
    const au = await q(db, `SELECT 1 FROM audit_log WHERE entity_type = 'register_record' AND entity_id = $1 AND action = 'register_record_task_left_open'`, [rec.id]);
    expect(au.length).toBe(1);

    const locked = await team(app, db, 'powerco', 'powerco', R);
    await allLocked(db, locked.site);
    const r2 = await createRec(locked, POWERCO);
    const s2 = await post(locked.entry.api, 'powerco', r2.id, 'submit', r2.version);
    expect(s2.status).toBe(409);
    expect(s2.body.detail).toContain('C1');
  });
});
