'use server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { slugify } from '@/lib/utils';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
    if (s3Client) {
        return s3Client;
    }

    const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME } = process.env;

    const missingVars = [];
    if (!AWS_REGION) missingVars.push('AWS_REGION');
    if (!AWS_ACCESS_KEY_ID) missingVars.push('AWS_ACCESS_KEY_ID');
    if (!AWS_SECRET_ACCESS_KEY) missingVars.push('AWS_SECRET_ACCESS_KEY');
    if (!AWS_S3_BUCKET_NAME) missingVars.push('AWS_S3_BUCKET_NAME');

    if (missingVars.length > 0) {
        throw new Error(`The following AWS environment variables are missing: ${missingVars.join(', ')}.`);
    }

    s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        }
    });

    return s3Client;
}


export async function uploadToS3(
    buffer: Buffer, 
    fileName: string, 
    contentType: string, 
    options: { brandName?: string | null; productName?: string | null } = {}
): Promise<string> {
    const client = getS3Client();
    const { AWS_S3_BUCKET_NAME } = process.env;
    
    if (!AWS_S3_BUCKET_NAME) {
         throw new Error("AWS_S3_BUCKET_NAME environment variable is not set.");
    }
    
    const { brandName } = options;
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    let key: string;

    if (brandName) {
        const brandSlug = slugify(brandName).slice(0, 20);
        key = `uploads/brands/${brandSlug}--${timestamp}.${extension}`;
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
        const region = await client.config.region();
        await client.send(command);
        const url = `https://${AWS_S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
        return url;
    } catch (error) {
        console.error("[S3 UPLOAD] SDK send command failed:", error);
        if (error instanceof Error && (error.name === 'AccessDenied' || error.message.includes('Access Denied'))) {
            throw new Error('S3 Access Denied. Please check your IAM user permissions and S3 bucket policy.');
        }
        if (error instanceof Error && (error.name === 'InvalidAccessKeyId' || error.message.includes('The AWS Access Key Id you provided does not exist'))) {
            throw new Error('Invalid AWS Access Key ID. Please check your .env file credentials.');
        }
        throw error;
    }
}
