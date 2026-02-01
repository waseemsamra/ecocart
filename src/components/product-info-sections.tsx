'use client';

import React from 'react';
import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { ProductInfoSection } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

function InfoSection({ section }: { section: ProductInfoSection }) {
    return (
        <div>
            <h3 className="font-semibold uppercase tracking-wider">{section.title}</h3>
            <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{section.description}</p>
        </div>
    )
}

export function ProductInfoSections() {
  const db = useFirestore();

  const sectionsQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'productInfoSections'), orderBy('order', 'asc'));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: sections, isLoading } = useCollection<ProductInfoSection>(sectionsQuery);

  if (isLoading || !sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 text-sm">
        <Separator />
        {sections.map((section) => (
            <React.Fragment key={section.id}>
                <InfoSection section={section} />
                <Separator />
            </React.Fragment>
        ))}
    </div>
  );
}
