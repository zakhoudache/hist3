import * as d3 from "d3";
import { Node, Edge } from "@/components/KnowledgeGraph/types";
import { getNodeShape } from "@/components/KnowledgeGraph/utils/nodeShapes";

// Define node colors
const nodeColors = {
  person: "#3b82f6",
  event: "#ef4444",
  place: "#22c55e",
  document: "#8b5cf6",
  concept: "#f59e0b",
};

/**
 * Exports the knowledge graph to a high-quality PDF
 * Note: This is a placeholder until jsPDF is installed
 */
export const exportGraphToPDF = async (
  nodes: Node[],
  edges: Edge[],
  title: string = "Knowledge Graph",
): Promise<void> => {
  // This is a placeholder function that will be implemented when jsPDF is installed
  console.log("PDF export requested with:", { nodes, edges, title });
  alert("PDF export functionality will be available once jsPDF is installed.");
};

/**
 * Optimizes node positions for PDF layout using force-directed algorithm
 */
const optimizeNodePositions = (
  nodes: Node[],
  width: number,
  height: number,
): Node[] => {
  if (nodes.length === 0) return [];

  // Create a copy of nodes to avoid modifying the original
  const nodesCopy = nodes.map((node) => ({ ...node }));

  // Create a simulation
  const simulation = d3
    .forceSimulation(nodesCopy)
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("charge", d3.forceManyBody().strength(-1000))
    .force("collision", d3.forceCollide().radius(50))
    .stop();

  // Run the simulation
  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }

  // Ensure nodes are within bounds
  const padding = 50;
  nodesCopy.forEach((node) => {
    node.x = Math.max(padding, Math.min(width - padding, node.x || width / 2));
    node.y = Math.max(
      padding,
      Math.min(height - padding, node.y || height / 2),
    );
  });

  return nodesCopy;
};

/**
 * Converts hex color to RGB
 */
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
};
