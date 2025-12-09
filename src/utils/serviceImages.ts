/**
 * Service Image Mapping Utility
 * Maps service names to local asset images in public/images/
 * 
 * To add/update images:
 * 1. Place your image files in public/images/ folder
 * 2. Add them to the SERVICE_IMAGE_MAP below using the path '/images/filename.jpg'
 * 3. Images in public/ are served directly by Vite
 */

// Map service names to their image paths in public/images/
// Images in public/ are served at the root, so '/images/filename.jpg' is the correct path
export const SERVICE_IMAGE_MAP: Record<string, string> = {
  'Premium Haircut': '/images/PremiumHaircut.jpg',
  'Hair Coloring': '/images/HairColoring.jpg',
  'Keratin Treatment': '/images/KeratinTreatment.jpg',
  'Hair Styling': '/images/HairStyling.jpg',
  'Manicure & Pedicure': '/images/Manicure-and-Pedicure.jpg',
  'Facial Treatment': '/images/FacialTreatment.jpg',
  // Add more mappings as needed
};

/**
 * Get the image path for a service
 * @param serviceName - The name of the service
 * @returns The image path or undefined if not found
 */
export function getServiceImagePath(serviceName: string): string | undefined {
  return SERVICE_IMAGE_MAP[serviceName];
}

/**
 * Get image path with fallback to placeholder
 * @param serviceName - The name of the service
 * @returns The image path or a placeholder gradient
 */
export function getServiceImage(serviceName: string): string {
  const imagePath = getServiceImagePath(serviceName);
  
  if (imagePath) {
    return imagePath;
  }
  
  // Fallback placeholder (gradient SVG)
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e91e8c;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#9333ea;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${encodeURIComponent(serviceName)}</text>
    </svg>
  `)}`;
}
