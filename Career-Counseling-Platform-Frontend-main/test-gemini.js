import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.VITE_GEMINI_API_KEY
});

async function run() {
  const modelsToTest = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash-8b", "gemini-2.5-flash"];
  for (const model of modelsToTest) {
    try {
      console.log(`Testing ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents: "Say hello"
      });
      console.log(`Success ${model}:`, response.text);
      return; // Stop on first success
    } catch (error) {
      console.error(`Error ${model}:`, error.status || error);
    }
  }
}

run();
