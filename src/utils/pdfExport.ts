import { jsPDF } from "jspdf";
import { Node, Edge } from "@/components/KnowledgeGraph/types";
import { getNodeShape } from "@/components/KnowledgeGraph/utils/nodeShapes";
import * as d3 from "d3";

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
 */
export const exportGraphToPDF = async (
  nodes: Node[],
  edges: Edge[],
  title: string = "Knowledge Graph",
): Promise<void> => {
  // Create a new PDF document
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  // Set PDF metadata
  pdf.setProperties({
    title: title,
    subject: "Knowledge Graph Export",
    creator: "Historical Knowledge Graph Tool",
    keywords: "knowledge graph, history, visualization",
  });

  // PDF dimensions
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const graphWidth = pdfWidth - margin * 2;
  const graphHeight = pdfHeight - margin * 2 - 60; // Leave space for title and legend

  // Add title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(title, pdfWidth / 2, margin, { align: "center" });

  // Add timestamp
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const timestamp = new Date().toLocaleString();
  pdf.text(`Generated: ${timestamp}`, pdfWidth - margin, margin, {
    align: "right",
  });

  // Optimize node positions for PDF layout
  const optimizedNodes = optimizeNodePositions(nodes, graphWidth, graphHeight);

  // Draw the graph
  drawGraph(pdf, optimizedNodes, edges, margin, graphWidth, graphHeight);

  // Add legend
  drawLegend(pdf, margin, pdfHeight - 30);

  // Add node count and edge count
  pdf.setFontSize(10);
  pdf.text(
    `Nodes: ${nodes.length} | Edges: ${edges.length}`,
    margin,
    pdfHeight - 20,
  );

  // Save the PDF
  pdf.save(
    `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
  );
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
 * Draws the graph on the PDF
 */
const drawGraph = (
  pdf: jsPDF,
  nodes: Node[],
  edges: Edge[],
  margin: number,
  width: number,
  height: number,
): void => {
  // Draw edges first (so they appear behind nodes)
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (
      sourceNode &&
      targetNode &&
      sourceNode.x &&
      sourceNode.y &&
      targetNode.x &&
      targetNode.y
    ) {
      // Draw edge line
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.5);
      pdf.line(
        margin + sourceNode.x,
        margin + sourceNode.y,
        margin + targetNode.x,
        margin + targetNode.y,
      );

      // Draw edge label
      if (edge.relationship) {
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;

        // Draw small white background for label
        pdf.setFillColor(255, 255, 255);
        const textWidth = pdf.getTextWidth(edge.relationship) + 4;
        pdf.roundedRect(
          margin + midX - textWidth / 2,
          margin + midY - 6,
          textWidth,
          12,
          2,
          2,
          "F",
        );

        // Draw label text
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(edge.relationship, margin + midX, margin + midY, {
          align: "center",
        });
      }
    }
  });

  // Draw nodes
  nodes.forEach((node) => {
    if (node.x === undefined || node.y === undefined) return;

    const nodeColor =
      nodeColors[node.type as keyof typeof nodeColors] || "#94a3b8";
    const [r, g, b] = hexToRgb(nodeColor);

    // Draw node shape
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(1.5);

    // Draw circle for node
    pdf.circle(margin + node.x, margin + node.y, 15, "FD");

    // Draw node label
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text(node.label, margin + node.x, margin + node.y + 25, {
      align: "center",
    });

    // Draw node type icon
    drawNodeTypeIcon(pdf, node.type, margin + node.x, margin + node.y);
  });
};

/**
 * Draws a node type icon
 */
const drawNodeTypeIcon = (
  pdf: jsPDF,
  type: string,
  x: number,
  y: number,
): void => {
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);

  let icon = "?";

  switch (type) {
    case "person":
      icon = "👤";
      break;
    case "event":
      icon = "📅";
      break;
    case "place":
      icon = "📍";
      break;
    case "document":
      icon = "📄";
      break;
    case "concept":
      icon = "💡";
      break;
  }

  pdf.text(icon, x, y + 3, { align: "center" });
};

/**
 * Draws the legend
 */
const drawLegend = (pdf: jsPDF, x: number, y: number): void => {
  const legendItems = [
    { type: "person", label: "Person" },
    { type: "event", label: "Event" },
    { type: "place", label: "Place" },
    { type: "document", label: "Document" },
    { type: "concept", label: "Concept" },
  ];

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Legend:", x, y);

  let offsetX = pdf.getTextWidth("Legend: ") + x + 10;

  legendItems.forEach((item) => {
    const nodeColor = nodeColors[item.type as keyof typeof nodeColors];
    const [r, g, b] = hexToRgb(nodeColor);

    // Draw color circle
    pdf.setFillColor(r, g, b);
    pdf.circle(offsetX, y - 3, 4, "F");

    // Draw label
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, offsetX + 8, y);

    offsetX += pdf.getTextWidth(item.label) + 25;
  });
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
