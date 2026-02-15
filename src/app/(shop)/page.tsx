'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { SignupBanner } from '@/components/signup-banner';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { HeroCarousel } from '@/components/hero-carousel';
import { ShopByCategory } from '@/components/shop-by-category';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const LowMinimumMustHaves = dynamic(
  () => import('@/components/low-minimum-must-haves').then((mod) => mod.LowMinimumMustHaves),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-96 w-full" /></div>
      </section>
    ),
  }
);

const NewArrivals = dynamic(
  () => import('@/components/new-arrivals').then((mod) => mod.NewArrivals),
  {
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-96 w-full" /></div>
      </section>
    ),
  }
);

const WeddingTales = dynamic(
  () => import('@/components/wedding-tales').then((mod) => mod.WeddingTales),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-96 w-full" /></div>
      </section>
    ),
  }
);

const DesignersOnDiscount = dynamic(
  () => import('@/components/designers-on-discount').then((mod) => mod.DesignersOnDiscount),
  {
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-96 w-full" /></div>
      </section>
    ),
  }
);

const TrendingNow = dynamic(
  () => import('@/components/trending-now').then((mod) => mod.TrendingNow),
  {
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-96 w-full" /></div>
      </section>
    ),
  }
);

const FeaturedBrandSection = dynamic(
  () => import('@/components/featured-brand').then((mod) => mod.FeaturedBrandSection),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-96 w-full" /></div>
      </section>
    ),
  }
);

const PackagingPartner = dynamic(
  () => import('@/components/packaging-partner').then((mod) => mod.PackagingPartner),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-96 w-full" /></div>
      </section>
    ),
  }
);

const DesignersSpotlight = dynamic(
  () => import('@/components/designers-spotlight').then((mod) => mod.DesignersSpotlight),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-[60vh] w-full" /></div>
      </section>
    ),
  }
);

const BestSellingDesigners = dynamic(
  () => import('@/components/best-selling-designers').then((mod) => mod.BestSellingDesigners),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-96 w-full" /></div>
      </section>
    ),
  }
);

const ReadyToShipArticles = dynamic(
  () => import('@/components/ready-to-ship').then((mod) => mod.ReadyToShipArticles),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-96 w-full" /></div>
      </section>
    ),
  }
);

const BrandStories = dynamic(
  () => import('@/components/brand-stories').then((mod) => mod.BrandStories),
  { 
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-96 w-full" /></div>
      </section>
    ),
  }
);

const HandpickedForYou = dynamic(
  () => import('@/components/handpicked-for-you').then((mod) => mod.HandpickedForYou),
  {
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container">
          <Skeleton className="h-96 w-full" />
        </div>
      </section>
    ),
  }
);

const CelebrityCloset = dynamic(
  () => import('@/components/celebrity-closet').then((mod) => mod.CelebrityCloset),
  {
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-20">
        <div className="container">
          <Skeleton className="h-96 w-full" />
        </div>
      </section>
    ),
  }
);


export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <ShopByCategory />
      
      <LowMinimumMustHaves />

      <NewArrivals />

      <WeddingTales />

      <DesignersOnDiscount />

      <TrendingNow />

      <FeaturedBrandSection />

      <PackagingPartner />

      <DesignersSpotlight />

      <BestSellingDesigners />

      <ReadyToShipArticles />

      <HandpickedForYou />

      <CelebrityCloset />

      <BrandStories />

      <SignupBanner />
    </>
  );
}
