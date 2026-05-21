import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function test() {
  const prompt = 'You are a scientific research assistant. A research paper titled \"Test Paper\" has no abstract. Write a comprehensive 10-15 line paragraph that describes what this paper is likely about. Do not start with I.';
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  };

  try {
    const url = GEMINI_BASE + '?key=' + 'AIzaSyBTHtJMEUHbEc1gt_NNLhF8UeLvi9706T4';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
