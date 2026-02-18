'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, writeBatch, serverTimestamp, doc, query, where, limit, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, FileCheck2, AlertTriangle, CheckCircle, XCircle, Clock, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { slugify } from '@/lib/utils';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { Progress } from '@/components/ui/progress';

interface ParsedProduct {
  brand: string;
  frontPic: string;
  hoverPic: string;
  sidePic: string;
  title: string;
  price: string;
  description: string;
}

type ProductStatus = 'pending' | 'processing' | 'success' | 'error' | 'skipped';
interface ParsedProductWithStatus extends ParsedProduct {
    status: ProductStatus;
    message: string;
}

export default function DataUploadPage() {
  const [products, setProducts] = useState<ParsedProductWithStatus[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const db = useFirestore();
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLogs(['Reading file...']);
    setProducts([]);
    setProcessedCount(0);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // This will parse the sheet into an array of objects, using the first row as headers.
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);
        
        if (jsonData.length === 0) {
          setLogs(prev => [...prev, 'Error: No data found in the sheet.']);
          return;
        }

        // Map from JSON data to our product structure. Handles potential header variations.
        const productsWithStatus: ParsedProductWithStatus[] = jsonData.map((row) => {
            // Find keys case-insensitively and ignoring hyphens/underscores/spaces
            const findKey = (keyName: string) => Object.keys(row).find(k => k.toLowerCase().replace(/[-_\s]/g, '') === keyName.toLowerCase().replace(/[-_\s]/g, ''));
            
            const brandKey = findKey('brand');
            const frontPicKey = findKey('front-pic');
            const hoverPicKey = findKey('hover-pic');
            const sidePicKey = findKey('side_pic');
            const titleKey = findKey('product-title'); // this now matches product_title
            const priceKey = findKey('price');
            const descriptionKey = findKey('description');

            return {
              brand: brandKey ? row[brandKey] : '',
              frontPic: frontPicKey ? row[frontPicKey] : '',
              hoverPic: hoverPicKey ? row[hoverPicKey] : '',
              sidePic: sidePicKey ? row[sidePicKey] : '',
              title: titleKey ? row[titleKey] : '',
              price: priceKey ? String(row[priceKey] || '0') : '0',
              description: descriptionKey ? row[descriptionKey] : '',
              status: 'pending',
              message: 'Waiting...'
            };
        });
        
        setProducts(productsWithStatus);
        setLogs(prev => [...prev, `Successfully parsed ${productsWithStatus.length} products from the file.`]);
      } catch (error: any) {
        setLogs(prev => [...prev, `Error parsing file: ${error.message}`]);
        toast({
          variant: 'destructive',
          title: 'File Parse Error',
          description: error.message,
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    if (!db) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
      return;
    }
    if (products.length === 0) {
      toast({ variant: 'destructive', title: 'No Data', description: 'No data to upload.' });
      return;
    }

    setIsProcessing(true);
    setLogs(['Starting upload process...']);
    setProcessedCount(0);
    
    // Step 1: Handle brands
    const brandsRef = collection(db, 'brands');
    const uniqueBrandNamesFromFile = [...new Set(products.map(p => p.brand.trim()).filter(Boolean))];
    const existingBrandsMap = new Map<string, string>();
    const allBrandsSnapshot = await getDocs(brandsRef);
    allBrandsSnapshot.docs.forEach(doc => {
        existingBrandsMap.set(doc.data().name.toLowerCase(), doc.id);
    });
    setLogs(prev => [...prev, `Found ${existingBrandsMap.size} existing brands.`]);
    
    const brandBatch = writeBatch(db);
    for (const brandName of uniqueBrandNamesFromFile) {
      if (!existingBrandsMap.has(brandName.toLowerCase())) {
        const newBrandRef = doc(brandsRef);
        brandBatch.set(newBrandRef, {
          name: brandName, slug: slugify(brandName), description: '', createdAt: serverTimestamp(),
        });
        existingBrandsMap.set(brandName.toLowerCase(), newBrandRef.id);
        setLogs(prev => [...prev, `Preparing new brand "${brandName}".`]);
      }
    }
    await brandBatch.commit();
    setLogs(prev => [...prev, 'Brand setup complete. Starting product uploads.']);

    // Step 2: Process products one by one
    const productsRef = collection(db, 'products');
    for (let i = 0; i < products.length; i++) {
        let productData = products[i];

        const updateProductStatus = (index: number, status: ProductStatus, message: string) => {
            setProducts(prev => {
                const newProducts = [...prev];
                if (newProducts[index]) {
                    newProducts[index] = { ...newProducts[index], status, message };
                }
                return newProducts;
            });
        };
        
        updateProductStatus(i, 'processing', 'Processing...');

        try {
            const brandNameTrimmed = productData.brand.trim();
            if (!brandNameTrimmed) throw new Error("Brand name is empty.");

            const brandId = existingBrandsMap.get(brandNameTrimmed.toLowerCase());
            if (!brandId) throw new Error(`Brand "${brandNameTrimmed}" not found.`);
            
            const price = parseFloat(String(productData.price).replace(/[^0-9.-]+/g,""));
            if (isNaN(price)) throw new Error("Invalid price format.");
            
            const description = productData.description.trim();
            if (!description) throw new Error("Description is empty.");

            // Upload images
            updateProductStatus(i, 'processing', 'Uploading images...');
            const uploadedImages: Omit<ImagePlaceholder, 'id'>[] = [];
            
            const uploadImage = async (url: string, description: string, hint: string) => {
                if (!url) return null;
                const res = await fetch('/api/image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, brandName: brandNameTrimmed, productName: productData.title })
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                    throw new Error(`${description} upload failed: ${errorData.error}`);
                }
                const result = await res.json();
                return { imageUrl: result.url, description, imageHint: hint };
            };

            const frontImage = await uploadImage(productData.frontPic, 'Front View', 'front view');
            if (frontImage) uploadedImages.push(frontImage);
            
            const hoverImage = await uploadImage(productData.hoverPic, 'Hover View', 'hover view');
            if (hoverImage) uploadedImages.push(hoverImage);

            const sideImage = await uploadImage(productData.sidePic, 'Side View', 'side view');
            if (sideImage) uploadedImages.push(sideImage);

            // Save product to Firestore
            updateProductStatus(i, 'processing', 'Saving to database...');
            const newProductRef = doc(productsRef);
            const productDocData = {
                name: productData.title,
                slug: slugify(productData.title),
                price,
                costPrice: price * (1 - 0.35),
                description,
                brandIds: [brandId],
                images: uploadedImages.map((img, idx) => ({ ...img, id: `${newProductRef.id}_${idx}`, isPrimary: idx === 0 })),
                materials: [], certifications: [], sustainabilityImpact: '', categoryIds: [], sizeIds: [],
                colourIds: [], materialTypeIds: [], finishTypeIds: [], adhesiveIds: [], handleIds: [],
                shapeIds: [], lidIds: [], showInWeddingTales: false, showInDesignersOnDiscount: false,
                showInModernMustHaves: false, packagingPartnerTags: [], productCode: '', fit: '',
                composition: '', care: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
            };
            await setDoc(newProductRef, productDocData);
            
            updateProductStatus(i, 'success', 'Success!');
            setProcessedCount(prev => prev + 1);
        } catch (e: any) {
            updateProductStatus(i, 'error', e.message);
            setProcessedCount(prev => prev + 1);
        }
    }
    setLogs(prev => [...prev, 'All products processed.']);
    setIsProcessing(false);
  };

  const progress = products.length > 0 ? (processedCount / products.length) * 100 : 0;

  const renderStatusIcon = (status: ProductStatus) => {
    switch (status) {
        case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
        case 'processing': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
        case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
        case 'skipped': return <Info className="h-4 w-4 text-gray-500" />;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Data Upload</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Product Data</CardTitle>
          <CardDescription>Upload an XLSX file. Columns can be: <code className="bg-muted px-1 rounded-sm">brand</code>, <code className="bg-muted px-1 rounded-sm">Front-pic</code>, <code className="bg-muted px-1 rounded-sm">Hover-pic</code>, <code className="bg-muted px-1 rounded-sm">side_pic</code>, <code className="bg-muted px-1 rounded-sm">product_title</code>, <code className="bg-muted px-1 rounded-sm">price</code>, <code className="bg-muted px-1 rounded-sm">description</code>. The first row is used for headers.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Input type="file" accept=".xlsx, .xls" onChange={handleFile} disabled={isProcessing} className="max-w-xs"/>
          <Button onClick={handleUpload} disabled={isProcessing || products.length === 0}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload to Firestore
          </Button>
        </CardContent>
      </Card>
      
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-green-500" /> Parsed Data & Upload Status</CardTitle>
            <CardDescription>Review data and monitor the upload process. Images from URLs will be uploaded to S3.</CardDescription>
          </CardHeader>
          <CardContent>
            {isProcessing && <Progress value={progress} className="w-full mb-4" />}
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center">{renderStatusIcon(row.status)}</TableCell>
                      <TableCell>{row.brand}</TableCell>
                      <TableCell>{row.title}</TableCell>
                      <TableCell className={`text-sm ${row.status === 'error' ? 'text-red-500' : row.status === 'skipped' ? 'text-gray-500' : 'text-muted-foreground'}`}>{row.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" />Processing Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 bg-muted p-4 rounded-md">
              <pre className="text-sm whitespace-pre-wrap">
                {logs.join('\n')}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
