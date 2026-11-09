import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { api, API_BASE } from '@/api/client';
import type { Matrix, RegisterDefinition, RegisterRecord } from '@/api/types';
import { defaultsFor, forEntry, isHidden, sectionsFor, validateRecord } from '@/lib/registerForms';
import { recId, REGISTER_DEFS } from '@/mocks/registersData';
import { server } from '@/mocks/server';
import { renderApp, signIn } from '@/test/utils';
import { RegisterPage } from './Register';

/**
 * Migration 0042 / contract 0.9.0: the HPC purchase request is a Procurement record of scope HPC (entered by the HPC Fiber Team), the HPC register holds
 * the execution only and links its purchase request, and non-blocking ordering issues come as RegisterRecord.warnings (Q96).
 */
const Routed = () => <Routes><Route path="/registers/:key" element={<RegisterPage />} /></Routes>;
const at = (key: string, q = '') => ({ route: `/registers/${key}${q}` });
const def = (key: string): RegisterDefinition => REGISTER_DEFS.find((d) => d.register_key === key)!;
const scopeValues = () => within(screen.getByTestId('reg-field-scope')).getAllByRole('option').map((o) => (o as HTMLOptionElement).value).filter(Boolean);

describe('form rules of the HPC redesign', () => {
  it('shows the HPC approval date only on scope HPC, and hides the pointer of an HPC record (shown as a link)', () => {
    const p = def('procurement');
    expect(isHidden('procurement', 'hpc_approval_date', { scope: 'CW' })).toBe(true);
    expect(isHidden('procurement', 'hpc_approval_date', { scope: 'HPC' })).toBe(false);
    expect(sectionsFor(p, { scope: 'CW' }).flatMap((s) => s.fields.map((f) => f.code))).not.toContain('hpc_approval_date');
    expect(sectionsFor(p, { scope: 'HPC' }).flatMap((s) => s.fields.map((f) => f.code))).toContain('hpc_approval_date');
    const h = sectionsFor(def('hpc'), {});
    expect(h.map((s) => s.id)).toEqual(['purchase_request', 'fiber_status', 'install', 'in_service', 'remark']);
    expect(h.flatMap((s) => s.fields.map((f) => f.code))).not.toContain('procurement_record_id');
    expect(def('hpc').fields.filter((f) => f.read_only).map((f) => f.code)).toEqual(['pr_no', 'hpc_approval_date', 'procurement_record_id']);
    expect(def('hpc').fields.map((f) => f.code)).not.toContain('request_no');
  });

  it('offers only the scopes the caller may enter, and presets the only one', () => {
    const p = def('procurement');
    const hpcTeam = { ...p, entry_scopes: ['HPC'] };
    expect(forEntry(hpcTeam).fields.find((f) => f.code === 'scope')!.options!.map((o) => o.value)).toEqual(['HPC']);
    expect(defaultsFor('procurement', hpcTeam)).toEqual({ scope: 'HPC' });
    const procTeam = { ...p, entry_scopes: ['CW', 'Tower Erection'] };
    expect(forEntry(procTeam).fields.find((f) => f.code === 'scope')!.options!.map((o) => o.value)).toEqual(['CW', 'Tower Erection']);
    expect(defaultsFor('procurement', procTeam)).toEqual({});
    expect(forEntry(p)).toBe(p);                                                      // no list: the server decides
    const none = { ...p, entry_scopes: [] };
    expect(forEntry(none)).toBe(none);
  });

  it('needs the PR No. and PR date of an HPC request, and refuses a future HPC approval date', () => {
    const codes = (data: Record<string, unknown>) => validateRecord(def('procurement'), data, 'site', '2026-10-30');
    expect(Object.keys(codes({ scope: 'HPC', order_status: 'Open' })).sort()).toEqual(['pr_date', 'pr_no']);
    expect(codes({ scope: 'HPC', order_status: 'Open', pr_no: 'H', pr_date: '2026-10-01', hpc_approval_date: '2026-11-15' }).hpc_approval_date?.code).toBe('future_date');
    expect(codes({ scope: 'CW', order_status: 'Open' })).toEqual({});
  });
});

