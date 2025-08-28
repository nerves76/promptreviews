export interface Tool {
  name: string;
  iconName: string;
  description: string;
  highlight?: string;
  learnMore?: string | null;
  position?: { bottom: string; right?: string; left?: string };
}

export interface ToolCategory {
  category: string;
  tools: Tool[];
}

export interface ReviewPlatform {
  name: string;
  iconName: string;
}