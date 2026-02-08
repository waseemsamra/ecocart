'use client';
import type { Product } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function ProductInfoAccordion({ product }: { product: Product }) {
  return (
    <div>
      <Accordion type="single" collapsible className="w-full" defaultValue="description">
        <AccordionItem value="description">
          <AccordionTrigger className="text-xl font-semibold">Description</AccordionTrigger>
          <AccordionContent>
            {product.description}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="specification">
          <AccordionTrigger className="text-xl font-semibold">Specification</AccordionTrigger>
          <AccordionContent>
            {product.sustainabilityImpact}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="product-highlights">
          <AccordionTrigger className="text-xl font-semibold">Product Highlights</AccordionTrigger>
          <AccordionContent>
            - Made from {product.materials?.join(', ')} <br/>
            - Certifications: {product.certifications?.join(', ')}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="dielines-templates">
          <AccordionTrigger className="text-xl font-semibold">Dielines & Templates</AccordionTrigger>
          <AccordionContent>
            Downloadable templates and dielines will be available here.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="how-it-works">
          <AccordionTrigger className="text-xl font-semibold">How it works</AccordionTrigger>
          <AccordionContent>
            A step-by-step guide on the customization and ordering process.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
