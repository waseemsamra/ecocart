'use server';
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { slugify } from '@/lib/utils';

// Destructuring at the top level is fine, but we need to check them before use.
const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME } = process.env;

let s3Client: S3Client | null = null;
let s3Error: string | null = null;

// Initialization logic with clear error messages.
try {
    console.log('[S3 INIT] Starting S3 client initialization...');
    const missingVars = [];
    if (!AWS_REGION) missingVars.push('AWS_REGION');
    if (!AWS_ACCESS_KEY_ID) missingVars.push('AWS_ACCESS_KEY_ID');
    if (!AWS_SECRET_ACCESS_KEY) missingVars.push('AWS_SECRET_ACCESS_KEY');
    if (!AWS_S3_BUCKET_NAME) missingVars.push('AWS_S3_BUCKET_NAME');

    if (missingVars.length > 0) {
        throw new Error(`The following environment variables are missing from your .env file: ${missingVars.join(', ')}. Please add them and restart the server.`);
    }

    console.log(`[S3 INIT] All credentials found. Region: ${AWS_REGION}, Bucket: ${AWS_S3_BUCKET_NAME}`);

    s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        }
    });
    console.log("[S3 INIT] S3 client successfully initialized.");

} catch (error: any) {
    s3Error = error.message;
    console.error("[S3 INIT] S3 Initialization Error:", s3Error);
}


async function uploadToS3(buffer: Buffer, fileName: string, contentType: string, brandName?: string | null, productName?: string | null): Promise<string> {
    if (!s3Client || !AWS_S3_BUCKET_NAME || !AWS_REGION) {
        throw new Error(s3Error || "S3 client is not configured. Check server environment variables and restart the server.");
    }
    
    const originalFileName = fileName.replace(/\s+/g, '-');
    let keyPath = 'uploads'; // Default path

    if (brandName) {
        const brandSlug = slugify(brandName);
        keyPath += `/brands/${brandSlug}`;
        if (productName) {
            const productSlug = slugify(productName);
            keyPath += `/${productSlug}`;
        }
    }

    // Using a timestamp to ensure uniqueness, which is more robust than a simple index.
    const key = `${keyPath}/${Date.now()}-${originalFileName}`;

    const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    console.log(`[S3 UPLOAD] Attempting to upload to S3 path: ${key}`);

    try {
        await s3Client.send(command);
        const url = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
        console.log(`[S3 UPLOAD] SDK send command successful. Generated URL: ${url}`);
        return url;
    } catch (error) {
        console.error("[S3 UPLOAD] SDK send command failed:", error);
        if (error instanceof Error && (error.name === 'AccessDenied' || error.message.includes('Access Denied'))) {
            throw new Error('S3 Access Denied. Please check your IAM user permissions and S3 bucket policy.');
        }
        throw error;
    }
}

export async function POST(request: Request) {
  console.log("Image API route hit at:", new Date().toISOString());
  
  if (s3Error) {
      console.error("[API CHECK] Configuration Error from init:", s3Error);
      return NextResponse.json({ error: s3Error }, { status: 500 });
  }

  if (!s3Client) {
      const errorMessage = "S3 Client not available. This is unexpected. Check server startup logs for an S3 Initialization Error.";
      console.error("[API CHECK]", errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
  
  try {
    const contentType = request.headers.get('content-type') || '';
    console.log("[API] Request Content-Type:", contentType);

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const brandName = formData.get('brandName') as string | null;
      const productName = formData.get('productName') as string | null;

      if (!file) {
        console.error("[API] No file found in form data.");
        return NextResponse.json({ error: 'No file provided in form data.' }, { status: 400 });
      }
      
      console.log(`[API] Received file: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

      const buffer = Buffer.from(await file.arrayBuffer());
      const s3Url = await uploadToS3(buffer, file.name, file.type, brandName, productName);
      
      return NextResponse.json({ url: s3Url });
    }

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const imageUrl = body.url as string;
      const brandName = body.brandName as string | null;
      const productName = body.productName as string | null;

      console.log("[API] Received request to fetch URL:", imageUrl);

      if (!imageUrl || !imageUrl.startsWith('http')) {
        console.error("[API] Invalid URL provided for fetching.");
        return NextResponse.json({ error: 'A valid public URL must be provided in the JSON body.' }, { status: 400 });
      }

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
          console.error(`[API] Failed to fetch image from ${imageUrl}. Status: ${imageResponse.status}`);
          throw new Error(`Failed to fetch image from ${imageUrl}. Status: ${imageResponse.status}`);
      }
      
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const fetchedContentType = imageResponse.headers.get('content-type') || 'application/octet-stream';
      const fileName = new URL(imageUrl).pathname.split('/').pop() || 'external-image';

      console.log(`[API] Fetched image: ${fileName}, Size: ${imageBuffer.length}, Type: ${fetchedContentType}`);

      const s3Url = await uploadToS3(imageBuffer, fileName, fetchedContentType, brandName, productName);

      return NextResponse.json({ url: s3Url });
    }

    console.error("[API] Unsupported Content-Type:", contentType);
    return NextResponse.json({ error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' }, { status: 415 });

  } catch (error) {
    console.error('[API] Image processing endpoint error:', error);
    let message = 'Failed to process image.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
