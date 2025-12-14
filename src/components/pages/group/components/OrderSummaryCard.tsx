import React from 'react';
import {Button, Card, CardContent, CardHeader, CardTitle} from '@/components/ui';

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

export type UnitPrice = {
    id: string;
    name: string | null;
    unitAmount: number;
    currency: string;
    taxBehavior?: 'inclusive' | 'exclusive' | null
};

export function OrderSummaryCard(props: {
    title?: string;
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
        unitPrices,
        entries,
        canEdit,
        onCheckout,
        labels = {}
    } = props;

    const fmt2 = (cents: number) => (cents / 100).toFixed(2);
    const fmtPrice = (cents?: number | null) => typeof cents === 'number' ? `${fmt2(cents)} €` : '—';

    // Derive total members (persons) from entries (sum individuals and people inside groups)
    let totalMembers = 0;
    let singles = 0;
    let groupsCnt = 0;
    for (const e of (entries || [])) {
        if (!e) continue;
        if (e.type === 'person') {
            singles += 1;
            totalMembers += 1;
        } else if (e.type === 'group') {
            groupsCnt += 1;
            const ppl = Array.isArray(e.people) ? e.people.length : 0;
            totalMembers += ppl;
        }
    }

    // Helper: pricing table in EUR (cents) by member count
    const getUnitPriceCentsForCount = (count: number): number => {
        if (count <= 1) return 299;
        if (count === 2) return 289;
        if (count === 3) return 279;
        if (count === 4) return 269;
        if (count === 5) return 259;
        if (count === 6) return 249;
        if (count === 7) return 239;
        if (count === 8) return 229;
        if (count === 9) return 219;
        return 199; // 10+
    };

    // Build line items: if there are members, show a single consolidated line using dynamic per-person pricing
    let items: Array<{
        id: string;
        description: string;
        quantity: number;
        unit_amount: number;
        amount_total: number;
    }> = [];

    if (totalMembers > 0) {
        const unitCents = getUnitPriceCentsForCount(totalMembers);
        const description = labels.item || 'Item';
        items = [{
            id: 'per-person',
            description,
            quantity: totalMembers,
            unit_amount: unitCents,
            amount_total: unitCents * totalMembers,
        }];
    } else {
        // Fallback to original behavior when there are no members yet
        if (unitPrices.single && singles > 0) {
            items.push({
                id: unitPrices.single.id || 'single',
                description: unitPrices.single.name || (labels.item || 'Item'),
                quantity: singles,
                unit_amount: unitPrices.single.unitAmount,
                amount_total: unitPrices.single.unitAmount * singles,
            });
        }
        if (unitPrices.group && groupsCnt > 0) {
            items.push({
                id: unitPrices.group.id || 'group',
                description: unitPrices.group.name || (labels.item || 'Item'),
                quantity: groupsCnt,
                unit_amount: unitPrices.group.unitAmount,
                amount_total: unitPrices.group.unitAmount * groupsCnt,
            });
        }
    }

    const subtotal = items.reduce((acc, it) => acc + it.amount_total, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="divide-y">
                        {items.map((it) => (
                            <div key={it.id} className="flex items-center justify-between py-2 text-sm">
                                <div className="min-w-0">
                                    <div className="font-medium truncate" title={it.description}>{it.description}</div>
                                    <div className="text-gray-500">
                                        {(labels.qty || 'Qty')}: {it.quantity} · {(labels.unit || 'Unit')}: {fmtPrice(it.unit_amount)}
                                    </div>
                                </div>
                                <div className="font-medium">{fmtPrice(it.amount_total)}</div>
                            </div>
                        ))}
                        {items.length === 0 ? (
                            <div className="py-2 text-sm text-gray-500">{labels.item || 'Item'}: —</div>
                        ) : null}
                    </div>

                    <div className="mt-3 pt-3 border-t text-sm space-y-1">
                        {/* Subtotal omitted because VAT is unknown */}
                        <div className="flex justify-between font-semibold text-base">
                            <span>{labels.total || 'Total'}</span>
                            <span>{fmtPrice(subtotal)}</span>
                        </div>
                    </div>

                    {canEdit && onCheckout ? (
                        <div className="flex justify-end mt-4">
                            <Button onClick={onCheckout}>{labels.checkout || 'Checkout'}</Button>
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
