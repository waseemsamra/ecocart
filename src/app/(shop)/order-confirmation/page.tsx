'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, PackageCheck } from 'lucide-react';
import type { CartItem } from '@/lib/types';
import { format } from 'date-fns';

interface ShippingDetails {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  country: string;
}

interface OrderDetails {
  orderId: string;
  shippingDetails: ShippingDetails;
  items: CartItem[];
  total: number;
  createdAt: string; // ISO string
}

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const orderData = sessionStorage.getItem('latestOrder');
    if (orderData) {
      try {
        const parsedOrder: OrderDetails = JSON.parse(orderData);
        setOrder(parsedOrder);
        // Optional: remove the item from session storage after reading it
        // sessionStorage.removeItem('latestOrder');
      } catch (error) {
        console.error("Failed to parse order data from session storage", error);
        router.push('/');
      }
    } else {
        // If no order data, redirect to home.
        router.push('/');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
       <div className="container py-24 text-center">
        <h1 className="mt-4 font-headline text-3xl font-bold">No Order Found</h1>
        <p className="mt-2 text-muted-foreground">We couldn't find any recent order information.</p>
        <Button asChild className="mt-6">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
            <PackageCheck className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="mt-4 font-headline text-3xl md:text-4xl font-bold">Thank you for your order!</h1>
            <p className="mt-2 text-muted-foreground">
                Your order has been placed successfully. A confirmation email has been sent to {order.shippingDetails.email}.
            </p>
            <p className="mt-4 text-sm font-semibold">
                Order Reference: <span className="font-mono text-primary">{order.orderId}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
                Order placed on: {format(new Date(order.createdAt), 'PPP')}
            </p>
        </div>

        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-4">
                            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                               <Image src={item.images?.[0]?.imageUrl || 'https://placehold.co/64x64'} alt={item.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                            </div>
                            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${order.total.toFixed(2)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Shipping To</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-muted-foreground">
                    <p className="font-semibold text-foreground">{order.shippingDetails.name}</p>
                    <p>{order.shippingDetails.address}</p>
                    <p>{order.shippingDetails.city}, {order.shippingDetails.zip}</p>
                    <p>{order.shippingDetails.country}</p>
                </CardContent>
            </Card>
        </div>
         <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link href="/">Continue Shopping</Link>
            </Button>
        </div>
    </div>
  );
}
