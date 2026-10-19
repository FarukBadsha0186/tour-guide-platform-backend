// src/lib/groq.ts

import Groq from "groq-sdk";
import config from "../config";

export const groq = new Groq({
  apiKey: config.groq_api_key,
});

export const GROQ_MODEL = "openai/gpt-oss-120b"; // Best for general/RAG tasks[reference:1]