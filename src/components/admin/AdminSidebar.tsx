
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart,
  Calendar,
  LogOut,
  Home,
  UserCheck,
  ChevronRight,
  FolderOpenDot,
  Star,
  Upload,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isProductRouteActive = pathname.startsWith('/admin/products');
  const isCmsRouteActive = pathname.startsWith('/admin/content');

  const [isProductsOpen, setIsProductsOpen] = useState(isProductRouteActive);
  const [isCmsOpen, setIsCmsOpen] = useState(isCmsRouteActive);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <span className="font-headline text-2xl font-bold">AdminHub</span>
            <Badge variant="outline">Beta</Badge>
          </div>
        </SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/admin/dashboard'} tooltip="Dashboard">
              <Link href="/admin/dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/admin/orders'} tooltip="Orders">
              <Link href="/admin/orders">
                <ShoppingCart />
                <span>Orders</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Products Accordion */}
          <SidebarMenuItem asChild>
            <Collapsible open={isProductsOpen} onOpenChange={setIsProductsOpen}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  isActive={isProductRouteActive}
                  tooltip="Products"
                  className="justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <Package />
                    <span>Products</span>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 transition-transform', isProductsOpen && 'rotate-90')} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/products'}>
                      <Link href="/admin/products">
                        All Products
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/products/categories'}>
                      <Link href="/admin/products/categories">
                        Categories
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/admin/data-upload'} tooltip="Data Upload">
              <Link href="/admin/data-upload">
                <Upload />
                <span>Data Upload</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/admin/image-migration'} tooltip="Image Migration">
              <Link href="/admin/image-migration">
                <Sparkles />
                <span>Image Migration</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/admin/users'} tooltip="Users">
              <Link href="/admin/users">
                <Users />
                <span>Users</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/admin/analytics'} tooltip="Analytics">
              <Link href="/admin/analytics">
                <BarChart />
                <span>Analytics</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/admin/calendar'} tooltip="Calendar">
              <Link href="/admin/calendar">
                <Calendar />
                <span>Calendar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/admin/grant-admin'} tooltip="Grant Admin">
              <Link href="/admin/grant-admin">
                <UserCheck />
                <span>Grant Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* CMS Accordion */}
          <SidebarMenuItem asChild>
            <Collapsible open={isCmsOpen} onOpenChange={setIsCmsOpen}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  isActive={isCmsRouteActive}
                  tooltip="CMS"
                  className="justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpenDot />
                    <span>CMS</span>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 transition-transform', isCmsOpen && 'rotate-90')} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/content/hero-slides'}>
                      <Link href="/admin/content/hero-slides">
                        Hero Slides
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/content/new-arrivals'}>
                      <Link href="/admin/content/new-arrivals">
                        New Arrivals
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/content/trending-now'}>
                     <Link href="/admin/content/trending-now">
                        Trending Now
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                   <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/content/featured-brand'}>
                      <Link href="/admin/content/featured-brand">
                        Featured Brand
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/content/packaging-partner'}>
                      <Link href="/admin/content/packaging-partner">
                        Packaging Partner
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/content/packaging-partner-settings'}>
                      <Link href="/admin/content/packaging-partner-settings">
                        Packaging Partner Settings
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/content/spotlight'}>
                      <Link href="/admin/content/spotlight">
                        Designers Spotlight
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/content/best-selling-designers'}>
                      <Link href="/admin/content/best-selling-designers">
                        Best Selling Designers
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/content/product-callouts'}>
                      <Link href="/admin/content/product-callouts">
                        Product Callouts
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin/content/product-info-sections'}>
                      <Link href="/admin/content/product-info-sections">
                        Product Info Sections
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/settings')} tooltip="Settings">
              <Link href="/admin/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to Shop">
              <Link href="/">
                <Home />
                <span>Back to Shop</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => logout()} tooltip="Logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <Link href="/admin/profile" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
            <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
            <p className="font-medium text-sm truncate">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
