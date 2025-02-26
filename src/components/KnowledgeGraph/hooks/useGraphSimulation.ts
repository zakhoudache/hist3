import { useCallback, useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { Node, Edge, MidEdgePoint } from "../types";
import { getNodeShape } from "../data";

export const useGraphVisualization = (
  nodeList: Node[],
  edgeList: Edge[],
  onNodeSelect: (nodeId: string) => void,
  createNewEdge: (sourceId: string, targetId: string) => void,
  edgeCreationState: { source: string | null; target: string | null },
  hoveredNode: string | null,
  setHoveredNode: (id: string | null) => void,
  hoveredEdge: string | null,
  setHoveredEdge: (id: string | null) => void,
  setNodeToDelete: (id: string | null) => void,
  setEdgeToDelete: (id: string | null) => void,
  setConfirmDeleteType: (type: "node" | "edge" | null) => void,
  setActiveNode: (node: Node | null) => void,
  setShowNodeDialog: (open: boolean) => void,
  setActiveEdge: (edge: Edge | null) => void,
  setShowEdgeDialog: (open: boolean) => void,
  setMidEdgePoint: (point: MidEdgePoint | null) => void,
  setShowMidEdgeMenu: (show: boolean) => void,
  createNewNodeFromScratch: (event: React.MouseEvent) => void,
  midEdgePoint: MidEdgePoint | null,
  showMidEdgeMenu: boolean,
  createNodeFromEdge: (relationship: string) => void,
) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const width = 800;
  const height = 600;

  const createVisualization = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Create a simulation with many-body force and center force
    const simulation = d3
      .forceSimulation(nodeList)
      .force(
        "link",
        d3
          .forceLink(edgeList)
          .id((d: any) => d.id)
          .distance(150),
      )
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Add double-click handler for creating new nodes
    svg.on("dblclick", createNewNodeFromScratch);

    // Add arrow markers for edge directionality
    svg
      .append("defs")
      .selectAll("marker")
      .data(["end"])
      .join("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28) // Adjust based on node size
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#94a3b8")
      .attr("d", "M0,-5L10,0L0,5");

    // Add drop shadow for nodes
    const defs = svg.append("defs");
    defs
      .append("filter")
      .attr("id", "shadow")
      .append("feDropShadow")
      .attr("dx", "0")
      .attr("dy", "1")
      .attr("stdDeviation", "2");

    // Create patterns for node thumbnails/avatars
    nodeList.forEach((node) => {
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

    // Draw curved edges with gradients
    const link = g
      .append("g")
      .selectAll(".link")
      .data(edgeList)
      .join("path")
      .attr("class", "link")
      .attr("id", (d) => `edge-${d.id}`)
      .attr("stroke", (d) => (hoveredEdge === d.id ? "#3b82f6" : "#e2e8f0"))
      .attr("stroke-width", (d) => (hoveredEdge === d.id ? 3 : 2))
      .attr("stroke-dasharray", (d) => (d.isNew ? "5,5" : "none"))
      .attr("fill", "none")
      .attr("marker-end", "url(#arrow)")
      .attr("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        setHoveredEdge(d.id);
      })
      .on("mouseleave", (event, d) => {
        setHoveredEdge(null);
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
      })
      .on("mouseleave", (event, d) => {
        setHoveredEdge(null);
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
      .data(nodeList)
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

    // Add node shapes
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
      .on("mouseenter", (event, d) => {
        setHoveredNode(d.id);
      })
      .on("mouseleave", (event, d) => {
        setHoveredNode(null);
      })
      .on("click", (event, d) => {
        event.stopPropagation();

        // Handle edge creation mode
        if (edgeCreationState.source) {
          if (d.id !== edgeCreationState.source) {
            createNewEdge(edgeCreationState.source, d.id);
          }
          return;
        }

        onNodeSelect(d.id);
        setActiveNode(d);
        setShowNodeDialog(true);
      });

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
      .attr("y", (d) => {
        switch (d.type) {
          case "person":
            return 35; // Square
          case "event":
            return 35; // Diamond
          case "place":
            return 35; // Triangle
          case "document":
            return 35; // Document
          case "concept":
            return 35; // Circle
          default:
            return 35;
        }
      })
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
        onNodeSelect(d.id);
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

    // Add midpoint menu if showing
    if (midEdgePoint && showMidEdgeMenu) {
      const menuGroup = g
        .append("g")
        .attr("class", "mid-edge-menu")
        .attr("transform", `translate(${midEdgePoint.x}, ${midEdgePoint.y})`);

      // Add background
      menuGroup
        .append("rect")
        .attr("x", -60)
        .attr("y", -20)
        .attr("width", 120)
        .attr("height", 40)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("fill", "#f8fafc")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1);

      // Add text
      menuGroup
        .append("text")
        .attr("x", 0)
        .attr("y", 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Add node");

      // Add buttons
      const buttonGroup = menuGroup.append("g");

      // Add "Create Node" button
      buttonGroup
        .append("rect")
        .attr("x", -50)
        .attr("y", -10)
        .attr("width", 100)
        .attr("height", 20)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", "#3b82f6")
        .attr("cursor", "pointer")
        .on("click", (event) => {
          event.stopPropagation();
          createNodeFromEdge("Connected to");
        });

      buttonGroup
        .append("text")
        .attr("x", 0)
        .attr("y", 4)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "white")
        .attr("pointer-events", "none")
        .text("Create Node");

      // Close button
      menuGroup
        .append("circle")
        .attr("cx", 60)
        .attr("cy", -20)
        .attr("r", 8)
        .attr("fill", "#ef4444")
        .attr("cursor", "pointer")
        .on("click", (event) => {
          event.stopPropagation();
          setShowMidEdgeMenu(false);
          setMidEdgePoint(null);
        });

      menuGroup
        .append("text")
        .attr("x", 60)
        .attr("y", -16)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "white")
        .attr("pointer-events", "none")
        .text("×");
    }

    // Update positions on each tick of the simulation
    simulation.on("tick", () => {
      // Update node positions
      nodeGroups.attr("transform", (d) => `translate(${d.x}, ${d.y})`);

      // Update edge paths (curved)
      link.attr("d", (d: any) => {
        const source = d.source;
        const target = d.target;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Adjust curvature
        return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
      });

      // Update edge hitboxes
      d3.selectAll(".edge-hitbox").attr("d", (d: any) => {
        const source = d.source;
        const target = d.target;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
      });
    });

    // Functions for dragging nodes
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [
    nodeList,
    edgeList,
    hoveredNode,
    setHoveredNode,
    hoveredEdge,
    setHoveredEdge,
    onNodeSelect,
    edgeCreationState,
    createNewEdge,
    setNodeToDelete,
    setEdgeToDelete,
    setConfirmDeleteType,
    setActiveNode,
    setShowNodeDialog,
    setActiveEdge,
    setShowEdgeDialog,
    midEdgePoint,
    showMidEdgeMenu,
    setMidEdgePoint,
    setShowMidEdgeMenu,
    createNewNodeFromScratch,
    createNodeFromEdge,
    width, // Added width and height to dependencies
    height,
  ]);

  // Initialize the visualization when the component mounts or when dependencies change
  useEffect(() => {
    createVisualization();
  }, [
    nodeList,
    edgeList,
    hoveredNode,
    hoveredEdge,
    edgeCreationState,
    midEdgePoint,
    showMidEdgeMenu,
    createVisualization,
  ]);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const currentZoom = d3.zoomTransform(svg.node() as any);

    const newScale = Math.min(currentZoom.k * 1.2, 4);
    setScale(newScale);

    svg
      .transition()
      .duration(250)
      .call(
        (d3.zoom() as any).transform,
        d3.zoomIdentity.translate(currentZoom.x, currentZoom.y).scale(newScale),
      );
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const currentZoom = d3.zoomTransform(svg.node() as any);

    const newScale = Math.max(currentZoom.k / 1.2, 0.1);
    setScale(newScale);

    svg
      .transition()
      .duration(250)
      .call(
        (d3.zoom() as any).transform,
        d3.zoomIdentity.translate(currentZoom.x, currentZoom.y).scale(newScale),
      );
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    setScale(1);

    svg
      .transition()
      .duration(750)
      .call((d3.zoom() as any).transform, d3.zoomIdentity);
  }, []);

  // Export the current view as SVG or PNG
  const exportVisualization = useCallback(
    (format: "svg" | "png") => {
      if (!svgRef.current) return;

      // Create a clone of the SVG to modify without affecting the display
      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;

      // Set dimensions and styling for the exported version
      svgClone.setAttribute("width", width.toString());
      svgClone.setAttribute("height", height.toString());
      svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgClone.setAttribute("background", "white");

      // Remove UI elements that shouldn't be part of the export
      const actionButtons = svgClone.querySelectorAll(".node-actions");
      actionButtons.forEach((button) => button.remove());

      // If exporting as SVG
      if (format === "svg") {
        const svgData = new XMLSerializer().serializeToString(svgClone);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "knowledge-graph.svg";
        link.click();
        URL.revokeObjectURL(url);
      }
      // If exporting as PNG
      else if (format === "png") {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // Fill white background
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, width, height);

          const svgData = new XMLSerializer().serializeToString(svgClone);
          const img = new Image();

          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            const pngUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = "knowledge-graph.png";
            link.click();
          };

          img.src =
            "data:image/svg+xml;base64," +
            btoa(unescape(encodeURIComponent(svgData)));
        }
      }
    },
    [width, height],
  );

  return {
    svgRef,
    scale,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    exportVisualization,
  };
};
