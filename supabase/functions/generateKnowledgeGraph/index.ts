import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface Node {
  id: string;
  type: "person" | "event" | "place" | "document" | "concept";
  label: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Extract entities and generate knowledge graph
    const { nodes, edges } = generateKnowledgeGraph(text);

    return new Response(JSON.stringify({ nodes, edges }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Generate knowledge graph from text
function generateKnowledgeGraph(text: string): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Extract potential entities (simplified approach)
  const words = text.split(/\s+/);
  const potentialEntities = words.filter(
    (word) => word.length > 4 && /^[A-Z]/.test(word),
  );

  // Deduplicate
  const uniqueEntities = [...new Set(potentialEntities)];

  // Create nodes from entities
  uniqueEntities.slice(0, 10).forEach((word, index) => {
    // Determine entity type based on simple heuristics
    let type: "person" | "event" | "place" | "document" | "concept" = "concept";

    if (
      word.includes("War") ||
      word.includes("Battle") ||
      word.includes("Revolution")
    ) {
      type = "event";
    } else if (
      word.includes("Mr.") ||
      word.includes("Mrs.") ||
      word.includes("Dr.")
    ) {
      type = "person";
    } else if (
      word.includes("City") ||
      word.includes("Mountain") ||
      word.includes("River")
    ) {
      type = "place";
    } else if (
      word.includes("Book") ||
      word.includes("Treaty") ||
      word.includes("Constitution")
    ) {
      type = "document";
    }

    // Create node
    const node: Node = {
      id: `node-${Date.now()}-${index}`,
      type,
      label: word,
      description: `A ${type} mentioned in the text`,
      // Position nodes in a circle layout
      x: 400 + 200 * Math.cos((index * 2 * Math.PI) / uniqueEntities.length),
      y: 300 + 200 * Math.sin((index * 2 * Math.PI) / uniqueEntities.length),
      // Add fixed position for stability
      fx: 400 + 200 * Math.cos((index * 2 * Math.PI) / uniqueEntities.length),
      fy: 300 + 200 * Math.sin((index * 2 * Math.PI) / uniqueEntities.length),
    };

    nodes.push(node);
  });

  // Create edges between nodes
  for (let i = 0; i < nodes.length; i++) {
    // Connect to 1-3 other nodes
    const connections = Math.floor(Math.random() * 3) + 1;
    for (let c = 0; c < connections; c++) {
      // Select a random target node that's not the same as the source
      const possibleTargets = nodes.filter((n) => n.id !== nodes[i].id);
      if (possibleTargets.length === 0) continue;

      const targetIndex = Math.floor(Math.random() * possibleTargets.length);
      const target = possibleTargets[targetIndex];

      // Check if edge already exists
      const edgeExists = edges.some(
        (e) =>
          (e.source === nodes[i].id && e.target === target.id) ||
          (e.source === target.id && e.target === nodes[i].id),
      );

      if (!edgeExists) {
        const relationship = determineRelationship(nodes[i].type, target.type);

        edges.push({
          id: `edge-${Date.now()}-${i}-${targetIndex}`,
          source: nodes[i].id,
          target: target.id,
          relationship,
        });
      }
    }
  }

  return { nodes, edges };
}

// Determine relationship type between entities
function determineRelationship(sourceType: string, targetType: string): string {
  const relationshipTypes = [
    "connected to",
    "related to",
    "associated with",
    "mentioned with",
    "appears with",
  ];

  // For specific entity type combinations, use more specific relationships
  if (sourceType === "person" && targetType === "event") {
    return "participated in";
  } else if (sourceType === "event" && targetType === "person") {
    return "involved";
  } else if (sourceType === "person" && targetType === "place") {
    return "visited";
  } else if (sourceType === "place" && targetType === "person") {
    return "visited by";
  } else if (sourceType === "person" && targetType === "document") {
    return "authored";
  } else if (sourceType === "document" && targetType === "person") {
    return "written by";
  }

  // Default to a random generic relationship
  return relationshipTypes[
    Math.floor(Math.random() * relationshipTypes.length)
  ];
}
