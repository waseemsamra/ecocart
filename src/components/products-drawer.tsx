'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { collection, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Category } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/context/auth-context';

export function ProductsDrawer({ onLinkClick }: { onLinkClick?: () => void }) {
  const { loading: authLoading } = useAuth();
  const db = useFirestore();

  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'categories'));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: categories, isLoading: isLoadingData, error } = useCollection<Category>(categoriesQuery);
  const isLoading = authLoading || isLoadingData;

  const categoryTree = useMemo(() => {
    if (!categories) return [];
    
    const categoryMap = new Map(categories.map(c => [c.id, { ...c, subCategories: [] as Category[] }]));
    const tree: (Category & { subCategories: Category[] })[] = [];
    
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)!;
      if (category.parentId && categoryMap.has(category.parentId)) {
        categoryMap.get(category.parentId)!.subCategories.push(categoryNode);
      } else {
        tree.push(categoryNode);
      }
    });

    return tree;
  }, [categories]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="p-4 text-destructive">Error loading categories.</p>;
  }

  return (
    <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
      <Accordion type="multiple" className="w-full">
        {categoryTree.map(category => (
          <AccordionItem key={category.id} value={category.id}>
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              {category.name}
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 pl-4">
                <li>
                  <Link
                    href={`/categories/${category.slug || category.id}`}
                    className="block hover:text-primary font-medium"
                    onClick={onLinkClick}
                  >
                    All {category.name}
                  </Link>
                </li>
                {category.subCategories.map(subCategory => (
                  <li key={subCategory.id}>
                    <Link
                      href={`/categories/${subCategory.slug || subCategory.id}`}
                      className="block hover:text-primary"
                      onClick={onLinkClick}
                    >
                      {subCategory.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
