'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const handpickedItems = [
  {
    id: 'hpfy-1',
    title: 'THE EID EDIT',
    image: PlaceHolderImages.find(img => img.id === 'handpicked-1'),
    linkUrl: '/products?tag=eid-edit',
  },
  {
    id: 'hpfy-2',
    title: 'ETHEREAL DRAPES',
    image: PlaceHolderImages.find(img => img.id === 'handpicked-2'),
    linkUrl: '/products?tag=drapes',
  },
  {
    id: 'hpfy-3',
    title: 'ALL ABOUT VELVETS',
    image: PlaceHolderImages.find(img => img.id === 'handpicked-3'),
    linkUrl: '/products?tag=velvets',
  },
  {
    id: 'hpfy-4',
    title: 'PRET IT UP',
    image: PlaceHolderImages.find(img => img.id === 'handpicked-4'),
    linkUrl: '/products?tag=pret',
  },
  {
    id: 'hpfy-5',
    title: 'DIAL UP THE GLAM',
    image: PlaceHolderImages.find(img => img.id === 'handpicked-5'),
    linkUrl: '/products?tag=glam',
  },
];

function HandpickedCard({ item }: { item: (typeof handpickedItems)[0] }) {
  if (!item.image) return null;

  return (
    <Link href={item.linkUrl} className="relative group block overflow-hidden rounded-lg h-full w-full">
      <Image
        src={item.image.imageUrl}
        alt={item.image.description}
        fill
        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        data-ai-hint={item.image.imageHint}
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h3 className="font-headline text-lg font-bold uppercase">{item.title}</h3>
        <p className="text-xs uppercase tracking-wider group-hover:underline">Shop Now</p>
      </div>
    </Link>
  );
}

export function HandpickedForYou() {
  const [item1, item2, item3, item4, item5] = handpickedItems;

  return (
    <section className="py-12 md:py-20">
      <div className="container">
         <div className="flex justify-between items-baseline mb-8">
            <h2 className="font-headline text-2xl font-bold tracking-widest uppercase">HANDPICKED FOR YOU</h2>
            <Link href="/products" className="text-xs font-semibold text-muted-foreground hover:text-primary tracking-widest">
                VIEW ALL
            </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 md:auto-rows-[25rem]">
            {item1 && (
                <div className="md:col-span-2">
                    <HandpickedCard item={item1} />
                </div>
            )}
            {item2 && (
                <div className="md:col-span-1">
                    <HandpickedCard item={item2} />
                </div>
            )}
            {item3 && (
                <div className="md:col-span-1">
                    <HandpickedCard item={item3} />
                </div>
            )}
            {item4 && (
                <div className="md:col-span-1">
                    <HandpickedCard item={item4} />
                </div>
            )}
            {item5 && (
                <div className="md:col-span-1">
                    <HandpickedCard item={item5} />
                </div>
            )}
        </div>
      </div>
    </section>
  );
}
