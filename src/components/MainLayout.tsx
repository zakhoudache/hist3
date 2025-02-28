import React, { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import TextEditor from "./TextEditor";
import EntityDetails from "./EntityDetails";
import { Node, Edge } from "./KnowledgeGraph/types";
import { Entity } from "@/services/entityExtraction";

interface MainLayoutProps {
  defaultLayout?: number[];
  onLayoutChange?: (sizes: number[]) => void;
}

const MainLayout = ({
  defaultLayout = [40, 60],
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

  return (
    <div className="h-full w-full bg-background">
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={onLayoutChange}
        className="h-full w-full rounded-lg border"
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

        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <EntityDetails
            entityId={selectedEntityId}
            entityName={selectedEntityName}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default MainLayout;
