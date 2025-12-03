import { GoogleGenAI } from '@google/genai';
import { AgentTool, ToolResult } from '../tools/base.js';
import { WebSearchTool } from '../tools/webSearch.js';
import { CodeAnalysisTool } from '../tools/codeAnalysis.js';
import { v4 as uuidv4 } from 'uuid';

// Types for Agent State
export enum AgentStatus {
    IDLE = 'IDLE',
    RUNNING = 'RUNNING',
    WAITING_FOR_ACTION = 'WAITING_FOR_ACTION',
    COMPLETED = 'COMPLETED',
    ERROR = 'ERROR'
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
    status: AgentStatus;
    steps: AgentStep[];
    result?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class AgentService {
    private sessions: Map<string, AgentSession> = new Map();
    private tools: Map<string, AgentTool> = new Map();
    private ai: GoogleGenAI;

    constructor() {
        // Initialize Gemini
        // Initialize Gemini with default key if available (fallback)
        // Actual key will be passed per session or re-instantiated
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

        // Register Tools
        this.registerTool(new WebSearchTool());
        this.registerTool(new CodeAnalysisTool());
    }

    private registerTool(tool: AgentTool) {
        this.tools.set(tool.name, tool);
    }

    /**
     * Starts a new agent session
     */
    startAgent(goal: string, role: string, contextFiles: any[], apiKey?: string): AgentSession {
        const id = uuidv4();
        const session: AgentSession = {
            id,
            goal,
            role,
            status: AgentStatus.IDLE,
            steps: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.sessions.set(id, session);

        // Start execution asynchronously
        this.runAgentLoop(id, contextFiles, apiKey);

        return session;
    }

    /**
     * Retrieves session status
     */
    getSession(id: string): AgentSession | undefined {
        return this.sessions.get(id);
    }

    /**
     * Main Agent Loop (Thought -> Action -> Observation)
     */
    private async runAgentLoop(sessionId: string, contextFiles: any[], apiKey?: string) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.status = AgentStatus.RUNNING;
        session.updatedAt = new Date();

        try {
            const MAX_STEPS = 5; // Safety limit
            let currentStepCount = 0;

            while (session.status === AgentStatus.RUNNING && currentStepCount < MAX_STEPS) {
                currentStepCount++;

                // 1. Prepare Prompt
                const prompt = this.buildPrompt(session, contextFiles);

                // 2. Get Thought & Action from Gemini
                const response = await this.callGemini(prompt, apiKey);

                // 3. Parse Response
                const step = this.parseResponse(response);
                step.timestamp = new Date();
                session.steps.push(step);

                // 4. Execute Action (if any)
                if (step.action && step.action !== 'FINAL_ANSWER') {
                    const tool = this.tools.get(step.action);
                    if (tool) {
                        const result: ToolResult = await tool.execute(step.actionInput);
                        step.observation = result.output || result.error;
                    } else {
                        step.observation = `Error: Tool '${step.action}' not found.`;
                    }
                } else if (step.action === 'FINAL_ANSWER') {
                    session.status = AgentStatus.COMPLETED;
                    session.result = step.actionInput?.answer || step.thought;
                    break;
                } else {
                    // No action, just thought - maybe ask for more info or conclude?
                    // For now, if no action, we assume it's a final thought or we force a stop to avoid loops
                    if (!step.action) {
                        session.status = AgentStatus.COMPLETED;
                        session.result = step.thought;
                        break;
                    }
                }

                session.updatedAt = new Date();
            }

            if (currentStepCount >= MAX_STEPS && session.status === AgentStatus.RUNNING) {
                session.status = AgentStatus.COMPLETED;
                session.result = "Task limit reached. Partial result: " + session.steps[session.steps.length - 1].thought;
            }

        } catch (error: any) {
            console.error(`Agent Error (Session ${sessionId}):`, error);
            session.status = AgentStatus.ERROR;
            session.result = `Error: ${error.message}`;
        }
    }

    private buildPrompt(session: AgentSession, contextFiles: any[]): string {
        let context = "FILES:\n";
        contextFiles.forEach(f => {
            context += `--- ${f.name} ---\n${f.content.substring(0, 2000)}\n\n`;
        });

        let history = "HISTORY:\n";
        session.steps.forEach((s, i) => {
            history += `Step ${i + 1}:\nThought: ${s.thought}\nAction: ${s.action}\nObservation: ${s.observation}\n\n`;
        });

        const toolDefs = Array.from(this.tools.values()).map(t => JSON.stringify(t.getDefinition())).join('\n');

        return `
You are an AI Agent with the role: ${session.role}.
Your Goal: ${session.goal}

AVAILABLE TOOLS:
${toolDefs}

INSTRUCTIONS:
1. Analyze the goal and files.
2. Decide on the next step.
3. You MUST respond in JSON format ONLY.
4. Format:
{
  "thought": "your reasoning here",
  "action": "tool_name" or "FINAL_ANSWER",
  "actionInput": { ...tool_params } or { "answer": "final response" }
}

${context}

${history}

Next Step JSON:
`;
    }

    private async callGemini(prompt: string, apiKey?: string): Promise<string> {
        // Use provided key or fallback to instance default
        const client = apiKey ? new GoogleGenAI({ apiKey }) : this.ai;

        const result = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.1,
                responseMimeType: 'application/json'
            }
        });

        return result.text || "{}";
    }

    private parseResponse(text: string): AgentStep {
        try {
            // Clean markdown code blocks if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const json = JSON.parse(cleanText);
            return {
                thought: json.thought || "No thought provided",
                action: json.action,
                actionInput: json.actionInput,
                timestamp: new Date()
            };
        } catch (e) {
            return {
                thought: "Failed to parse JSON response: " + text,
                timestamp: new Date()
            };
        }
    }
}

export const agentService = new AgentService();
