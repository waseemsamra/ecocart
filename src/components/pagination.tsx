'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) {
    const handlePrevious = () => {
        onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        onPageChange(currentPage + 1);
    };

    const paginationRange = useMemo(() => {
        const siblingCount = 1;
        const totalPageNumbers = siblingCount + 5; // 1 (current) + 2*siblingCount + 2 (first/last) + 2 (dots)

        // Case 1: If the number of pages is less than the page numbers we want to show
        if (totalPages <= totalPageNumbers) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(
            currentPage + siblingCount,
            totalPages
        );

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

        const firstPageIndex = 1;
        const lastPageIndex = totalPages;

        // Case 2: No left dots, but right dots
        if (!shouldShowLeftDots && shouldShowRightDots) {
            let leftItemCount = 3 + 2 * siblingCount;
            let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
            return [...leftRange, '...', totalPages];
        }

        // Case 3: No right dots, but left dots
        if (shouldShowLeftDots && !shouldShowRightDots) {
            let rightItemCount = 3 + 2 * siblingCount;
            let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
            return [firstPageIndex, '...', ...rightRange];
        }

        // Case 4: Both left and right dots
        if (shouldShowLeftDots && shouldShowRightDots) {
            let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
            return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
        }
        
        // Default case (should not be hit with correct logic but good as a fallback)
        return Array.from({ length: totalPages }, (_, i) => i + 1);

    }, [currentPage, totalPages]);

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-center space-x-1 mt-12">
            <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentPage <= 1}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
            </Button>
            {paginationRange.map((pageNumber, index) => {
                if (pageNumber === '...') {
                    return <span key={index} className="px-4 py-2">...</span>;
                }

                return (
                    <Button
                        key={index}
                        variant={currentPage === pageNumber ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => onPageChange(pageNumber as number)}
                    >
                        {pageNumber}
                    </Button>
                );
            })}
            <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentPage >= totalPages}
            >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}
