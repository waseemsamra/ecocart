'use server';
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME } = process.env;

// Initialize the S3 client, but only if the credentials are all present.
let s3Client: S3Client | null = null;
if (AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        }
    });
    console.log("S3 client initialized for region:", AWS_REGION);
} else {
    console.error("S3 client NOT initialized. Missing one or more environment variables.");
}

async function uploadToS3(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    if (!s3Client || !AWS_S3_BUCKET_NAME) {
        console.error("uploadToS3 called but S3 client or bucket name is not configured.");
        throw new Error("S3 client is not configured. Check server environment variables.");
    }
    
    const key = `uploads/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

    const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    console.log(`[S3 UPLOAD] Attempting to upload to:`);
    console.log(`  -> Bucket: ${AWS_S3_BUCKET_NAME}`);
    console.log(`  -> Region: ${AWS_REGION}`);
    console.log(`  -> Key: ${key}`);

    try {
        const output = await s3Client.send(command);
        console.log("[S3 UPLOAD] SDK send command successful. Full response:", JSON.stringify(output, null, 2));

        if (output.$metadata.httpStatusCode !== 200) {
            console.error("[S3 UPLOAD] SDK returned a non-200 status code:", output.$metadata.httpStatusCode);
            throw new Error(`S3 returned status code ${output.$metadata.httpStatusCode}`);
        }
        
        const url = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
        console.log("[S3 UPLOAD] Generated URL:", url);
        return url;

    } catch (error) {
        console.error("[S3 UPLOAD] SDK send command failed:", error);
        throw error; // Re-throw the original error to be caught by the POST handler
    }
}

export async function POST(request: Request) {
  console.log("Image API route hit.");
  if (!s3Client || !AWS_S3_BUCKET_NAME) {
    const missingVars = [];
    if (!process.env.AWS_REGION) missingVars.push('AWS_REGION');
    if (!process.env.AWS_ACCESS_KEY_ID) missingVars.push('AWS_ACCESS_KEY_ID');
    if (!process.env.AWS_SECRET_ACCESS_KEY) missingVars.push('AWS_SECRET_ACCESS_KEY');
    if (!process.env.AWS_S3_BUCKET_NAME) missingVars.push('AWS_S3_BUCKET_NAME');

    const errorMessage = `AWS S3 is not configured. The following environment variables are missing from your .env.local file: ${missingVars.join(', ')}.`;
    console.error("Configuration Error:", errorMessage);
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
  
  try {
    const contentType = request.headers.get('content-type') || '';
    console.log("Request Content-Type:", contentType);

    // CASE 1: Client sends a file for direct upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        console.error("No file found in form data.");
        return NextResponse.json({ error: 'No file provided in form data.' }, { status: 400 });
      }
      
      console.log(`Received file: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

      const buffer = Buffer.from(await file.arrayBuffer());
      const s3Url = await uploadToS3(buffer, file.name, file.type);
      
      console.log("Successfully generated S3 URL. Returning to client:", s3Url);
      return NextResponse.json({ url: s3Url });
    }

    // CASE 2: Client sends a URL to be fetched
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const imageUrl = body.url as string;
      console.log("Received request to fetch URL:", imageUrl);

      if (!imageUrl || !imageUrl.startsWith('http')) {
        console.error("Invalid URL provided for fetching.");
        return NextResponse.json({ error: 'A valid public URL must be provided in the JSON body.' }, { status: 400 });
      }

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
          console.error(`Failed to fetch image from ${imageUrl}. Status: ${imageResponse.status}`);
          throw new Error(`Failed to fetch image from ${imageUrl}. Status: ${imageResponse.status}`);
      }
      
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const fetchedContentType = imageResponse.headers.get('content-type') || 'application/octet-stream';
      const fileName = new URL(imageUrl).pathname.split('/').pop() || 'external-image';

      console.log(`Fetched image: ${fileName}, Size: ${imageBuffer.length}, Type: ${fetchedContentType}`);

      const s3Url = await uploadToS3(imageBuffer, fileName, fetchedContentType);

      console.log("Successfully generated S3 URL from fetched image. Returning to client:", s3Url);
      return NextResponse.json({ url: s3Url });
    }

    // If content type is not supported
    console.error("Unsupported Content-Type:", contentType);
    return NextResponse.json({ error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' }, { status: 415 });

  } catch (error) {
    console.error('Image processing endpoint error:', error);
    let message = 'Failed to process image.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
