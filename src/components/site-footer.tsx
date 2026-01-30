
'use client';

import { Logo } from "./logo";
import Link from 'next/link';
import { Instagram, Facebook, Linkedin, Wifi, WifiOff } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useFirestore } from "@/firebase/provider";

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
);

const PinterestIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 4.885 3.433 9.05 8.13 10.53-.108-.85-.195-2.228.03-3.13.206-.822 1.303-5.52 1.303-5.52s-.33-.66-.33-1.634c0-1.53.888-2.67 1.987-2.67.93 0 1.378.696 1.378 1.528 0 .93-.593 2.322-.9 3.612-.255 1.088.54 1.972 1.603 1.972 1.92 0 3.39-2.033 3.39-4.988 0-2.64-1.88-4.59-4.716-4.59-3.23 0-5.118 2.42-5.118 4.755 0 .91.35 1.89.78 2.43.08.1.09.18.06.28-.06.25-.21.84-.26 1.03-.03.11-.12.14-.24.06-1.02-.65-1.66-2.58-1.66-3.84 0-3.34 2.4-6.3 7.06-6.3 3.73 0 6.32 2.65 6.32 5.96 0 3.74-2.35 6.6-5.63 6.6-1.12 0-2.17-.57-2.52-1.24l-.74 2.84c-.28 1.12-1.04 2.5-1.55 3.29.98.3 2 .46 3.05.46 6.627 0 12-5.373 12-12C24 5.373 18.627 0 12 0z" />
    </svg>
);

function FirebaseConnectionStatus() {
  const db = useFirestore();
  
  if (db) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <Wifi className="h-4 w-4" />
        <span>DB Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-red-600">
      <WifiOff className="h-4 w-4" />
      <span>DB Disconnected</span>
    </div>
  );
}


export function SiteFooter() {
  return (
    <footer className="border-t bg-background text-foreground">
      <div className="w-full bg-secondary/50">
        <div className="container py-12">
          <div className="p-8 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              <div className="col-span-1 lg:col-span-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                      <div>
                        <h4 className="font-headline font-semibold mb-4">Company</h4>
                        <ul className="space-y-2">
                          <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">EcoCart</Link></li>
                          <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">EcoCart+</Link></li>
                          <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">The blog</Link></li>
                          <li><Link href="/sustainability-report" className="text-sm text-muted-foreground hover:text-primary">Sustainability</Link></li>
                          <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Help center</Link></li>
                           <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Contact</Link></li>
                        </ul>
                      </div>
                       <div>
                        <h4 className="font-headline font-semibold mb-4">Account</h4>
                        <ul className="space-y-2">
                          <li><Link href="/account" className="text-sm text-muted-foreground hover:text-primary">My orders</Link></li>
                          <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">My quotes</Link></li>
                          <li><Link href="/account" className="text-sm text-muted-foreground hover:text-primary">My profile</Link></li>
                          <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Track order</Link></li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-headline font-semibold mb-4">Shop</h4>
                        <ul className="space-y-2">
                          <li><Link href="/products" className="text-sm text-muted-foreground hover:text-primary">All products</Link></li>
                          <li><Link href="/brands" className="text-sm text-muted-foreground hover:text-primary">Brands</Link></li>
                          <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Samples</Link></li>
                        </ul>
                      </div>
                      <div className="mt-8 sm:mt-0 col-span-2 sm:col-span-1">
                        <h4 className="font-headline font-semibold mb-4">Partners</h4>
                        <ul className="space-y-2">
                          <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Supplier application</Link></li>
                        </ul>
                      </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                  <h4 className="font-headline font-semibold mb-2">Join us! Special offers, tips, tricks and more</h4>
                   <div className="flex w-full max-w-sm items-center space-x-2">
                      <Input type="email" placeholder="hello@thisismyemail.com" className="bg-white" />
                      <Button type="submit" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>Subscribe</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">By subscribing you will receive marketing from EcoCart. See Privacy Policy</p>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container flex flex-col sm:flex-row justify-between items-center gap-4 py-6">
        <div className="flex items-center gap-4">
           <Logo />
           <div className="flex items-center gap-4">
              <Link href="#" aria-label="Instagram"><Instagram className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
              <Link href="#" aria-label="Facebook"><Facebook className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
              <Link href="#" aria-label="TikTok"><TikTokIcon className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
              <Link href="#" aria-label="Pinterest"><PinterestIcon className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
              <Link href="#" aria-label="LinkedIn"><Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
           </div>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-4">
          <FirebaseConnectionStatus />
          <span>&copy; EcoCart {new Date().getFullYear()}</span>
          <Link href="#" className="hover:text-primary">T & C's</Link>
          <Link href="#" className="hover:text-primary">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
