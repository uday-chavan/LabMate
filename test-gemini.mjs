import fetch from "node-fetch";
(async () => {
  const query = `Calculate the Density for SMILES: C#N using the most appropriate estimation method (e.g., Joback, Lydersen, UNIFAC, Orrick-Erbar, etc.).
For properties like Ionization Energy, use alternative structural or group contribution approximations if standard ones don't apply, and state the method used.

CRITICAL INSTRUCTIONS:
1. You MUST return ONLY a valid, parsable JSON object. No markdown formatting (\`\`\`json), no conversational text, no warnings outside the JSON.
2. Keep all text extremely concise (maximum 3-4 words per field). DO NOT write theory, explanations, or essays.
3. If the property depends on temperature/pressure (e.g. Viscosity, Vapor Pressure, Density), ASSUME STANDARD CONDITIONS (298.15 K, 1 atm) and proceed with the calculation.
4. If a calculation is strictly mathematically impossible for this SMILES even under standard conditions, return a step "Status" with value "Not applicable". DO NOT use "Not applicable" just because variables were missing.
5. IF YOU ABSOLUTELY CANNOT CALCULATE IT, YOU MUST STILL RETURN ONLY A VALID JSON WITH "methodSubtitle": "GCM — NO SUITABLE METHOD" AND FILL THE REST WITH "Not applicable" OR EMPTY ARRAYS. NEVER RETURN PLAIN TEXT EXPLANATIONS.

Exact JSON schema required:
{
  "methodSubtitle": "GCM — [NAME OF METHOD USED]",
  "given": [
    { "label": "Group Name/Property", "value": "Contribution/Value" }
  ],
  "formula": "Base + Σ (Contributions) or relevant formula",
  "steps": [
    { "label": "Short Step Name", "value": "Result" }
  ],
  "finalResult": {
    "value": "Numeric value",
    "unit": "Unit"
  }
}`;
  try {
    const res = await fetch('http://localhost:5000/api/predict-process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, raw: true })
    });
    const data = await res.json();
    console.log("RESPONSE LENGTH:", data.prediction?.length);
    console.log("RESPONSE:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
})();
