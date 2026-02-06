'use server';
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Destructuring at the top level is fine, but we need to check them before use.
const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME } = process.env;

let s3Client: S3Client | null = null;
let s3Error: string | null = null;

// Initialization logic with clear error messages.
try {
    const missingVars = [];
    if (!AWS_REGION) missingVars.push('AWS_REGION');
    if (!AWS_ACCESS_KEY_ID) missingVars.push('AWS_ACCESS_KEY_ID');
    if (!AWS_SECRET_ACCESS_KEY) missingVars.push('AWS_SECRET_ACCESS_KEY');
    if (!AWS_S3_BUCKET_NAME) missingVars.push('AWS_S3_BUCKET_NAME');

    if (missingVars.length > 0) {
        throw new Error(`The following environment variables are missing from your .env.local file: ${missingVars.join(', ')}.`);
    }

    s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        }
    });
    console.log("S3 client successfully initialized for region:", AWS_REGION);

} catch (error: any) {
    s3Error = error.message;
    console.error("S3 Initialization Error:", s3Error);
}


async function uploadToS3(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    // This function will now be called inside the POST handler, where we can check s3Client
    if (!s3Client || !AWS_S3_BUCKET_NAME) {
         // This re-uses the error from initialization time.
        throw new Error(s3Error || "S3 client is not configured. Check server environment variables.");
    }
    
    const key = `uploads/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

    const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    console.log(`[S3 UPLOAD] Attempting to upload to bucket "${AWS_S3_BUCKET_NAME}" in region "${AWS_REGION}"`);

    try {
        await s3Client.send(command);
        const region = await s3Client.config.region();
        const url = `https://${AWS_S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
        console.log("[S3 UPLOAD] Successfully uploaded. Generated URL:", url);
        return url;

    } catch (error) {
        console.error("[S3 UPLOAD] SDK send command failed:", error);
        // Provide more context for debugging S3 permissions.
        if (error instanceof Error && (error.name === 'AccessDenied' || error.message.includes('Access Denied'))) {
            throw new Error('S3 Access Denied. Please check your IAM user permissions and S3 bucket policy.');
        }
        throw error; // Re-throw other errors
    }
}

export async function POST(request: Request) {
  console.log("Image API route hit.");
  
  if (s3Error) {
      console.error("Configuration Error:", s3Error);
      return NextResponse.json({ error: s3Error }, { status: 500 });
  }

  // This check is now redundant because of the above, but good for safety.
  if (!s3Client) {
      return NextResponse.json({ error: "S3 Client not available. Check server logs." }, { status: 500 });
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
