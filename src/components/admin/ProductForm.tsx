'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, addDoc, updateDoc, collection, serverTimestamp, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import type { Product, Category, Size, Colour, Brand, MaterialType, FinishType, Adhesive, Handle, Shape, Lid } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Trash2, PlusCircle, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { slugify } from '@/lib/utils';

const s3BaseUrl = 'https://ecocloths.s3.us-west-2.amazonaws.com';

const imageSchema = z.object({
  id: z.string(),
  imageUrl: z.string().optional(),
  imageHint: z.string().optional(),
  description: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  originalPrice: z.coerce.number().optional(),
  sustainabilityImpact: z.string().optional(),
  materials: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  sizeIds: z.array(z.string()).optional(),
  colourIds: z.array(z.string()).optional(),
  brandIds: z.array(z.string()).optional(),
  materialTypeIds: z.array(z.string()).optional(),
  finishTypeIds: z.array(z.string()).optional(),
  adhesiveIds: z.array(z.string()).optional(),
  handleIds: z.array(z.string()).optional(),
  shapeIds: z.array(z.string()).optional(),
  lidIds: z.array(z.string()).optional(),
  images: z.array(imageSchema).optional(),
  showInWeddingTales: z.boolean().optional(),
  showInDesignersOnDiscount: z.boolean().optional(),
  showInModernMustHaves: z.boolean().optional(),
  packagingPartnerTags: z.array(z.string()).optional(),
  productCode: z.string().optional(),
  fit: z.string().optional(),
  composition: z.string().optional(),
  care: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const optionCollections = [
  { name: 'categories', field: 'categoryIds' },
  { name: 'sizes', field: 'sizeIds' },
  { name: 'colours', field: 'colourIds' },
  { name: 'brands', field: 'brandIds' },
  { name: 'materialTypes', field: 'materialTypeIds' },
  { name: 'finishTypes', field: 'finishTypeIds' },
  { name: 'adhesives', field: 'adhesiveIds' },
  { name: 'handles', field: 'handleIds' },
  { name: 'shapes', field: 'shapeIds' },
  { name: 'lids', field: 'lidIds' },
] as const;

type OptionType = Category | Size | Colour | Brand | MaterialType | FinishType | Adhesive | Handle | Shape | Lid;

export function ProductForm({ product }: { product?: Product }) {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          ...product,
          price: product.price || 0,
          originalPrice: product.originalPrice || undefined,
          images: product.images?.map(img => ({
              ...img,
              imageUrl: img.imageUrl?.startsWith(s3BaseUrl) ? img.imageUrl.replace(s3BaseUrl, '') : (img.imageUrl || '')
          })) || [],
          showInWeddingTales: product.showInWeddingTales || false,
          showInDesignersOnDiscount: product.showInDesignersOnDiscount || false,
          showInModernMustHaves: product.showInModernMustHaves || false,
          packagingPartnerTags: product.packagingPartnerTags || [],
          productCode: product.productCode || '',
          fit: product.fit || '',
          composition: product.composition || '',
          care: product.care || '',
        }
      : {
          name: '',
          description: '',
          price: 0,
          originalPrice: undefined,
          images: [],
          categoryIds: [],
          sizeIds: [],
          colourIds: [],
          brandIds: [],
          materialTypeIds: [],
          finishTypeIds: [],
          adhesiveIds: [],
          handleIds: [],
          shapeIds: [],
          lidIds: [],
          materials: [],
          certifications: [],
          showInWeddingTales: false,
          showInDesignersOnDiscount: false,
          showInModernMustHaves: false,
          packagingPartnerTags: [],
          productCode: '',
          fit: '',
          composition: '',
          care: '',
        },
  });
  
  const { fields: imagesField, append: appendImage, remove: removeImage } = useFieldArray({
    control: form.control,
    name: 'images',
  });

  const collections = useMemo(() => {
    if (!db) return {};
    return optionCollections.reduce((acc, { name }) => {
      acc[name] = collection(db, name);
      return acc;
    }, {} as Record<(typeof optionCollections)[number]['name'], ReturnType<typeof collection>>);
  }, [db]);
  
  const categoriesQuery = useMemo(() => {
    if(!collections.categories) return null;
    const q = query(collections.categories);
    (q as any).__memo = true;
    return q;
  }, [collections.categories]);

  const sizesQuery = useMemo(() => {
    if(!collections.sizes) return null;
    const q = query(collections.sizes);
    (q as any).__memo = true;
    return q;
  }, [collections.sizes]);

  const coloursQuery = useMemo(() => {
    if(!collections.colours) return null;
    const q = query(collections.colours);
    (q as any).__memo = true;
    return q;
  }, [collections.colours]);
  
  const brandsQuery = useMemo(() => {
    if(!collections.brands) return null;
    const q = query(collections.brands);
    (q as any).__memo = true;
    return q;
  }, [collections.brands]);

  const materialTypesQuery = useMemo(() => {
    if(!collections.materialTypes) return null;
    const q = query(collections.materialTypes);
    (q as any).__memo = true;
    return q;
  }, [collections.materialTypes]);
  
  const finishTypesQuery = useMemo(() => {
    if(!collections.finishTypes) return null;
    const q = query(collections.finishTypes);
    (q as any).__memo = true;
    return q;
  }, [collections.finishTypes]);

  const adhesivesQuery = useMemo(() => {
    if(!collections.adhesives) return null;
    const q = query(collections.adhesives);
    (q as any).__memo = true;
    return q;
  }, [collections.adhesives]);

  const handlesQuery = useMemo(() => {
    if(!collections.handles) return null;
    const q = query(collections.handles);
    (q as any).__memo = true;
    return q;
  }, [collections.handles]);

  const shapesQuery = useMemo(() => {
    if(!collections.shapes) return null;
    const q = query(collections.shapes);
    (q as any).__memo = true;
    return q;
  }, [collections.shapes]);

  const lidsQuery = useMemo(() => {
    if(!collections.lids) return null;
    const q = query(collections.lids);
    (q as any).__memo = true;
    return q;
  }, [collections.lids]);

  const { data: categories } = useCollection<Category>(categoriesQuery);
  const { data: sizes } = useCollection<Size>(sizesQuery);
  const { data: colours } = useCollection<Colour>(coloursQuery);
  const { data: brands } = useCollection<Brand>(brandsQuery);
  const { data: materialTypes } = useCollection<MaterialType>(materialTypesQuery);
  const { data: finishTypes } = useCollection<FinishType>(finishTypesQuery);
  const { data: adhesives } = useCollection<Adhesive>(adhesivesQuery);
  const { data: handles } = useCollection<Handle>(handlesQuery);
  const { data: shapes } = useCollection<Shape>(shapesQuery);
  const { data: lids } = useCollection<Lid>(lidsQuery);

  const optionData = {
    categories: categories || [],
    sizes: sizes || [],
    colours: colours || [],
    brands: brands || [],
    materialTypes: materialTypes || [],
    finishTypes: finishTypes || [],
    adhesives: adhesives || [],
    handles: handles || [],
    shapes: shapes || [],
    lids: lids || [],
  };

  const handleImageChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newImageFiles = [...imageFiles];
      newImageFiles[index] = file;
      setImageFiles(newImageFiles);

      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue(`images.${index}.imageUrl`, reader.result as string, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (index: number) => {
    removeImage(index);
    const newImageFiles = [...imageFiles];
    newImageFiles.splice(index, 1);
    setImageFiles(newImageFiles);
  };

  const onSubmit = async (data: ProductFormValues) => {
    if (!db) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }
    setIsSubmitting(true);
    try {
        const finalImages = await Promise.all(
            (data.images || []).map(async (image, index) => {
                const file = imageFiles[index];
                let finalUrl = image.imageUrl || '';

                if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const productName = data.name;
                    const brandId = data.brandIds?.[0];
                    const brand = brandId ? optionData.brands.find(b => b.id === brandId) : null;
                    
                    if (productName) {
                        formData.append('productName', productName);
                    }
                    if (brand?.name) {
                        formData.append('brandName', brand.name);
                    }

                    const response = await fetch('/api/image', { method: 'POST', body: formData });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: `Image upload failed for image ${index + 1}: ${response.statusText}` }));
                        throw new Error(errorData.error);
                    }
                    const result = await response.json();
                    finalUrl = result.url;
                } else if (finalUrl && !finalUrl.startsWith('http')) {
                    finalUrl = `${s3BaseUrl}${finalUrl}`;
                }
                
                return { ...image, imageUrl: finalUrl };
            })
        );

        const validImages = finalImages.filter(img => img.imageUrl && img.imageUrl.trim() !== '');

        const dataToSave: Record<string, any> = {
            ...data,
            slug: slugify(data.name),
            images: validImages,
            updatedAt: serverTimestamp(),
        };

        if (dataToSave.originalPrice === undefined) {
            delete dataToSave.originalPrice;
        }

      if (product?.id) {
        await updateDoc(doc(db, 'products', product.id), dataToSave);
        toast({ title: 'Success', description: 'Product updated.' });
      } else {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, 'products'), dataToSave);
        toast({ title: 'Success', description: 'New product added.' });
      }
      router.push('/admin/products');
      router.refresh();
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex justify-between items-center">
            <h1 className="font-headline text-3xl font-bold">{product ? 'Edit Product' : 'Create New Product'}</h1>
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {product ? 'Save Changes' : 'Create Product'}
            </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Set the name, description, and price for your product.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="originalPrice" render={({ field }) => (
                                <FormItem><FormLabel>Original Price (for sales)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 120.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Images</CardTitle>
                        <CardDescription>Add or manage product images.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                        {imagesField.map((field, index) => {
                            const imageUrlValue = form.watch(`images.${index}.imageUrl`);
                            let previewUrl = 'https://placehold.co/80x80';
                            if (imageUrlValue) {
                                if (imageUrlValue.startsWith('data:') || imageUrlValue.startsWith('http')) {
                                    previewUrl = imageUrlValue;
                                } else {
                                    previewUrl = `${s3BaseUrl}${imageUrlValue}`;
                                }
                            }

                            return (
                                <div key={field.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                    <div className="w-20 h-20 relative bg-muted rounded-md overflow-hidden">
                                    <Image 
                                        src={previewUrl} 
                                        alt={field.description || `Image ${index + 1}`} 
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <FormField
                                            control={form.control}
                                            name={`images.${index}.imageUrl`}
                                            render={({ field: imageField }) => (
                                                <FormItem>
                                                    <FormLabel className="sr-only">Image Path</FormLabel>
                                                    <FormControl>
                                                        <div className="flex gap-2">
                                                          <Input
                                                              {...imageField}
                                                              value={imageField.value?.startsWith('data:') ? '' : imageField.value}
                                                              placeholder="/images/product.jpg"
                                                          />
                                                          <Button type="button" variant="outline" asChild>
                                                              <label htmlFor={`image-upload-${index}`} className="cursor-pointer">
                                                                  <UploadCloud className="h-4 w-4" />
                                                                  <input id={`image-upload-${index}`} type="file" accept="image/*" onChange={(e) => handleImageChange(index, e)} className="hidden" />
                                                              </label>
                                                          </Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`images.${index}.imageHint`}
                                            render={({ field: hintField }) => (
                                                <FormItem>
                                                    <FormLabel className="sr-only">AI Image Hint</FormLabel>
                                                    <FormControl><Input {...hintField} placeholder="AI Image Hint (e.g. coffee cup)" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveImage(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            );
                        })}
                        <Button type="button" variant="outline" onClick={() => {
                            if (imagesField.length < 10) {
                                appendImage({ id: crypto.randomUUID(), imageUrl: '', imageHint: '', description: '' });
                                const newImageFiles = [...imageFiles, null];
                                setImageFiles(newImageFiles);
                            } else {
                                toast({ variant: 'destructive', title: 'Limit Reached', description: 'You can add a maximum of 10 images.' });
                            }
                        }}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Image
                        </Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Product Page Details</CardTitle>
                        <CardDescription>Additional details displayed on the product page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="productCode" render={({ field }) => (
                            <FormItem><FormLabel>Product Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="fit" render={({ field }) => (
                            <FormItem><FormLabel>Fit</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="composition" render={({ field }) => (
                            <FormItem><FormLabel>Composition</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="care" render={({ field }) => (
                            <FormItem><FormLabel>Care</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Homepage Placement</CardTitle>
                        <CardDescription>Control where this product is featured on the homepage.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="showInWeddingTales"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Show in "Wedding Tales"</FormLabel>
                                        <FormDescription>
                                            Feature this product in the Wedding Tales section.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="showInDesignersOnDiscount"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Show in "Designers on Discount"</FormLabel>
                                        <FormDescription>
                                            Feature this product in the Designers on Discount section.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="showInModernMustHaves"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Show in "Modern Must-Haves"</FormLabel>
                                        <FormDescription>
                                            Feature this product in the Modern Must-Haves grid.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="packagingPartnerTags"
                            render={() => (
                                <FormItem className="rounded-lg border p-4">
                                    <div className="mb-4">
                                        <FormLabel className="text-base">"Packaging Partner" Tags</FormLabel>
                                        <FormDescription>
                                            Select which tabs this product should appear in on the homepage.
                                        </FormDescription>
                                    </div>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'new-in', label: 'New In' },
                                            { id: 'most-popular', label: 'Most Popular' },
                                            { id: 'ready-to-ship', label: 'Ready to Ship' },
                                        ].map((item) => (
                                            <FormField
                                                key={item.id}
                                                control={form.control}
                                                name="packagingPartnerTags"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={item.id}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(item.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...(field.value || []), item.id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== item.id
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {item.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Organization</CardTitle>
                        <CardDescription>Categorize your product.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="categoryIds"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Categories</FormLabel>
                                <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                                    {optionData.categories.map((item) => (
                                    <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), item.id])
                                                : field.onChange(field.value?.filter((value) => value !== item.id));
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal">{item.name}</FormLabel>
                                    </FormItem>
                                    ))}
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Product Attributes</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {optionCollections.filter(c => c.name !== 'categories').map(({ name, field }) => {
                            if ((optionData as any)[name] && (optionData as any)[name].length > 0) {
                                if (name === 'brands') {
                                    return (
                                        <FormField
                                            key={name}
                                            control={form.control}
                                            name="brandIds"
                                            render={({ field: formField }) => (
                                                <FormItem>
                                                    <div className="flex justify-between items-center">
                                                        <FormLabel>Brands/Designers</FormLabel>
                                                        <Button asChild variant="link" className="text-xs h-auto p-0">
                                                            <Link href="/admin/brands">Manage</Link>
                                                        </Button>
                                                    </div>
                                                    <Select
                                                        value={formField.value?.[0] || 'none'}
                                                        onValueChange={(value) => {
                                                            formField.onChange(value === 'none' ? [] : (value ? [value] : []));
                                                        }}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a brand" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="none">Unbranded</SelectItem>
                                                            {optionData.brands.map((brand: Brand) => (
                                                                <SelectItem key={brand.id} value={brand.id}>
                                                                    {brand.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    );
                                } else {
                                    return (
                                        <FormField key={name} control={form.control} name={field as any} render={({ field: formField }) => (
                                            <FormItem>
                                                <div className="flex justify-between items-center">
                                                    <FormLabel>{name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')}</FormLabel>
                                                </div>
                                                <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                                                    {(optionData as any)[name].map((item: OptionType) => (
                                                        <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox checked={formField.value?.includes(item.id)} onCheckedChange={(checked) => (
                                                                    checked ? formField.onChange([...(formField.value || []), item.id]) : formField.onChange(formField.value?.filter((v: string) => v !== item.id))
                                                                )}/>
                                                            </FormControl>
                                                            <FormLabel className="font-normal">{item.name}</FormLabel>
                                                        </FormItem>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                    );
                                }
                            }
                            return null;
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
      </form>
    </Form>
  );
}
