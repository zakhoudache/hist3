import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import GraphControls from "./components/GraphControls";
import EdgeCreationIndicator from "./components/EdgeCreationIndicator";
import NodeDialog from "./components/NodeDialog";
import EdgeDialog from "./components/EdgeDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import MidEdgeMenu from "./components/MidEdgeMenu";
import { Node, Edge } from "./types";
import { getNodeShape } from "./utils/nodeShapes";
import { defaultNodes, defaultEdges } from "./constants";

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
  const [scale, setScale] = useState(1);
  const width = 800;
  const height = 600;

  // State management
  const [nodeList, setNodeList] = useState<Node[]>(nodes);
  const [edgeList, setEdgeList] = useState<Edge[]>(edges);

  // UI state
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [activeEdge, setActiveEdge] = useState<Edge | null>(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showEdgeDialog, setShowEdgeDialog] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

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

  // ... rest of the component implementation ...

  return (
    <div className="knowledge-graph-container">
      <GraphControls
        onZoomIn={() => setScale(scale * 1.2)}
        onZoomOut={() => setScale(Math.max(0.1, scale / 1.2))}
        onResetZoom={() => setScale(1)}
        onAddNode={() => {
          const newNode: Node = {
            id: `node-${Date.now()}`,
            type: "concept",
            label: "New Node",
            x: width / 2,
            y: height / 2,
            isNew: true,
          };
          setNodeList([...nodeList, newNode]);
        }}
      />

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="knowledge-graph-svg"
      />

      {showMidEdgeMenu && midEdgePoint && (
        <MidEdgeMenu
          x={midEdgePoint.x}
          y={midEdgePoint.y}
          onCreateNode={createNodeFromEdge}
          onClose={() => {
            setShowMidEdgeMenu(false);
            setMidEdgePoint(null);
          }}
        />
      )}
    </div>
  );
};

export default KnowledgeGraph;
