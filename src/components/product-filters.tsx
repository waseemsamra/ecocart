'use client';

import { useMemo, useState, useEffect } from 'react';
import { collection, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Size, Colour, Brand, MaterialType, FinishType, Adhesive, Handle, Shape, Category, Lid } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

type OptionCollection = 'categories' | 'sizes' | 'colours' | 'brands' | 'materialTypes' | 'finishTypes' | 'adhesives' | 'handles' | 'shapes' | 'lids';
type OptionType = Category | Size | Colour | Brand | MaterialType | FinishType | Adhesive | Handle | Shape | Lid;

const filterOptions: { collectionName: OptionCollection; title: string; formFieldName: string }[] = [
    { collectionName: 'categories', title: 'Categories', formFieldName: 'categoryIds' },
    { collectionName: 'sizes', title: 'Sizes', formFieldName: 'sizeIds' },
    { collectionName: 'colours', title: 'Colours', formFieldName: 'colourIds' },
    { collectionName: 'brands', title: 'Brands/Designers', formFieldName: 'brandIds' },
    { collectionName: 'materialTypes', title: 'Material Types', formFieldName: 'materialTypeIds' },
    { collectionName: 'finishTypes', title: 'Finish Types', formFieldName: 'finishTypeIds' },
    { collectionName: 'adhesives', title: 'Adhesives', formFieldName: 'adhesiveIds' },
    { collectionName: 'handles', title: 'Handles', formFieldName: 'handleIds' },
    { collectionName: 'shapes', title: 'Shapes', formFieldName: 'shapeIds' },
    { collectionName: 'lids', title: 'Lids', formFieldName: 'lidIds' },
];

function FilterSection({
    title,
    collectionName,
    selectedValues,
    onFilterChange,
    availableOptionIds
}: {
    title: string;
    collectionName: OptionCollection;
    selectedValues: string[];
    onFilterChange: (value: string) => void;
    availableOptionIds?: string[];
}) {
    const { loading: authLoading } = useAuth();
    const db = useFirestore();

    const optionsQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, collectionName));
        (q as any).__memo = true;
        return q;
    }, [collectionName, db]);

    const { data: options, isLoading: isLoadingData } = useCollection<OptionType>(optionsQuery);
    const isLoading = authLoading || isLoadingData;

    const displayedOptions = useMemo(() => {
        if (!options) return [];
        if (availableOptionIds) {
            const availableSet = new Set(availableOptionIds);
            return options.filter(option => availableSet.has(option.id));
        }
        return options;
    }, [options, availableOptionIds]);
    
    if (isLoading) return <Loader2 className="animate-spin" />;
    
    // Don't render the section if there are no relevant options to show.
    if (displayedOptions.length === 0) return null;

    return (
        <AccordionItem value={collectionName}>
            <AccordionTrigger className="font-semibold">{title}</AccordionTrigger>
            <AccordionContent>
                <div className="space-y-2">
                    {displayedOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`${collectionName}-${option.id}`}
                                checked={selectedValues.includes(option.id)}
                                onCheckedChange={() => onFilterChange(option.id)}
                            />
                            <Label htmlFor={`${collectionName}-${option.id}`} className="font-normal cursor-pointer">
                                {option.name}
                            </Label>
                        </div>
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

export function ProductFilters({ 
    onFiltersChange,
    initialFilters = {},
    disabledFilters = [],
    availableOptions
}: { 
    onFiltersChange: (filters: Record<string, string[]>) => void;
    initialFilters?: Record<string, string[]>;
    disabledFilters?: string[];
    availableOptions?: Record<string, string[]>;
}) {
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(initialFilters);

    useEffect(() => {
        setActiveFilters(initialFilters);
    }, [initialFilters]);

    useEffect(() => {
        onFiltersChange(activeFilters);
    }, [activeFilters, onFiltersChange]);

    const handleFilterChange = (filterGroup: string, value: string) => {
        setActiveFilters(prev => {
            const groupValues = prev[filterGroup] || [];
            const newGroupValues = groupValues.includes(value)
                ? groupValues.filter(v => v !== value)
                : [...groupValues, value];
            
            const newFilters = { ...prev, [filterGroup]: newGroupValues };
            
            if (newGroupValues.length === 0) {
                delete newFilters[filterGroup];
            }
            
            return newFilters;
        });
    };

    const clearFilters = () => {
        const filtersToKeep: Record<string, string[]> = {};
        if (initialFilters) {
            for(const key of disabledFilters) {
                if(initialFilters[key]) {
                    filtersToKeep[key] = initialFilters[key];
                }
            }
        }
        setActiveFilters(filtersToKeep);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-headline text-lg font-bold">Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters} disabled={Object.keys(activeFilters).length === 0}>Clear All</Button>
            </div>
            <Accordion type="multiple" className="w-full" defaultValue={Object.keys(initialFilters)}>
                {filterOptions.filter(option => !disabledFilters.includes(option.formFieldName)).map(option => (
                    <FilterSection
                        key={option.collectionName}
                        title={option.title}
                        collectionName={option.collectionName}
                        selectedValues={activeFilters[option.formFieldName] || []}
                        onFilterChange={(value) => handleFilterChange(option.formFieldName, value)}
                        availableOptionIds={availableOptions ? availableOptions[option.formFieldName] : undefined}
                    />
                ))}
            </Accordion>
        </div>
    );
}
