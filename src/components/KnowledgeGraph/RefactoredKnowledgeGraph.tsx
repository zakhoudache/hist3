import React from "react";
import { useKnowledgeGraph } from "./hooks/useKnowledgeGraph";
import { useZoomControls } from "./hooks/useZoomControls";
import GraphRenderer from "./components/GraphRenderer";
import GraphControls from "./components/GraphControls";
import NodeDialog from "./components/NodeDialog";
import EdgeDialog from "./components/EdgeDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import EdgeCreationIndicator from "./components/EdgeCreationIndicator";
import { Node, Edge } from "./types";

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
  nodes,
  edges,
  onNodeSelect = () => {},
  onNodeCreate = () => {},
  onNodeUpdate = () => {},
  onNodeDelete = () => {},
  onEdgeCreate = () => {},
  onEdgeUpdate = () => {},
  onEdgeDelete = () => {},
}) => {
  // Canvas dimensions
  const width = 800;
  const height = 600;

  // Use custom hooks for state management
  const {
    nodeList,
    edgeList,
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
    handleNodeFormSubmit,
    handleEdgeFormSubmit,
    confirmDelete,
    createNodeFromEdge,
    createNewNodeFromScratch,
    createNewEdge,
    handleCancelEdgeCreation,
  } = useKnowledgeGraph(
    nodes,
    edges,
    onNodeSelect,
    onNodeCreate,
    onNodeUpdate,
    onNodeDelete,
    onEdgeCreate,
    onEdgeUpdate,
    onEdgeDelete,
  );

  // Use zoom controls hook
  const { handleZoomIn, handleZoomOut, handleResetZoom } = useZoomControls();

  return (
    <div className="flex flex-col w-full h-full">
      {/* Graph Controls */}
      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onAddNode={() => {
          const newNode: Node = {
            id: `node-${Date.now()}`,
            type: "concept",
            label: "New Node",
            x: width / 2,
            y: height / 2,
            fx: width / 2, // Add fixed position for stability
            fy: height / 2, // Add fixed position for stability
            isNew: true,
          };
          setActiveNode(newNode);
          setShowNodeDialog(true);
        }}
      />

      {/* Edge Creation Indicator */}
      {edgeCreationState.source && (
        <EdgeCreationIndicator
          sourceNodeId={edgeCreationState.source}
          onCancel={handleCancelEdgeCreation}
        />
      )}

      {/* Main Graph Renderer */}
      <div className="relative flex-grow overflow-hidden">
        <GraphRenderer
          nodeList={nodeList}
          edgeList={edgeList}
          hoveredNode={hoveredNode}
          hoveredEdge={hoveredEdge}
          edgeCreationState={edgeCreationState}
          focusedNodeId={focusedNodeId}
          midEdgePoint={midEdgePoint}
          showMidEdgeMenu={showMidEdgeMenu}
          width={width}
          height={height}
          setHoveredNode={setHoveredNode}
          setHoveredEdge={setHoveredEdge}
          setActiveNode={setActiveNode}
          setShowNodeDialog={setShowNodeDialog}
          setActiveEdge={setActiveEdge}
          setShowEdgeDialog={setShowEdgeDialog}
          setNodeToDelete={setNodeToDelete}
          setEdgeToDelete={setEdgeToDelete}
          setConfirmDeleteType={setConfirmDeleteType}
          setShowConfirmDelete={setShowConfirmDelete}
          setMidEdgePoint={setMidEdgePoint}
          setShowMidEdgeMenu={setShowMidEdgeMenu}
          createNewEdge={createNewEdge}
          createNodeFromEdge={createNodeFromEdge}
          createNewNodeFromScratch={createNewNodeFromScratch}
        />
      </div>

      {/* Dialogs */}
      {showNodeDialog && (
        <NodeDialog
          open={showNodeDialog}
          onOpenChange={setShowNodeDialog}
          activeNode={activeNode}
          setActiveNode={setActiveNode}
          onSubmit={handleNodeFormSubmit}
        />
      )}

      {showEdgeDialog && (
        <EdgeDialog
          edge={activeEdge!}
          sourceNode={nodeList.find((n) => n.id === activeEdge?.source)}
          targetNode={nodeList.find((n) => n.id === activeEdge?.target)}
          onClose={() => setShowEdgeDialog(false)}
          onChange={(field, value) =>
            setActiveEdge(activeEdge ? { ...activeEdge, [field]: value } : null)
          }
          onSubmit={handleEdgeFormSubmit}
          onDelete={() => {
            setEdgeToDelete(activeEdge?.id || null);
            setConfirmDeleteType("edge");
            setShowConfirmDelete(true);
            setShowEdgeDialog(false);
          }}
        />
      )}

      {showConfirmDelete && (
        <ConfirmDeleteDialog
          type={confirmDeleteType}
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default KnowledgeGraph;
