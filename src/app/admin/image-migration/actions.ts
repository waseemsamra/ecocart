
'use server';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { uploadToS3 } from '@/lib/s3-client';
import type { Product, Brand } from '@/lib/types';

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
const db = getFirestore(app);

const s3BucketUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

export interface ProductToMigrate {
    id: string;
    name: string;
    imageCount: number;
    brandName: string | null;
}

export async function getProductsToMigrate(): Promise<{ products: ProductToMigrate[], error?: string }> {
    try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const brandsSnapshot = await getDocs(collection(db, 'brands'));
        const brandsMap = new Map(brandsSnapshot.docs.map(doc => [doc.id, doc.data() as Brand]));

        const productsToMigrate: ProductToMigrate[] = [];

        productsSnapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() } as Product;
            const hasExternalImage = product.images?.some(img => img.imageUrl && !img.imageUrl.startsWith(s3BucketUrl));
            
            if (hasExternalImage) {
                const brandId = product.brandIds?.[0];
                const brandName = brandId ? brandsMap.get(brandId)?.name || null : null;
                productsToMigrate.push({
                    id: product.id,
                    name: product.name,
                    imageCount: product.images?.filter(img => img.imageUrl && !img.imageUrl.startsWith(s3BucketUrl)).length || 0,
                    brandName: brandName,
                });
            }
        });

        return { products: productsToMigrate };
    } catch (e: any) {
        console.error("Error fetching products for migration:", e);
        return { products: [], error: e.message };
    }
}

export async function migrateImagesForProduct(productId: string, brandName: string | null): Promise<{ message: string, error?: string }> {
    try {
        const productRef = doc(db, 'products', productId);
        const productDoc = await getDoc(productRef);
        if (!productDoc.exists()) {
             throw new Error(`Product with ID ${productId} not found.`);
        }
        
        const product = { id: productDoc.id, ...productDoc.data() } as Product;
        if (!product.images || product.images.length === 0) {
            return { message: "No images to process." };
        }

        let migratedCount = 0;
        let errorCount = 0;
        const errorMessages: string[] = [];
        const newImages = [...product.images];

        for (let i = 0; i < newImages.length; i++) {
            const image = newImages[i];
            if (image.imageUrl && !image.imageUrl.startsWith(s3BucketUrl)) {
                try {
                    const response = await fetch(image.imageUrl, {
                       headers: {
                           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                       },
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to fetch (status ${response.status})`);
                    }
                    const buffer = Buffer.from(await response.arrayBuffer());
                    const contentType = response.headers.get('content-type') || 'image/jpeg';
                    const fileName = image.imageUrl.split('/').pop() || `${product.id}-${i}.jpg`;
                    
                    const newUrl = await uploadToS3(buffer, fileName, contentType, { brandName, productName: product.name });
                    newImages[i].imageUrl = newUrl;
                    migratedCount++;
                } catch (fetchError: any) {
                    console.warn(`Skipping ${image.imageUrl} for product ${productId} due to fetch error: ${fetchError.message}`);
                    errorCount++;
                    errorMessages.push(`- ${image.imageUrl.split('/').pop()}: ${fetchError.message}`);
                }
            }
        }
        
        if (migratedCount > 0) {
            await updateDoc(productRef, { images: newImages });
        }

        if(errorCount > 0 && migratedCount > 0) {
            return { message: `Migrated ${migratedCount} image(s), but ${errorCount} failed.\n${errorMessages.join('\n')}` };
        } else if (errorCount > 0) {
            return { message: `Failed to migrate ${errorCount} image(s).\n${errorMessages.join('\n')}`, error: 'Some images failed' };
        } else if (migratedCount > 0) {
            return { message: `Successfully migrated ${migratedCount} image(s).` };
        } else {
             return { message: "All images already migrated or nothing to migrate." };
        }

    } catch (e: any) {
        console.error(`Error migrating images for product ${productId}:`, e);
        return { message: `Failed: ${e.message}`, error: e.message };
    }
}
