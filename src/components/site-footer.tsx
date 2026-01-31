'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  Facebook, 
  Instagram, 
  Youtube, 
  MessageCircle, 
  Plane,
  ArrowUp,
} from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" {...props}>
    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8l164.9-199.9L26.8 48h145.6l105.5 141.4L389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
  </svg>
);

const PinterestIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 4.885 3.433 9.05 8.13 10.53-.108-.85-.195-2.228.03-3.13.206-.822 1.303-5.52 1.303-5.52s-.33-.66-.33-1.634c0-1.53.888-2.67 1.987-2.67.93 0 1.378.696 1.378 1.528 0 .93-.593 2.322-.9 3.612-.255 1.088.54 1.972 1.603 1.972 1.92 0 3.39-2.033 3.39-4.988 0-2.64-1.88-4.59-4.716-4.59-3.23 0-5.118 2.42-5.118 4.755 0 .91.35 1.89.78 2.43.08.1.09.18.06.28-.06.25-.21.84-.26 1.03-.03.11-.12.14-.24.06-1.02-.65-1.66-2.58-1.66-3.84 0-3.34 2.4-6.3 7.06-6.3 3.73 0 6.32 2.65 6.32 5.96 0 3.74-2.35 6.6-5.63 6.6-1.12 0-2.17-.57-2.52-1.24l-.74 2.84c-.28 1.12-1.04 2.5-1.55 3.29.98.3 2 .46 3.05.46 6.627 0 12-5.373 12-12C24 5.373 18.627 0 12 0z" />
    </svg>
);

const HangerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12.5 4.5a2.5 2.5 0 1 0-5 0v1.5"/>
        <path d="M4 8h16"/>
        <path d="M6 8l-2.5 7a2 2 0 0 0 2 3h13a2 2 0 0 0 2-3L18 8"/>
    </svg>
);

const AppStoreButton = () => (
  <button className="flex items-center justify-center gap-2 bg-black text-white rounded-md px-3 py-2 w-36 h-10">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>
    <div className="text-left">
      <div className="text-xs">Download on the</div>
      <div className="text-sm font-semibold">App Store</div>
    </div>
  </button>
);

const GooglePlayButton = () => (
  <button className="flex items-center justify-center gap-2 bg-black text-white rounded-md px-3 py-2 w-36 h-10">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="m22 12-2.12-2.12"/><path d="M2 12h2.12"/><path d="m12 2 2.12 2.12"/><path d="M12 22v-2.12"/></svg>
    <div className="text-left">
      <div className="text-xs">GET IT ON</div>
      <div className="text-sm font-semibold">Google Play</div>
    </div>
  </button>
);


export function SiteFooter() {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.pageYOffset > 400) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 400) {
        setShowScroll(false);
      }
    };
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, [showScroll]);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-background text-sm text-foreground/80 border-t">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <h4 className="font-semibold mb-4 uppercase">About Us</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-primary">Purple Style Labs</Link></li>
              <li><Link href="#" className="hover:text-primary">Pernia's Pop Up Show</Link></li>
              <li><Link href="#" className="hover:text-primary">Studio Locator</Link></li>
              <li><Link href="#" className="hover:text-primary">First Look</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 uppercase">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-primary">Bestsellers</Link></li>
              <li><Link href="#" className="hover:text-primary">Exclusive</Link></li>
              <li><Link href="#" className="hover:text-primary">Sale</Link></li>
              <li><Link href="#" className="hover:text-primary">Gift Cards</Link></li>
              <li><Link href="#" className="hover:text-primary">Celebrity Closet</Link></li>
              <li><Link href="#" className="hover:text-primary">Personal Styling</Link></li>
              <li><Link href="#" className="text-destructive font-semibold hover:text-destructive/80">Occasions</Link></li>
              <li><Link href="#" className="hover:text-primary">Client Diaries</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 uppercase">Customer Care</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-primary">Shipping Information</Link></li>
              <li><Link href="#" className="hover:text-primary">Returns & Exchange</Link></li>
              <li><Link href="#" className="hover:text-primary">Terms & Conditions</Link></li>
              <li><Link href="#" className="hover:text-primary">Privacy & Cookie Policies</Link></li>
              <li><Link href="#" className="hover:text-primary">FAQs</Link></li>
              <li><Link href="#" className="hover:text-primary">Site Map</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 uppercase">Contact Us</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4"/> +91 78478 48484</li>
              <li className="flex items-center gap-2"><MessageSquare className="h-4 w-4"/> Whatsapp us on +91 84880 70070</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4"/> customercare@perniaspopupshop.com</li>
            </ul>
            <h4 className="font-semibold mt-6 mb-4 uppercase">Follow Us</h4>
            <div className="flex items-center gap-3">
              <Link href="#" aria-label="Facebook"><Facebook className="h-5 w-5 hover:text-primary" /></Link>
              <Link href="#" aria-label="Instagram"><Instagram className="h-5 w-5 hover:text-primary" /></Link>
              <Link href="#" aria-label="X"><XIcon className="h-4 w-4 hover:text-primary" /></Link>
              <Link href="#" aria-label="Pinterest"><PinterestIcon className="h-5 w-5 hover:text-primary" /></Link>
              <Link href="#" aria-label="Youtube"><Youtube className="h-5 w-5 hover:text-primary" /></Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 uppercase">Get Pernia's Pop-up Shop App</h4>
            <p className="mb-4">We will send you a link on your Email or Phone, open it on your phone and download the App.</p>
            <RadioGroup defaultValue="email" className="flex gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="r-email" />
                <Label htmlFor="r-email">Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="r-phone" />
                <Label htmlFor="r-phone">Phone</Label>
              </div>
            </RadioGroup>
            <div className="flex items-center gap-2 mb-4">
              <Input placeholder="Email Address" className="bg-secondary/50"/>
              <Button className="bg-neutral-800 text-white hover:bg-black text-xs h-10">SHARE APP LINK</Button>
            </div>
            <div className="flex items-center gap-2">
              <AppStoreButton/>
              <GooglePlayButton/>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-xs uppercase tracking-wider">
          <div className="flex items-center justify-center gap-3">
            <MessageCircle className="h-6 w-6"/>
            <span>24x7 Customer Support</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <HangerIcon className="h-6 w-6"/>
            <span>500+ Designers</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Plane className="h-6 w-6"/>
            <span>Free International Shipping*</span>
          </div>
        </div>
      </div>
      <div className="border-t bg-secondary/30">
        <div className="container py-6 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="font-semibold uppercase">Completely Safe and Secure Payment Method</h4>
              <p className="text-xs mt-1">We accept Netbanking, all major credit cards. We also accept orders with cash payment</p>
              <div className="flex items-center gap-2 mt-2">
                  {/* Placeholder for payment icons */}
                  <span className="font-bold text-lg">VISA</span>
                  <span className="font-bold text-lg text-blue-500">PayPal</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs">Sign up to get exclusive style tips, new arrival updates and a special discount code.</p>
              <div className="flex justify-end items-center gap-2 mt-2">
                <Input placeholder="Here's my Email" className="bg-white max-w-xs"/>
                <Button className="bg-neutral-800 text-white hover:bg-black">Sign Up</Button>
              </div>
            </div>
        </div>
      </div>
      {showScroll && (
        <Button onClick={scrollTop} variant="secondary" className="fixed bottom-4 right-4 z-50 h-10 w-10 rounded-full p-0 shadow-lg">
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </footer>
  );
}
