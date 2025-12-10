import { supabase } from '../lib/supabase';

/**
 * Converts an image URL to a usable format
 * Handles:
 * - Supabase storage paths (converts to public URL)
 * - Relative paths (converts to absolute paths)
 * - Full URLs (returns as-is)
 * - Null/undefined (returns null)
 */
export function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  // If it's already a full URL (http/https), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a Supabase storage URL (contains supabase.co/storage)
  if (imageUrl.includes('supabase.co/storage')) {
    return imageUrl;
  }

  // If it's a relative path starting with /, return as-is (assumes it's from public folder)
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // Check if it might be a Supabase storage path (e.g., "services/image.jpg" or just "image.jpg")
  // Try to get public URL from Supabase storage
  // First try "services" bucket (for service images)
  try {
    const { data: servicesData } = supabase.storage
      .from('services')
      .getPublicUrl(imageUrl);
    
    if (servicesData?.publicUrl) {
      return servicesData.publicUrl;
    }
  } catch (error) {
    // Bucket might not exist, continue to next option
  }

  // If it's a relative path without /, prepend /images/ (assuming images are in public/images)
  if (!imageUrl.startsWith('/')) {
    return `/images/${imageUrl}`;
  }

  return imageUrl;
}

/**
 * Gets the image URL for a service
 * Falls back to local images if Supabase storage fails
 */
export function getServiceImageUrl(imageUrl: string | null | undefined, serviceName?: string): string | null {
  const url = getImageUrl(imageUrl);
  
  if (url) {
    return url;
  }

  // Fallback: try to match service name to local image files
  if (serviceName) {
    const imageMap: Record<string, string> = {
      'facial treatment': '/images/FacialTreatment.jpg',
      'manicure': '/images/Manicure-and-Pedicure.jpg',
      'pedicure': '/images/Manicure-and-Pedicure.jpg',
      'manicure & pedicure': '/images/Manicure-and-Pedicure.jpg',
      'hair styling': '/images/HairStyling.jpg',
      'styling': '/images/HairStyling.jpg',
      'keratin treatment': '/images/KeratinTreatment.jpg',
      'hair coloring': '/images/HairColoring.jpg',
      'coloring': '/images/HairColoring.jpg',
      'premium haircut': '/images/PremiumHaircut.jpg',
      'haircut': '/images/PremiumHaircut.jpg',
    };

    const normalizedName = serviceName.toLowerCase();
    for (const [key, path] of Object.entries(imageMap)) {
      if (normalizedName.includes(key)) {
        return path;
      }
    }
  }

  return null;
}

