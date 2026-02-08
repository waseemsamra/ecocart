
'use client';

import { Button } from './ui/button';
import Link from 'next/link';

export function PackagingAlliance() {

  return (
    <section className="bg-[#464E33] text-white">
      <div className="container mx-auto py-12 lg:py-24">
        <div className="text-center">
            <p className="font-semibold uppercase tracking-wider">ClothCard packaging alliance</p>
            <h2 className="font-headline text-4xl md:text-5xl font-bold mt-4">Making change together.</h2>
            <p className="mt-6 max-w-md text-lg text-white/80 mx-auto">
              Sport your support and join a global network of brands focused on making smarter, more sustainable choices.
            </p>
            <Button
              asChild
              className="mt-8 bg-[#B4D939] text-black hover:bg-[#B4D939]/90 rounded-full font-bold px-6 py-3"
            >
              <Link href="#">Download badge</Link>
            </Button>
          </div>
      </div>
    </section>
  );
}
