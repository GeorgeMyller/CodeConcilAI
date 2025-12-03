
import { GoogleGenAI } from "@google/genai";
import { AgentDefinition, FileContent, OutputLanguage } from '../types';
import KeyStore from './keyStore';

/**
 * Prepares the prompt context from uploaded files.
 */
const prepareContext = (files: FileContent[]): string => {
  let context = "CODEBASE CONTEXT:\n\n";

  if (files.length === 0) return "No files provided.";

  files.forEach(file => {
    context += `--- FILE: ${file.name} ---\n`;
    // Truncate large files to avoid hitting token limits aggressively if needed, 
    // though Gemini 2.5 has a large window.
    context += file.content.substring(0, 50000);
    context += `\n--- END FILE: ${file.name} ---\n\n`;
  });

  return context;
};

const LANGUAGE_MAP: Record<OutputLanguage, string> = {
  en: "English",
  pt: "Portuguese (Brazil)",
  fr: "French"
};

/**
 * Executes a single agent's task using Gemini 2.5 Flash.
 */
export const runAgentAnalysis = async (
  files: FileContent[],
  agent: AgentDefinition,
  language: OutputLanguage
): Promise<{ text: string; citations: string[] }> => {
  const context = prepareContext(files);
  const fullPrompt = `${agent.taskPrompt}\n\n${context}`;

  // Inject language constraint into system instruction
  const languageInstruction = `\n\nCRITICAL INSTRUCTION: The user has requested the output in ${LANGUAGE_MAP[language]}. You MUST write the entire response in ${LANGUAGE_MAP[language]}. Do not use any other language for the main text. Technical terms can remain in English if standard, but the explanation must be in ${LANGUAGE_MAP[language]}.`;

  // Prefer BYOK stored at runtime; fallback to Vite env for local dev
  const apiKey = KeyStore.get() || import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey) {
    return {
      text: 'Error: No API key found. Add your Gemini API key via the "Skip trial" flow or set VITE_GEMINI_API_KEY in .env.local for local development. Never ship a hardcoded key to production.',
      citations: []
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: agent.systemInstruction + languageInstruction,
        temperature: 0.2, // Low temperature for analytical tasks
        tools: agent.tools, // Inject tools (e.g., googleSearch)
      }
    });

    // Extract text
    const text = response.text || "No response generated.";

    // Extract citations/grounding metadata if available
    const citations: string[] = [];

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          citations.push(chunk.web.uri);
        }
      });
    }

    return { text, citations };
  } catch (error: any) {
    console.error(`Error running agent ${agent.role}:`, error);
    return {
      text: `Error: ${error.message || "Unknown error occurred during analysis."}`,
      citations: []
    };
  }
};

/**
 * Starts a backend agent session.
 */
export const startBackendAgent = async (
  files: FileContent[],
  agent: AgentDefinition,
  token: string
): Promise<string> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/agents/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      goal: agent.taskPrompt,
      role: agent.role,
      files: files.map(f => ({ name: f.name, content: f.content }))
    })
  });

  if (!response.ok) {
    throw new Error('Failed to start agent session');
  }

  const data = await response.json();
  return data.sessionId;
};

/**
 * Polls agent status.
 */
export const getAgentStatus = async (sessionId: string, token: string): Promise<any> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/agents/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch agent status');
  }

  return response.json();
};
