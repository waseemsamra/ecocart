
'use server';
import { adminDb } from '@/firebase/admin-config';
import { uploadToS3 } from '@/lib/s3-client';
import type { Product, Brand } from '@/lib/types';

const s3BucketUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

export interface ProductToMigrate {
    id: string;
    name: string;
    imageCount: number;
    brandName: string | null;
}

export async function getProductsToMigrate(): Promise<{ products: ProductToMigrate[], error?: string }> {
    if (!adminDb) {
        return { products: [], error: "Firebase Admin SDK is not initialized. Please check your service account credentials in the .env file and restart the server." };
    }
    try {
        const productsSnapshot = await adminDb.collection('products').get();
        const brandsSnapshot = await adminDb.collection('brands').get();
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
    if (!adminDb) {
        return { message: "Failed: Firebase Admin SDK is not initialized. Check server logs.", error: "Admin SDK not initialized" };
    }
    try {
        const productRef = adminDb.collection('products').doc(productId);
        const productDoc = await productRef.get();
        if (!productDoc.exists) {
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
                    const fileName = image.imageUrl.split('/').pop()?.split('?')[0] || `${product.id}-${i}.jpg`;
                    
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
            await productRef.update({ images: newImages });
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
