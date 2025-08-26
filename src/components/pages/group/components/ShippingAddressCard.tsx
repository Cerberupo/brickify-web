import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export type ShippingDetails = {
  name?: string | null;
  address?: any;
} | null | undefined;

export function ShippingAddressCard({ title = 'Shipping to', shipping }: { title?: string; shipping: ShippingDetails }) {
  const ship = shipping;
  if (!ship || (!ship.address && !ship.name)) return null;
  const addr = ship.address || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          {ship?.name ? <div className="font-medium">{ship.name}</div> : null}
          {addr.line1 ? <div>{addr.line1}</div> : null}
          {addr.line2 ? <div>{addr.line2}</div> : null}
          {(addr.postal_code || addr.city) ? <div>{addr.postal_code} {addr.city}</div> : null}
          {addr.state ? <div>{addr.state}</div> : null}
          {addr.country ? <div>{addr.country}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
