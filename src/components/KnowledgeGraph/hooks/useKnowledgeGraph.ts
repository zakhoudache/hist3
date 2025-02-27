import { useState, useCallback, useEffect } from "react";
import { Node, Edge } from "../types";
import { defaultNodes, defaultEdges } from "../constants";
import * as d3 from "d3";

export const useKnowledgeGraph = (
  initialNodes = defaultNodes,
  initialEdges = defaultEdges,
  onNodeSelect = (nodeId: string) => {},
  onNodeCreate = (node: Node) => {},
  onNodeUpdate = (node: Node) => {},
  onNodeDelete = (nodeId: string) => {},
  onEdgeCreate = (edge: Edge) => {},
  onEdgeUpdate = (edge: Edge) => {},
  onEdgeDelete = (edgeId: string) => {},
) => {
  // Apply force-directed layout algorithm
  useEffect(() => {
    if (initialNodes.length === 0) return;

    // Create a simulation with improved forces
    const simulation = d3
      .forceSimulation(initialNodes)
      .force(
        "link",
        d3
          .forceLink(initialEdges)
          .id((d: any) => d.id)
          .distance(150),
      )
      .force("charge", d3.forceManyBody().strength(-1000).distanceMax(500))
      .force("center", d3.forceCenter(400, 300))
      .force("collision", d3.forceCollide().radius(60))
      .force("x", d3.forceX().strength(0.05))
      .force("y", d3.forceY().strength(0.05))
      .alphaDecay(0.028) // Slower decay for more stable layout
      .alpha(0.3);

    // Run the simulation for a fixed number of ticks
    for (let i = 0; i < 300; i++) {
      simulation.tick();
    }

    // Stop the simulation
    simulation.stop();
  }, [initialNodes, initialEdges]);
  // State management
  const [nodeList, setNodeList] = useState<Node[]>(initialNodes);
  const [edgeList, setEdgeList] = useState<Edge[]>(initialEdges);

  // UI state
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [activeEdge, setActiveEdge] = useState<Edge | null>(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showEdgeDialog, setShowEdgeDialog] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Edge creation state
  const [edgeCreationState, setEdgeCreationState] = useState<{
    source: string | null;
    target: string | null;
  }>({ source: null, target: null });

  // Delete confirmation
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
  const [edgeToDelete, setEdgeToDelete] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [confirmDeleteType, setConfirmDeleteType] = useState<
    "node" | "edge" | null
  >(null);

  // Edge menu state
  const [midEdgePoint, setMidEdgePoint] = useState<{
    x: number;
    y: number;
    edge: Edge;
  } | null>(null);
  const [showMidEdgeMenu, setShowMidEdgeMenu] = useState(false);

  // Node form handlers
  const handleNodeFormSubmit = useCallback(() => {
    if (!activeNode) return;

    if (activeNode.isNew) {
      const newNode = { ...activeNode, isNew: false, isEditing: false };
      setNodeList((prev) => [...prev, newNode]);
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
  }, [activeNode, nodeList, onNodeCreate, onNodeUpdate]);

  // Edge form handlers
  const handleEdgeFormSubmit = useCallback(() => {
    if (!activeEdge) return;

    if (activeEdge.isNew) {
      const newEdge = { ...activeEdge, isNew: false, isEditing: false };
      setEdgeList((prev) => [...prev, newEdge]);
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
  }, [activeEdge, edgeList, onEdgeCreate, onEdgeUpdate]);

  // Delete confirmation
  const confirmDelete = useCallback(() => {
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
  }, [
    confirmDeleteType,
    nodeToDelete,
    edgeToDelete,
    nodeList,
    edgeList,
    onNodeDelete,
    onEdgeDelete,
  ]);

  // Create node from edge
  const createNodeFromEdge = useCallback(
    (relationship: string) => {
      if (!midEdgePoint) return;

      const sourceNode = nodeList.find(
        (n) => n.id === midEdgePoint.edge.source,
      );
      const targetNode = nodeList.find(
        (n) => n.id === midEdgePoint.edge.target,
      );

      if (!sourceNode || !targetNode) return;

      const newNodeId = `node-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: "event",
        label: `Event between ${sourceNode.label} and ${targetNode.label}`,
        description: "",
        x: midEdgePoint.x,
        y: midEdgePoint.y,
        fx: midEdgePoint.x, // Add fixed position for stability
        fy: midEdgePoint.y, // Add fixed position for stability
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

      const filteredEdges = edgeList.filter(
        (e) => e.id !== midEdgePoint.edge.id,
      );

      setNodeList([...nodeList, newNode]);
      setEdgeList([...filteredEdges, edge1, edge2]);
      setMidEdgePoint(null);
      setShowMidEdgeMenu(false);

      setActiveNode(newNode);
      setShowNodeDialog(true);
    },
    [midEdgePoint, nodeList, edgeList],
  );

  // Create new node from scratch
  const createNewNodeFromScratch = useCallback(
    (event: React.MouseEvent, svgRef: React.RefObject<SVGSVGElement>) => {
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
        fx: x, // Add fixed position for stability
        fy: y, // Add fixed position for stability
        isNew: true,
        isEditing: true,
      };

      setActiveNode(newNode);
      setShowNodeDialog(true);
    },
    [],
  );

  // Create new edge
  const createNewEdge = useCallback(
    (sourceId: string, targetId: string) => {
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
    },
    [edgeList],
  );

  // Cancel edge creation
  const handleCancelEdgeCreation = useCallback(() => {
    setEdgeCreationState({ source: null, target: null });
  }, []);

  return {
    // State
    nodeList,
    setNodeList,
    edgeList,
    setEdgeList,
    activeNode,
    setActiveNode,
    activeEdge,
    setActiveEdge,
    showNodeDialog,
    setShowNodeDialog,
    showEdgeDialog,
    setShowEdgeDialog,
    hoveredNode,
    setHoveredNode,
    hoveredEdge,
    setHoveredEdge,
    focusedNodeId,
    setFocusedNodeId,
    edgeCreationState,
    setEdgeCreationState,
    nodeToDelete,
    setNodeToDelete,
    edgeToDelete,
    setEdgeToDelete,
    showConfirmDelete,
    setShowConfirmDelete,
    confirmDeleteType,
    setConfirmDeleteType,
    midEdgePoint,
    setMidEdgePoint,
    showMidEdgeMenu,
    setShowMidEdgeMenu,

    // Actions
    handleNodeFormSubmit,
    handleEdgeFormSubmit,
    confirmDelete,
    createNodeFromEdge,
    createNewNodeFromScratch,
    createNewEdge,
    handleCancelEdgeCreation,
  };
};
