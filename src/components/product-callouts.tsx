'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { ProductCallout } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function Callout({ callout }: { callout: ProductCallout }) {
    const disclaimerText = callout.description || "";
    const disclaimerParts = disclaimerText.split('(T&C Applied)');

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-semibold uppercase tracking-wider">{callout.title}</h3>
                    <p className="text-muted-foreground">
                        {disclaimerParts[0]}
                        {disclaimerParts.length > 1 && <span className="text-red-500">(T&C Applied)</span>}
                        {disclaimerParts[1]}
                    </p>
                </div>
                <Button variant="link" className="text-red-500 font-semibold">{callout.linkText}</Button>
            </div>
        </div>
    )
}

export function ProductCallouts() {
  const db = useFirestore();

  const calloutsQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'productCallouts'), orderBy('order', 'asc'));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: callouts, isLoading } = useCollection<ProductCallout>(calloutsQuery);

  if (isLoading || !callouts || callouts.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6 text-sm">
        <Separator />
        {callouts.map((callout) => (
            <React.Fragment key={callout.id}>
                <Callout callout={callout} />
                <Separator />
            </React.Fragment>
        ))}
    </div>
  );
}
