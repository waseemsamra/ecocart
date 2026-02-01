'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Loader2, Truck } from 'lucide-react';
import { useEffect } from 'react';

const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  zip: z.string().min(4),
  country: z.string().min(2),
  paymentMethod: z.enum(['credit-card', 'cod']),
  cardName: z.string().optional(),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvc: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.paymentMethod === 'credit-card') {
        if (!data.cardName || data.cardName.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['cardName'],
                message: "Name on card is required",
            });
        }
        if (!data.cardNumber || !/^\d{4} \d{4} \d{4} \d{4}$/.test(data.cardNumber)) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['cardNumber'],
                message: "Invalid card number format",
            });
        }
        if (!data.expiryDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiryDate)) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['expiryDate'],
                message: "Invalid format MM/YY",
            });
        }
        if (!data.cvc || !/^\d{3,4}$/.test(data.cvc)) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['cvc'],
                message: "Invalid CVC",
            });
        }
    }
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
      paymentMethod: 'credit-card',
      cardName: '', cardNumber: '', expiryDate: '', cvc: '',
    },
  });

  const paymentMethod = form.watch('paymentMethod');

  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/');
    }
  }, [cartItems, router]);

  const onSubmit = (data: CheckoutFormValues) => {
    const orderId = `CC-${Date.now()}`;

    const orderDetails = {
      orderId,
      shippingDetails: {
        name: data.name,
        email: data.email,
        address: data.address,
        city: data.city,
        zip: data.zip,
        country: data.country,
      },
      items: cartItems,
      total: cartTotal,
    };

    try {
      sessionStorage.setItem('latestOrder', JSON.stringify(orderDetails));
    } catch (error) {
      console.error("Could not save order to session storage", error);
      toast({
        variant: "destructive",
        title: "Could not proceed to confirmation",
        description: "There was an issue saving your order details. Please try again.",
      });
      return;
    }

    clearCart();
    router.push('/order-confirmation');
  };
  
  if (cartItems.length === 0) {
    return (
        <div className="container py-12 flex justify-center items-center min-h-[60vh] flex-col gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Your cart is empty. Redirecting...</p>
        </div>
      );
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
                <CardHeader><CardTitle className="font-headline">Payment Method</CardTitle></CardHeader>
                <CardContent>
                    <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                            <FormItem>
                                <FormControl>
                                <RadioGroupItem value="credit-card" id="credit-card" className="sr-only" />
                                </FormControl>
                                <Label htmlFor="credit-card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <CreditCard className="mb-3 h-6 w-6" />
                                    Credit Card
                                </Label>
                            </FormItem>
                             <FormItem>
                                <FormControl>
                                <RadioGroupItem value="cod" id="cod" className="sr-only" />
                                </FormControl>
                                <Label htmlFor="cod" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <Truck className="mb-3 h-6 w-6" />
                                    Payment on Delivery
                                </Label>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>
            
            {paymentMethod === 'credit-card' && (
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
            )}

            {paymentMethod === 'cod' && (
                <Card>
                    <CardHeader><CardTitle className="font-headline">Payment on Delivery</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">You will pay for your order in cash when it is delivered to your address. Please have the exact amount ready.</p>
                    </CardContent>
                </Card>
            )}

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
