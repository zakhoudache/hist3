export interface Node {
  id: string;
  type: "person" | "event" | "place" | "document" | "concept";
  label: string;
  x?: number;
  y?: number;
  fx?: number; // Fixed x position for stability
  fy?: number; // Fixed y position for stability
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
  relationship?: string;
  isNew?: boolean;
  isEditing?: boolean;
}

export interface MidEdgePoint {
  x: number;
  y: number;
  edge: Edge;
}

export interface KnowledgeGraphProps {
  nodes?: Node[];
  edges?: Edge[];
  onNodeSelect?: (nodeId: string) => void;
  onNodeCreate?: (node: Node) => void;
  onNodeUpdate?: (node: Node) => void;
  onNodeDelete?: (nodeId: string) => void;
  onEdgeCreate?: (edge: Edge) => void;
  onEdgeUpdate?: (edge: Edge) => void;
  onEdgeDelete?: (edgeId: string) => void;
}
