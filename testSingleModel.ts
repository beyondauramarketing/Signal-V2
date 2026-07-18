import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey });

async function main() {
  const modelName = "gemini-3.5-flash";
  console.log(`Testing ${modelName}...`);
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello, reply with exactly the word 'SUCCESS' if you read this.",
    });
    console.log(`✅ Success with ${modelName}:`, response.text?.trim());
  } catch (err: any) {
    console.log(`❌ Failed with ${modelName}:`, err.message || err);
  }
}

main();
