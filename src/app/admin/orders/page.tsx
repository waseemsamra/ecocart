'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { collection, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const ordersQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: orders, isLoading, error } = useCollection<Order>(ordersQuery);

  const handleDeleteOrder = async (orderId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast({ title: 'Success', description: 'Order deleted.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleChangeStatus = async (
    orderId: string,
    status: Order['status']
  ) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      toast({
        title: 'Success',
        description: `Order status updated to ${status}.`,
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Ready to Delivery':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Orders</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>View and manage customer orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-destructive"
                  >
                    {error.message}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && orders?.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No orders found yet.</TableCell>
                </TableRow>
              )}
              {!isLoading &&
                orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderId}</TableCell>
                    <TableCell>{order.shippingDetails.name}</TableCell>
                    <TableCell>
                      {order.createdAt
                        ? format(order.createdAt.toDate(), 'MMM d, yyyy')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusClass(order.status)}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ${order.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => setViewingOrder(order)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Order
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Change Status</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleChangeStatus(order.id, 'Processing')
                                  }
                                >
                                  Processing
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleChangeStatus(
                                      order.id,
                                      'Ready to Delivery'
                                    )
                                  }
                                >
                                  Ready to Delivery
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleChangeStatus(order.id, 'Delivered')
                                  }
                                >
                                  Delivered
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleChangeStatus(order.id, 'Cancelled')
                                  }
                                  className="text-red-500"
                                >
                                  Cancelled
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuItem
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!viewingOrder}
        onOpenChange={(open) => !open && setViewingOrder(null)}
      >
        <DialogContent className="sm:max-w-[625px]">
          {viewingOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order {viewingOrder.orderId}</DialogTitle>
                <DialogDescription>
                  Placed on{' '}
                  {viewingOrder.createdAt
                    ? format(viewingOrder.createdAt.toDate(), 'PPP p')
                    : 'N/A'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <h4 className="font-semibold">Customer Details</h4>
                  <p className="text-sm text-muted-foreground">
                    {viewingOrder.shippingDetails.name}
                    <br />
                    {viewingOrder.shippingDetails.email}
                    <br />
                    {viewingOrder.shippingDetails.phone}
                    <br />
                    {viewingOrder.shippingDetails.address},{' '}
                    {viewingOrder.shippingDetails.city},{' '}
                    {viewingOrder.shippingDetails.zip}
                    <br />
                    {viewingOrder.shippingDetails.country}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Items</h4>
                  <div className="space-y-2 mt-2">
                    {viewingOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 text-sm"
                      >
                        <Image
                          src={
                            item.images?.[0]?.imageUrl ||
                            'https://placehold.co/64'
                          }
                          alt={item.name}
                          width={48}
                          height={48}
                          className="rounded-md"
                          unoptimized
                        />
                        <div className="flex-1">
                          <p>{item.name}</p>
                          <p className="text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p>${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg pt-4 border-t">
                <span>Total:</span>
                <span>${viewingOrder.total.toFixed(2)}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
