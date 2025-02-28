import { useState, useCallback } from "react";
import { Entity, TextInsight, Node, Edge } from "../types";

export const useTextAnalysis = (
  text: string,
  entities: Entity[],
  setEntities: (entities: Entity[]) => void,
  setInsights: (insights: TextInsight[]) => void,
  setNodeList: (nodes: Node[]) => void,
  setEdgeList: (edges: Edge[]) => void,
  onEntityDetected?: (entity: Entity) => void,
) => {
  const [loading, setLoading] = useState(false);
  const [nodeList, setInternalNodeList] = useState<Node[]>([]);
  const [edgeList, setInternalEdgeList] = useState<Edge[]>([]);

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return;

    setLoading(true);

    try {
      // Import the entity extraction service
      const { analyzeText } = await import("@/services/entityExtraction");

      // Analyze the text
      const result = await analyzeText(text);

      // Update state with the analysis results
      setEntities(result.entities);
      setInsights(result.insights);
      setInternalNodeList(result.nodes);
      setInternalEdgeList(result.edges);

      // Update parent state
      setNodeList(result.nodes);
      setEdgeList(result.edges);

      // Notify parent component about detected entities
      if (onEntityDetected) {
        result.entities.forEach((entity) => onEntityDetected(entity));
      }
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  }, [
    text,
    setEntities,
    setInsights,
    setNodeList,
    setEdgeList,
    onEntityDetected,
  ]);

  return {
    loading,
    handleAnalyze,
    nodeList: nodeList,
    setNodeList: setInternalNodeList,
    edgeList: edgeList,
    setEdgeList: setInternalEdgeList,
  };
};
