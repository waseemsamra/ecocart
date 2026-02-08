import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Ruler, Palette, Percent, Store, CreditCard, Ship, Layers, PenSquare, Package, Sparkles, StickyNote, Hand, Circle, Disc3 } from 'lucide-react';

const settingsLinks = [
    {
        href: "/admin/sizes",
        title: "Sizes",
        description: "Manage available product sizes.",
        icon: Ruler,
    },
    {
        href: "/admin/colours",
        title: "Colours",
        description: "Manage product colours and hex codes.",
        icon: Palette,
    },
    {
        href: "/admin/print-options",
        title: "Discount Settings",
        description: "Manage discounts and promotions.",
        icon: Percent,
    },
    {
        href: "/admin/shipping-times",
        title: "Shipping Times",
        description: "Configure shipping durations and costs.",
        icon: Ship,
    },
    {
        href: "/admin/brands",
        title: "Brands/Designers",
        description: "Manage brands and designers for products.",
        icon: PenSquare,
    },
    {
        href: "/admin/material-types",
        title: "Materials",
        description: "Manage materials like Standard White or Kraft.",
        icon: Package,
    },
    {
        href: "/admin/finish-types",
        title: "Finish Types",
        description: "Manage finish types like Matt or Glossy.",
        icon: Sparkles,
    },
    {
        href: "/admin/adhesives",
        title: "Adhesives",
        description: "Manage adhesive types like single or double.",
        icon: StickyNote,
    },
    {
        href: "/admin/handles",
        title: "Handles",
        description: "Manage bag handle types like Flat or Twisted.",
        icon: Hand,
    },
    {
        href: "/admin/shapes",
        title: "Shapes",
        description: "Manage coaster shapes like Circle or Square.",
        icon: Circle,
    },
    {
        href: "/admin/lids",
        title: "Lids",
        description: "Manage product lid options like Sip or Straw Slot.",
        icon: Disc3,
    },
    {
        href: "/admin/settings/store-details",
        title: "Store Details",
        description: "Update your store name, contact info, and address.",
        icon: Store,
    },
     {
        href: "#",
        title: "Payment Gateways",
        description: "Connect and manage payment options.",
        icon: CreditCard,
    },
     {
        href: "#",
        title: "Shipping & Delivery",
        description: "Configure shipping zones and rates.",
        icon: Ship,
    },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
          <h1 className="font-headline text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your store's settings, product options, and more.
          </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsLinks.map((link) => {
            const Icon = link.icon;
            return (
                <Link href={link.href} key={link.title} className="block">
                    <Card className="h-full hover:border-primary transition-colors hover:shadow-md">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-secondary p-3 rounded-lg">
                                <Icon className="h-6 w-6 text-secondary-foreground" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-lg">{link.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <CardDescription>{link.description}</CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            )
        })}
      </div>
    </div>
  );
}
    