'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/cart-context';
import type { Product } from '@/lib/types';
import { Minus, Plus, ShoppingCart } from 'lucide-react';

export function AddToCartForm({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToCart(product, quantity);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-4 mt-6">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
          className="w-16 text-center h-10"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => handleQuantityChange(quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button type="submit" size="lg" className="flex-1">
        <ShoppingCart className="mr-2 h-5 w-5" />
        Add to Cart
      </Button>
    </form>
  );
}
