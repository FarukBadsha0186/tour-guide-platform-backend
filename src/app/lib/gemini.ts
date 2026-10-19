// src/lib/gemini.ts

import { GoogleGenAI } from "@google/genai";
import config from "../config";

// ✅ Initialize the new GoogleGenAI client
export const ai = new GoogleGenAI({ 
  apiKey: config.gemini_api_key as string 
});

// ✅ Set the current model name
export const GEMINI_MODEL = "gemini-3.8-flash";

// System instruction (optional, but keeps AI on track)
export const SYSTEM_INSTRUCTION = "You are a helpful AI travel assistant for a Tour Guide Platform in Bangladesh. You help users find tour packages, local guides, and answer travel-related questions. Keep your answers short, friendly, and helpful.";