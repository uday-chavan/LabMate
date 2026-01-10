import { createWorker } from 'tesseract.js';

export async function processImage(file: File): Promise<string> {
  try {
    const worker = await createWorker('eng');
    
    // Convert File to image URL
    const imageUrl = URL.createObjectURL(file);
    
    // Recognize text
    const { data: { text } } = await worker.recognize(imageUrl);
    
    // Cleanup
    URL.revokeObjectURL(imageUrl);
    await worker.terminate();
    
    return text;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image. Please try again.');
  }
}
