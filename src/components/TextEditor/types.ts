export type EntityType =
  | "person"
  | "place"
  | "event"
  | "concept"
  | "organization"
  | "artifact"
  | "time"
  | "other";

export interface Entity {
  id: string;
  text: string;
  type: EntityType;
  confidence: number;
  offsets: { start: number; end: number }[];
  metadata?: {
    description?: string;
    importance?: number;
    dates?: { start?: string; end?: string };
    category?: string;
  };
}

export interface TextInsight {
  type:
    | "readability"
    | "sentiment"
    | "complexity"
    | "historical_accuracy"
    | "bias";
  score: number;
  summary: string;
  details?: string;
}

export interface TextSnapshot {
  id: string;
  timestamp: number;
  content: string;
  wordCount: number;
  description?: string;
}

export interface Node {
  id: string;
  type: EntityType;
  label: string;
  x?: number;
  y?: number;
  description?: string;
  image?: string;
  date?: string;
  isNew?: boolean;
  isEditing?: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  isNew?: boolean;
  isEditing?: boolean;
}

export interface TextEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onEntityDetected?: (entity: Entity) => void;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  mode?: "standard" | "research" | "teaching" | "collaborative";
  readOnly?: boolean;
  maxLength?: number;
  autoSave?: boolean;
  showAnalytics?: boolean;
}
