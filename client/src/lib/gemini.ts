/**
 * Secure Client-Side API Proxy
 * All actual Gemini API calls and prompt logic have been moved to the backend
 * to prevent API keys from leaking in the frontend source code.
 */

import { compressImage } from "./image-compressor";

export async function predictProcess(query: string, signal?: AbortSignal, raw: boolean = false): Promise<string> {
  const response = await fetch('/api/predict-process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, raw }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to predict process' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.prediction;
}

export async function analyzeImage(imageBase64: string, type: 'equipment' | 'chemical', mode?: 'safety', signal?: AbortSignal): Promise<string> {
  const compressedImage = await compressImage(imageBase64);
  const response = await fetch('/api/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData: compressedImage, type, mode }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to analyze image' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.analysis;
}

export async function analyzePaper(text: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch('/api/analyze-paper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to analyze paper' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.analysis;
}

export async function generateMermaidDiagram(description: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch('/api/generate-diagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate diagram' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.diagram;
}