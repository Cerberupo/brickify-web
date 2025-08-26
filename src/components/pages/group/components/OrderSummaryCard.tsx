import React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export type PurchaseDetails = {
  line_items?: Array<{
    id: string;
    description: string | null;
    quantity: number;
    currency: string | null;
    unit_amount: number | null;
    amount_subtotal: number | null;
    amount_total: number | null;
  }> | null;
  amount_subtotal?: number | null;
  amount_total?: number | null;
  total_details?: { amount_discount?: number; amount_shipping?: number; amount_tax?: number } | null;
} | null | undefined;

export type UnitPrice = { id: string; name: string | null; unitAmount: number; currency: string; taxBehavior?: 'inclusive' | 'exclusive' | null };

export function OrderSummaryCard(props: {
  title?: string;
  purchase?: PurchaseDetails;
  unitPrices: { single: UnitPrice | null; group: UnitPrice | null };
  entries: any[];
  canEdit: boolean;
  onCheckout?: () => void;
  labels?: {
    orderSummary?: string;
    item?: string;
    qty?: string;
    unit?: string;
    subtotal?: string;
    shipping?: string;
    discount?: string;
    tax?: string;
    total?: string;
    subtotalExclVat?: string;
    vatNote?: string;
    subtotalInclVat?: string;
    vatIncluded?: string;
    checkout?: string;
  };
}) {
  const {
    title = 'Order Summary',
    purchase,
    unitPrices,
    entries,
    canEdit,
    onCheckout,
    labels = {}
  } = props;

  const fmt = (cents?: number | null) => typeof cents === 'number' ? `${(cents / 100).toFixed(2)} €` : '—';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {purchase ? (
          <div className="space-y-2">
            <div className="divide-y">
              {(purchase.line_items || []).map((it) => (
                <div key={it.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate" title={it.description || ''}>{it.description || labels.item || 'Item'}</div>
                    <div className="text-gray-500">
                      {(labels.qty || 'Qty')}: {it.quantity} · {(labels.unit || 'Unit')}: {fmt(it.unit_amount)}
                    </div>
                  </div>
                  <div className="font-medium">{fmt(it.amount_total)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t text-sm space-y-1">
              <div className="flex justify-between"><span>{labels.subtotal || 'Subtotal'}</span><span>{fmt(purchase?.amount_subtotal)}</span></div>
              {((purchase?.total_details?.amount_shipping ?? 0) > 0) ? (
                <div className="flex justify-between"><span>{labels.shipping || 'Shipping'}</span><span>{fmt(purchase?.total_details?.amount_shipping)}</span></div>
              ) : null}
              {((purchase?.total_details?.amount_discount ?? 0) > 0) ? (
                <div className="flex justify-between"><span>{labels.discount || 'Discount'}</span><span>- {fmt(purchase?.total_details?.amount_discount)}</span></div>
              ) : null}
              <div className="flex justify-between"><span>{labels.tax || 'Tax'}</span><span>{fmt(purchase?.total_details?.amount_tax ?? 0)}</span></div>
              <div className="flex justify-between font-semibold text-base"><span>{labels.total || 'Total'}</span><span>{fmt(purchase?.amount_total)}</span></div>
            </div>
            {canEdit && onCheckout ? (
              <div className="flex justify-end mt-4">
                <Button onClick={onCheckout}>{labels.checkout || 'Checkout'}</Button>
              </div>
            ) : null}
          </div>
        ) : (
          (() => {
            let singles = 0;
            let groupsCnt = 0;
            for (const e of (entries || [])) {
              if (!e) continue;
              if (e.type === 'person') singles += 1;
              else if (e.type === 'group') groupsCnt += 1;
            }
            const singlePrice = unitPrices.single?.unitAmount ?? 0; // cents
            const groupPrice = unitPrices.group?.unitAmount ?? 0; // cents
            const subtotalCents = singles * singlePrice + groupsCnt * groupPrice;
            const fmt2 = (cents: number) => (cents / 100).toFixed(2);
            const fmtPrice = (cents: number) => `${fmt2(cents)} €`;
            const behaviorSingle = unitPrices.single?.taxBehavior;
            const behaviorGroup = unitPrices.group?.taxBehavior;
            const knownBehaviors = [behaviorSingle, behaviorGroup].filter((b): b is 'inclusive' | 'exclusive' => !!b);
            // Default to inclusive when no behavior is known; otherwise require all known to be inclusive
            const inclusiveMode = knownBehaviors.length === 0 ? true : knownBehaviors.every(b => b === 'inclusive');
            const subtotalLabel = inclusiveMode ? (labels.subtotalInclVat || 'Subtotal (incl. VAT)') : (labels.subtotalExclVat || 'Subtotal (excl. VAT)');
            const noteCopy = inclusiveMode ? (labels.vatIncluded || 'VAT included in price') : (labels.vatNote || 'VAT is calculated at checkout');
            return (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{unitPrices.single?.name || (labels.qty || 'Qty') + `: ${singles}`}</span>
                  <span>{unitPrices.single ? `${fmtPrice(singlePrice)} x ${singles} = ${fmtPrice(singlePrice * singles)}` : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{unitPrices.group?.name || (labels.qty || 'Qty') + `: ${groupsCnt}`}</span>
                  <span>{unitPrices.group ? `${fmtPrice(groupPrice)} x ${groupsCnt} = ${fmtPrice(groupPrice * groupsCnt)}` : '—'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <span className="text-base font-medium">{subtotalLabel}</span>
                  <span className="text-lg font-bold">{`${fmt2(subtotalCents)} €`}</span>
                </div>
                <div className="text-xs text-gray-500">{noteCopy}</div>
                {canEdit && onCheckout ? (
                  <div className="flex justify-end mt-4">
                    <Button onClick={onCheckout}>{labels.checkout || 'Checkout'}</Button>
                  </div>
                ) : null}
              </div>
            );
          })()
        )}
      </CardContent>
    </Card>
  );
}
