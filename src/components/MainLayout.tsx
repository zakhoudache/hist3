import React, { useState, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import TextEditor from "./TextEditor_";
import KnowledgeGraph from "./KnowledgeGraph_";
import TopToolbar from "./TopToolbar_";
import EntityDetails from "./EntityDetails_";
import ParametricVisualization from "./Infographic";
import { Node, Edge } from "./KnowledgeGraph/types";
import { Entity } from "@/services/entityExtraction";

interface MainLayoutProps {
  defaultLayout?: number[];
  onLayoutChange?: (sizes: number[]) => void;
}

const MainLayout = ({
  defaultLayout = [30, 70],
  onLayoutChange = () => {},
}: MainLayoutProps) => {
  // Shared state for knowledge graph data
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<
    string | undefined
  >();
  const [selectedEntityName, setSelectedEntityName] = useState<
    string | undefined
  >();

  // Handler for entity detection from TextEditor
  const handleEntityDetected = (entity: Entity) => {
    // Log detected entity for debugging
    console.log("Entity detected:", entity);
    // The TextEditor component handles updating nodes and edges
  };

  // Handler for node selection in KnowledgeGraph
  const handleNodeSelect = (nodeId: string) => {
    const selectedNode = nodes.find((node) => node.id === nodeId);
    if (selectedNode) {
      setSelectedEntityId(nodeId);
      setSelectedEntityName(selectedNode.label);
    }
  };

  // State for filtering knowledge graph
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<Node[]>([]);
  const [filteredEdges, setFilteredEdges] = useState<Edge[]>([]);
  const [showInfographic, setShowInfographic] = useState(false);

  // Apply filters to nodes and edges
  useEffect(() => {
    if (nodeTypeFilter.length === 0) {
      // No filters, show all nodes
      setFilteredNodes(nodes);
      setFilteredEdges(edges);
    } else {
      // Filter nodes by type
      const filtered = nodes.filter((node) =>
        nodeTypeFilter.includes(node.type),
      );
      setFilteredNodes(filtered);

      // Only keep edges where both source and target nodes are in the filtered set
      const filteredNodeIds = new Set(filtered.map((node) => node.id));
      const validEdges = edges.filter(
        (edge) =>
          filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target),
      );
      setFilteredEdges(validEdges);
    }
  }, [nodes, edges, nodeTypeFilter]);

  // Handle toolbar actions
  const handleSearch = () => {
    const searchTerm = prompt("Enter search term for entities:");
    if (searchTerm && searchTerm.trim() !== "") {
      const searchTermLower = searchTerm.toLowerCase();
      const matchingNodes = nodes.filter((node) =>
        node.label.toLowerCase().includes(searchTermLower),
      );

      if (matchingNodes.length > 0) {
        setFilteredNodes(matchingNodes);
        // Keep edges between matching nodes
        const matchingNodeIds = new Set(matchingNodes.map((node) => node.id));
        const relevantEdges = edges.filter(
          (edge) =>
            matchingNodeIds.has(edge.source) &&
            matchingNodeIds.has(edge.target),
        );
        setFilteredEdges(relevantEdges);
        alert(`Found ${matchingNodes.length} matching entities.`);
      } else {
        alert("No matching entities found.");
      }
    }
  };

  const handleFilter = () => {
    // Toggle filtering by node type
    const nodeTypes = ["person", "event", "place", "document", "concept"];
    const selectedTypes = window.prompt(
      "Filter by entity types (comma-separated):\nperson, event, place, document, concept",
      nodeTypeFilter.join(", "),
    );

    if (selectedTypes !== null) {
      const types = selectedTypes
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => nodeTypes.includes(t));

      setNodeTypeFilter(types);

      if (types.length === 0) {
        alert("Showing all entity types.");
      } else {
        alert(`Filtering to show only: ${types.join(", ")}`);
      }
    }
  };

  const handleExport = () => {
    alert("Export functionality will be implemented in a future update.");
  };

  const handleHelp = () => {
    setShowInfographic(!showInfographic);
  };

  // Reset filters
  const resetFilters = () => {
    setNodeTypeFilter([]);
    setFilteredNodes(nodes);
    setFilteredEdges(edges);
  };

  return (
    <div className="h-full w-full bg-background flex flex-col">
      <TopToolbar
        onSearch={handleSearch}
        onFilter={handleFilter}
        onExport={handleExport}
        onHelp={handleHelp}
        onResetFilters={resetFilters}
        hasActiveFilters={nodeTypeFilter.length > 0}
      />
      {showInfographic ? (
        <div className="flex-1 p-4 overflow-auto">
          <ParametricVisualization />
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setShowInfographic(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Knowledge Graph
            </button>
          </div>
        </div>
      ) : (
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={onLayoutChange}
          className="flex-1 w-full rounded-lg border"
        >
          <ResizablePanel defaultSize={defaultLayout[0]} minSize={30}>
            <TextEditor
              onEntityDetected={handleEntityDetected}
              onContentChange={(content) => {
                // Content change is handled internally by TextEditor
                // which will call the entity extraction service
              }}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
              onNodeSelect={handleNodeSelect}
            />
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={defaultLayout[1] / 2} minSize={20}>
            <KnowledgeGraph
              nodes={nodes}
              edges={edges}
              filteredNodes={filteredNodes}
              filteredEdges={filteredEdges}
              onNodeSelect={handleNodeSelect}
            />
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={defaultLayout[1] / 2} minSize={20}>
            <EntityDetails
              entityId={selectedEntityId}
              entityName={selectedEntityName}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

export default MainLayout;
