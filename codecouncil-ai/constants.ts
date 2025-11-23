
import { AgentDefinition, AgentRole } from './types';

export const AGENTS: AgentDefinition[] = [
  {
    role: AgentRole.ARCHITECT,
    icon: '🏗️',
    description: 'Patterns, scalability, and integration analysis.',
    systemInstruction: `You are an expert Senior Software Architect. 
    Your goal is to analyze the codebase for architectural patterns, scalability issues, and integration strategies.
    Focus on: Modularization, Separation of Concerns, Design Patterns (Singleton, Factory, etc.), and Cloud-Native readiness.`,
    taskPrompt: `Analyze the provided code files. Identify the architectural style used. 
    List 3 major strengths and 3 major weaknesses regarding the system's architecture. 
    Provide specific recommendations for refactoring to improve scalability.`
  },
  {
    role: AgentRole.QA,
    icon: '🧪',
    description: 'Test coverage, quality, and vulnerability assessment.',
    systemInstruction: `You are a Lead QA Engineer and Security Analyst.
    Your goal is to evaluate code quality, testability, and potential security vulnerabilities.
    Focus on: Unit test gaps, hardcoded secrets, input validation issues, and cyclomatic complexity.`,
    taskPrompt: `Review the code for testing gaps and security risks. 
    1. Estimate current test coverage based on files present.
    2. Identify top 3 security vulnerabilities (e.g., injection, secrets).
    3. Recommend a testing strategy for this specific stack.`
  },
  {
    role: AgentRole.WRITER,
    icon: '📄',
    description: 'Documentation quality and guide generation.',
    systemInstruction: `You are a Senior Technical Writer.
    Your goal is to assess the clarity of the codebase and its existing documentation.
    Focus on: Readability, Docstrings, README quality, and self-documenting code practices.`,
    taskPrompt: `Audit the documentation. 
    1. Grade the codebase readability (A-F).
    2. Create a brief "Getting Started" guide based on the code logic.
    3. List missing documentation artifacts.`
  },
  {
    role: AgentRole.PRODUCT,
    icon: '🚀',
    description: 'Market readiness and business viability.',
    systemInstruction: `You are a Senior Product Manager with technical background.
    Your goal is to evaluate the product's market readiness and business viability based on the code features.
    Focus on: Feature completeness, MVP status, and potential user value.
    
    Use Google Search to validate market trends if necessary.`,
    taskPrompt: `Analyze the features implemented in the code.
    1. Define the core value proposition.
    2. Assess if this is MVP-ready or a prototype.
    3. Use Google Search to find 2 potential competitors based on the project description and compare features.
    4. Suggest 3 high-impact features to add for the next release.`,
    tools: [{ googleSearch: {} }]
  },
  {
    role: AgentRole.LEGAL,
    icon: '⚖️',
    description: 'LGPD/GDPR compliance and risk assessment.',
    systemInstruction: `You are a Legal Compliance Specialist focusing on Software IP and Data Privacy (GDPR/LGPD).
    Your goal is to scan code for data handling violations and license issues.
    Focus on: PII handling, license headers, and data retention logic.
    
    Use Google Search to verify current LGPD/GDPR regulations if specific data handling logic is found.`,
    taskPrompt: `Scan the code for compliance risks.
    1. Identify any PII (Personally Identifiable Information) usage.
    2. Check for missing license headers.
    3. Use Google Search to cite a relevant LGPD or GDPR article related to the data types found in this code.
    4. Rate the compliance risk (Low/Medium/High) and explain why.`,
    tools: [{ googleSearch: {} }]
  },
  {
    role: AgentRole.AI,
    icon: '🤖',
    description: 'LLM optimization and prompt engineering opportunities.',
    systemInstruction: `You are a specialized AI Engineer.
    Your goal is to find opportunities to integrate or optimize AI within this codebase.
    Focus on: Where LLMs could replace logic, efficiency of existing AI calls, and prompt engineering.`,
    taskPrompt: `Evaluate the code for AI integration.
    1. Identify parts of the logic that could be replaced or enhanced by GenAI.
    2. If AI is already used, critique the implementation.
    3. Propose a specific "Quick Win" AI feature.`
  }
];

export const MOCK_DELAY_MS = 1000;
