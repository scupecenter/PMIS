import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePowercoOrderWarnings, useSetPowercoOrderWarnings, type PowercoOrderWarningsInput } from '@/api/p4c';
import { errText, FormDialog } from '@/components/FormDialog';
import { useToast } from '@/components/Toast';
import { fieldErrors } from '@/lib/fields';

/**
 * Settings, POWERCO order warnings (contract 0.12.11, Q151). Each chain lists POWERCO dates in their expected order; a later step dated before an earlier one
 * warns the reviewer (never blocks). The step order and the billing event are to be confirmed by the POWERCO team, so the setting is off by default.
 */
export function PowercoOrderWarnings() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const q = usePowercoOrderWarnings(), set = useSetPowercoOrderWarnings();
  const [draft, setDraft] = useState<PowercoOrderWarningsInput | null>(null);
  const [open, setOpen] = useState(false);
  const cur: PowercoOrderWarningsInput | null = draft ?? (q.data ? { enabled: q.data.enabled, chains: q.data.chains, billing_after: q.data.billing_after ?? null } : null);
  const errs = fieldErrors(set.error);
  if (!cur || !q.data) return <section className="card p-4" data-testid="page-powerco-order">…</section>;
  const fields = q.data.fields;
  const label = (code: string) => { const f = fields.find((x) => x.code === code); return (i18n.language === 'ar' && f?.label_ar) || f?.label_en || code; };
  const setChain = (i: number, chain: string[]) => setDraft({ ...cur, chains: cur.chains.map((c, j) => (j === i ? chain : c)) });

  return (
    <section className="card space-y-3 p-4" data-testid="page-powerco-order">
      <h2 className="font-bold">{t('powercoOrder.title')}</h2>
      <p className="text-sm text-mute">{t('powercoOrder.note')}</p>
      <p className="mono text-xs text-mute" data-testid="gow-version">{t('scopeMatch.version', { version: q.data.version })}{draft && <span className="chip ms-2">{t('scopeMatch.unsaved')}</span>}</p>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" data-testid="gow-enabled" checked={cur.enabled} onChange={(e) => setDraft({ ...cur, enabled: e.target.checked })} />{t('powercoOrder.enabled')}
      </label>
      {cur.chains.map((chain, i) => (
        <fieldset key={i} className="rounded-md border border-line p-2" data-testid={`gow-chain-${i}`}>
          <legend className="px-1 text-sm font-semibold">{t('powercoOrder.chain', { n: i + 1 })}</legend>
          <ol className="flex flex-wrap items-center gap-1 text-sm">
            {chain.map((code, j) => (
              <li key={`${code}-${j}`} className="chip bg-card2" data-testid={`gow-step-${i}-${j}`}>
                {j > 0 && <span aria-hidden className="text-mute">≤ </span>}{label(code)}
                <button type="button" className="btn btn-ghost p-0.5" aria-label={t('scopeMatch.remove', { name: label(code) })} data-testid={`gow-remove-${i}-${j}`}
                  onClick={() => setChain(i, chain.filter((_, k) => k !== j))}><X size={12} /></button>
              </li>
            ))}
            <li>
              <select className="input w-auto" aria-label={t('powercoOrder.add_step')} data-testid={`gow-add-${i}`} value="" onChange={(e) => e.target.value && setChain(i, [...chain, e.target.value])}>
                <option value="">{t('powercoOrder.add_step')}</option>
                {fields.filter((f) => !chain.includes(f.code)).map((f) => <option key={f.code} value={f.code}>{label(f.code)}</option>)}
              </select>
            </li>
          </ol>
          {errs[`/chains/${i}`] && <p role="alert" className="text-xs text-lateInk">{t(`fieldError.${errs[`/chains/${i}`]}`)}</p>}
          <button type="button" className="btn btn-ghost mt-1 text-sm" data-testid={`gow-remove-chain-${i}`} onClick={() => setDraft({ ...cur, chains: cur.chains.filter((_, k) => k !== i) })}>{t('powercoOrder.remove_chain')}</button>
        </fieldset>
      ))}
      <button type="button" className="btn" data-testid="gow-add-chain" disabled={cur.chains.length >= 10} onClick={() => setDraft({ ...cur, chains: [...cur.chains, []] })}><Plus size={14} />{t('powercoOrder.add_chain')}</button>
      <label className="block text-sm font-semibold">{t('powercoOrder.billing_after')}
        <select className="input mt-1 font-normal" data-testid="gow-billing" value={cur.billing_after ?? ''} onChange={(e) => setDraft({ ...cur, billing_after: e.target.value || null })}>
          <option value="">{t('powercoOrder.billing_none')}</option>
          {fields.filter((f) => f.code !== 'billing_conversion_date').map((f) => <option key={f.code} value={f.code}>{label(f.code)}</option>)}
        </select>
      </label>
      <button className="btn btn-accent" data-testid="gow-save" disabled={!draft || cur.chains.some((c) => c.length < 2)} onClick={() => setOpen(true)}>{t('scopeMatch.save')}</button>
      {open && (
        <FormDialog open onClose={() => setOpen(false)} testid="gow-dialog" title={t('powercoOrder.title')} busy={set.isPending} error={set.isError ? errText(set.error, t) : null}
          onSubmit={(reason) => set.mutate({ version: q.data!.version, body: { ...cur, reason } }, { onSuccess: () => { toast(t('settings.audited')); setOpen(false); setDraft(null); } })} />
      )}
    </section>
  );
}
