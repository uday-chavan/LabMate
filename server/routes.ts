import express, { Router } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertEmergencyAlertSchema } from "@shared/schema";
import { z } from "zod";
import { sendTelegramAlert } from './telegram';
import { generateMermaidDiagram } from "../client/src/lib/gemini";
import estimateProperties from "./api/estimate-properties";

const router = Router();

// Configure middleware
router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount the estimate-properties routes
router.use('/api/estimate-properties', estimateProperties);

// Image Analysis endpoint
router.post('/api/analyze-image', async (req, res) => {
  try {
    const schema = z.object({
      imageData: z.string(),
      type: z.enum(['chemical', 'equipment'])
    });

    const { imageData, type } = schema.parse(req.body);
    const base64Data = imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const prompt = type === 'chemical'
      ? "You are a chemical safety expert. Analyze this chemical label image. Return ONLY the following format, no other text:\nName: [chemical name]\nHazards:\n- [hazard 1]\n- [hazard 2]\nPrecautions:\n- [precaution 1]\n- [precaution 2]"
      : "You are a lab equipment expert. Analyze this equipment image. Return ONLY the following format, no other text:\nName: [equipment name]\nDescription: [brief description]\nUsage: [usage instructions]\nMaintenance: [maintenance details]";

    console.log('Starting Gemini API request...');

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

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
        temperature: 0.1,
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
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid response format from Gemini API");
    }

    const analysis = data.candidates[0].content.parts[0].text;
    console.log('Analysis result:', analysis);

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
    const diagramCode = await generateMermaidDiagram(description);
    res.json({ diagram: diagramCode });

  } catch (error: any) {
    console.error('Diagram generation error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : "Failed to generate diagram"
    });
  }
});

export function setupServer(app: express.Express): Server {
  const httpServer = createServer(app);
  // Mount all routes
  app.use(router);
  return httpServer;
}