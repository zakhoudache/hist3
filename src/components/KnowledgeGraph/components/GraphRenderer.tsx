import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import type { Node, Edge } from "../types";
import { getNodeShape } from "../utils/nodeShapes";

interface GraphRendererProps {
  nodeList: Node[];
  edgeList: Edge[];
  hoveredNode: string | null;
  hoveredEdge: string | null;
  edgeCreationState: { source: string | null; target: null };
  focusedNodeId: string | null;
  midEdgePoint: { x: number; y: number; edge: Edge } | null;
  showMidEdgeMenu: boolean;
  width: number;
  height: number;
  setHoveredNode: (id: string | null) => void;
  setHoveredEdge: (id: string | null) => void;
  setActiveNode: (node: Node | null) => void;
  setShowNodeDialog: (show: boolean) => void;
  setActiveEdge: (edge: Edge | null) => void;
  setShowEdgeDialog: (show: boolean) => void;
  setNodeToDelete: (id: string | null) => void;
  setEdgeToDelete: (id: string | null) => void;
  setConfirmDeleteType: (type: "node" | "edge" | null) => void;
  setShowConfirmDelete: (show: boolean) => void;
  setMidEdgePoint: (point: { x: number; y: number; edge: Edge } | null) => void;
  setShowMidEdgeMenu: (show: boolean) => void;
  setEdgeCreationState: (state: {
    source: string | null;
    target: null;
  }) => void;
  setFocusedNodeId: (id: string | null) => void;
  createNewEdge: (sourceId: string, targetId: string) => void;
  createNodeFromEdge: (relationship: string) => void;
  createNewNodeFromScratch: (
    event: React.MouseEvent,
    svgRef: React.RefObject<SVGSVGElement>,
  ) => void;
}

