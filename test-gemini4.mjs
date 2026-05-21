import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEYS = [
  'AIzaSyDpzsohDGw__JXiDJEecztle3KKt-jHwJo'
];

const genAI = new GoogleGenerativeAI(GEMINI_KEYS[0]);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function test() {
  const description = 'Manufacturing of Polyvinyl Chloride (PVC) – 12-Step Process\nPolyvinyl chloride (PVC) is a widely used plastic made from vinyl chloride monomer (VCM).\n\nStep 1: Cracking of naphtha or natural gas.\nStep 2: Ethylene production\nStep 3: Chlorine Production via electrolysis of brine (NaCl solution).\nStep 4: Ethylene Dichloride (EDC) Formation - C₂H₄ + Cl₂ → C₂H₄Cl₂ with FeCl₃ catalyst.\nStep 5: EDC Purification through distillation.\nStep 6: EDC Cracking to Vinyl Chloride Monomer (VCM) - C₂H₄Cl₂ → C₂H₃Cl + HCl (450-550°C).\nStep 7: HCl Recycling for chlorine production.\nStep 8: VCM Purification via distillation.\nStep 9: Polymerization of VCM using suspension, emulsion, or bulk methods.\nStep 10: Polymerization Control with catalysts and temperature regulation.\nStep 11: PVC Recovery & Washing to remove residuals.\nStep 12: Drying & Sieving for uniform granules.\nStep 13: Final Compounding & Processing with additives.';
  
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

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, topK: 16, topP: 0.8, maxOutputTokens: 4096 }
    });
    console.log(result.response.text());
  } catch (err) {
    console.error(err);
  }
}
test();
