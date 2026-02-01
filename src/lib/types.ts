import type { ImagePlaceholder } from './placeholder-images';

export interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  description: string;
  images?: ImagePlaceholder[];
  materials: string[];
  certifications: string[];
  sustainabilityImpact: string;
  showInWeddingTales?: boolean;
  showInDesignersOnDiscount?: boolean;
  showInModernMustHaves?: boolean;
  packagingPartnerTags?: ('new-in' | 'most-popular' | 'ready-to-ship')[];
  
  // Option relationships
  categoryIds?: string[];
  sizeIds?: string[];
  colourIds?: string[];
  brandIds?: string[];
  materialTypeIds?: string[];
  finishTypeIds?: string[];
  adhesiveIds?: string[];
  handleIds?: string[];
  shapeIds?: string[];
  lidIds?: string[];

  createdAt?: any;
  updatedAt?: any;

  // New fields for product detail page
  productCode?: string;
  fit?: string;
  composition?: string;
  care?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  customerName: string;
  itemCount: number;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  roles: ('admin' | 'customer')[];
  createdAt?: any;
  lastLogin?: any;
  photoURL?: string;
}

export interface BrandStory {
    id: string;
    title: string;
    description: string;
    image: ImagePlaceholder;
}

export interface Size {
  id: string;
  name: string;
  shortName: string;
  createdAt?: any;
}

export interface Colour {
  id: string;
  name: string;
  hexCode: string;
  createdAt?: any;
}

export interface Discount {
  id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  createdAt?: any;
}

export interface ShippingTime {
  id: string;
  name: string;
  duration: string;
  cost: number;
  createdAt?: any;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  createdAt?: any;
  slug?: string;
}

export interface MaterialType {
  id: string;
  name: string;
  description: string;
  createdAt?: any;
}

export interface FinishType {
  id: string;
  name: string;
  description: string;
  createdAt?: any;
}

export interface Adhesive {
  id: string;
  name: string;
  description: string;
  createdAt?: any;
}

export interface Handle {
  id: string;
  name: string;
  description: string;
  createdAt?: any;
}
    
export interface Shape {
  id: string;
  name: string;
  description: string;
  createdAt?: any;
}

export interface Lid {
  id: string;
  name: string;
  description: string;
  createdAt?: any;
}

export interface StoreSettings {
  id: string;
  storeName?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  companyDetails?: string;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  imageUrl?: string;
  imageHint?: string;
  order?: number;
  createdAt?: any;
  slug?: string;
}
  
export interface HeroSlide {
  id: string;
  title: string;
  subLinks?: { text: string; href: string }[];
  shopNowUrl?: string;
  imageUrl: string;
  imageHint: string;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface TrendingItem {
  id: string;
  title: string;
  imageUrl: string;
  imageHint: string;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}
    
export interface FeaturedBrand {
  id: string;
  brandId: string;
  updatedAt?: any;
}

export interface SpotlightSettings {
  id: string;
  brandId: string;
  imageUrl: string;
  imageHint: string;
  updatedAt?: any;
}

export interface PackagingPartnerTab {
  id: 'new-in' | 'most-popular' | 'ready-to-ship';
  label: string;
}

export interface PackagingPartnerSettings {
  id: string;
  title: string;
  tabs: PackagingPartnerTab[];
  updatedAt?: any;
}

export interface BestSellingDesigners {
  id: string;
  brandIds: string[];
  updatedAt?: any;
}

export interface ProductCallout {
    id: string;
    title: string;
    description: string;
    linkText: string;
    linkHref: string;
    order: number;
    createdAt?: any;
    updatedAt?: any;
}
