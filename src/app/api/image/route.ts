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
}

async function uploadToS3(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    if (!s3Client || !AWS_S3_BUCKET_NAME) {
        throw new Error("S3 client is not configured. Check server environment variables.");
    }
    
    const key = `uploads/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

    const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    await s3Client.send(command);

    return `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

export async function POST(request: Request) {
  if (!s3Client || !AWS_S3_BUCKET_NAME) {
    const missingVars = [];
    if (!process.env.AWS_REGION) missingVars.push('AWS_REGION');
    if (!process.env.AWS_ACCESS_KEY_ID) missingVars.push('AWS_ACCESS_KEY_ID');
    if (!process.env.AWS_SECRET_ACCESS_KEY) missingVars.push('AWS_SECRET_ACCESS_KEY');
    if (!process.env.AWS_S3_BUCKET_NAME) missingVars.push('AWS_S3_BUCKET_NAME');

    const errorMessage = `AWS S3 is not configured. The following environment variables are missing from your .env.local file: ${missingVars.join(', ')}.`;
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
  
  try {
    const contentType = request.headers.get('content-type') || '';

    // CASE 1: Client sends a file for direct upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data.' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const s3Url = await uploadToS3(buffer, file.name, file.type);
      
      return NextResponse.json({ url: s3Url });
    }

    // CASE 2: Client sends a URL to be fetched
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const imageUrl = body.url as string;

      if (!imageUrl || !imageUrl.startsWith('http')) {
        return NextResponse.json({ error: 'A valid public URL must be provided in the JSON body.' }, { status: 400 });
      }

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image from ${imageUrl}. Status: ${imageResponse.status}`);
      }
      
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const fetchedContentType = imageResponse.headers.get('content-type') || 'application/octet-stream';
      // Try to get a reasonable file name from the URL
      const fileName = new URL(imageUrl).pathname.split('/').pop() || 'external-image';

      const s3Url = await uploadToS3(imageBuffer, fileName, fetchedContentType);

      return NextResponse.json({ url: s3Url });
    }

    // If content type is not supported
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
