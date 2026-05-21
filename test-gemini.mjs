import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEYS = [
  'AIzaSyCGq0qrMqMIuFUQ156k3WY_pg41jZkLLMw',
  'AIzaSyBTHtJMEUHbEc1gt_NNLhF8UeLvi9706T4',
  'AIzaSyBkDVhV0bq3geQyaJQDt1MuJT7Qk_hHSJA',
  'AIzaSyCWUAiXrWB6GoMmyr5b72RuptDWF3PLHt0',
];

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function isKeyError(status) {
  return status === 401 || status === 403 || status === 429 || status === 503;
}

async function callWithKeyRotation(body) {
  let lastError = '';
  for (const key of GEMINI_KEYS) {
    const url = GEMINI_BASE + '?key=' + key;
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (netErr) {
      lastError = netErr.message;
      continue;
    }

    if (res.ok) return res.json();

    lastError = 'HTTP ' + res.status;
    if (isKeyError(res.status)) continue;

    const errText = await res.text().catch(() => res.statusText);
    throw new Error('Gemini API error: ' + errText);
  }
  throw new Error('All Gemini API keys exhausted. Last error: ' + lastError);
}

async function test() {
  const prompt = 'Hello';
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, topK: 32, topP: 0.9, maxOutputTokens: 1024 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  try {
    const data = await callWithKeyRotation(requestBody);
    console.log(data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error(err);
  }
}
test();
