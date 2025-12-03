
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  credits: number; // Added for billing simulation
  isUnlimited?: boolean; // If true, user is billing directly to their API Key without credit limits
  hasApiKey?: boolean; // True if user has configured their own Gemini API Key
}

export interface AuditSession {
  id: string;
  timestamp: number;
  tier: 'startup' | 'enterprise';
  filesCount: number;
  results: Record<string, AgentResult>;
  repoUrl?: string;
}

export interface AgentStep {
  thought: string;
  action?: string;
  actionInput?: any;
  observation?: string;
  timestamp: Date;
}

export interface AgentSession {
  id: string;
  goal: string;
  role: string;
  status: 'IDLE' | 'RUNNING' | 'WAITING_FOR_ACTION' | 'COMPLETED' | 'ERROR';
  steps: AgentStep[];
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}