const GraphRenderer: React.FC<GraphRendererProps> = ({
  nodeList,
  edgeList,
  hoveredNode,
  hoveredEdge,
  edgeCreationState,
  focusedNodeId,
  midEdgePoint,
  showMidEdgeMenu,
  width,
  height,
  setHoveredNode,
  setHoveredEdge,
  setActiveNode,
  setShowNodeDialog,
  setActiveEdge,
  setShowEdgeDialog,
  setNodeToDelete,
  setEdgeToDelete,
  setConfirmDeleteType,
  setShowConfirmDelete,
  setMidEdgePoint,
  setShowMidEdgeMenu,
  setEdgeCreationState,
  setFocusedNodeId,
  createNewEdge,
  createNodeFromEdge,
  createNewNodeFromScratch,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Edge> | null>(null);
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform | null>(
    null,
  );
  const [simulationRunning, setSimulationRunning] = useState<boolean>(true);

  // Function to add keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Escape key to cancel edge creation mode
      if (event.key === "Escape" && edgeCreationState.source) {
        setEdgeCreationState({ source: null, target: null });
      }

      // Delete key to trigger deletion of selected node/edge
      if (event.key === "Delete" || event.key === "Backspace") {
        if (hoveredNode) {
          setNodeToDelete(hoveredNode);
          setConfirmDeleteType("node");
          setShowConfirmDelete(true);
        } else if (hoveredEdge) {
          setEdgeToDelete(hoveredEdge);
          setConfirmDeleteType("edge");
          setShowConfirmDelete(true);
        }
      }
    },
    [
      edgeCreationState,
      hoveredNode,
      hoveredEdge,
      setNodeToDelete,
      setEdgeToDelete,
      setConfirmDeleteType,
      setShowConfirmDelete,
      setEdgeCreationState,
    ],
  );

  // Add event listener for keyboard shortcuts
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Performance optimization: Memoize node and edge data processing
  const processedNodeList = React.useMemo(() => {
    return nodeList.map((node) => ({
      ...node,
      // Ensure nodes have initial positions if not already set
      x: node.x ?? width / 2 + (Math.random() - 0.5) * 200,
      y: node.y ?? height / 2 + (Math.random() - 0.5) * 200,
    }));
  }, [nodeList, width, height]);

  // Toggle simulation on/off
  const toggleSimulation = useCallback(() => {
    setSimulationRunning((prev) => !prev);

    if (!simulationRunning && simulationRef.current) {
      simulationRef.current.alpha(0.3).restart();
    } else if (simulationRef.current) {
      simulationRef.current.stop();
    }
  }, [simulationRunning]);

  // Function to reset zoom
  const resetZoom = useCallback(() => {
    if (!svgRef.current) return;

    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call((d3.zoom() as any).transform, d3.zoomIdentity);
  }, []);

  // Function to center and focus on a specific node
  const focusOnNode = useCallback(
    (nodeId: string) => {
      if (!svgRef.current || !simulationRef.current) return;

      const node = nodeList.find((n) => n.id === nodeId);
      if (!node || node.x === undefined || node.y === undefined) return;

      const zoom = d3.zoom().scaleExtent([0.1, 4]) as any;
      const svg = d3.select(svgRef.current);

      // Calculate transform to center on node
      const transform = d3.zoomIdentity
        .translate(width / 2 - node.x, height / 2 - node.y)
        .scale(1.2);

      // Apply transform with animation
      svg.transition().duration(750).call(zoom.transform, transform);

      // Set this node as focused
      setFocusedNodeId(nodeId);
    },
    [nodeList, width, height, setFocusedNodeId],
  );

  // Main effect to set up and render the graph
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Add tooltip container for hovering information
    const tooltip = d3
      .select("body")
      .selectAll(".graph-tooltip")
      .data([null])
      .join("div")
      .attr("class", "graph-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #d1d5db")
      .style("border-radius", "0.375rem")
      .style("padding", "0.5rem")
      .style("box-shadow", "0 1px 3px 0 rgba(0, 0, 0, 0.1)")
      .style("pointer-events", "none")
      .style("z-index", "50");

    const g = svg.append("g");

    // Create a simulation with many-body force and center force
    const simulation = d3
      .forceSimulation(processedNodeList)
      .force(
        "link",
        d3
          .forceLink(edgeList)
          .id((d: any) => d.id)
          .distance(150),
      )
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50))
      .alphaDecay(0.05); // Slower decay for more stable positioning

    // Store simulation in ref for access from other functions
    simulationRef.current = simulation;

    // Stop simulation if not running
    if (!simulationRunning) {
      simulation.stop();
    }

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomTransform(event.transform);
      });

    svg.call(zoom as any);

    // Add double-click handler for creating new nodes
    svg.on("dblclick", (event) => createNewNodeFromScratch(event, svgRef));

    // Add click handler to clear focus
    svg.on("click", () => {
      // Clear focused node
      if (focusedNodeId) {
        svg
          .selectAll(".node")
          .classed("highlighted", false)
          .classed("dimmed", false);
        svg
          .selectAll(".link")
          .classed("highlighted", false)
          .classed("dimmed", false);
        setFocusedNodeId(null);
      }

      // Clear edge creation mode
      if (edgeCreationState.source) {
        setEdgeCreationState({ source: null, target: null });
      }
    });

    // Add arrow markers for edge directionality with different colors
    const nodeColors = {
      person: "#3b82f6",
      event: "#ef4444",
      place: "#22c55e",
      document: "#8b5cf6",
      concept: "#f59e0b",
    };

    // Create marker for each node type
    Object.entries(nodeColors).forEach(([type, color]) => {
      svg
        .append("defs")
        .append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", color)
        .attr("d", "M0,-5L10,0L0,5");
    });

    // Default arrow
    svg
      .append("defs")
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
    const defs = svg.append("defs");
    const filter = defs
      .append("filter")
      .attr("id", "shadow")
      .attr("height", "130%");

    filter
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", "3")
      .attr("result", "blur");

    filter
      .append("feOffset")
      .attr("in", "blur")
      .attr("dx", "0")
      .attr("dy", "3")
      .attr("result", "offsetBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Create patterns for node thumbnails/avatars
    processedNodeList.forEach((node) => {
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
          .attr("y", -20)
          .attr("preserveAspectRatio", "xMidYMid slice");
      }
    });

    // Function to get edge color based on source node type
    const getEdgeColor = (d: Edge) => {
      const sourceNode = processedNodeList.find((n) => n.id === d.source);
      if (hoveredEdge === d.id) return "#3b82f6";

      if (sourceNode) {
        return (
          nodeColors[sourceNode.type as keyof typeof nodeColors] || "#e2e8f0"
        );
      }
      return "#e2e8f0";
    };

    // Function to get edge marker based on source node type
    const getEdgeMarker = (d: Edge) => {
      const sourceNode = processedNodeList.find((n) => n.id === d.source);
      if (sourceNode) {
        return `url(#arrow-${sourceNode.type})`;
      }
      return "url(#arrow)";
    };

    // Draw curved edges with gradients
    const link = g
      .append("g")
      .selectAll(".link")
      .data(edgeList)
      .join("path")
      .attr("class", "link")
      .attr("id", (d) => `edge-${d.id}`)
      .attr("stroke", getEdgeColor)
      .attr("stroke-width", (d) => (hoveredEdge === d.id ? 3 : 2))
      .attr("stroke-dasharray", (d) => (d.isNew ? "5,5" : "none"))
      .attr("fill", "none")
      .attr("marker-end", getEdgeMarker)
      .attr("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        setHoveredEdge(d.id);

        // Show tooltip with edge information
        tooltip.style("visibility", "visible").html(`
            <div class="font-medium">Relationship: ${d.relationship || "Undefined"}</div>
            <div class="text-sm text-gray-600">Click to edit</div>
          `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseleave", (event, d) => {
        setHoveredEdge(null);
        tooltip.style("visibility", "hidden");
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        setActiveEdge(d);
        setShowEdgeDialog(true);
      })
      .on("contextmenu", (event, d) => {
        event.preventDefault();
        setEdgeToDelete(d.id);
        setConfirmDeleteType("edge");
        setShowConfirmDelete(true);
      });

    // Add relationship labels on edges
    g.append("g")
      .selectAll(".edge-label")
      .data(edgeList)
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
      .data(edgeList)
      .join("path")
      .attr("class", "edge-hitbox")
      .attr("stroke", "transparent")
      .attr("stroke-width", 15)
      .attr("fill", "none")
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        setHoveredEdge(d.id);

        // Show tooltip with edge information
        tooltip.style("visibility", "visible").html(`
            <div class="font-medium">Relationship: ${d.relationship || "Undefined"}</div>
            <div class="text-sm text-gray-600">Click to edit</div>
          `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseleave", (event, d) => {
        setHoveredEdge(null);
        tooltip.style("visibility", "hidden");
      })
      .on("click", (event, d) => {
        // Calculate middle point of the edge
        const source = nodeList.find((n) => n.id === d.source);
        const target = nodeList.find((n) => n.id === d.target);

        if (
          source &&
          source.x !== undefined &&
          source.y !== undefined &&
          target &&
          target.x !== undefined &&
          target.y !== undefined
        ) {
          const x = (source.x + target.x) / 2;
          const y = (source.y + target.y) / 2;

          setMidEdgePoint({ x, y, edge: d });
          setShowMidEdgeMenu(true);
        }
      });

    // Draw nodes with different shapes based on type
    const nodeGroups = g
      .append("g")
      .selectAll(".node")
      .data(processedNodeList)
      .join("g")
      .attr("class", "node")
      .attr("id", (d) => `node-${d.id}`)
      .attr("cursor", "pointer")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any,
      );

    // Add node shapes with improved hit area
    // First add a larger transparent hit area
    nodeGroups
      .append("path")
      .attr("d", (d) => getNodeShape(d.type))
      .attr("fill", "transparent")
      .attr("stroke", "transparent")
      .attr("stroke-width", 10) // Wider hit area
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        setHoveredNode(d.id);

        // Show tooltip with node information
        tooltip.style("visibility", "visible").html(`
            <div class="font-medium">${d.label}</div>
            <div class="text-sm text-gray-600">Type: ${d.type}</div>
            ${d.description ? `<div class="text-sm mt-1">${d.description}</div>` : ""}
          `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseleave", (event, d) => {
        setHoveredNode(null);
        tooltip.style("visibility", "hidden");
      })
      .on("click", (event, d) => {
        event.stopPropagation();

        // Handle edge creation mode
        if (edgeCreationState.source) {
          if (d.id !== edgeCreationState.source) {
            createNewEdge(edgeCreationState.source, d.id);
            setEdgeCreationState({ source: null, target: null });
          }
          return;
        }

        setActiveNode(d);
        setShowNodeDialog(true);
      })
      .on("contextmenu", (event, d) => {
        event.preventDefault();

        // Focus on this node
        focusOnNode(d.id);
      });

    // Then add the visible node shape
    nodeGroups
      .append("path")
      .attr("d", (d) => getNodeShape(d.type))
      .attr("fill", (d) => (d.image ? `url(#image-${d.id})` : "white"))
      .attr("stroke", (d) => {
        if (hoveredNode === d.id) return "#000000";
        switch (d.type) {
          case "person":
            return "#3b82f6";
          case "event":
            return "#ef4444";
          case "place":
            return "#22c55e";
          case "document":
            return "#8b5cf6";
          case "concept":
            return "#f59e0b";
          default:
            return "#94a3b8";
        }
      })
      .attr("stroke-width", (d) => (hoveredNode === d.id ? 3 : 2))
      .attr("stroke-dasharray", (d) => (d.isNew ? "5,5" : "none"))
      .attr("filter", "url(#shadow)")
      .attr("pointer-events", "none"); // No pointer events on the visible shape

    // Add type icon inside nodes
    nodeGroups
      .append("svg:foreignObject")
      .attr("width", 24)
      .attr("height", 24)
      .attr("x", -12)
      .attr("y", -12)
      .attr("pointer-events", "none")
      .append("xhtml:div")
      .html((d) => {
        const iconColor =
          d.type === "person"
            ? "#3b82f6"
            : d.type === "event"
              ? "#ef4444"
              : d.type === "place"
                ? "#22c55e"
                : d.type === "document"
                  ? "#8b5cf6"
                  : "#f59e0b";

        return `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
            ${
              d.type === "person"
                ? '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>'
                : d.type === "event"
                  ? '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>'
                  : d.type === "place"
                    ? '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>'
                    : d.type === "document"
                      ? '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>'
                      : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
            }
          </svg>
        </div>`;
      });

    // Add node labels
    nodeGroups
      .append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("y", 35)
      .attr("font-size", "12px")
      .attr("pointer-events", "none")
      .attr("font-weight", (d) => (hoveredNode === d.id ? "bold" : "normal"));

    // Add quick action buttons when node is hovered
    const actionButtons = nodeGroups
      .append("g")
      .attr("class", "node-actions")
      .attr("opacity", (d) => (hoveredNode === d.id ? 1 : 0))
      .attr("transform", "translate(0, -35)");

    // Edit button
    actionButtons
      .append("circle")
      .attr("cx", -20)
      .attr("cy", 0)
      .attr("r", 10)
      .attr("fill", "#3b82f6")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setActiveNode(d);
        setShowNodeDialog(true);
      });

    actionButtons
      .append("text")
      .attr("x", -20)
      .attr("y", 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .text("✏️");

    // Delete button
    actionButtons
      .append("circle")
      .attr("cx", 20)
      .attr("cy", 0)
      .attr("r", 10)
      .attr("fill", "#ef4444")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setNodeToDelete(d.id);
        setConfirmDeleteType("node");
        setShowConfirmDelete(true);
      });

    actionButtons
      .append("text")
      .attr("x", 20)
      .attr("y", 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .text("🗑️");

    // Create new edge button
    actionButtons
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 10)
      .attr("fill", "#22c55e")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        // Start edge creation mode
        setEdgeCreationState({ source: d.id, target: null });
      });

    actionButtons
      .append("text")
      .attr("x", 0)
      .attr("y", 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .text("🔗");

    // Show indicator when in edge creation mode
    if (edgeCreationState.source) {
      const sourceNode = processedNodeList.find(
        (n) => n.id === edgeCreationState.source,
      );
      if (
        sourceNode &&
        sourceNode.x !== undefined &&
        sourceNode.y !== undefined
      ) {
        g.append("circle")
          .attr("cx", sourceNode.x)
          .attr("cy", sourceNode.y)
          .attr("r", 40)
          .attr("fill", "none")
          .attr("stroke", "#22c55e")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5");

        g.append("text")
          .attr("x", sourceNode.x)
          .attr("y", sourceNode.y - 45)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("fill", "#22c55e")
          .text("Select target node to connect");
      }
    }

    // Render mid-edge menu if active
    if (showMidEdgeMenu && midEdgePoint) {
      const menu = g
        .append("g")
        .attr("class", "mid-edge-menu")
        .attr("transform", `translate(${midEdgePoint.x}, ${midEdgePoint.y})`);

      // Background circle
      menu
        .append("circle")
        .attr("r", 40)
        .attr("fill", "white")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1);

      // Add entity button
      const addButton = menu
        .append("g")
        .attr("cursor", "pointer")
        .on("click", () =>
          createNodeFromEdge(midEdgePoint.edge.relationship || ""),
        );

      addButton
        .append("circle")
        .attr("cx", 0)
        .attr("cy", -15)
        .attr("r", 15)
        .attr("fill", "#3b82f6");

      addButton
        .append("text")
        .attr("x", 0)
        .attr("y", -11)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "white")
        .text("+");

      addButton
        .append("text")
        .attr("x", 0)
        .attr("y", 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#3b82f6")
        .text("Add Node");

      // Close button
      const closeButton = menu
        .append("g")
        .attr("cursor", "pointer")
        .on("click", () => {
          setMidEdgePoint(null);
          setShowMidEdgeMenu(false);
        });

      closeButton
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 15)
        .attr("r", 15)
        .attr("fill", "#ef4444");

      closeButton
        .append("text")
        .attr("x", 0)
        .attr("y", 19)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "white")
        .text("×");

      closeButton
        .append("text")
        .attr("x", 0)
        .attr("y", 35)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#ef4444")
        .text("Close");
    }

    // Implement node drag behavior
    function dragstarted(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      // Stop event propagation to prevent click events from firing
      event.sourceEvent.stopPropagation();
    }

    function dragged(event: any, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep position fixed where user dropped it
      // d.fx = null;
      // d.fy = null;
    }

    // Highlight connected nodes when focusing
    if (focusedNodeId) {
      // Find the focused node and its connected edges
      const connectedEdges = edgeList.filter(
        (e) => e.source === focusedNodeId || e.target === focusedNodeId,
      );
      const connectedNodeIds = new Set<string>();

      connectedEdges.forEach((e) => {
        connectedNodeIds.add(e.source as string);
        connectedNodeIds.add(e.target as string);
      });

      // Highlight the focused node and connected nodes/edges
      svg
        .selectAll(".node")
        .classed("highlighted", (d) => d.id === focusedNodeId)
        .classed(
          "dimmed",
          (d) => d.id !== focusedNodeId && !connectedNodeIds.has(d.id),
        );

      svg
        .selectAll(".link")
        .classed(
          "highlighted",
          (d) => d.source === focusedNodeId || d.target === focusedNodeId,
        )
        .classed(
          "dimmed",
          (d) => d.source !== focusedNodeId && d.target !== focusedNodeId,
        );
    }

    // Update node and edge positions on each simulation tick
    simulation.on("tick", () => {
      // Update curved edge paths
      link.attr("d", (d: any) => {
        const sourceNode = processedNodeList.find(
          (n) => n.id === d.source.id || n.id === d.source,
        );
        const targetNode = processedNodeList.find(
          (n) => n.id === d.target.id || n.id === d.target,
        );

        if (
          !sourceNode ||
          !targetNode ||
          sourceNode.x === undefined ||
          sourceNode.y === undefined ||
          targetNode.x === undefined ||
          targetNode.y === undefined
        ) {
          return "";
        }

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dr = Math.sqrt(dx * dx + dy * dy);

        // Straight lines for short distances, curved for longer
        if (dr < 100) {
          return `M${sourceNode.x},${sourceNode.y}L${targetNode.x},${targetNode.y}`;
        } else {
          // Calculate curve based on distance
          const curvature = Math.min(0.3, 30 / dr);
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;

          // Offset the curve
          const offsetX = -dy * curvature;
          const offsetY = dx * curvature;

          return `M${sourceNode.x},${sourceNode.y} Q${midX + offsetX},${midY + offsetY} ${targetNode.x},${targetNode.y}`;
        }
      });

      // Update edge hitbox paths to match
      g.selectAll(".edge-hitbox").attr("d", function () {
        const correspondingEdge = d3.select(this.parentNode).select(".link");
        return correspondingEdge.attr("d");
      });

      // Update node positions
      nodeGroups.attr("transform", (d) => {
        return `translate(${d.x || 0},${d.y || 0})`;
      });
    });

    // Handle window resize
    const resizeHandler = () => {
      simulation.force("center", d3.forceCenter(width / 2, height / 2));
      simulation.alpha(0.3).restart();
    };

    window.addEventListener("resize", resizeHandler);

    // Cleanup function
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      window.removeEventListener("resize", resizeHandler);
      tooltip.remove();
    };
  }, [
    processedNodeList,
    edgeList,
    width,
    height,
    hoveredNode,
    hoveredEdge,
    edgeCreationState,
    focusedNodeId,
    midEdgePoint,
    showMidEdgeMenu,
    simulationRunning,
    setHoveredNode,
    setHoveredEdge,
    setActiveNode,
    setShowNodeDialog,
    setActiveEdge,
    setShowEdgeDialog,
    setNodeToDelete,
    setEdgeToDelete,
    setConfirmDeleteType,
    setShowConfirmDelete,
    setMidEdgePoint,
    setShowMidEdgeMenu,
    setEdgeCreationState,
    setFocusedNodeId,
    createNewEdge,
    createNodeFromEdge,
    createNewNodeFromScratch,
    focusOnNode,
  ]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full bg-gray-50 rounded-lg"
      >
        {/* Graph will be rendered here by D3 */}
      </svg>

      {/* Controls overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={toggleSimulation}
          className={`p-2 rounded-full ${
            simulationRunning ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          title={simulationRunning ? "Pause layout" : "Resume layout"}
        >
          {simulationRunning ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>

        <button
          onClick={resetZoom}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
          title="Reset zoom"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </button>
      </div>

      {/* Edge creation mode indicator */}
      {edgeCreationState.source && (
        <div className="absolute top-4 left-4 bg-green-100 p-2 rounded-md border border-green-500">
          <div className="flex items-center gap-2">
            <span className="text-green-800">Connecting node...</span>
            <button
              onClick={() =>
                setEdgeCreationState({ source: null, target: null })
              }
              className="p-1 rounded-full bg-green-200 hover:bg-green-300"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="text-sm text-green-700">
            Click on another node to create connection, or press ESC to cancel
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphRenderer;
