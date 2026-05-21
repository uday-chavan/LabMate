/**
 * Utility to aggressively compress images using HTML5 Canvas
 * before sending to the backend to prevent database bloat.
 */
export async function compressImage(base64Str: string, maxWidth = 500, quality = 0.4): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str.startsWith('data:') ? base64Str : `data:image/jpeg;base64,${base64Str}`;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as heavily compressed JPEG
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.onerror = (error) => reject(error);
  });
}
