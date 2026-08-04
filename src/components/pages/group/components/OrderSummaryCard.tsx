import React from 'react';
import {Button, Card, CardContent, CardHeader, CardTitle} from '@/components/ui';
import {Coins} from 'lucide-react';

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
        entries,
        canEdit,
        onCheckout,
        labels = {}
    } = props;

    const fmt2 = (cents: number) => (cents / 100).toFixed(2);
    const fmtPrice = (cents?: number | null) => typeof cents === 'number' ? `${fmt2(cents)} $` : '—';

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

    const unitCents = getUnitPriceCentsForCount(totalMembers);
    const description = labels.item || 'Item';
    items = [{
        id: 'per-person',
        description,
        quantity: totalMembers,
        unit_amount: unitCents,
        amount_total: unitCents * totalMembers,
    }];

    const subtotal = items.reduce((acc, it) => acc + it.amount_total, 0);

    // Cost in credits
    const costPerPerson = 100;
    const totalCredits = totalMembers * costPerPerson;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="divide-y">
                        <div className="flex items-center justify-between py-2 text-sm">
                            <div className="min-w-0">
                                <div className="font-medium truncate">{labels.item || 'Item'}</div>
                                <div className="text-gray-500">
                                    {(labels.qty || 'Qty')}: {totalMembers} · {costPerPerson} {(labels.unit || 'Credits')}
                                </div>
                            </div>
                            <div className="font-medium flex items-center">
                                <Coins className="h-4 w-4 mr-1 text-yellow-500"/>
                                {totalCredits}
                            </div>
                        </div>
                    </div>


                    {canEdit && onCheckout ? (
                        <div className="flex justify-end mt-4">
                            <Button id="tour-checkout-btn" onClick={onCheckout} className="w-full sm:w-auto">
                                {labels.checkout || 'Process'}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
