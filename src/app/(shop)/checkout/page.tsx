'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  zip: z.string().min(4),
  country: z.string().min(2),
  cardName: z.string().min(2),
  cardNumber: z.string().regex(/^\d{4} \d{4} \d{4} \d{4}$/, 'Invalid card number'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Invalid format MM/YY'),
  cvc: z.string().regex(/^\d{3,4}$/, 'Invalid CVC'),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: '', name: '', address: '', city: '', zip: '', country: '',
      cardName: '', cardNumber: '', expiryDate: '', cvc: '',
    },
  });

  const onSubmit = (data: CheckoutFormValues) => {
    console.log('Order placed:', data);
    toast({
      title: 'Order Successful!',
      description: "Thank you for your purchase. We'll process your order shortly.",
    });
    clearCart();
    router.push('/');
  };
  
  if (cartItems.length === 0 && typeof window !== 'undefined') {
      router.push('/');
      return null;
  }

  return (
    <div className="container py-12">
      <h1 className="font-headline text-4xl font-bold mb-8">Checkout</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader><CardTitle className="font-headline">Shipping Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="zip" render={({ field }) => (
                  <FormItem><FormLabel>ZIP Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-headline">Payment Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="cardName" render={({ field }) => (
                  <FormItem><FormLabel>Name on Card</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cardNumber" render={({ field }) => (
                  <FormItem><FormLabel>Card Number</FormLabel><FormControl><Input placeholder="xxxx xxxx xxxx xxxx" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="expiryDate" render={({ field }) => (
                    <FormItem><FormLabel>Expiry (MM/YY)</FormLabel><FormControl><Input placeholder="MM/YY" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="cvc" render={({ field }) => (
                    <FormItem><FormLabel>CVC</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader><CardTitle className="font-headline">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="truncate pr-2">{item.name} x {item.quantity}</span>
                    <span className="font-medium">DH{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-4 border-t">
                  <span>Total</span>
                  <span>DH{cartTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
            <Button type="submit" size="lg" className="w-full mt-6">
              Place Order
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
