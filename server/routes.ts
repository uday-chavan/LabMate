import express, { Router } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertEmergencyAlertSchema } from "@shared/schema";
import { z } from "zod";
import { sendTelegramAlert } from './telegram';
import { generateMermaidDiagram } from "../client/src/lib/gemini";
import estimateProperties from "./api/estimate-properties";
import papersRouter from "./api/papers";
import { callGemini } from "./lib/gemini-keys";

const router = Router();

// Configure middleware
router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount the estimate-properties routes
router.use('/api/estimate-properties', estimateProperties);

// Mount the papers search route
router.use('/api/papers', papersRouter);

// Image Analysis endpoint
router.post('/api/analyze-image', async (req, res) => {
  try {
    const schema = z.object({
      imageData: z.string(),
      type: z.enum(['chemical', 'equipment']),
      mode: z.enum(['safety', 'general']).optional()
    });

    const { imageData, type, mode } = schema.parse(req.body);
    const base64Data = imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

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

    const data = await callGemini(requestBody);

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0 || !parts[0].text) {
      throw new Error("Invalid response format from API");
    }

    const analysis = parts.map((p: any) => p.text).join("");

    if (req.user) {
      await storage.createRecentSearch({
        userId: req.user.id,
        type: type, // 'chemical' or 'equipment'
        query: mode === 'safety' ? 'Safety Analysis' : 'General Analysis',
        image: base64Data, // This is now aggressively compressed by the frontend
        result: analysis
      });
    }

    res.json({ analysis });

  } catch (error: any) {
    console.error('Image analysis error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : "Failed to analyze image"
    });
  }
});

// Alert endpoints
router.post('/api/alert', async (req, res) => {
  try {
    const schema = z.object({
      message: z.string(),
      type: z.string(),
      severity: z.string(),
      timestamp: z.string()
    });

    const alertData = schema.parse(req.body);
    await sendTelegramAlert(alertData.message);
    res.json({ success: true });
  } catch (error) {
    console.error('Alert error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to send alert" 
    });
  }
});

router.get('/api/alerts', async (req, res) => {
  const alerts = await storage.getActiveAlerts();
  res.json(alerts);
});

router.post('/api/alerts/:id/resolve', async (req, res) => {
  const id = parseInt(req.params.id);
  await storage.resolveAlert(id);
  res.json({ success: true });
});

// Equipment routes
router.get('/api/equipment', async (req, res) => {
  const equipment = await storage.getAllEquipment();
  res.json(equipment);
});

router.get('/api/equipment/:name', async (req, res) => {
  const equipment = await storage.getEquipmentByName(req.params.name);
  if (equipment) {
    res.json(equipment);
  } else {
    res.status(404).json({ error: "Equipment not found" });
  }
});

// Chemical routes
router.get('/api/chemicals', async (req, res) => {
  const chemicals = await storage.getAllChemicals();
  res.json(chemicals);
});

router.get('/api/chemicals/:name', async (req, res) => {
  const chemical = await storage.getChemicalByName(req.params.name);
  if (chemical) {
    res.json(chemical);
  } else {
    res.status(404).json({ error: "Chemical not found" });
  }
});

// Mermaid diagram generation
router.post('/api/generate-diagram', async (req, res) => {
  try {
    const schema = z.object({
      description: z.string().min(1, "Description is required"),
    });

    const { description } = schema.parse(req.body);
    
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

    const data = await callGemini(requestBody);

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
    
    // Auto-save removed; handled manually on frontend


    res.json({ diagram: rawCode });

  } catch (error: any) {
    console.error('Diagram generation error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : "Failed to generate diagram"
    });
  }
});

// Process prediction
router.post('/api/predict-process', async (req, res) => {
  try {
    const schema = z.object({
      query: z.string().min(1, "Query is required"),
    });

    const { query } = schema.parse(req.body);
    
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

    const data = await callGemini(requestBody);

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0 || !parts[0].text) {
      throw new Error("Invalid response format from API");
    }

    const prediction = parts.map((p: any) => p.text).join("").replace(/\*\*/g, '');
    
    // Auto-save removed; handled manually on frontend


    res.json({ prediction });

  } catch (error: any) {
    console.error('Process prediction error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : "Failed to predict process"
    });
  }
});

// Analyze paper
router.post('/api/analyze-paper', async (req, res) => {
  try {
    const schema = z.object({
      text: z.string().min(1, "Text is required"),
    });

    const { text } = schema.parse(req.body);
    
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

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, topK: 32, topP: 0.95, maxOutputTokens: 4096 },
    };

    const data = await callGemini(requestBody);

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0 || !parts[0].text) {
      throw new Error("Invalid response format from API");
    }

    const analysis = parts.map((p: any) => p.text).join("");
    
    if (req.user) {
      await storage.createRecentSearch({
        userId: req.user.id,
        type: 'paper',
        query: text.substring(0, 100) + '...', // Save first 100 chars as query preview
        image: null,
        result: analysis
      });
    }

    res.json({ analysis });

  } catch (error: any) {
    console.error('Paper analysis error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : "Failed to analyze paper"
    });
  }
});

// Recent Searches
router.get('/api/recent-searches', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const searches = await storage.getRecentSearches(req.user.id);
    res.json(searches);
  } catch (error: any) {
    console.error('Failed to fetch recent searches:', error);
    res.status(500).json({ error: "Failed to fetch recent searches" });
  }
});

router.post('/api/recent-searches', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const schema = z.object({
      type: z.string(),
      query: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
      result: z.string()
    });

    const data = schema.parse(req.body);
    const search = await storage.createRecentSearch({
      ...data,
      userId: req.user.id
    });
    res.json(search);
  } catch (error: any) {
    console.error('Failed to save search:', error);
    res.status(400).json({ error: "Failed to save search" });
  }
});

router.delete('/api/recent-searches/:id', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    const success = await storage.deleteRecentSearch(id, req.user.id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Search not found or unauthorized" });
    }
  } catch (error: any) {
    console.error('Failed to delete search:', error);
    res.status(500).json({ error: "Failed to delete search" });
  }
});

router.patch('/api/user/profile', async (req, res) => {
  console.log("PATCH /api/user/profile hit!", req.body ? "Body length: " + JSON.stringify(req.body).length : "No body");
  if (!req.user) {
    console.log("No req.user");
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const schema = z.object({
      displayName: z.string().optional(),
      avatarUrl: z.string().optional(),
    });
    const data = schema.parse(req.body);
    console.log("Parsed data:", { displayName: data.displayName, avatarUrlLength: data.avatarUrl?.length });
    const updatedUser = await storage.updateUser(req.user.id, data);
    if (!updatedUser) {
      console.log("Updated user failed: returned undefined");
      return res.status(500).json({ error: "Failed to update database" });
    }
    console.log("Updated user:", "Success");
    res.json(updatedUser);
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    res.status(400).json({ error: "Failed to update profile", details: error.message });
  }
});

export function setupServer(app: express.Express): Server {
  const httpServer = createServer(app);
  // Mount all routes
  app.use(router);
  return httpServer;
}