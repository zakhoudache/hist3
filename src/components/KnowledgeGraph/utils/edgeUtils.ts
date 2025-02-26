import { Node, Edge } from "../types";

// Generates a unique ID for a new edge
export const generateEdgeId = (): string => `edge-${Date.now()}`;

// Checks if an edge already exists between two nodes
export const edgeExists = (
  edges: Edge[],
  sourceId: string,
  targetId: string,
): boolean => {
  return edges.some(
    (e) =>
      (e.source === sourceId && e.target === targetId) ||
      (e.source === targetId && e.target === sourceId),
  );
};

// Creates a new edge between two nodes
export const createNewEdge = (sourceId: string, targetId: string): Edge => {
  return {
    id: generateEdgeId(),
    source: sourceId,
    target: targetId,
    relationship: "",
    isNew: true,
    isEditing: true,
  };
};

// Calculates the mid-point between two nodes for edge interactions
export const calculateMidPoint = (
  sourceNode: Node | undefined,
  targetNode: Node | undefined,
): { x: number; y: number } | null => {
  if (
    !sourceNode ||
    sourceNode.x === undefined ||
    sourceNode.y === undefined ||
    !targetNode ||
    targetNode.x === undefined ||
    targetNode.y === undefined
  ) {
    return null;
  }

  return {
    x: (sourceNode.x + targetNode.x) / 2,
    y: (sourceNode.y + targetNode.y) / 2,
  };
};

// Creates a new node from an edge (splitting the edge)
export const createNodeFromEdge = (
  edge: Edge,
  position: { x: number; y: number },
  nodes: Node[],
): { node: Node; edges: Edge[] } => {
  const sourceNode =
    typeof edge.source === "string"
      ? nodes.find((n) => n.id === edge.source)
      : (edge.source as Node);

  const targetNode =
    typeof edge.target === "string"
      ? nodes.find((n) => n.id === edge.target)
      : (edge.target as Node);

  if (!sourceNode || !targetNode) {
    throw new Error("Source or target node not found");
  }

  const sourceId = sourceNode.id;
  const targetId = targetNode.id;

  // Generate a new node ID
  const newNodeId = `node-${Date.now()}`;

  // Create the new node
  const newNode: Node = {
    id: newNodeId,
    type: "event",
    label: `Event between ${sourceNode.label} and ${targetNode.label}`,
    x: position.x,
    y: position.y,
    description: "",
    isNew: true,
    isEditing: true,
  };

  // Create two new edges
  const edge1: Edge = {
    id: generateEdgeId(),
    source: sourceId,
    target: newNodeId,
    relationship: edge.relationship || "Related to",
  };

  const edge2: Edge = {
    id: generateEdgeId(),
    source: newNodeId,
    target: targetId,
    relationship: edge.relationship || "Related to",
  };

  return {
    node: newNode,
    edges: [edge1, edge2],
  };
};
