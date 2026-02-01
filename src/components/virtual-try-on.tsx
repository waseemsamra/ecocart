'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, Sparkles } from 'lucide-react';
import type { Product } from '@/lib/types';
import { virtualTryOn, VirtualTryOnInput } from '@/ai/flows/virtual-try-on-flow';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

// Helper function to convert a file to a data URI
const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Helper function to fetch an image and convert it to a data URI
const imageUrlToDataUri = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


export function VirtualTryOn({ product }: { product: Product }) {
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if(file.size > 4 * 1024 * 1024) {
          toast({
              variant: 'destructive',
              title: 'File too large',
              description: 'Please upload an image smaller than 4MB.',
          });
          return;
      }
      setUserImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImagePreview(reader.result as string);
        setGeneratedImage(null); // Reset generated image when a new file is selected
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleTryOn = async () => {
    if (!userImageFile || !product.images?.[0]?.imageUrl) {
        toast({
            variant: 'destructive',
            title: 'Missing Image',
            description: 'Please upload your photo first.',
        });
        return;
    }

    setIsLoading(true);
    setGeneratedImage(null);

    try {
        // We need to use a CORS proxy to fetch the image on the client-side
        // This is a common issue when trying to read pixel data from cross-origin images.
        // For this demo, we'll use a public proxy. In a real app, you should host your own.
        const productImageUrl = `https://cors-anywhere.herokuapp.com/${product.images[0].imageUrl}`;

        const [userPhotoDataUri, productImageDataUri] = await Promise.all([
             fileToDataUri(userImageFile),
             imageUrlToDataUri(productImageUrl)
        ]);

        const input: VirtualTryOnInput = { userPhotoDataUri, productImageDataUri };
        
        const result = await virtualTryOn(input);

        if (result.generatedImageUrl) {
            setGeneratedImage(result.generatedImageUrl);
        } else {
             throw new Error('The model did not return an image.');
        }

    } catch (error: any) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Virtual Try-On Failed',
            description: error.message || 'An unexpected error occurred. Please try again.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <Alert>
         <Sparkles className="h-4 w-4" />
         <AlertTitle>Virtual Try-On (Beta)</AlertTitle>
         <AlertDescription>
           Upload a full-body photo of yourself to see how this item might look on you. This is an experimental feature.
         </AlertDescription>
       </Alert>
        
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div 
           className="relative aspect-[3/4] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:border-primary"
           onClick={() => fileInputRef.current?.click()}
         >
           <Input
              ref={fileInputRef}
              id="user-photo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {userImagePreview ? (
              <Image src={userImagePreview} alt="Your photo" fill className="object-contain rounded-lg" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <UploadCloud className="h-12 w-12" />
                <span className="font-semibold">Click to upload your photo</span>
                <span className="text-xs">PNG, JPG, or WebP up to 4MB</span>
              </div>
            )}
         </div>

         <div className="relative aspect-[3/4] border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
           {isLoading ? (
             <div className="flex flex-col items-center gap-2 text-primary">
               <Loader2 className="h-12 w-12 animate-spin" />
               <span className="font-semibold">Generating your try-on...</span>
             </div>
           ) : generatedImage ? (
             <Image src={generatedImage} alt="Virtual try-on result" fill className="object-contain rounded-lg" />
           ) : (
             <div className="flex flex-col items-center gap-2 text-center text-muted-foreground p-4">
               <Sparkles className="h-12 w-12" />
               <span className="font-semibold">Your virtual try-on will appear here</span>
             </div>
           )}
         </div>
       </div>

       <Button onClick={handleTryOn} disabled={isLoading || !userImageFile} className="w-full" size="lg">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        {isLoading ? 'Generating...' : 'Try It On'}
       </Button>
    </div>
  );
}
