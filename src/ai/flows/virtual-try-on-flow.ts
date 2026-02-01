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

    return { generatedImageUrl: media.url };
  }
);
