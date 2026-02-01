'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { collection, query, orderBy } from 'firebase/firestore';
import type { HeroSlide } from '@/lib/types';
import { Loader2, ArrowRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"

function HeroSlideCard({ slide }: { slide: HeroSlide }) {
  return (
    <div className="relative group text-white h-[80vh]">
       <Link href={slide.shopNowUrl || '#'} className="absolute inset-0 z-10" aria-label={`Shop ${slide.title}`}></Link>
      <Image
        src={slide.imageUrl}
        alt={slide.title}
        fill
        className="object-cover w-full h-full"
        data-ai-hint={slide.imageHint}
        unoptimized
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 px-8 md:px-12">
        <h2 className="font-headline text-4xl md:text-5xl font-bold">{slide.title}</h2>
        {slide.subLinks && slide.subLinks.length > 0 && (
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-4 text-sm">
            {slide.subLinks.map(link => (
              <Link key={link.text} href={link.href} className="hover:underline relative z-30">
                {link.text}
              </Link>
            ))}
          </div>
        )}
        {slide.shopNowUrl && (
          <Link href={slide.shopNowUrl} className="flex items-center gap-2 font-semibold mt-8 hover:underline relative z-30">
            Shop now <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}


export function HeroCarousel() {
  const db = useFirestore();

  const slidesQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'heroSlides'), orderBy('order', 'asc'));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: slides, isLoading } = useCollection<HeroSlide>(slidesQuery);

  if (isLoading) {
    return (
      <section className="bg-muted flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </section>
    );
  }

  if (!slides || slides.length === 0) {
    return (
      <section className="bg-muted flex flex-col items-center justify-center text-center p-4 h-[80vh]">
        <h3 className="font-headline text-2xl font-bold">No Hero Content Found</h3>
        <p className="text-muted-foreground mt-2">
          Add slides in the admin panel at Content {'>'} Hero Slides to see them here.
        </p>
      </section>
    );
  }

  return (
    <section>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
         plugins={[
          Autoplay({
            delay: 5000,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="p-0">
                <HeroSlideCard slide={slide} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex" />
      </Carousel>
    </section>
  );
}
