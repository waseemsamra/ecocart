
'use server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

export async function uploadToS3(buffer: Buffer, fileName: string, contentType: string, brandName?: string | null): Promise<string> {
    if (!s3Client || !AWS_S3_BUCKET_NAME) {
        throw new Error(s3Error || "S3 client is not configured. Check server environment variables.");
    }
    
    const originalFileName = fileName.replace(/\s+/g, '-');
    let keyPath = 'uploads';

    if (brandName) {
        keyPath += `/brands`;
    }
    
    const key = `${keyPath}/${Date.now()}-${originalFileName}`;

    const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });
    
    try {
        await s3Client.send(command);
        const region = await s3Client.config.region();
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
