
export type NodeType = 'act' | 'scene' | 'beat';

export interface ScriptNode {
  id: string;
  type: NodeType;
  title?: string;
  description?: string; // For scenes/acts
  content?: {
    audio: string;
    visual: string;
  };
  children?: ScriptNode[]; // Recursive structure
  isCollapsed?: boolean;
  duration?: number; // Estimated duration in seconds for visualization
}

export type ResourceType = 'character' | 'location' | 'object' | 'media' | 'web' | 'note';

export interface Resource {
  id: string;
  type: ResourceType;
  value: string;
  label?: string;
  icon?: string; // SVG string or icon name
  color?: string; // Hex code
  description?: string; // Rich text content for the resource wiki
  tags?: string[]; // New: Categorization tags
  embeddedData?: string; // Base64-encoded media data
  mimeType?: string; // MIME type (e.g., "image/png", "video/mp4")
}

export interface ScriptMetadata {
  title: string;
  author: string;
  description: string;
  created: string;
  modified: string;
  lastSaved?: string;
}

export interface ScriptVersion {
  id: string;
  label: string;
  timestamp: string;
  stats: {
    words: number;
    resources: number;
    duration: number;
  };
  data: {
    content: ScriptNode[];
    resources: Resource[];
    metadata: ScriptMetadata;
  };
}

export interface Script {
  id: string;
  metadata: ScriptMetadata;
  resources: Resource[];
  content: ScriptNode[]; // Top level should be Acts
  history: ScriptVersion[];
}

export type ViewMode = 'script' | 'clock' | 'reader' | 'print';