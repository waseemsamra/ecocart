'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const celebrityItems = [
  {
    id: 'cc-1',
    celebrity: 'Genelia Deshmukh',
    brand: 'Saaksha & Kinni',
    productName: 'White Cambric Co-ord Set',
    image: PlaceHolderImages.find(img => img.id === 'celebrity-1'),
    linkUrl: '/products?tag=genelia-deshmukh',
  },
  {
    id: 'cc-2',
    celebrity: 'Sharvari Wagh',
    brand: 'Mac Duggal',
    productName: 'Black Polyester 3D Floral One-Shoulder Mi...',
    image: PlaceHolderImages.find(img => img.id === 'celebrity-2'),
    linkUrl: '/products?tag=sharvari-wagh',
  },
  {
    id: 'cc-3',
    celebrity: 'Alaya F',
    brand: 'Diyarajvvir',
    productName: 'Royal Red Silk Lehenga Set',
    image: PlaceHolderImages.find(img => img.id === 'celebrity-3'),
    linkUrl: '/products?tag=alaya-f',
  },
  {
    id: 'cc-4',
    celebrity: 'Shraddha Kapoor',
    brand: 'Mishru',
    productName: 'Ivory Sequins Lehenga Set',
    image: PlaceHolderImages.find(img => img.id === 'celebrity-4'),
    linkUrl: '/products?tag=shraddha-kapoor',
  },
];

function CelebrityClosetCard({ item }: { item: (typeof celebrityItems)[0] }) {
  if (!item.image) return null;

  return (
    <Link href={item.linkUrl} className="relative group block overflow-hidden aspect-[3/4]">
      <Image
        src={item.image.imageUrl}
        alt={`${item.celebrity} in ${item.brand}`}
        fill
        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        data-ai-hint={item.image.imageHint}
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white text-left">
        <h3 className="font-semibold text-sm uppercase">{`${item.celebrity} in ${item.brand}`}</h3>
        <p className="text-xs uppercase tracking-wider text-white/80">{item.productName}</p>
      </div>
    </Link>
  );
}

export function CelebrityCloset() {
  if (celebrityItems.some(item => !item.image)) {
    return null;
  }
  
  return (
    <section className="py-12 md:py-20">
      <div className="container">
         <div className="flex justify-between items-baseline mb-8">
            <h2 className="font-headline text-2xl font-bold tracking-widest uppercase">Celebrity Closet</h2>
            <Link href="/products?collection=celebrity-closet" className="text-xs font-semibold text-muted-foreground hover:text-primary tracking-widest">
                VIEW ALL
            </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {celebrityItems.map(item => (
                <CelebrityClosetCard key={item.id} item={item} />
            ))}
        </div>
      </div>
    </section>
  );
}
