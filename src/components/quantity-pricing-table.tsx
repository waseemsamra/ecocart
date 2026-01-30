'use client';

import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const quantityTiers = [
  { qty: 1000, pricePerUnit: 0.130, save: 0, total: 130.00 },
  { qty: 5000, pricePerUnit: 0.113, save: 13, total: 565.00 },
  { qty: 10000, pricePerUnit: 0.111, save: 15, total: 1105.00 },
  { qty: 20000, pricePerUnit: 0.101, save: 22, total: 2015.00 },
];

export function QuantityPricingTable({ onQuantityChange }: { onQuantityChange: (tier: typeof quantityTiers[0]) => void }) {
  const [selectedQty, setSelectedQty] = useState(quantityTiers[0].qty.toString());

  const handleValueChange = (value: string) => {
    setSelectedQty(value);
    const selectedTier = quantityTiers.find(t => t.qty.toString() === value);
    if (selectedTier) {
      onQuantityChange(selectedTier);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold mb-2">Quantity</h3>
      <RadioGroup defaultValue={selectedQty} onValueChange={handleValueChange} className="space-y-2">
        {quantityTiers.map(tier => (
          <Label
            key={tier.qty}
            htmlFor={`qty-${tier.qty}`}
            className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${selectedQty === tier.qty.toString() ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
          >
            <div className="flex items-center gap-4">
              <RadioGroupItem value={tier.qty.toString()} id={`qty-${tier.qty}`} />
              <span className="font-medium">{tier.qty.toLocaleString()}</span>
              {tier.save > 0 && <Badge variant="secondary" className="bg-purple-100 text-purple-700">-{tier.save}%</Badge>}
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm">DH{tier.total.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">DH{tier.pricePerUnit.toFixed(3)} / Unit</p>
            </div>
          </Label>
        ))}
      </RadioGroup>
       <div className="mt-2 text-sm text-muted-foreground">
        Need more? <a href="#" className="underline text-primary">Click here</a>
      </div>
    </div>
  );
}
