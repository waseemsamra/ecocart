
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from './ui/button';
import Link from 'next/link';

export function PackagingForBrands() {
  return (
    <section className="py-12 md:py-24">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="max-w-md">
            <h2 className="font-headline text-4xl font-bold">
              Packaging for Brands –<br />
              ClothCard
            </h2>
            <p className="mt-4 text-muted-foreground">
              From cakes and bakes, to candles and sandals, whatever your
              business package onbrand with ClothCard.
            </p>
            <Button asChild className="mt-6" size="lg" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
              <Link href="/account">Create account</Link>
            </Button>
          </div>
          <div>
            <Accordion type="single" defaultValue="item-1" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="font-semibold">Low minimums & custom branding</AccordionTrigger>
                <AccordionContent>
                  We pride ourselves on our accessible and low minimum order quantities (MOQ). Each product has its own MOQ and can vary from 1 up to 1,000+, so check out each product page to learn more.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="font-semibold">24/7 design & logistics support</AccordionTrigger>
                <AccordionContent>
                  Yes. It comes with default styles that matches the other
                  components&apos; aesthetic.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="font-semibold">ClothCard Packaging Alliance Certified</AccordionTrigger>
                <AccordionContent>
                  Yes. It&apos;s animated by default, but you can disable it if you
                  prefer.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="font-semibold">QR packaging specialists</AccordionTrigger>
                <AccordionContent>
                    Yes. It's built on top of Radix UI and is fully accessible.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger className="font-semibold">Free carbon-offset shipping</AccordionTrigger>
                <AccordionContent>
                    Yes. You can use it in your commercial projects.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
