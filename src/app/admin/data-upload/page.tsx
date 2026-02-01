'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, addDoc, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, FileCheck2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { slugify } from '@/lib/utils';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

interface ParsedProduct {
  brand: string;
  frontPic: string;
  hoverPic: string;
  title: string;
  price: string;
}

export default function DataUploadPage() {
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogs(['Reading file...']);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Using `header: 1` to get array of arrays, then mapping to object
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (rows.length < 2) {
          setLogs(prev => [...prev, 'Error: No data found in the sheet.']);
          return;
        }

        // Assuming headers are: brands, Front-pic, Hover-pic, Product-title, price
        const products: ParsedProduct[] = rows.slice(1).map((row) => ({
          brand: row[0] || '',
          frontPic: row[1] || '',
          hoverPic: row[2] || '',
          title: row[3] || '',
          price: String(row[4] || '0'),
        }));
        
        setParsedData(products);
        setLogs(prev => [...prev, `Successfully parsed ${products.length} products from the file.`]);
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
    if (parsedData.length === 0) {
      toast({ variant: 'destructive', title: 'No Data', description: 'No data to upload.' });
      return;
    }

    setIsProcessing(true);
    setLogs(['Starting upload process...']);

    try {
      const brandsRef = collection(db, 'brands');
      const productsRef = collection(db, 'products');
      const batch = writeBatch(db);

      // Step 1: Get all unique brand names
      const uniqueBrandNames = [...new Set(parsedData.map(p => p.brand.trim()).filter(Boolean))];
      setLogs(prev => [...prev, `Found ${uniqueBrandNames.length} unique brands.`]);
      
      // Step 2: Check which brands already exist, handling Firestore's 30-item 'in' query limit.
      const existingBrandsMap = new Map<string, string>();
      if (uniqueBrandNames.length > 0) {
        const chunks = [];
        for (let i = 0; i < uniqueBrandNames.length; i += 30) {
            chunks.push(uniqueBrandNames.slice(i, i + 30));
        }

        for (const chunk of chunks) {
            const existingBrandsQuery = query(brandsRef, where('name', 'in', chunk));
            const existingBrandsSnapshot = await getDocs(existingBrandsQuery);
            existingBrandsSnapshot.docs.forEach(doc => {
                existingBrandsMap.set(doc.data().name, doc.id);
            });
        }
      }
      setLogs(prev => [...prev, `Found ${existingBrandsMap.size} existing brands in the database.`]);
      
      // Step 3: Create new brands that don't exist
      for (const brandName of uniqueBrandNames) {
        if (!existingBrandsMap.has(brandName)) {
          const newBrandRef = doc(collection(db, 'brands'));
          batch.set(newBrandRef, {
            name: brandName,
            slug: slugify(brandName),
            description: '',
            createdAt: serverTimestamp(),
          });
          existingBrandsMap.set(brandName, newBrandRef.id);
          setLogs(prev => [...prev, `Prepared new brand "${brandName}" for creation.`]);
        }
      }

      // Step 4: Prepare product batch
      parsedData.forEach((productData, index) => {
        const brandId = existingBrandsMap.get(productData.brand.trim());
        if (!brandId) {
          setLogs(prev => [...prev, `[Row ${index + 2}] Skipping product "${productData.title}": Brand not found or empty.`]);
          return;
        }

        const price = parseFloat(String(productData.price).replace(/[^0-9.-]+/g,""));
        if (isNaN(price)) {
          setLogs(prev => [...prev, `[Row ${index + 2}] Skipping product "${productData.title}": Invalid price.`]);
          return;
        }
        
        const costPrice = price * (1 - 0.35);

        const images: Omit<ImagePlaceholder, 'id'>[] = [];
        if (productData.frontPic) {
            images.push({ imageUrl: productData.frontPic, description: 'Front View', imageHint: 'front view' });
        }
        if (productData.hoverPic) {
            images.push({ imageUrl: productData.hoverPic, description: 'Hover View', imageHint: 'hover view' });
        }

        const newProductRef = doc(collection(db, 'products'));
        batch.set(newProductRef, {
          name: productData.title,
          slug: slugify(productData.title),
          price: price,
          costPrice: costPrice,
          description: '',
          brandIds: [brandId],
          images: images.map((img, idx) => ({ ...img, id: `${newProductRef.id}_${idx}` })),
          materials: [],
          certifications: [],
          sustainabilityImpact: '',
          categoryIds: [],
          sizeIds: [],
          colourIds: [],
          materialTypeIds: [],
          finishTypeIds: [],
          adhesiveIds: [],
          handleIds: [],
          shapeIds: [],
          lidIds: [],
          showInWeddingTales: false,
          showInDesignersOnDiscount: false,
          showInModernMustHaves: false,
          packagingPartnerTags: [],
          productCode: '',
          fit: '',
          composition: '',
          care: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setLogs(prev => [...prev, `[Row ${index + 2}] Prepared product "${productData.title}" for creation.`]);
      });
      
      // Step 5: Commit batch
      setLogs(prev => [...prev, 'Committing all changes to the database...']);
      await batch.commit();

      toast({
        title: 'Upload Complete',
        description: `${parsedData.length} products have been processed.`,
      });
      setLogs(prev => [...prev, 'Upload complete!']);

    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message,
      });
      setLogs(prev => [...prev, `Error during upload: ${error.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Data Upload</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Product Data</CardTitle>
          <CardDescription>Upload an XLSX file with product information. The columns should be in this order: <code className="bg-muted px-1 rounded-sm">brand</code>, <code className="bg-muted px-1 rounded-sm">Front-pic</code>, <code className="bg-muted px-1 rounded-sm">Hover-pic</code>, <code className="bg-muted px-1 rounded-sm">Product-title</code>, <code className="bg-muted px-1 rounded-sm">price</code>. The first row will be ignored.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Input type="file" accept=".xlsx, .xls" onChange={handleFile} disabled={isProcessing} className="max-w-xs"/>
          <Button onClick={handleUpload} disabled={isProcessing || parsedData.length === 0}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload to Firestore
          </Button>
        </CardContent>
      </Card>
      
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-green-500" /> Parsed Data Preview</CardTitle>
            <CardDescription>Review the data before uploading. Only the first 10 rows are shown.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Front Pic</TableHead>
                    <TableHead>Hover Pic</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.brand}</TableCell>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{row.price}</TableCell>
                      <TableCell className="max-w-xs truncate"><a href={row.frontPic} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{row.frontPic}</a></TableCell>
                      <TableCell className="max-w-xs truncate"><a href={row.hoverPic} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{row.hoverPic}</a></TableCell>
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
