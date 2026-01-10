import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const anthropic = new Anthropic();

export async function analyzeImage(imageBase64: string, type: 'equipment' | 'chemical'): Promise<string> {
  try {
    console.log('Starting Claude image analysis...');

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const prompt = type === 'chemical' 
      ? "Analyze this chemical label image in detail. Return the response in this exact format:\nName: [chemical name]\nHazards:\n- [hazard 1]\n- [hazard 2]\nPrecautions:\n- [precaution 1]\n- [precaution 2]"
      : "Analyze this laboratory equipment image in detail. Return the response in this exact format:\nName: [equipment name]\nDescription: [brief description]\nUsage: [usage instructions]\nMaintenance: [maintenance details]";

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64Data
            }
          }
        ]
      }]
    });

    console.log('Successfully received Claude analysis');

    // Extract text from the response
    const messageContent = response.content[0];
    if (!messageContent || typeof messageContent !== 'object' || !('text' in messageContent)) {
      throw new Error('Unexpected response format from Claude API');
    }

    return messageContent.text;

  } catch (error: any) {
    console.error('Error during Claude image analysis:', error);
    const errorMessage = error.message || "Unknown error occurred";
    throw new Error(`Image analysis failed: ${errorMessage}`);
  }
}