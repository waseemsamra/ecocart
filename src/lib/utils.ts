import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -

const s3BaseUrl = 'https://ecocloths.s3.us-west-2.amazonaws.com';

export const getFullImageUrl = (url?: string): string | undefined => {
  if (!url || url.trim() === '') {
    return undefined;
  }

  const trimmedUrl = url.trim();

  // It's already a full URL or a data URI
  if (trimmedUrl.startsWith('http') || trimmedUrl.startsWith('data:')) {
    return trimmedUrl;
  }

  // It's a protocol-relative URL
  if (trimmedUrl.startsWith('//')) {
    return `https:${trimmedUrl}`;
  }
  
  // It's a path on our own S3 bucket
  if (trimmedUrl.startsWith('/')) {
      return `${s3BaseUrl}${trimmedUrl}`;
  }

  // It's a domain name without a protocol, like 'go.sanaullastore.com/...'
  const firstSegment = trimmedUrl.split('/')[0];
  if (firstSegment && firstSegment.includes('.')) {
    return `https://${trimmedUrl}`;
  }

  // Fallback for simple relative paths like 'images/foo.jpg'
  return `${s3BaseUrl}/${trimmedUrl}`;
};
