import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Client-side key rotation ─────────────────────────────────────────────────
// Keys are tried in order. On a quota / rate-limit error the next key is used.
const GEMINI_KEYS: string[] = [
  "AIzaSyCGq0qrMqMIuFUQ156k3WY_pg41jZkLLMw", // KEY_1
  "AIzaSyBTHtJMEUHbEc1gt_NNLhF8UeLvi9706T4", // KEY_2
  "AIzaSyBkDVhV0bq3geQyaJQDt1MuJT7Qk_hHSJA", // KEY_3
  "AIzaSyCWUAiXrWB6GoMmyr5b72RuptDWF3PLHt0", // KEY_4
  "AIzaSyDpzsohDGw__JXiDJEecztle3KKt-jHwJo", // KEY_5
].filter(Boolean);

const genAI = new GoogleGenerativeAI(GEMINI_KEYS[0]);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/** Retry statuses that indicate a key problem (not a request problem). */
function isKeyError(status: number) {
  return status === 401 || status === 403 || status === 429 || status === 503;
}

/** POST to Gemini with automatic key fallback. Returns parsed JSON data. */
async function callWithKeyRotation(body: object): Promise<any> {
  let lastError = "";
  for (const key of GEMINI_KEYS) {
    const url = `${GEMINI_BASE}?key=${key}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (netErr: any) {
      lastError = netErr.message;
      continue; // network error — try next key
    }

    if (res.ok) return res.json();

    lastError = `HTTP ${res.status}`;
    if (isKeyError(res.status)) continue; // quota / auth — try next key

    // Bad request or other non-key error — fail immediately
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`API error: ${errText}`);
  }
  throw new Error(`All API key's limit exhausted.`);
}

export async function predictProcess(query: string): Promise<string> {
  try {
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
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, topK: 32, topP: 0.9, maxOutputTokens: 4096 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",  threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT",  threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };

    const data = await callWithKeyRotation(requestBody);

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
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
          { inline_data: { mime_type: "image/jpeg", data: base64Data } },
        ],
      }],
      generationConfig: { temperature: 0.4, topK: 32, topP: 0.95, maxOutputTokens: 4096 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",  threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT",  threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };

    const data = await callWithKeyRotation(requestBody);

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0 || !parts[0].text) {
      throw new Error("Invalid response format from API");
    }

    const analysisText = parts.map((p: any) => p.text).join("");
    console.log('Successfully parsed analysis text:', analysisText);
    return analysisText;

  } catch (error: any) {
    console.error('Error during image analysis:', error);
    throw new Error(`Image analysis failed: ${error.message || "Unknown error"}`);
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
    const prompt = `As a diagram expert, convert this process description into a Mermaid.js flowchart diagram code. Follow these specific formatting rules:

1. Use 'graph LR' (left-to-right) layout
2. Make blocks large with descriptive text (2-3 words maximum per block)
3. Arrange only 2-4 blocks per horizontal level
4. Use subgraphs if needed to organize complex processes
5. Style blocks with meaningful shapes:
   - ["Square"] for processes (ALWAYS use double quotes for text inside shapes)
   - ("Rounded") for inputs/outputs
   - {"Diamond"} for decisions
   - (("Circle")) for start/end points
6. Keep arrow labels short and clear
7. CRITICAL: ALL text inside shapes MUST be wrapped in double quotes to prevent syntax errors! (e.g., A["Process Name"])

Output ONLY the Mermaid.js diagram code, no explanations. Example format:

graph LR
  A(("Start")) --> B["Process 1"]
  B --> C["Process 2"]
  C --> D{"Decision"}
  D -->|Yes| E["Action 1"]
  D -->|No| F["Action 2"]

Description: ${description}`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, topK: 16, topP: 0.8, maxOutputTokens: 4096 },
    };

    const data = await callWithKeyRotation(requestBody);

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0 || !parts[0].text) {
      throw new Error("Invalid response format from API");
    }

    let rawCode = parts.map((p: any) => p.text).join("").trim();
    
    // Strip markdown code block wrappers if the AI adds them
    if (rawCode.startsWith("```")) {
      const lines = rawCode.split("\n");
      if (lines[0].includes("mermaid")) {
        lines.shift();
      } else {
        lines.shift(); // just strip the ``` line
      }
      if (lines[lines.length - 1] === "```") {
        lines.pop();
      }
      rawCode = lines.join("\n").trim();
    }
    
    return rawCode;

  } catch (error: any) {
    console.error('Error generating Mermaid diagram:', error);
    throw new Error(`Diagram generation failed: ${error.message}`);
  }
}