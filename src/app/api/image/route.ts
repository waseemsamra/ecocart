
'use server';
import { NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3-client';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const brandName = formData.get('brandName') as string | null;
      const productName = formData.get('productName') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data.' }, { status: 400 });
      }
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const s3Url = await uploadToS3(buffer, file.name, file.type, { brandName, productName });
      
      return NextResponse.json({ url: s3Url });
    }

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const imageUrl = body.url as string;
      const brandName = body.brandName as string | null;
      const productName = body.productName as string | null;

      if (!imageUrl || !imageUrl.startsWith('http')) {
        return NextResponse.json({ error: 'A valid public URL must be provided.' }, { status: 400 });
      }

      const imageResponse = await fetch(imageUrl, { headers: { 'User-Agent': 'ClothCard-Image-Migrator/1.0' }});
      if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image from ${imageUrl}. Status: ${imageResponse.status}`);
      }
      
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const fetchedContentType = imageResponse.headers.get('content-type') || 'application/octet-stream';
      const fileName = new URL(imageUrl).pathname.split('/').pop() || 'external-image.jpg';

      const s3Url = await uploadToS3(imageBuffer, fileName, fetchedContentType, { brandName, productName });

      return NextResponse.json({ url: s3Url });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' }, { status: 415 });

  } catch (error) {
    let message = 'Failed to process image.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
