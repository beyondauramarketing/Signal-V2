import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey });

import { Type } from "@google/genai";

async function testModel(modelName: string) {
  console.log(`Testing ${modelName} with JSON schema...`);
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello, reply with a JSON object containing key 'status' set to 'SUCCESS'.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["status"],
          properties: {
            status: { type: Type.STRING }
          }
        }
      }
    });
    console.log(`✅ Success with ${modelName}:`, response.text?.trim());
    return true;
  } catch (err: any) {
    console.log(`❌ Failed with ${modelName}:`, err.message || err);
    return false;
  }
}

async function main() {
  const models = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-flash-lite-latest",
    "gemini-pro-latest",
    "gemini-3.1-flash-lite"
  ];
  for (const m of models) {
    await testModel(m);
  }
}

main();
