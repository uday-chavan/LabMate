import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyBWyvtUF-LNMb0QSj4IRH-MJCrpKi4kJ8Q");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function predictProcess(query: string): Promise<string> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${genAI.apiKey}`;

    const prompt = `As a chemistry expert, provide a comprehensive analysis of this process/reaction query. Start with a clear, concise one-line answer, then provide a detailed explanation.

Use these professional symbols only at the start of points, not in between text:
⚛️ - For atomic/molecular processes
⚗️ - For laboratory procedures
🧪 - For chemical reactions
📊 - For data/measurements
🔬 - For analysis/observations
⚠️ - For safety/precautions
📌 - For key points
💡 - For insights/tips

Format your response exactly like this:

[DIRECT ONE-LINE ANSWER TO THE QUESTION, NO SYMBOLS HERE]

Detailed Explanation:

[Start each main point with an appropriate symbol from above, then provide the explanation. Make the explanation easy to understand while maintaining technical accuracy. Structure the content based on the specific query's needs.]

Query: ${query}`;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.8,
        topK: 32,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini API response format:', data);
      throw new Error("Invalid response format from Gemini API");
    }

    return data.candidates[0].content.parts[0].text.replace(/\*\*/g, '');

  } catch (error: any) {
    console.error('Error during process prediction:', error);
    throw new Error(`Process prediction failed: ${error.message}`);
  }
}

export async function analyzeImage(imageBase64: string, type: 'equipment' | 'chemical', mode?: 'safety'): Promise<string> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${genAI.apiKey}`;

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    console.log('Processing image analysis request...');

    let prompt;
    if (type === 'chemical') {
      prompt = `You are a chemical safety expert. Analyze this chemical label and provide a comprehensive safety analysis. If certain information isn't visible, use your expert knowledge to provide appropriate safety guidelines. Provide exactly 5-7 points for each section in this format:

[Chemical Name]

HAZARDS:
• [First key hazard point]
• [Second hazard point]
• [Continue with 3-5 more hazard points]

SAFETY HANDLING:
• [First key safety measure]
• [Second safety measure]
• [Continue with 3-5 more safety points]

FIRST AID MEASURES:
• [First key first aid response]
• [Second first aid measure]
• [Continue with 3-5 more first aid points]

PRECAUTIONS:
• [First key precaution]
• [Second precaution]
• [Continue with 3-5 more precaution points]

Keep all text plain without any formatting or emphasis. Use natural, clear language for each point. Ensure all information is accurate and safety-focused.`;
    } else if (mode === 'safety') {
      prompt = "Analyze this laboratory equipment image and provide a detailed list of safety guidelines and precautions. Focus on safety measures, protective equipment needed, and operational safety requirements. Format the response as a clear, bullet-pointed list focused only on safety aspects.";
    } else {
      prompt = "Look at this laboratory equipment and write a response in this format: First line should be just the name of the equipment (without any formatting or bullets). Then write a natural paragraph describing its function and important information.";
    }

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw Gemini API response:', JSON.stringify(data, null, 2));

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini API response format:', data);
      throw new Error("Invalid response format from Gemini API");
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    console.log('Successfully parsed analysis text:', analysisText);
    return analysisText;

  } catch (error: any) {
    console.error('Error during image analysis:', error);
    const errorMessage = error.message || "Unknown error occurred";
    throw new Error(`Image analysis failed: ${errorMessage}`);
  }
}

export async function analyzePaper(text: string): Promise<string> {
  const prompt = `As a research assistant, analyze this scientific text and provide a structured analysis:

Text: ${text}

Please provide your analysis in the following format:

🔍 Key Findings:
[List the main findings and conclusions]

📊 Methodology:
[Describe the research methods used]

⚠️ Limitations:
[Identify any limitations or gaps]

💡 Applications:
[Discuss potential practical applications]

🔬 Technical Details:
[Any important technical specifics]`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error('Paper analysis error:', error);
    throw new Error(`Failed to analyze paper: ${error.message}`);
  }
}

export async function generateMermaidDiagram(description: string): Promise<string> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${genAI.apiKey}`;

    const prompt = `As a diagram expert, convert this process description into a Mermaid.js flowchart diagram code. Follow these specific formatting rules:

1. Use 'graph LR' (left-to-right) layout
2. Make blocks large with descriptive text (2-3 words maximum per block)
3. Arrange only 2-4 blocks per horizontal level
4. Use subgraphs if needed to organize complex processes
5. Style blocks with meaningful shapes:
   - [Square] for processes
   - (Rounded) for inputs/outputs
   - {Diamond} for decisions
   - ((Circle)) for start/end points
6. Keep arrow labels short and clear

Output ONLY the Mermaid.js diagram code, no explanations. Example format:

graph LR
  A((Start)) --> B[Process 1]
  B --> C[Process 2]
  C --> D{Decision}
  D -->|Yes| E[Action 1]
  D -->|No| F[Action 2]

Description: ${description}`;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 16,
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini API response format:', data);
      throw new Error("Invalid response format from Gemini API");
    }

    return data.candidates[0].content.parts[0].text.trim();

  } catch (error: any) {
    console.error('Error generating Mermaid diagram:', error);
    throw new Error(`Diagram generation failed: ${error.message}`);
  }
}