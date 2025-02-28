import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Entity, Node, Edge } from "../types";

export const useKnowledgeGraph = (
  text: string,
  setNodeList: (nodes: Node[]) => void,
  setEdgeList: (edges: Edge[]) => void,
  setGraphLoading: (loading: boolean) => void,
  entities: Entity[],
) => {
  const generateKnowledgeGraph = useCallback(async () => {
    setGraphLoading(true);

    try {
      // Check if supabase client is available
      if (!supabase || !supabase.functions) {
        throw new Error("Supabase client not available");
      }

      // Call Supabase Edge Function to generate knowledge graph
      const { data, error } = await supabase.functions.invoke(
        "generateKnowledgeGraph",
        {
          body: { text },
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      if (data?.nodes && data?.edges) {
        setNodeList(data.nodes);
        setEdgeList(data.edges);
      }
    } catch (err) {
      console.error("Knowledge graph generation error:", err);
      // Fallback to mock data
      const safeEntities = entities || [];
      const mockNodes: Node[] = safeEntities.map((entity, index) => ({
        id: entity.id || `entity-${index}`,
        type: entity.type || "concept",
        label: entity.text || `Entity ${index}`,
        description: entity.metadata?.description || "",
        // Add fixed positions for stability
        x: 200 + index * 50,
        y: 200 + index * 30,
        fx: 200 + index * 50,
        fy: 200 + index * 30,
      }));

      const mockEdges: Edge[] = [];
      // Create some sample edges
      for (let i = 0; i < mockNodes.length - 1; i++) {
        mockEdges.push({
          id: `edge-${i}`,
          source: mockNodes[i].id,
          target: mockNodes[i + 1].id,
          relationship: "related to",
        });
      }

      setNodeList(mockNodes);
      setEdgeList(mockEdges);
    } finally {
      setGraphLoading(false);
    }
  }, [text, entities, setNodeList, setEdgeList, setGraphLoading]);

  return { generateKnowledgeGraph };
};
