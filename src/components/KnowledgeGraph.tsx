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
  Save,
  Download,
  Upload,
  RefreshCw,
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
import { createClient } from "@supabase/supabase-js";
import { Textarea } from "./ui/textarea";
import { Loader2 } from "lucide-react";
import { saveAs } from "file-saver";

// Define your Supabase URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

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
  graphId?: string;
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
    description: "Founding Father",
  },
  {
    id: "2",
    type: "event",
    label: "Constitutional Convention",
    date: "1787-05-25",
  },
];

const defaultEdges: Edge[] = [
  { id: "e1", source: "1", target: "2", relationship: "Attended" },
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
  graphId = "default",
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
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<Node, Edge> | null>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
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
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading graph data...");
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "svg" | "png">(
    "json",
  );
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [graphName, setGraphName] = useState(graphId);
  const [availableGraphs, setAvailableGraphs] = useState<string[]>([]);
  const [showLoadGraphDialog, setShowLoadGraphDialog] = useState(false);
  const [selectedGraphToLoad, setSelectedGraphToLoad] = useState("");

  // Load data from Supabase
  useEffect(() => {
    loadGraphData(graphId);
    fetchAvailableGraphs();
  }, [graphId]);

  const fetchAvailableGraphs = async () => {
    try {
      const { data, error } = await supabase
        .from("graphs")
        .select("id")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setAvailableGraphs(data.map((graph) => graph.id));
      }
    } catch (error) {
      console.error("Error fetching available graphs:", error);
    }
  };

  const loadGraphData = async (id: string) => {
    setLoading(true);
    setLoadingMessage("Loading graph data...");

    try {
      // Fetch graph nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from("nodes")
        .select("*")
        .eq("graph_id", id);

      if (nodesError) throw nodesError;

      // Fetch graph edges
      const { data: edgesData, error: edgesError } = await supabase
        .from("edges")
        .select("*")
        .eq("graph_id", id);

      if (edgesError) throw edgesError;

      if (nodesData && edgesData) {
        // Transform data to match our interface
        const transformedNodes: Node[] = nodesData.map((node) => ({
          id: node.id,
          type: node.type,
          label: node.label,
          x: node.x,
          y: node.y,
          description: node.description,
          image: node.image,
          date: node.date,
        }));

        const transformedEdges: Edge[] = edgesData.map((edge) => ({
          id: edge.id,
          source: edge.source_id,
          target: edge.target_id,
          relationship: edge.relationship,
        }));

        setNodeList(
          transformedNodes.length > 0 ? transformedNodes : defaultNodes,
        );
        setEdgeList(
          transformedEdges.length > 0 ? transformedEdges : defaultEdges,
        );
        setGraphName(id);
      } else {
        // If no data found, use defaults
        setNodeList(defaultNodes);
        setEdgeList(defaultEdges);
      }
    } catch (error) {
      console.error("Error loading graph data:", error);
      // Fall back to defaults
      setNodeList(defaultNodes);
      setEdgeList(defaultEdges);
    } finally {
      setLoading(false);
    }
  };

  const saveGraphData = async () => {
    setLoading(true);
    setLoadingMessage("Saving graph data...");

    try {
      // First save graph metadata
      const { error: graphError } = await supabase.from("graphs").upsert([
        {
          id: graphName,
          name: graphName,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (graphError) throw graphError;

      // Save nodes
      for (const node of nodeList) {
        const { error } = await supabase.from("nodes").upsert([
          {
            id: node.id,
            graph_id: graphName,
            type: node.type,
            label: node.label,
            x: node.x,
            y: node.y,
            description: node.description,
            image: node.image,
            date: node.date,
          },
        ]);

        if (error) throw error;
      }

      // Save edges
      for (const edge of edgeList) {
        const { error } = await supabase.from("edges").upsert([
          {
            id: edge.id,
            graph_id: graphName,
            source_id: edge.source,
            target_id: edge.target,
            relationship: edge.relationship,
          },
        ]);

        if (error) throw error;
      }

      alert("Graph saved successfully!");
      fetchAvailableGraphs();
    } catch (error) {
      console.error("Error saving graph data:", error);
      alert("Failed to save graph. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Recreate visualization when nodes or edges change
  useEffect(() => {
    if (!loading) {
      createVisualization();
    }
  }, [nodeList, edgeList, hoveredNode, hoveredEdge, loading]);

  const handleNodeFormSubmit = async () => {
    if (!activeNode) return;

    try {
      if (activeNode.isNew) {
        const newNode = { ...activeNode, isNew: false, isEditing: false };
        setNodeList([...nodeList, newNode]);
        onNodeCreate(newNode);

        // Save to Supabase
        const { error } = await supabase.from("nodes").upsert([
          {
            id: newNode.id,
            graph_id: graphName,
            type: newNode.type,
            label: newNode.label,
            x: newNode.x,
            y: newNode.y,
            description: newNode.description,
            image: newNode.image,
            date: newNode.date,
          },
        ]);

        if (error) throw error;
      } else {
        const updatedNodes = nodeList.map((n) =>
          n.id === activeNode.id ? { ...activeNode, isEditing: false } : n,
        );
        setNodeList(updatedNodes);
        onNodeUpdate(activeNode);

        // Update in Supabase
        const { error } = await supabase
          .from("nodes")
          .update({
            type: activeNode.type,
            label: activeNode.label,
            x: activeNode.x,
            y: activeNode.y,
            description: activeNode.description,
            image: activeNode.image,
            date: activeNode.date,
          })
          .eq("id", activeNode.id)
          .eq("graph_id", graphName);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving node:", error);
    }

    setShowNodeDialog(false);
    setActiveNode(null);
  };

  const handleEdgeFormSubmit = async () => {
    if (!activeEdge) return;

    try {
      if (activeEdge.isNew) {
        const newEdge = { ...activeEdge, isNew: false, isEditing: false };
        setEdgeList([...edgeList, newEdge]);
        onEdgeCreate(newEdge);

        // Save to Supabase
        const { error } = await supabase.from("edges").upsert([
          {
            id: newEdge.id,
            graph_id: graphName,
            source_id: newEdge.source,
            target_id: newEdge.target,
            relationship: newEdge.relationship,
          },
        ]);

        if (error) throw error;
      } else {
        const updatedEdges = edgeList.map((e) =>
          e.id === activeEdge.id ? { ...activeEdge, isEditing: false } : e,
        );
        setEdgeList(updatedEdges);
        onEdgeUpdate(activeEdge);

        // Update in Supabase
        const { error } = await supabase
          .from("edges")
          .update({
            relationship: activeEdge.relationship,
          })
          .eq("id", activeEdge.id)
          .eq("graph_id", graphName);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving edge:", error);
    }

    setShowEdgeDialog(false);
    setActiveEdge(null);
    setEdgeCreationState({ source: null, target: null });
  };

  const confirmDelete = async () => {
    try {
      if (confirmDeleteType === "node" && nodeToDelete) {
        const filteredNodes = nodeList.filter((n) => n.id !== nodeToDelete);
        const filteredEdges = edgeList.filter(
          (e) => e.source !== nodeToDelete && e.target !== nodeToDelete,
        );
        setNodeList(filteredNodes);
        setEdgeList(filteredEdges);
        onNodeDelete(nodeToDelete);

        // Delete from Supabase
        const { error: nodeError } = await supabase
          .from("nodes")
          .delete()
          .eq("id", nodeToDelete)
          .eq("graph_id", graphName);

        if (nodeError) throw nodeError;

        // Delete related edges
        const { error: edgeError } = await supabase
          .from("edges")
          .delete()
          .or(`source_id.eq.${nodeToDelete},target_id.eq.${nodeToDelete}`)
          .eq("graph_id", graphName);

        if (edgeError) throw edgeError;
      } else if (confirmDeleteType === "edge" && edgeToDelete) {
        const filteredEdges = edgeList.filter((e) => e.id !== edgeToDelete);
        setEdgeList(filteredEdges);
        onEdgeDelete(edgeToDelete);

        // Delete from Supabase
        const { error } = await supabase
          .from("edges")
          .delete()
          .eq("id", edgeToDelete)
          .eq("graph_id", graphName);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error deleting:", error);
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

    // Generate new node position between source and target
    const newNodeId = `node-${Date.now()}`;

    // Create a new node
    const newNode: Node = {
      id: newNodeId,
      type: "event", // Default type
      label: `Event between ${sourceNode.label} and ${targetNode.label}`,
      description: "",
      x: midEdgePoint.x,
      y: midEdgePoint.y,
      isNew: true,
      isEditing: true,
    };

    // Create two new edges
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

    // Delete the original edge
    const filteredEdges = edgeList.filter((e) => e.id !== midEdgePoint.edge.id);

    // Update the state
    setNodeList([...nodeList, newNode]);
    setEdgeList([...filteredEdges, edge1, edge2]);
    setMidEdgePoint(null);
    setShowMidEdgeMenu(false);

    // Set active node for editing
    setActiveNode(newNode);
    setShowNodeDialog(true);
  };

  const createNewNodeFromScratch = (event: React.MouseEvent) => {
    if (!svgRef.current) return;

    // Get mouse position relative to SVG
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const transform = d3.zoomTransform(svgRef.current);

    // Adjust for zoom and pan
    const x = (event.clientX - rect.left - transform.x) / transform.k;
    const y = (event.clientY - rect.top - transform.y) / transform.k;

    // Create new node
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
    // Check if edge already exists
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

  const createVisualization = () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Make nodes have initial positions if they don't have them
    nodeList.forEach((node, i) => {
      if (node.x === undefined || node.y === undefined) {
        // Position in a circle around the center
        const angle = (i / nodeList.length) * 2 * Math.PI;
        const radius = 150;
        node.x = width / 2 + radius * Math.cos(angle);
        node.y = height / 2 + radius * Math.sin(angle);
      }
    });

    // Create a simulation with many-body force and center force
    const simulation = d3
      .forceSimulation(nodeList as any)
      .force(
        "link",
        d3
          .forceLink(edgeList as any)
          .id((d: any) => d.id)
          .distance(150),
      )
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    simulationRef.current = simulation as any;

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setScale(event.transform.k);
      });

    zoomRef.current = zoom;

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
        return `<div style="color:${iconColor}; font-size:14px; font-weight:bold; text-align:center;">${d.type.charAt(0).toUpperCase()}</div>`;
      });

    // Add node labels
    nodeGroups
      .append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("y", 35)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("pointer-events", "none")
      .each(function (d) {
        const text = d3.select(this);
        const words = d.label.split(/\s+/).reverse();
        const lineHeight = 1.1;
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy") || "0");

        let tspan = text
          .text(null)
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", dy + "em");

        let line = [];
        let lineNumber = 0;
        let word = words.pop();

        while (word) {
          line.push(word);
          tspan.text(line.join(" "));

          if (line.join(" ").length > 20) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];

            tspan = text
              .append("tspan")
              .attr("x", 0)
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .text(word);
          }

          word = words.pop();
        }
      });

    // Node info tooltip for hover
    nodeGroups
      .append("title")
      .text((d) => `${d.label}\nType: ${d.type}\n${d.description || ""}`);

    // Update edge positions on simulation tick
    simulation.on("tick", () => {
      // Update node positions
      nodeGroups.attr("transform", (d) => {
        if (d.x !== undefined && d.y !== undefined) {
          return `translate(${d.x},${d.y})`;
        }
        return "";
      });

      // Update edge paths with curved paths
      link.attr("d", (d) => {
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
          // Calculate control points for a curved edge
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dr = Math.sqrt(dx * dx + dy * dy);

          // Straight line if it's the only edge between these nodes
          const isOnlyEdge =
            edgeList.filter(
              (e) =>
                (e.source === d.source && e.target === d.target) ||
                (e.source === d.target && e.target === d.source),
            ).length === 1;

          if (isOnlyEdge) {
            return `M${source.x},${source.y}L${target.x},${target.y}`;
          } else {
            // Use curved path if multiple edges exist between the same nodes
            return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
          }
        }
        return "";
      });

      // Update edge hitboxes
      g.selectAll(".edge-hitbox").attr("d", function () {
        const correspondingPath = link.filter(
          (_, i) => i === this.__data__?.index,
        );
        return correspondingPath.attr("d");
      });
    });

    // Drag functions
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
      // Update the node's position in state
      setNodeList(
        nodeList.map((node) =>
          node.id === d.id ? { ...node, x: d.x, y: d.y } : node,
        ),
      );
      d.fx = null;
      d.fy = null;
    }
  };

  const exportGraph = async () => {
    setIsExporting(true);

    try {
      switch (exportFormat) {
        case "json":
          // Export as JSON
          const graphData = {
            nodes: nodeList,
            edges: edgeList,
          };

          const blob = new Blob([JSON.stringify(graphData, null, 2)], {
            type: "application/json",
          });

          saveAs(blob, `${graphName || "knowledge-graph"}.json`);
          break;

        case "svg":
          // Export as SVG
          if (!svgRef.current) return;

          const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
          const svgData = new XMLSerializer().serializeToString(svgClone);
          const svgBlob = new Blob([svgData], { type: "image/svg+xml" });

          saveAs(svgBlob, `${graphName || "knowledge-graph"}.svg`);
          break;

        case "png":
          // Export as PNG
          if (!svgRef.current) return;

          const svgElement = svgRef.current;
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const svgData2 = new XMLSerializer().serializeToString(svgElement);
          const DOMURL = window.URL || window.webkitURL || window;
          const img = new Image();
          const svgBlob2 = new Blob([svgData2], { type: "image/svg+xml" });
          const url = DOMURL.createObjectURL(svgBlob2);

          canvas.width = svgElement.width.baseVal.value;
          canvas.height = svgElement.height.baseVal.value;

          img.onload = function () {
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              DOMURL.revokeObjectURL(url);

              canvas.toBlob(function (blob) {
                if (blob) {
                  saveAs(blob, `${graphName || "knowledge-graph"}.png`);
                }
                setIsExporting(false);
              });
            }
          };

          img.src = url;
          return; // Early return to avoid setting isExporting to false before image loads
      }
    } catch (error) {
      console.error("Error exporting graph:", error);
      alert("Failed to export graph. See console for details.");
    }

    setIsExporting(false);
    setShowExportDialog(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === "string") {
          const data = JSON.parse(result);

          if (
            data.nodes &&
            Array.isArray(data.nodes) &&
            data.edges &&
            Array.isArray(data.edges)
          ) {
            setNodeList(data.nodes);
            setEdgeList(data.edges);

            // Stop simulation and restart with new data
            if (simulationRef.current) {
              simulationRef.current.stop();
              simulationRef.current.nodes(data.nodes);
              simulationRef.current.force(
                "link",
                d3
                  .forceLink(data.edges)
                  .id((d: any) => d.id)
                  .distance(150),
              );
              simulationRef.current.alpha(1).restart();
            }

            alert("Graph imported successfully!");
          } else {
            alert("Invalid graph data format!");
          }
        }
      } catch (error) {
        console.error("Error importing graph:", error);
        alert("Failed to import graph. See console for details.");
      }
    };

    reader.readAsText(file);
  };

  const resetView = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(
          zoomRef.current.transform as any,
          d3.zoomIdentity.translate(width / 2, height / 2).scale(1),
        );
    }
  };

  const zoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(zoomRef.current.scaleBy as any, 1.2);
    }
  };

  const zoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(zoomRef.current.scaleBy as any, 0.8);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 h-full w-full relative">
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-700 font-medium">{loadingMessage}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center w-full mb-4">
        <div className="text-xl font-bold">Knowledge Graph: {graphName}</div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowLoadGraphDialog(true)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Load Graph</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={saveGraphData}>
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save Graph</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowExportDialog(true)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Graph</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  <Upload className="h-4 w-4" />
                  <input
                    id="file-upload"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Import Graph</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="relative w-full h-[600px] border rounded-md overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full bg-slate-50"
          width={width}
          height={height}
        ></svg>

        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" onClick={zoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom In</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" onClick={zoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom Out</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" onClick={resetView}>
                  <Move className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={edgeCreationState.source ? "default" : "secondary"}
                  size="icon"
                  onClick={() => {
                    if (edgeCreationState.source) {
                      setEdgeCreationState({ source: null, target: null });
                    } else {
                      // Prepare to select source node
                      alert("Select a source node to create an edge");
                      setEdgeCreationState({ source: null, target: null });
                    }
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {edgeCreationState.source
                    ? "Cancel Edge Creation"
                    : "Create Edge"}
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={createNewNodeFromScratch}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Node</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {showMidEdgeMenu && midEdgePoint && (
        <div
          className="absolute bg-white border rounded-md shadow-md p-2 flex flex-col z-10"
          style={{
            left: midEdgePoint.x + position.x,
            top: midEdgePoint.y + position.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => createNodeFromEdge("Causes")}
          >
            Add Causal Event
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => createNodeFromEdge("Connects")}
          >
            Add Connection Point
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => createNodeFromEdge("Influences")}
          >
            Add Influencing Factor
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-red-600"
            onClick={() => {
              setEdgeToDelete(midEdgePoint.edge.id);
              setConfirmDeleteType("edge");
              setShowConfirmDelete(true);
              setShowMidEdgeMenu(false);
              setMidEdgePoint(null);
            }}
          >
            Delete Edge
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => {
              setShowMidEdgeMenu(false);
              setMidEdgePoint(null);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Node Form Dialog */}
      <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeNode?.isNew ? "Create New Node" : "Edit Node"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="node-type">Type</Label>
              <Select
                value={activeNode?.type || "concept"}
                onValueChange={(value) =>
                  activeNode &&
                  setActiveNode({ ...activeNode, type: value as any })
                }
              >
                <SelectTrigger>
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
            <div className="grid gap-2">
              <Label htmlFor="node-label">Label</Label>
              <Input
                id="node-label"
                value={activeNode?.label || ""}
                onChange={(e) =>
                  activeNode &&
                  setActiveNode({ ...activeNode, label: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="node-description">Description</Label>
              <Textarea
                id="node-description"
                value={activeNode?.description || ""}
                onChange={(e) =>
                  activeNode &&
                  setActiveNode({
                    ...activeNode,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="node-image">Image URL (optional)</Label>
              <Input
                id="node-image"
                value={activeNode?.image || ""}
                onChange={(e) =>
                  activeNode &&
                  setActiveNode({ ...activeNode, image: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            {activeNode?.type === "event" && (
              <div className="grid gap-2">
                <Label htmlFor="node-date">Date (optional)</Label>
                <Input
                  id="node-date"
                  type="date"
                  value={activeNode?.date || ""}
                  onChange={(e) =>
                    activeNode &&
                    setActiveNode({ ...activeNode, date: e.target.value })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              type="button"
              onClick={() => {
                if (activeNode?.isNew) {
                  setShowNodeDialog(false);
                  setActiveNode(null);
                } else if (activeNode) {
                  setNodeToDelete(activeNode.id);
                  setConfirmDeleteType("node");
                  setShowConfirmDelete(true);
                  setShowNodeDialog(false);
                }
              }}
            >
              {activeNode?.isNew ? "Cancel" : "Delete"}
            </Button>
            <Button type="button" onClick={handleNodeFormSubmit}>
              {activeNode?.isNew ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edge Form Dialog */}
      <Dialog open={showEdgeDialog} onOpenChange={setShowEdgeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeEdge?.isNew ? "Create New Edge" : "Edit Edge"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edge-relationship">Relationship</Label>
              <Input
                id="edge-relationship"
                value={activeEdge?.relationship || ""}
                onChange={(e) =>
                  activeEdge &&
                  setActiveEdge({
                    ...activeEdge,
                    relationship: e.target.value,
                  })
                }
                placeholder="e.g., Wrote, Attended, Created..."
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              type="button"
              onClick={() => {
                if (activeEdge?.isNew) {
                  setShowEdgeDialog(false);
                  setActiveEdge(null);
                  setEdgeCreationState({ source: null, target: null });
                } else if (activeEdge) {
                  setEdgeToDelete(activeEdge.id);
                  setConfirmDeleteType("edge");
                  setShowConfirmDelete(true);
                  setShowEdgeDialog(false);
                }
              }}
            >
              {activeEdge?.isNew ? "Cancel" : "Delete"}
            </Button>
            <Button type="button" onClick={handleEdgeFormSubmit}>
              {activeEdge?.isNew ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this {confirmDeleteType}?</p>
            {confirmDeleteType === "node" && (
              <p className="text-red-500 mt-2">
                This will also delete all connected edges!
              </p>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setShowConfirmDelete(false);
                setNodeToDelete(null);
                setEdgeToDelete(null);
                setConfirmDeleteType(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" type="button" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Graph</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="export-format">Format</Label>
              <Select
                value={exportFormat}
                onValueChange={(value) => setExportFormat(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="graph-name">Graph Name</Label>
              <Input
                id="graph-name"
                value={graphName}
                onChange={(e) => setGraphName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={exportGraph} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Graph Dialog */}
      <Dialog open={showLoadGraphDialog} onOpenChange={setShowLoadGraphDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Load Graph</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="graph-select">Select a Graph</Label>
              <Select
                value={selectedGraphToLoad}
                onValueChange={setSelectedGraphToLoad}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a graph" />
                </SelectTrigger>
                <SelectContent>
                  {availableGraphs.map((graph) => (
                    <SelectItem key={graph} value={graph}>
                      {graph}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowLoadGraphDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (selectedGraphToLoad) {
                  loadGraphData(selectedGraphToLoad);
                  setShowLoadGraphDialog(false);
                }
              }}
              disabled={!selectedGraphToLoad}
            >
              Load
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeGraph;