describe('the Procurement screen for the HPC Fiber Team', () => {
  it('offers scope HPC only (preset), with the HPC approval date, and saves the request', async () => {
    await signIn('pm');
    // the catalogue as the API serves it to an HPC Fiber Team member (contract 0.9.0: entry_scopes)
    server.use(http.get(`${API_BASE}/registers`, () => HttpResponse.json({ items: [{ ...def('procurement'), entry_scopes: ['HPC'], record_count: 0 }] })));
    renderApp(<Routed />, at('procurement'));
    const u = userEvent.setup();
    expect(await screen.findByTestId('register-owner-note')).toHaveTextContent(/HPC Fiber Team enters the HPC purchase requests here/);
    await u.click(screen.getByTestId('register-new'));
    await u.type(await screen.findByTestId('reg-site-search'), 'WM103');
    await u.click(await screen.findByTestId('reg-site-opt-WM103'));
    expect(scopeValues()).toEqual(['HPC']);
    expect(screen.getByTestId('reg-field-scope')).toHaveValue('HPC');
    expect(screen.getByTestId('reg-field-hpc_approval_date')).toBeInTheDocument();
    await u.click(screen.getByTestId('reg-submit'));
    expect(await screen.findByTestId('reg-error-pr_no')).toBeInTheDocument();
    expect(screen.getByTestId('reg-error-pr_date')).toBeInTheDocument();
    await u.type(screen.getByTestId('reg-field-pr_no'), 'HPR-2026-090');
    await u.type(screen.getByTestId('reg-field-pr_date'), '2026-10-01');
    await u.type(screen.getByTestId('reg-field-hpc_approval_date'), '2026-10-08');
    await u.click(screen.getByTestId('reg-save'));
    await waitFor(() => expect(screen.getByTestId('toast')).toHaveTextContent(/Saved/i));
    const list = await api.get<{ items: RegisterRecord[] }>('/registers/procurement/records', { query: { q: 'HPR-2026-090' } });
    expect(list.items[0]!.data).toMatchObject({ scope: 'HPC', pr_no: 'HPR-2026-090', hpc_approval_date: '2026-10-08' });
  });

  it('lists the HPC scope beside the others for someone who may enter every scope, and hides the HPC approval date until HPC is chosen', async () => {
    await signIn('pm');
    renderApp(<Routed />, at('procurement'));
    const u = userEvent.setup();
    await u.click(await screen.findByTestId('register-new'));
    await screen.findByTestId('reg-field-scope');
    expect(scopeValues()).toEqual(expect.arrayContaining(['CW', 'HPC']));
    expect(screen.queryByTestId('reg-field-hpc_approval_date')).not.toBeInTheDocument();
    await u.selectOptions(screen.getByTestId('reg-field-scope'), 'HPC');
    expect(screen.getByTestId('reg-field-hpc_approval_date')).toBeInTheDocument();
  });

  it('shows the Matrix row of the HPC scope (L1 HPC Fiber Team, L2 CW Team Lead) in the mock matrix', async () => {
    await signIn('pm');
    const m = await api.get<Matrix>('/matrix');
    const codes = m.stages.map((r) => r.code);
    expect(codes.indexOf('procurement_hpc')).toBe(codes.indexOf('procurement') + 1);
    const row = m.stages.find((r) => r.code === 'procurement_hpc')!;
    expect(row.cells.find((c) => c.level === 1)!.assignees.map((a) => a.employee_id)).toEqual(['1207']);
    expect(row.cells.find((c) => c.level === 3)!.assignees.map((a) => a.employee_id)).toEqual(['1203']);
  });
});

describe('the HPC register screen: execution only, with the link to the purchase request', () => {
  it('links the approved HPC purchase request in Procurement and shows its HPC approval', async () => {
    await signIn('pm');
    renderApp(<Routed />, at('hpc', `?record=${recId(7)}`));
    const link = await screen.findByTestId('reg-hpc-pr-link');
    expect(link).toHaveTextContent('HPR-2026-044');
    expect(link.getAttribute('href')).toBe(`/registers/procurement?record=${recId(14)}`);
    expect(screen.getByTestId('reg-hpc-pr-approval')).toHaveTextContent('2026-09-14');
    expect(screen.queryByTestId('reg-hpc-legacy')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reg-warnings')).not.toBeInTheDocument();
    expect(screen.getByTestId('reg-section-install')).toHaveTextContent(/Link Received/);
    expect(screen.queryByText('HPC Request No.')).not.toBeInTheDocument();
  });

  it('keeps a request entered before the move readable, and warns the reviewer that Procurement has no HPC request yet', async () => {
    await signIn('pm');
    renderApp(<Routed />, at('hpc', `?record=${recId(8)}`));
    expect(await screen.findByTestId('reg-hpc-legacy')).toHaveTextContent('HPC-2026-031');
    expect(screen.getByTestId('reg-hpc-pr-missing')).toBeInTheDocument();
    expect(screen.getByTestId('reg-warning-no_approved_hpc_pr')).toHaveTextContent(/no approved HPC purchase request/);
  });

  it('names the field of a warning the server sends, and shows the server sentence for an unknown code', async () => {
    await signIn('pm');
    const real = await api.get<RegisterRecord>(`/registers/hpc/records/${recId(7)}`);
    server.use(http.get(`${API_BASE}/registers/hpc/records/${recId(7)}`, () => HttpResponse.json({ ...real, warnings: [
      { path: '/data/installation_date', code: 'before_hpc_approval', message: 'x' },
      { path: '/data/remark', code: 'something_new', message: 'A sentence from the server.' },
    ] })));
    renderApp(<Routed />, at('hpc', `?record=${recId(7)}`));
    expect(await screen.findByTestId('reg-warning-before_hpc_approval')).toHaveTextContent('Installation Date is before the HPC approval date.');
    expect(screen.getByTestId('reg-warning-something_new')).toHaveTextContent('A sentence from the server.');
  });
});
