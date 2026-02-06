
'use server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { slugify } from '@/lib/utils';

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME } = process.env;

let s3Client: S3Client | null = null;
let s3Error: string | null = null;

try {
    const missingVars = [];
    if (!AWS_REGION) missingVars.push('AWS_REGION');
    if (!AWS_ACCESS_KEY_ID) missingVars.push('AWS_ACCESS_KEY_ID');
    if (!AWS_SECRET_ACCESS_KEY) missingVars.push('AWS_SECRET_ACCESS_KEY');
    if (!AWS_S3_BUCKET_NAME) missingVars.push('AWS_S3_BUCKET_NAME');

    if (missingVars.length > 0) {
        throw new Error(`The following environment variables are missing: ${missingVars.join(', ')}.`);
    }

    s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        }
    });

} catch (error: any) {
    s3Error = error.message;
    console.error("[S3 INIT] S3 Initialization Error:", s3Error);
}

export async function uploadToS3(
    buffer: Buffer, 
    fileName: string, 
    contentType: string, 
    options: { brandName?: string | null; productName?: string | null } = {}
): Promise<string> {
    if (!s3Client || !AWS_S3_BUCKET_NAME) {
        throw new Error(s3Error || "S3 client is not configured. Check server environment variables.");
    }
    
    const { brandName, productName } = options;
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    let key: string;

    if (brandName) {
        const brandSlug = slugify(brandName).slice(0, 20);
        // If product name is available, include it for more descriptive filenames.
        const productSlug = productName ? slugify(productName).slice(0, 20) : '';
        const baseName = productSlug ? `${brandSlug}--${productSlug}` : brandSlug;
        key = `uploads/brands/${baseName}--${timestamp}.${extension}`;
    } else {
        // Fallback for general uploads like store logos
        const safeOriginalFileName = slugify(fileName.split('.').slice(0, -1).join('.')).slice(0, 50);
        key = `uploads/general/${timestamp}-${safeOriginalFileName}.${extension}`;
    }


    const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });
    
    try {
        const region = await s3Client.config.region();
        await s3Client.send(command);
        const url = `https://${AWS_S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
        return url;
    } catch (error) {
        console.error("[S3 UPLOAD] SDK send command failed:", error);
        if (error instanceof Error && (error.name === 'AccessDenied' || error.message.includes('Access Denied'))) {
            throw new Error('S3 Access Denied. Please check your IAM user permissions and S3 bucket policy.');
        }
        throw error;
    }
}
