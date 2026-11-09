import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './client';
import type { components } from './schema';
import type { RegisterRecord } from './types';

/**
 * Work package P4c (contract 0.12.11, migration 0063): the HPC purchase requests of an HPC record (Q150), the Dismantle order picker (Q114), the one-time
 * migration of the legacy HPC requests (Q139) and the POWERCO order warnings (Q151).
 */
type S = components['schemas'];
export type HpcPurchaseRequests = S['HpcPurchaseRequests'];
export type HpcLegacyMigration = S['HpcLegacyMigration'];
export type DismantleOrderOption = S['DismantleOrderOption'];
export type PowercoOrderWarnings = S['PowercoOrderWarnings'];
export type PowercoOrderWarningsInput = S['PowercoOrderWarningsInput'];

/** PUT /registers/hpc/records/{id}/purchase-requests (If-Match = record version). */
export function useSetHpcPurchaseRequests() {
  const qc = useQueryClient();
  return useMutation<RegisterRecord, ApiError, { record: RegisterRecord; ids: string[] }>({
    mutationFn: ({ record, ids }) => api.put(`/registers/hpc/records/${record.id}/purchase-requests`, { version: record.version, body: { procurement_entity_ids: ids } }),
    onSuccess: (r) => qc.setQueryData(['register-record', 'hpc', r.id], r),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['register-records', 'hpc'] }),
  });
}

/** GET /registers/dismantle/order-options: the approved, active orders of the site for the part. */
export const useDismantleOrders = (siteId: string | null | undefined, part: string | null | undefined) =>
  useQuery({
    queryKey: ['dismantle-orders', siteId, part], enabled: !!siteId && (part === 'cw' || part === 'te'),
    queryFn: () => api.get<{ items: DismantleOrderOption[] }>('/registers/dismantle/order-options', { query: { site_id: siteId!, record_type: part! } }).then((r) => r.items),
  });

/** POST /registers/hpc/legacy-migration: the preview (dry_run) or the run (reason; the server asks for a step-up). */
export function useHpcLegacyMigration() {
  const qc = useQueryClient();
  return useMutation<HpcLegacyMigration, ApiError, { dry_run: boolean; reason?: string }>({
    mutationFn: (body) => api.post('/registers/hpc/legacy-migration', { body }),
    onSettled: (_d, _e, v) => { if (!v.dry_run) void qc.invalidateQueries({ queryKey: ['register-records', 'procurement'] }); },
  });
}

export const usePowercoOrderWarnings = () => useQuery({ queryKey: ['powercoOrderWarnings'], queryFn: () => api.get<PowercoOrderWarnings>('/settings/powerco-order-warnings') });
export function useSetPowercoOrderWarnings() {
  const qc = useQueryClient();
  return useMutation<PowercoOrderWarnings, ApiError, { version: number; body: PowercoOrderWarningsInput & { reason: string } }>({
    mutationFn: ({ version, body }) => api.put('/settings/powerco-order-warnings', { version, body }),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['powercoOrderWarnings'] }),
  });
}
