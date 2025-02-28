import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import {
  ZoomIn,
  ZoomOut,
  Move,
  Edit,
  Plus,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Node {
  id: string;
  type: "person" | "event" | "place" | "document" | "concept";
  label: string;
  x?: number;
  y?: number;
  description?: string;
  image?: string;
  date?: string;
  isNew?: boolean;
  isEditing?: boolean;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  relationship?: string;
  isNew?: boolean;
  isEditing?: boolean;
}

interface KnowledgeGraphProps {
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

const defaultNodes: Node[] = [
  {
    id: "1",
    type: "person",
    label: "Alexander Hamilton",
    x: 100,
    y: 100,
    description: "Founding Father",
  },
  {
    id: "2",
    type: "event",
    label: "Constitutional Convention",
    x: 300,
    y: 150,
    date: "1787-05-25",
  },
  {
    id: "3",
    type: "place",
    label: "Philadelphia",
    x: 200,
    y: 250,
    description: "City in Pennsylvania",
  },
  {
    id: "4",
    type: "person",
    label: "George Washington",
    x: 400,
    y: 200,
    description: "First US President",
  },
  {
    id: "5",
    type: "event",
    label: "Battle of Yorktown",
    x: 250,
    y: 350,
    date: "1781-09-28",
  },
  {
    id: "6",
    type: "document",
    label: "The Federalist Papers",
    x: 150,
    y: 180,
    description: "Collection of essays",
  },
  {
    id: "7",
    type: "concept",
    label: "Republicanism",
    x: 350,
    y: 300,
    description: "Political ideology",
  },
];

const defaultEdges: Edge[] = [
  { id: "e1", source: "1", target: "2", relationship: "Attended" },
  { id: "e2", source: "2", target: "3", relationship: "Took place in" },
  { id: "e3", source: "4", target: "2", relationship: "Presided over" },
  { id: "e4", source: "4", target: "5", relationship: "Commanded at" },
  { id: "e5", source: "1", target: "6", relationship: "Wrote" },
  { id: "e6", source: "6", target: "7", relationship: "Promoted" },
];

const getNodeShape = (type: string): string => {
  switch (type) {
    case "person":
      return "M -20,-20 L 20,-20 L 20,20 L -20,20 Z"; // Square
    case "event":
      return "M 0,-25 L 25,0 L 0,25 L -25,0 Z"; // Diamond
    case "place":
      return "M 0,-25 L 22,10 L -22,10 Z"; // Triangle
    case "document":
      return "M -18,-25 L 18,-25 L 25,-18 L 25,25 L -25,25 L -25,-18 Z"; // Document shape
    case "concept":
      return "M 0,-25 C 15,-25 25,-15 25,0 C 25,15 15,25 0,25 C -15,25 -25,15 -25,0 C -25,-15 -15,-25 0,-25"; // Circle/Oval
    default:
      return "M 0,-25 C 15,-25 25,-15 25,0 C 25,15 15,25 0,25 C -15,25 -25,15 -25,0 C -25,-15 -15,-25 0,-25"; // Default circle
  }
};

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  nodes = defaultNodes,
  edges = defaultEdges,
  onNodeSelect = () => {},
  onNodeCreate = () => {},
  onNodeUpdate = () => {},
  onNodeDelete = () => {},
  onEdgeCreate = () => {},
  onEdgeUpdate = () => {},
  onEdgeDelete = () => {},
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const width = 800;
  const height = 600;
  const [edgeCreationState, setEdgeCreationState] = useState<{
    source: string | null;
    target: string | null;
  }>({ source: null, target: null });
  const [nodeList, setNodeList] = useState<Node[]>(nodes);
  const [edgeList, setEdgeList] = useState<Edge[]>(edges);
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [activeEdge, setActiveEdge] = useState<Edge | null>(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showEdgeDialog, setShowEdgeDialog] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
  const [edgeToDelete, setEdgeToDelete] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [confirmDeleteType, setConfirmDeleteType] = useState<
    "node" | "edge" | null
  >(null);
  const [newNodePosition, setNewNodePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [midEdgePoint, setMidEdgePoint] = useState<{
    x: number;
    y: number;
    edge: Edge;
  } | null>(null);
  const [showMidEdgeMenu, setShowMidEdgeMenu] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    createVisualization();
  }, [nodeList, edgeList, hoveredNode, hoveredEdge, focusedNodeId, searchTerm]);

  const handleNodeFormSubmit = () => {
    if (!activeNode) return;

    if (activeNode.isNew) {
      const newNode = { ...activeNode, isNew: false, isEditing: false };
      setNodeList([...nodeList, newNode]);
      onNodeCreate(newNode);
    } else {
      const updatedNodes = nodeList.map((n) =>
        n.id === activeNode.id ? { ...activeNode, isEditing: false } : n,
      );
      setNodeList(updatedNodes);
      onNodeUpdate(activeNode);
    }
    setShowNodeDialog(false);
    setActiveNode(null);
  };

  const handleEdgeFormSubmit = () => {
    if (!activeEdge) return;

    if (activeEdge.isNew) {
      const newEdge = { ...activeEdge, isNew: false, isEditing: false };
      setEdgeList([...edgeList, newEdge]);
      onEdgeCreate(newEdge);
    } else {
      const updatedEdges = edgeList.map((e) =>
        e.id === activeEdge.id ? { ...activeEdge, isEditing: false } : e,
      );
      setEdgeList(updatedEdges);
      onEdgeUpdate(activeEdge);
    }
    setShowEdgeDialog(false);
    setActiveEdge(null);
    setEdgeCreationState({ source: null, target: null });
  };

  const confirmDelete = () => {
    if (confirmDeleteType === "node" && nodeToDelete) {
      const filteredNodes = nodeList.filter((n) => n.id !== nodeToDelete);
      const filteredEdges = edgeList.filter(
        (e) => e.source !== nodeToDelete && e.target !== nodeToDelete,
      );
      setNodeList(filteredNodes);
      setEdgeList(filteredEdges);
      onNodeDelete(nodeToDelete);
    } else if (confirmDeleteType === "edge" && edgeToDelete) {
      const filteredEdges = edgeList.filter((e) => e.id !== edgeToDelete);
      setEdgeList(filteredEdges);
      onEdgeDelete(edgeToDelete);
    }
    setShowConfirmDelete(false);
    setNodeToDelete(null);
    setEdgeToDelete(null);
    setConfirmDeleteType(null);
  };

  const createNodeFromEdge = (relationship: string) => {
    if (!midEdgePoint) return;

    const sourceNode = nodeList.find((n) => n.id === midEdgePoint.edge.source);
    const targetNode = nodeList.find((n) => n.id === midEdgePoint.edge.target);

    if (!sourceNode || !targetNode) return;

    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: "event",
      label: `Event between ${sourceNode.label} and ${targetNode.label}`,
      description: "",
      x: midEdgePoint.x,
      y: midEdgePoint.y,
      isNew: true,
      isEditing: true,
    };

    const edge1: Edge = {
      id: `edge-${Date.now()}`,
      source: midEdgePoint.edge.source,
      target: newNodeId,
      relationship: relationship || "Related to",
    };

    const edge2: Edge = {
      id: `edge-${Date.now() + 1}`,
      source: newNodeId,
      target: midEdgePoint.edge.target,
      relationship: relationship || "Related to",
    };

    const filteredEdges = edgeList.filter((e) => e.id !== midEdgePoint.edge.id);

    setNodeList([...nodeList, newNode]);
    setEdgeList([...filteredEdges, edge1, edge2]);
    setMidEdgePoint(null);
    setShowMidEdgeMenu(false);

    setActiveNode(newNode);
    setShowNodeDialog(true);
  };

  const createNewNodeFromScratch = (event: React.MouseEvent) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: "concept",
      label: "New Entity",
      description: "",
      x: x,
      y: y,
      isNew: true,
      isEditing: true,
    };

    setActiveNode(newNode);
    setShowNodeDialog(true);
  };

  const createNewEdge = (sourceId: string, targetId: string) => {
    const edgeExists = edgeList.some(
      (e) =>
        (e.source === sourceId && e.target === targetId) ||
        (e.source === targetId && e.target === sourceId),
    );

    if (edgeExists) {
      setEdgeCreationState({ source: null, target: null });
      return;
    }

    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      source: sourceId,
      target: targetId,
      relationship: "",
      isNew: true,
      isEditing: true,
    };

    setActiveEdge(newEdge);
    setShowEdgeDialog(true);
  };

  const updateHighlighting = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    if (focusedNodeId) {
      const connectedEdges = edgeList.filter(
        (e) => e.source === focusedNodeId || e.target === focusedNodeId,
      );

      const connectedNodeIds = new Set<string>();
      connectedEdges.forEach((e) => {
        connectedNodeIds.add(e.source);
        connectedNodeIds.add(e.target);
      });

      svg.selectAll(".node").each(function (d: any) {
        const node = d3.select(this);
        if (d.id === focusedNodeId || connectedNodeIds.has(d.id)) {
          node.classed("highlighted", true);
          node.classed("dimmed", false);
        } else {
          node.classed("highlighted", false);
          node.classed("dimmed", true);
        }
      });

      svg.selectAll(".link").each(function (d: any) {
        const edge = d3.select(this);
        if (connectedEdges.some((e) => e.id === d.id)) {
          edge.classed("highlighted", true);
          edge.classed("dimmed", false);
        } else {
          edge.classed("highlighted", false);
          edge.classed("dimmed", true);
        }
      });
    } else {
      svg
        .selectAll(".node")
        .classed("highlighted", false)
        .classed("dimmed", false);
      svg
        .selectAll(".link")
        .classed("highlighted", false)
        .classed("dimmed", false);
    }
  }, [focusedNodeId, edgeList]);

  useEffect(() => {
    updateHighlighting();
  }, [focusedNodeId, updateHighlighting]);

  const updateSearchHighlighting = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    const lowerSearchTerm = searchTerm.toLowerCase();

    svg.selectAll(".node").each(function (d: any) {
      const node = d3.select(this);
      if (lowerSearchTerm && d.label.toLowerCase().includes(lowerSearchTerm)) {
        node.classed("search-highlighted", true);
      } else {
        node.classed("search-highlighted", false);
      }
    });
  }, [searchTerm]);

  useEffect(() => {
    updateSearchHighlighting();
  }, [searchTerm, updateSearchHighlighting]);

  const createVisualization = () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

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

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    svg.on("dblclick", createNewNodeFromScratch);

    svg.on("click", () => {
      setFocusedNodeId(null);
      setEdgeCreationState({ source: null, target: null }); // Ensure edge creation is cancelled on background click
    });

    svg
      .append("defs")
      .selectAll("marker")
      .data(["end"])
      .join("marker")
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

    const defs = svg.append("defs");
    defs
      .append("filter")
      .attr("id", "shadow")
      .append("feDropShadow")
      .attr("dx", "0")
      .attr("dy", "1")
      .attr("stdDeviation", "2");

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
        if (popoverRef.current) {
          const path = event.target as SVGPathElement;
          const length = path.getTotalLength();
          const point = path.getPointAtLength(length / 2);
          popoverRef.current.style.display = "block";
          popoverRef.current.innerHTML = `
            <div class="p-2 bg-white border rounded shadow">
              <p>Relationship: ${d.relationship || "Unknown"}</p>
              <p>From: ${nodeList.find((n) => n.id === d.source)?.label || "Unknown"}</p>
              <p>To: ${nodeList.find((n) => n.id === d.target)?.label || "Unknown"}</p>
            </div>
          `;
          const svgRect = svgRef.current?.getBoundingClientRect();
          if (svgRect) {
            popoverRef.current.style.left = `${svgRect.left + point.x}px`;
            popoverRef.current.style.top = `${svgRect.top + point.y - 10}px`;
          }
        }
      })
      .on("mouseleave", (event, d) => {
        setHoveredEdge(null);
        if (popoverRef.current) {
          popoverRef.current.style.display = "none";
        }
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
        if (popoverRef.current) {
          popoverRef.current.style.display = "block";
          popoverRef.current.innerHTML = `
            <div class="p-2 bg-white border rounded shadow">
              <h3>${d.label}</h3>
              <p>Type: ${d.type}</p>
              ${d.description ? `<p>${d.description}</p>` : ""}
            </div>
          `;
          const bbox = (event.target as SVGElement).getBoundingClientRect();
          popoverRef.current.style.left = `${bbox.left + bbox.width / 2}px`;
          popoverRef.current.style.top = `${bbox.top - 10}px`;
        }
      })
      .on("mouseleave", (event, d) => {
        setHoveredNode(null);
        if (popoverRef.current) {
          popoverRef.current.style.display = "none";
        }
      })
      .on("click", (event, d) => {
        event.stopPropagation();

        if (edgeCreationState.source) {
          if (d.id !== edgeCreationState.source) {
            createNewEdge(edgeCreationState.source, d.id);
          }
          setEdgeCreationState({ source: null, target: null }); //reset
          return;
        }

        onNodeSelect(d.id);
        setActiveNode(d);
        setShowNodeDialog(true);
      });

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

    nodeGroups
      .append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("y", 35)
      .attr("font-size", "12px")
      .attr("pointer-events", "none")
      .attr("font-weight", (d) => (hoveredNode === d.id ? "bold" : "normal"));

    const actionButtons = nodeGroups
      .append("g")
      .attr("class", "node-actions")
      .attr("opacity", (d) => (hoveredNode === d.id ? 1 : 0))
      .attr("transform", "translate(0, -35)");

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

    actionButtons
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 10)
      .attr("fill", "#22c55e")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
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

    actionButtons
      .append("circle")
      .attr("cx", 40)
      .attr("cy", 0)
      .attr("r", 10)
      .attr("fill", "#f59e0b")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setFocusedNodeId(d.id);
      });

    actionButtons
      .append("text")
      .attr("x", 40)
      .attr("y", 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .text("🔍");

    if (edgeCreationState.source) {
      const sourceNode = nodeList.find(
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

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      g.selectAll(".edge-hitbox").attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      nodeGroups.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    if (showMidEdgeMenu && midEdgePoint) {
      const menu = g
        .append("g")
        .attr("class", "mid-edge-menu")
        .attr("transform", `translate(${midEdgePoint.x}, ${midEdgePoint.y})`);

      menu
        .append("circle")
        .attr("r", 40)
        .attr("fill", "white")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1);

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
        .text("Cancel");
    }

    const nodeTypes = [
      { type: "person", color: "#3b82f6", label: "Person" },
      { type: "event", color: "#ef4444", label: "Event" },
      { type: "place", color: "#22c55e", label: "Place" },
      { type: "document", color: "#8b5cf6", label: "Document" },
      { type: "concept", color: "#f59e0b", label: "Concept" },
    ];

    const legend = g
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 100}, 20)`);

    const legendScale = 0.5;
    nodeTypes.forEach((type, index) => {
      const legendItem = legend
        .append("g")
        .attr("transform", `translate(0, ${index * 25})`);

      legendItem
        .append("path")
        .attr("d", getNodeShape(type.type))
        .attr("transform", `scale(${legendScale})`)
        .attr("fill", "none")
        .attr("stroke", type.color)
        .attr("stroke-width", 2);

      legendItem
        .append("text")
        .attr("x", 20)
        .attr("y", 5)
        .text(type.label)
        .attr("font-size", "12px");
    });

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
  };

  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.2, 4);
    setScale(newScale);

    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg
        .transition()
        .duration(300)
        .call(d3.zoom().transform as any, d3.zoomIdentity.scale(newScale));
    }
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.2, 0.1);
    setScale(newScale);

    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg
        .transition()
        .duration(300)
        .call(d3.zoom().transform as any, d3.zoomIdentity.scale(newScale));
    }
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });

    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg
        .transition()
        .duration(300)
        .call(d3.zoom().transform as any, d3.zoomIdentity);
    }
  };

  const handleCancelEdgeCreation = () => {
    setEdgeCreationState({ source: null, target: null });
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-2 bg-gray-100 border-b">
        <Input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="flex justify-between p-2 bg-gray-100 border-b">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  className="h-8 w-8"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  className="h-8 w-8"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleResetZoom}
                  className="h-8 w-8"
                >
                  <Move className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset View</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={createNewNodeFromScratch}
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add New Node</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {edgeCreationState.source && (
        <div className="absolute top-4 right-4 bg-green-100 p-2 rounded-md shadow-md">
          <p className="text-sm text-green-800">
            Select a target node to create connection
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelEdgeCreation}
            className="mt-2 w-full"
          >
            Cancel
          </Button>
        </div>
      )}
      <div className="relative flex-grow overflow-hidden">
        <svg ref={svgRef} width="100%" height="100%" className="bg-white">
          <></>
        </svg>
        <div
          ref={popoverRef}
          className="absolute pointer-events-none"
          style={{ display: "none" }}
        />
      </div>
      <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeNode?.isNew ? "Add New Node" : "Edit Node"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="node-type" className="text-right">
                Type
              </Label>
              <Select
                value={activeNode?.type}
                onValueChange={(value) =>
                  setActiveNode(
                    activeNode ? { ...activeNode, type: value as any } : null,
                  )
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="place">Place</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="concept">Concept</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="node-label" className="text-right">
                Label
              </Label>
              <Input
                id="node-label"
                value={activeNode?.label || ""}
                onChange={(e) =>
                  setActiveNode(
                    activeNode
                      ? { ...activeNode, label: e.target.value }
                      : null,
                  )
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="node-description" className="text-right">
                Description
              </Label>
              <Input
                id="node-description"
                value={activeNode?.description || ""}
                onChange={(e) =>
                  setActiveNode(
                    activeNode
                      ? { ...activeNode, description: e.target.value }
                      : null,
                  )
                }
                className="col-span-3"
              />
            </div>

            {activeNode?.type === "event" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="node-date" className="text-right">
                  Date
                </Label>
                <Input
                  id="node-date"
                  type="date"
                  value={activeNode?.date || ""}
                  onChange={(e) =>
                    setActiveNode(
                      activeNode
                        ? { ...activeNode, date: e.target.value }
                        : null,
                    )
                  }
                  className="col-span-3"
                />
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="node-image" className="text-right">
                Image URL
              </Label>
              <Input
                id="node-image"
                value={activeNode?.image || ""}
                onChange={(e) =>
                  setActiveNode(
                    activeNode
                      ? { ...activeNode, image: e.target.value }
                      : null,
                  )
                }
                className="col-span-3"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" onClick={handleNodeFormSubmit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showEdgeDialog} onOpenChange={setShowEdgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeEdge?.isNew ? "Add New Connection" : "Edit Connection"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edge-relationship" className="text-right">
                Relationship
              </Label>
              <Input
                id="edge-relationship"
                value={activeEdge?.relationship || ""}
                onChange={(e) =>
                  setActiveEdge(
                    activeEdge
                      ? { ...activeEdge, relationship: e.target.value }
                      : null,
                  )
                }
                className="col-span-3"
                placeholder="e.g. Created, Visited, Wrote..."
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">From</Label>
              <div className="col-span-3 font-medium">
                {nodeList.find((n) => n.id === activeEdge?.source)?.label ||
                  "Unknown node"}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">To</Label>
              <div className="col-span-3 font-medium">
                {nodeList.find((n) => n.id === activeEdge?.target)?.label ||
                  "Unknown node"}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" onClick={handleEdgeFormSubmit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDeleteType === "node"
                ? "Delete Node"
                : "Delete Connection"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>
              {confirmDeleteType === "node"
                ? "Are you sure you want to delete this node? This will also remove all connections to and from this node."
                : "Are you sure you want to delete this connection?"}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeGraph;
