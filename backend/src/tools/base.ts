
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolResult {
  output: string;
  error?: string;
}

export abstract class AgentTool {
  abstract name: string;
  abstract description: string;
  
  abstract getDefinition(): ToolDefinition;
  
  abstract execute(params: any): Promise<ToolResult>;
}
