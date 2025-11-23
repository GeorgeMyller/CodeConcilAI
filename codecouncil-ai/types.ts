
import { Tool } from "@google/genai";

export interface FileContent {
  name: string;
  content: string;
  size: number;
}

export type OutputLanguage = 'en' | 'pt' | 'fr';

export enum AgentRole {
  ARCHITECT = 'Software Architect',
  QA = 'QA Engineer',
  WRITER = 'Technical Writer',
  PRODUCT = 'Product Manager',
  LEGAL = 'Legal Specialist',
  AI = 'AI Engineer'
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface AgentResult {
  role: AgentRole;
  response: string;
  status: AnalysisStatus;
  executionTimeMs?: number;
  citations?: string[]; // URLs for grounding
}

export interface AgentDefinition {
  role: AgentRole;
  icon: string;
  description: string;
  systemInstruction: string;
  taskPrompt: string;
  tools?: Tool[]; // Google ADK Tools
}
