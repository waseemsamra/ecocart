'use client';

import Link from 'next/link';
import { ShoppingBag, Search, ChevronDown, User, LogOut, Menu } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useRouter } from 'next/navigation';
import { SearchDialog } from './search-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger
} from '@/components/ui/sheet';
import { ProductsDrawer } from './products-drawer';
import { Separator } from './ui/separator';
import { BrandsDialog } from './brands-dialog';

function CartButton() {
  const { cartCount, isCartLoading } = useCart();

  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link href="/cart">
        <ShoppingBag className="h-6 w-6" />
        {!isCartLoading && cartCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
            {cartCount}
          </span>
        )}
        <span className="sr-only">Shopping Cart</span>
      </Link>
    </Button>
  );
}

function AuthButton() {
  const { user, loading, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (!isClient || loading) {
    return <div className="h-10 w-10 bg-muted rounded-full" />;
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{user.displayName || 'My Account'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account">
              <User className="mr-2 h-4 w-4" />
              <span>My Account</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button asChild variant="outline">
      <Link href="/login">Login / Signup</Link>
    </Button>
  );
}


export function SiteHeader() {
  const [productsDrawerOpen, setProductsDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navLinks = [
    { href: '/products', label: 'All Products' },
  ];

  if (!isClient) {
     return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
             <div className="bg-secondary/50">
                <div className="container flex h-10 items-center justify-between text-xs">
                     <div className="h-4 bg-muted rounded-md w-1/3"></div>
                     <div className="hidden md:flex items-center gap-6">
                        <div className="h-4 bg-muted rounded-md w-24"></div>
                        <div className="h-4 bg-muted rounded-md w-24"></div>
                     </div>
                </div>
            </div>
            <div className="container flex h-20 items-center justify-between gap-4 md:gap-8">
                <div className="flex items-center gap-6">
                    <Logo />
                     <nav className="hidden items-center gap-6 md:flex">
                        <div className="h-5 w-20 bg-muted rounded-md"></div>
                        <div className="h-5 w-24 bg-muted rounded-md"></div>
                     </nav>
                </div>
                 <div className="flex-1 flex justify-center lg:justify-center">
                    <div className="w-full max-w-md lg:w-full">
                        <div className="h-10 w-full bg-muted rounded-md"></div>
                    </div>
                </div>
                <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                    <div className="h-10 w-24 bg-muted rounded-md hidden md:block"></div>
                    <div className="h-10 w-24 bg-muted rounded-md"></div>
                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                </div>
            </div>
        </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="bg-secondary/50">
        <div className="container flex h-10 items-center justify-between text-xs">
          <p className="font-medium">
            Custom Paper Bowls - <span className="text-muted-foreground">Serve in style! Now available</span>
          </p>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#" className="hover:underline">Tapkit by ClothCard</Link>
            <Link href="#" className="hover:underline">Help Center</Link>
            <Link href="#" className="hover:underline">Contact Us</Link>
          </nav>
        </div>
      </div>
      <div className="container flex h-20 items-center justify-between gap-4 md:gap-8">
        {/* Left Section */}
        <div className="flex items-center gap-2 md:gap-6">
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs flex flex-col p-0">
                <SheetHeader className="p-6">
                  <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                  <SheetDescription className="sr-only">Main navigation links</SheetDescription>
                  <Logo />
                </SheetHeader>
                <Separator />
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                       <ProductsDrawer onLinkClick={() => setMobileMenuOpen(false)} />
                    </div>
                     <Separator />
                    <nav className="p-6 flex flex-col gap-4 text-lg font-semibold">
                      {navLinks.map(link => (
                        <Link
                          key={link.label}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-foreground transition-colors hover:text-primary"
                        >
                          {link.label}
                        </Link>
                      ))}
                       <BrandsDialog />
                    </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
             <Sheet open={productsDrawerOpen} onOpenChange={setProductsDrawerOpen}>
              <SheetTrigger asChild>
                <button
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Products
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-sm flex flex-col">
                <SheetHeader className="p-6 text-left">
                  <SheetTitle className="text-2xl font-headline font-bold">Shop by Category</SheetTitle>
                  <SheetDescription>
                    Browse our products by category and sub-category.
                  </SheetDescription>
                </SheetHeader>
                <ProductsDrawer onLinkClick={() => setProductsDrawerOpen(false)} />
              </SheetContent>
            </Sheet>
            <BrandsDialog />
            {navLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-primary text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center Section & Mobile Search Trigger */}
        <div className="flex-1 flex justify-center lg:justify-center">
            <div className="w-full max-w-md lg:w-full">
                 <SearchDialog />
            </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
            <div className="hidden md:flex items-center text-sm font-medium">
              <Button variant="ghost" size="sm" className="ml-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="h-4 w-6 mr-2"
                >
                  <path fill="#00247d" d="M0 0h512v512H0z"/>
                  <path fill="#fff" d="m64 0 192 128L448 0h64v64L320 256l192 192v64h-64L256 384 64 512H0v-64l192-192L0 64V0h64z"/>
                  <path fill="#cf142b" d="m288 0 160 106.7V0h64v32l-160 106.7V224h-64v-85.3L64 0H0v64l224 149.3V288h64v-74.7L512 384v64l-224-149.3V224h-64v74.7L0 128V64l224 149.3V160h64v-53.3zM224 512l160-106.7V512h64v-32L288 373.3V320h-64v85.3L0 512h64v-64l224-149.3V288h-64v74.7L512 128V64l-224 149.3V224h64v-74.7L0 224v-64l224-149.3V160h-64V85.3L512 0v224h-64V117.3L256 256l256 128v-64h-64L256 192l-192 128v64h64l192-128 192 128h64v-64L320 256l192-192v-64h-64L256 128 64 0H0z"/>
                </svg>
                <span>Ship to:</span>
                <span className='font-bold ml-1'>$</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <AuthButton />
            <CartButton />
        </div>
      </div>
    </header>
  );
}
