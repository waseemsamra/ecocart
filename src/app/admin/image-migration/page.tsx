
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, FileImage, ShieldAlert, Sparkles, PauseCircle } from 'lucide-react';
import { getProductsToMigrate, migrateImagesForProduct } from './actions';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { ProductToMigrate } from './actions';

type MigrationStatus = 'idle' | 'fetching' | 'ready' | 'migrating' | 'complete' | 'stopped';
type ProductStatus = 'pending' | 'success' | 'error';

interface ProductWithStatus extends ProductToMigrate {
    status: ProductStatus;
    message?: string;
}

export default function ImageMigrationPage() {
    const [status, setStatus] = useState<MigrationStatus>('idle');
    const [products, setProducts] = useState<ProductWithStatus[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [processedCount, setProcessedCount] = useState(0);
    const isStoppingRef = useRef(false);

    const handleFetch = async () => {
        setStatus('fetching');
        setError(null);
        setProducts([]);
        setProcessedCount(0);
        isStoppingRef.current = false;
        try {
            const result = await getProductsToMigrate();
            if (result.error) {
                throw new Error(result.error);
            }
            setProducts(result.products.map(p => ({ ...p, status: 'pending' })));
            setStatus('ready');
        } catch (e: any) {
            setError(e.message);
            setStatus('idle');
        }
    };
    
    const handleStop = () => {
        isStoppingRef.current = true;
    };

    const handleMigrate = async () => {
        setStatus('migrating');
        isStoppingRef.current = false;
        
        // We only want to process products that are still pending
        const productsToProcess = products.filter(p => p.status === 'pending');

        for (const product of productsToProcess) {
            if (isStoppingRef.current) {
                setStatus('stopped');
                break;
            }

            try {
                const result = await migrateImagesForProduct(product.id, product.brandName);
                if (result.error) throw new Error(result.error);
                
                setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'success', message: result.message } : p));
            } catch (e: any) {
                setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'error', message: e.message } : p));
            }
            setProcessedCount(prev => prev + 1);
        }

        if (!isStoppingRef.current) {
            setStatus('complete');
        }
    };

    const progressValue = products.length > 0 ? (processedCount / products.length) * 100 : 0;
    
    const getCardDescription = () => {
        const totalPending = products.filter(p => p.status === 'pending').length;
        switch (status) {
            case 'ready':
                return `Found ${products.length} products with external images to migrate.`;
            case 'migrating':
                return `Migrating ${processedCount} of ${products.length}...`;
            case 'stopped':
                return `Migration stopped. ${processedCount} of ${products.length} processed. ${totalPending} remaining.`;
            case 'complete':
                 return `Migration complete! Processed ${processedCount} of ${products.length} products.`;
            default:
                return 'Status of the image migration process will be shown here.';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">S3 Image Migration</h1>
                <p className="text-muted-foreground">Find and upload external product images to your S3 bucket.</p>
            </div>
            
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Important: Backup Your Data!</AlertTitle>
                <AlertDescription>
                    This is a destructive operation that will modify your product data in Firestore. Please ensure you have a backup of your `products` collection before proceeding.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle>Migration Control</CardTitle>
                    <CardDescription>
                        Step 1: Fetch products with external images. Clicking again will restart the list. Step 2: Start the migration.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Button onClick={handleFetch} disabled={status === 'fetching' || status === 'migrating'}>
                        {status === 'fetching' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {products.length > 0 ? 'Re-fetch Product List' : 'Step 1: Fetch Products'}
                    </Button>
                    <Button onClick={handleMigrate} disabled={status === 'fetching' || status === 'migrating' || (status !== 'ready' && status !== 'stopped') || products.filter(p => p.status === 'pending').length === 0}>
                        {status === 'migrating' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Step 2: Start/Resume Migration
                    </Button>
                    {status === 'migrating' && (
                        <Button variant="destructive" onClick={handleStop}>
                            <PauseCircle className="mr-2 h-4 w-4" />
                            Stop
                        </Button>
                    )}
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>An Error Occurred</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {(status !== 'idle' && status !== 'fetching') && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Migration Progress</CardTitle>
                        <CardDescription>
                           {getCardDescription()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(status === 'migrating' || status === 'stopped' || status === 'complete') && (
                             <Progress value={progressValue} className="w-full mb-4" />
                        )}
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-4">
                            {products.map(p => (
                                <div key={p.id} className="flex items-center gap-4 text-sm p-2 border rounded-md">
                                    {p.status === 'pending' && <FileImage className="h-4 w-4 text-muted-foreground" />}
                                    {p.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                    {p.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                                    <span className="font-medium flex-1 truncate">{p.name}</span>
                                    <span className="text-muted-foreground truncate">{p.message || ''}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                 </Card>
            )}
        </div>
    );
}
