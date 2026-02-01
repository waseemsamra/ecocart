'use server';
/**
 * @fileOverview A virtual try-on AI agent.
 *
 * - virtualTryOn - A function that handles the virtual try-on process.
 * - VirtualTryOnInput - The input type for the virtualTryOn function.
 * - VirtualTryOnOutput - The return type for the virtualTryOn function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import fs from 'fs';
import path from 'path';

const VirtualTryOnInputSchema = z.object({
  userPhotoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productImageUrl: z
    .string()
    .describe(
      "URL of a photo of a clothing item."
    ),
});
export type VirtualTryOnInput = z.infer<typeof VirtualTryOnInputSchema>;

const VirtualTryOnOutputSchema = z.object({
  generatedImageUrl: z.string().describe('The generated image of the person wearing the clothing, as a data URI.'),
});
export type VirtualTryOnOutput = z.infer<typeof VirtualTryOnOutputSchema>;

export async function virtualTryOn(input: VirtualTryOnInput): Promise<VirtualTryOnOutput> {
  return virtualTryOnFlow(input);
}

const virtualTryOnFlow = ai.defineFlow(
  {
    name: 'virtualTryOnFlow',
    inputSchema: VirtualTryOnInputSchema,
    outputSchema: VirtualTryOnOutputSchema,
  },
  async ({userPhotoDataUri, productImageUrl}) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {media: {url: userPhotoDataUri}},
        {media: {url: productImageUrl}},
        {
          text: 'You are a virtual stylist. Take the clothing item from the second image and realistically place it on the person in the first image. Preserve the person\'s pose and background as much as possible. The output should be a photorealistic image of the person wearing the clothing.',
        },
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT'], // Required for this model
      },
    });

    if (!media?.url) {
      throw new Error('The AI model did not return an image. Please try again.');
    }

    // Save the generated image to a temporary folder for testing
    try {
      const dataUri = media.url;
      const matches = dataUri.match(/^data:(image\/(\w+));base64,(.*)$/);
      if (matches && matches.length === 4) {
        const imageType = matches[2];
        const base64Data = matches[3];
        const buffer = Buffer.from(base64Data, 'base64');
        const tempDir = path.join(process.cwd(), 'public', 'tmp');
        
        // Ensure the directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filename = `try-on-${Date.now()}.${imageType}`;
        const filePath = path.join(tempDir, filename);
        fs.writeFileSync(filePath, buffer);
        console.log(`Virtual try-on image saved to: /tmp/${filename}`);
      }
    } catch (e) {
      // Log the error but don't fail the flow
      console.error("Failed to save virtual try-on image:", e);
    }

    return { generatedImageUrl: media.url };
  }
);
