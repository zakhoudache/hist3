import * as d3 from "d3";
import { SimulationNodeDatum } from "d3";
import { Node, Edge } from "../types";
import {
  NODE_TYPE_COLORS,
  DEFAULT_EDGE_COLOR,
  HOVERED_EDGE_COLOR,
} from "../constants";

// Setup SVG defs (markers, filters, patterns)
export const setupSvgDefs = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: Node[],
) => {
  const defs = svg.append("defs");

  // Add arrow markers for edge directionality
  defs
    .append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 28)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("fill", "#94a3b8")
    .attr("d", "M0,-5L10,0L0,5");

  // Add drop shadow for nodes
  const filter = defs
    .append("filter")
    .attr("id", "shadow")
    .append("feDropShadow")
    .attr("dx", "0")
    .attr("dy", "1")
    .attr("stdDeviation", "2");

  // Create patterns for node thumbnails/avatars
  nodes.forEach((node) => {
    if (node.image) {
      defs
        .append("pattern")
        .attr("id", `image-${node.id}`)
        .attr("width", 1)
        .attr("height", 1)
        .append("image")
        .attr("xlink:href", node.image)
        .attr("width", 40)
        .attr("height", 40)
        .attr("x", -20)
        .attr("y", -20);
    }
  });

  return defs;
};

// Create edge paths
export const createEdgePaths = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  edges: Edge[],
  hoveredEdge: string | null,
  onEdgeClick: (event: MouseEvent, edge: Edge) => void,
  onEdgeContextMenu: (event: MouseEvent, edge: Edge) => void,
  onEdgeHover: (edgeId: string | null) => void,
  onMidEdgeClick: (event: MouseEvent, edge: Edge) => void,
) => {
  // Draw curved edges
  const link = g
    .append("g")
    .selectAll(".link")
    .data(edges)
    .join("path")
    .attr("class", "link")
    .attr("id", (d) => `edge-${d.id}`)
    .attr("stroke", (d) =>
      hoveredEdge === d.id ? HOVERED_EDGE_COLOR : DEFAULT_EDGE_COLOR,
    )
    .attr("stroke-width", (d) => (hoveredEdge === d.id ? 3 : 2))
    .attr("stroke-dasharray", (d) => (d.isNew ? "5,5" : "none"))
    .attr("fill", "none")
    .attr("marker-end", "url(#arrow)")
    .attr("cursor", "pointer")
    .on("mouseenter", (event, d) => onEdgeHover(d.id))
    .on("mouseleave", () => onEdgeHover(null))
    .on("click", (event: any, d) => {
      event.stopPropagation();
      onEdgeClick(event, d);
    })
    .on("contextmenu", (event: any, d) => {
      event.preventDefault();
      onEdgeContextMenu(event, d);
    });

  // Add relationship labels on edges
  g.append("g")
    .selectAll(".edge-label")
    .data(edges)
    .join("text")
    .attr("class", "edge-label")
    .attr("text-anchor", "middle")
    .attr("dy", -5)
    .attr("font-size", "10px")
    .attr("pointer-events", "none")
    .append("textPath")
    .attr("href", (d) => `#edge-${d.id}`)
    .attr("startOffset", "50%")
    .text((d) => d.relationship || "");

  // Add invisible wider path for edge interaction
  g.append("g")
    .selectAll(".edge-hitbox")
    .data(edges)
    .join("path")
    .attr("class", "edge-hitbox")
    .attr("stroke", "transparent")
    .attr("stroke-width", 15)
    .attr("fill", "none")
    .style("cursor", "pointer")
    .on("mouseenter", (event, d) => onEdgeHover(d.id))
    .on("mouseleave", () => onEdgeHover(null))
    .on("click", (event: any, d) => {
      event.stopPropagation();
      onMidEdgeClick(event, d);
    });

  return link;
};

// Update positions for simulation tick
export const updatePositions = (
  link: d3.Selection<d3.BaseType, Edge, SVGGElement, unknown>,
  nodeGroups: d3.Selection<d3.BaseType, Node, SVGGElement, unknown>,
) => {
  // Update edge paths
  link.attr("d", (d: any) => {
    const dx = d.target.x - d.source.x;
    const dy = d.target.y - d.source.y;
    const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Curve factor
    return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
  });

  // Update edge hitboxes
  d3.selectAll(".edge-hitbox").attr("d", (d: any) => {
    const dx = d.target.x - d.source.x;
    const dy = d.target.y - d.source.y;
    const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
    return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
  });

  // Update node positions
  nodeGroups.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
};

// Get the stroke color for a node based on its type and hover state
export const getNodeStrokeColor = (
  node: Node,
  hoveredNode: string | null,
): string => {
  if (hoveredNode === node.id) return "#000000";
  return NODE_TYPE_COLORS[node.type] || "#94a3b8";
};
